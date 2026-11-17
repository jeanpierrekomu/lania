"""Speaking Lab: conversaciones guiadas por pasos. La persona habla (o escribe), el servidor transcribe,
Lania reacciona en su rol y corrige 1–2 errores; la siguiente pregunta del guion la pone el servidor.

El audio del alumno no se guarda (ADR-005): solo la transcripción, para que pueda revisar su progreso.
"""

import uuid
from datetime import datetime, timedelta
from functools import lru_cache
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.ai import voice
from app.ai.gateway import run_structured
from app.ai.outputs import SpeakingTurnOutput
from app.ai.prompts.academic import PERSONAS
from app.ai.prompts.speaking import SPEAKING_PROMPT_VERSION, build_speaking_messages
from app.ai.providers.base import ChatMessage
from app.ai.providers.speech import SpeechAudio
from app.api.v1 import schemas as s
from app.content.loader import load_content
from app.content.models import ScenarioSpec
from app.core.config import Settings
from app.core.errors import ApiError
from app.db.models import LearningPreferences, Profile, SpeakingSession, SpeakingTurn


@lru_cache
def scenarios() -> dict[str, ScenarioSpec]:
    return {sc.slug: sc for sc in load_content().scenarios}


def _scenario(slug: str) -> ScenarioSpec:
    sc = scenarios().get(slug)
    if sc is None:
        raise ApiError(404, "NOT_FOUND", "Esa conversación no existe.")
    return sc


def list_scenarios() -> list[s.ScenarioSummaryOut]:
    return [
        s.ScenarioSummaryOut(
            slug=sc.slug,
            title_es=sc.title_es,
            context_es=sc.context_es,
            level=sc.level,
            topic=sc.topic,
            steps=len(sc.steps),
        )
        for sc in scenarios().values()
    ]


def _prompt_out(sc: ScenarioSpec, step: int) -> s.SpeakingPromptOut:
    if step >= len(sc.steps):
        return s.SpeakingPromptOut(
            step=step, total=len(sc.steps), lania_en=sc.closing_en, goal_es=None, useful_phrases_en=[], finished=True
        )
    st = sc.steps[step]
    return s.SpeakingPromptOut(
        step=step,
        total=len(sc.steps),
        lania_en=st.lania_en,
        goal_es=st.goal_es,
        useful_phrases_en=st.useful_phrases_en,
        finished=False,
    )


def _session(db: Session, user_id: uuid.UUID, session_id: uuid.UUID) -> SpeakingSession:
    sess = db.get(SpeakingSession, session_id)
    if sess is None or sess.user_id != user_id:
        raise ApiError(404, "NOT_FOUND", "No encontramos esa conversación.")
    return sess


def _turn_out(t: SpeakingTurn) -> s.SpeakingTurnOut:
    fb = t.feedback or {}
    return s.SpeakingTurnOut(
        id=t.id,
        step=t.step,
        input_mode=t.input_mode,
        transcript=t.transcript,
        on_task=bool(fb.get("on_task", True)),
        corrections=[s.TutorCorrectionOut(**c) for c in fb.get("corrections", [])],
        natural_version_en=fb.get("natural_version_en"),
        feedback_es=fb.get("feedback_es", ""),
        reply_en=t.reply_en,
    )


def _session_out(db: Session, settings: Settings, sess: SpeakingSession) -> s.SpeakingSessionOut:
    sc = _scenario(sess.scenario)
    turns = db.scalars(
        select(SpeakingTurn).where(SpeakingTurn.session_id == sess.id).order_by(SpeakingTurn.created_at)
    ).all()
    return s.SpeakingSessionOut(
        id=sess.id,
        scenario=list_scenarios_by_slug()[sc.slug],
        role_es=sc.context_es,
        current=_prompt_out(sc, sess.step),
        turns=[_turn_out(t) for t in turns],
        voice_input=voice.stt_available(settings),
        voice_output=voice.tts_available(settings),
    )


def list_scenarios_by_slug() -> dict[str, s.ScenarioSummaryOut]:
    return {x.slug: x for x in list_scenarios()}


def start(db: Session, settings: Settings, user_id: uuid.UUID, slug: str, now: datetime) -> s.SpeakingSessionOut:
    _scenario(slug)
    sess = SpeakingSession(id=uuid.uuid4(), user_id=user_id, scenario=slug, step=0, finished_at=None, created_at=now)
    db.add(sess)
    db.flush()
    return _session_out(db, settings, sess)


def get(db: Session, settings: Settings, user_id: uuid.UUID, session_id: uuid.UUID) -> s.SpeakingSessionOut:
    return _session_out(db, settings, _session(db, user_id, session_id))


def _turns_today(db: Session, user_id: uuid.UUID, now: datetime) -> int:
    profile = db.get(Profile, user_id)
    start_local = now.astimezone(ZoneInfo(profile.timezone if profile else "UTC")).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    return (
        db.scalar(
            select(func.count())
            .select_from(SpeakingTurn)
            .where(
                SpeakingTurn.user_id == user_id,
                SpeakingTurn.created_at >= start_local,
                SpeakingTurn.created_at < start_local + timedelta(days=1),
            )
        )
        or 0
    )


