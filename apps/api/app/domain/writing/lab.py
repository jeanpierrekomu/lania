"""Writing Lab: consignas de escritura libre para practicar, corregidas con la rúbrica writing_v1.

Reutiliza el mismo camino que la escritura del diagnóstico: el texto original queda inmutable en `attempts`,
la IA propone y `evaluator.evaluate_writing` valida; el resultado actualiza evaluación, evidencia y dominio.
"""

import uuid
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.v1 import schemas as s
from app.core.config import Settings
from app.core.errors import ApiError
from app.db.models import Attempt, Evaluation, ExerciseItem, Profile, SkillEvidence
from app.domain.diagnostics.service import evaluate_writing_attempt
from app.domain.writing.evaluator import word_count

POOL = "writing_lab"
HISTORY_LIMIT = 20


def topic_of(external_id: str) -> str:
    """writing_lab.<tema>.<nn> → tema."""
    parts = external_id.split(".")
    return parts[1] if len(parts) >= 3 else "general"


def _prompt_out(item: ExerciseItem) -> s.WritingPromptOut:
    p = item.prompt
    return s.WritingPromptOut(
        id=item.id,
        topic=topic_of(item.external_id),
        cefr=item.cefr_estimate,
        instruction_es=p["instruction_es"],
        task_en=p["task_en"],
        min_words=p["min_words"],
        max_words=p["max_words"],
    )


def feedback_out(item: ExerciseItem, attempt: Attempt, ev: Evaluation) -> s.WritingFeedbackOut:
    """Corrección de un texto libre tal como la ve el alumno."""
    crit = (ev.criteria_scores or {}).get("criteria")
    return s.WritingFeedbackOut(
        exercise_id=item.id,
        task_en=item.prompt.get("task_en", ""),
        your_text=attempt.original_answer,
        status="pending" if ev.grader == "pending" else ev.status,
        feedback_es=ev.feedback_es,
        criteria=crit if ev.status == "graded" else None,
        errors=[
            s.WritingErrorOut(**{k: e[k] for k in ("span", "type", "severity", "explanation_es", "minimal_correction")})
            for e in ev.errors
        ],
        natural_version_en=ev.natural_version_en,
        notes_es=list((ev.criteria_scores or {}).get("notes", [])),
    )


def list_prompts(db: Session, interests: list[str] | None = None) -> list[s.WritingPromptOut]:
    items = db.scalars(
        select(ExerciseItem)
        .where(ExerciseItem.pool == POOL, ExerciseItem.published)
        .order_by(ExerciseItem.difficulty, ExerciseItem.external_id)
    ).all()
    wanted = set(interests or [])
    # Primero los temas que la persona eligió en la bienvenida; el resto después, por dificultad.
    ordered = sorted(items, key=lambda i: topic_of(i.external_id) not in wanted)
    return [_prompt_out(i) for i in ordered]


def _submission_out(db: Session, attempt: Attempt) -> s.WritingSubmissionOut:
    item = db.get_one(ExerciseItem, attempt.exercise_id)
    ev = db.scalar(select(Evaluation).where(Evaluation.attempt_id == attempt.id))
    assert ev is not None
    return s.WritingSubmissionOut(
        attempt_id=attempt.id,
        submitted_at=attempt.submitted_at,
        prompt=_prompt_out(item),
        feedback=feedback_out(item, attempt, ev),
    )


def history(db: Session, user_id: uuid.UUID) -> list[s.WritingSubmissionOut]:
    attempts = db.scalars(
        select(Attempt)
        .join(ExerciseItem, ExerciseItem.id == Attempt.exercise_id)
        .where(Attempt.user_id == user_id, ExerciseItem.pool == POOL)
        .order_by(Attempt.submitted_at.desc())
        .limit(HISTORY_LIMIT)
    ).all()
    return [_submission_out(db, a) for a in attempts]


def _evaluations_today(db: Session, user_id: uuid.UUID, now: datetime) -> int:
    profile = db.get(Profile, user_id)
    tz = ZoneInfo(profile.timezone if profile else "UTC")
    local = now.astimezone(tz)
    start = local.replace(hour=0, minute=0, second=0, microsecond=0)
    return (
        db.scalar(
            select(func.count())
            .select_from(Attempt)
            .join(ExerciseItem, ExerciseItem.id == Attempt.exercise_id)
            .where(
                Attempt.user_id == user_id,
                ExerciseItem.pool == POOL,
                Attempt.submitted_at >= start,
                Attempt.submitted_at < start + timedelta(days=1),
            )
        )
        or 0
    )


def submit(
    db: Session, settings: Settings, user_id: uuid.UUID, payload: s.WritingSubmissionIn, now: datetime
) -> s.WritingSubmissionOut:
    existing = db.scalar(
        select(Attempt).where(Attempt.user_id == user_id, Attempt.client_submission_id == payload.client_submission_id)
    )
    if existing is not None:
        return _submission_out(db, existing)
    item = db.scalar(
        select(ExerciseItem).where(
            ExerciseItem.id == payload.exercise_id, ExerciseItem.pool == POOL, ExerciseItem.published
        )
    )
    if item is None:
        raise ApiError(404, "INVALID_EXERCISE", "Esa consigna no existe o no está disponible.")
    text = payload.text.strip()
    if word_count(text) < 3:
        raise ApiError(422, "INVALID_INPUT", "Escribe al menos una frase en inglés para que Lania pueda corregirla.")
    if _evaluations_today(db, user_id, now) >= settings.writing_daily_eval_limit:
        raise ApiError(
            429,
            "QUOTA_EXCEEDED",
            f"Llegaste al máximo de {settings.writing_daily_eval_limit} textos corregidos por hoy. Mañana seguimos.",
        )

    attempt = Attempt(
        id=uuid.uuid4(),
        user_id=user_id,
        exercise_id=item.id,
        client_submission_id=payload.client_submission_id,
        mode="practice",
        original_answer=text,
        hint_count=0,
        retry_of=None,
        submitted_at=now,
    )
    try:
        with db.begin_nested():
            db.add(attempt)
            db.flush()
    except IntegrityError:  # doble envío concurrente con el mismo client_submission_id
        again = db.scalar(
            select(Attempt).where(
                Attempt.user_id == user_id, Attempt.client_submission_id == payload.client_submission_id
            )
        )
        if again is None:
            raise
        return _submission_out(db, again)
    db.add(
        Evaluation(
            id=uuid.uuid4(),
            attempt_id=attempt.id,
            user_id=user_id,
            status="needs_review",
            verdict=None,
            score=None,
            max_score=1,
            matched_rule=None,
            expected_answer=None,
            errors=[],
            grader="pending",
            grader_version="writing_v1",
            rubric_version=item.rubric_version,
            confidence="low",
            review_status="none",
            created_at=now,
            feedback_es="Tu texto está guardado y Lania lo está corrigiendo.",
        )
    )
    db.add(
        SkillEvidence(
            user_id=user_id,
            skill_id=item.skill_id,
            attempt_id=attempt.id,
            exercise_id=item.id,
            context="practice",
            hint_count=0,
            difficulty=item.difficulty,
            result="needs_review",
            created_at=now,
        )
    )
    db.flush()
    # Corrección en la misma petición: la persona espera unos segundos y ve el resultado.
    evaluate_writing_attempt(db, settings, attempt.id, now)
    return _submission_out(db, attempt)
