"""Listening Lab: episodios originales por segmentos, audio sintetizado (cacheado) y preguntas corregidas en el
servidor con el motor de ejercicios cerrados (cuentan como evidencia de escucha)."""

import uuid
from functools import lru_cache

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai import voice
from app.ai.providers.speech import SpeechAudio
from app.api.v1 import schemas as s
from app.content.loader import load_content
from app.content.models import EpisodeSpec
from app.core.config import Settings
from app.core.errors import ApiError
from app.db.models import Attempt, Evaluation, ExerciseItem


@lru_cache
def episodes() -> dict[str, EpisodeSpec]:
    return {e.slug: e for e in load_content().episodes}


def _episode(slug: str) -> EpisodeSpec:
    ep = episodes().get(slug)
    if ep is None:
        raise ApiError(404, "NOT_FOUND", "Ese episodio no existe.")
    return ep


def _items(db: Session, ep: EpisodeSpec) -> dict[str, ExerciseItem]:
    rows = db.scalars(
        select(ExerciseItem).where(ExerciseItem.external_id.in_(list(ep.questions)), ExerciseItem.published)
    ).all()
    return {r.external_id: r for r in rows}


def _solved(db: Session, user_id: uuid.UUID, item_ids: list[uuid.UUID]) -> set[uuid.UUID]:
    """Preguntas que la persona ya respondió bien alguna vez."""
    rows = db.execute(
        select(Attempt.exercise_id)
        .join(Evaluation, Evaluation.attempt_id == Attempt.id)
        .where(Attempt.user_id == user_id, Attempt.exercise_id.in_(item_ids), Evaluation.verdict == "correct")
    ).all()
    return {r[0] for r in rows}


def list_episodes(db: Session, settings: Settings, user_id: uuid.UUID) -> list[s.EpisodeSummaryOut]:
    out = []
    for ep in episodes().values():
        items = _items(db, ep)
        solved = _solved(db, user_id, [i.id for i in items.values()])
        out.append(
            s.EpisodeSummaryOut(
                slug=ep.slug,
                title_es=ep.title_es,
                context_es=ep.context_es,
                level=ep.level,
                topic=ep.topic,
                speakers=[sp.name for sp in ep.speakers],
                questions=len(ep.questions),
                solved=len(solved),
            )
        )
    return out


def get_episode(db: Session, settings: Settings, user_id: uuid.UUID, slug: str) -> s.EpisodeOut:
    ep = _episode(slug)
    items = _items(db, ep)
    solved = _solved(db, user_id, [i.id for i in items.values()])
    questions = []
    for ext_id, segment in ep.questions.items():
        item = items.get(ext_id)
        if item is None:
            continue
        p = item.prompt
        questions.append(
            s.ListeningQuestionOut(
                exercise_id=item.id,
                question_en=p["question_en"],
                instruction_es=p["instruction_es"],
                options=[s.ChoiceOptionOut(id=o["id"], text=o["text"]) for o in p["options"]],
                segment=segment,
                solved=item.id in solved,
            )
        )
    return s.EpisodeOut(
        slug=ep.slug,
        title_es=ep.title_es,
        context_es=ep.context_es,
        level=ep.level,
        topic=ep.topic,
        speakers=[sp.name for sp in ep.speakers],
        segments=[s.ListeningSegmentOut(speaker=seg.speaker, text_en=seg.text_en) for seg in ep.segments],
        questions=questions,
        dictation=s.DictationOut(**ep.dictation.model_dump()) if ep.dictation else None,
        server_audio=voice.tts_available(settings),
    )


def segment_audio(db: Session, settings: Settings, slug: str, index: int) -> SpeechAudio:
    ep = _episode(slug)
    if not 0 <= index < len(ep.segments):
        raise ApiError(404, "NOT_FOUND", "Ese fragmento no existe.")
    seg = ep.segments[index]
    speaker_voice = next(sp.voice for sp in ep.speakers if sp.name == seg.speaker)
    return voice.synthesize(
        db,
        settings,
        text=seg.text_en,
        voice=speaker_voice,
        instructions="Natural conversational American English at a clear, moderate pace.",
        kind="listening",
    )