def _anchored(transcript: str, out: SpeakingTurnOutput) -> list[dict[str, str]]:
    """Solo correcciones que citan literalmente lo que se dijo (anti-alucinación)."""
    low = transcript.lower()
    return [c.model_dump() for c in out.corrections if c.original.lower() in low]


def take_turn(
    db: Session,
    settings: Settings,
    user_id: uuid.UUID,
    session_id: uuid.UUID,
    *,
    client_turn_id: uuid.UUID,
    text: str | None,
    audio: bytes | None,
    seconds: float | None,
    now: datetime,
) -> s.SpeakingSessionOut:
    sess = _session(db, user_id, session_id)
    existing = db.scalar(
        select(SpeakingTurn).where(SpeakingTurn.user_id == user_id, SpeakingTurn.client_turn_id == client_turn_id)
    )
    if existing is not None:  # reenvío del mismo turno: no se vuelve a transcribir ni a pagar
        return _session_out(db, settings, sess)
    sc = _scenario(sess.scenario)
    if sess.step >= len(sc.steps):
        raise ApiError(409, "CONFLICT", "Esta conversación ya terminó. Empieza una nueva cuando quieras.")
    if _turns_today(db, user_id, now) >= settings.speaking_daily_turn_limit:
        raise ApiError(429, "QUOTA_EXCEEDED", "Llegaste al máximo de turnos de conversación por hoy. Mañana seguimos.")

    if audio is not None:
        transcript, secs = voice.transcribe(db, settings, user_id=user_id, audio=audio, seconds=seconds)
        mode = "voice"
    elif text is not None:
        transcript, secs, mode = text.strip(), None, "text"
    else:
        raise ApiError(422, "INVALID_INPUT", "Envía tu respuesta grabada o escrita.")
    if not transcript:
        raise ApiError(422, "INVALID_INPUT", "No se escuchó nada. Acércate al micrófono e inténtalo otra vez.")
    transcript = transcript[:2000]

    prefs = db.get(LearningPreferences, user_id)
    step = sc.steps[sess.step]
    result = run_structured(
        db,
        settings,
        task="speaking_turn",
        user_id=user_id,
        messages=[
            ChatMessage(role, content)
            for role, content in build_speaking_messages(
                sc, step, transcript, mode, PERSONAS[prefs.tutor_persona if prefs else "fun"]
            )
        ],
        output_model=SpeakingTurnOutput,
        prompt_version=SPEAKING_PROMPT_VERSION,
        request_key=f"speaking:{user_id}:{client_turn_id}",
        temperature=0.4,
        max_output_tokens=700,
    )
    out = result.output
    if out is None:
        feedback = {
            "on_task": True,
            "corrections": [],
            "natural_version_en": None,
            "feedback_es": "Te escuché, pero no pude revisar este turno con confianza. Sigamos.",
        }
        reply = "Thank you. Let's continue."
    else:
        feedback = {
            "on_task": out.on_task,
            "corrections": _anchored(transcript, out),
            "natural_version_en": out.natural_version_en,
            "feedback_es": out.feedback_es,
        }
        reply = out.reply_en
    turn = SpeakingTurn(
        id=uuid.uuid4(),
        session_id=sess.id,
        user_id=user_id,
        client_turn_id=client_turn_id,
        step=sess.step,
        input_mode=mode,
        transcript=transcript,
        audio_seconds=secs,
        feedback=feedback,
        reply_en=reply,
        ai_request_id=result.ai_request_id,
        created_at=now,
    )
    try:
        with db.begin_nested():
            db.add(turn)
            db.flush()
    except IntegrityError:
        return _session_out(db, settings, sess)
    if feedback["on_task"]:
        sess.step += 1
        if sess.step >= len(sc.steps):
            sess.finished_at = now
    db.flush()
    return _session_out(db, settings, sess)


def lania_audio(db: Session, settings: Settings, user_id: uuid.UUID, session_id: uuid.UUID, what: str) -> SpeechAudio:
    """Voz de Lania SOLO para textos de esta conversación (nunca texto libre: evita abuso del TTS).

    `what`: «prompt:<paso>» para la pregunta del guion (o el cierre) o «turn:<id>» para su reacción a un turno.
    """
    sess = _session(db, user_id, session_id)
    sc = _scenario(sess.scenario)
    kind, _, ref = what.partition(":")
    if kind == "prompt" and ref.isdigit():
        text = _prompt_out(sc, int(ref)).lania_en
    elif kind == "turn":
        try:
            turn = db.get(SpeakingTurn, uuid.UUID(ref))
        except ValueError:
            turn = None
        if turn is None or turn.session_id != sess.id:
            raise ApiError(404, "NOT_FOUND", "Ese audio no existe.")
        text = turn.reply_en
    else:
        raise ApiError(404, "NOT_FOUND", "Ese audio no existe.")
    return voice.synthesize(
        db,
        settings,
        text=text,
        instructions=settings.tts_instructions_lania,
        kind="listening" if kind == "prompt" else "reply",
    )
