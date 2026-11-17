"""Misiones: situaciones reales que encadenan actividades existentes. El avance sale de la evidencia
(intentos corregidos, textos evaluados, conversaciones terminadas): no hay puntos ni pasos marcados a mano."""

import uuid
from functools import lru_cache

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.v1 import schemas as s
from app.content.loader import load_content
from app.content.models import MissionSpec, MissionStep
from app.db.models import Attempt, Evaluation, ExerciseItem, Lesson, LessonItem, SpeakingSession
from app.domain.listening.service import episodes
from app.domain.reading.service import readings

LESSON_CORRECT_TO_COMPLETE = 3  # aciertos en ejercicios distintos de la lección (o todos, si tiene menos)


@lru_cache
def missions() -> list[MissionSpec]:
    return load_content().missions


def _correct_items(db: Session, user_id: uuid.UUID, item_ids: list[uuid.UUID]) -> int:
    if not item_ids:
        return 0
    return (
        db.scalar(
            select(func.count(func.distinct(Attempt.exercise_id)))
            .join(Evaluation, Evaluation.attempt_id == Attempt.id)
            .where(
                Attempt.user_id == user_id,
                Attempt.exercise_id.in_(item_ids),
                Evaluation.verdict.in_(["correct", "valid_alternative"]),
            )
        )
        or 0
    )


def _step_done(db: Session, user_id: uuid.UUID, step: MissionStep) -> tuple[bool, str]:
    """(hecho, href) para un paso."""
    if step.kind == "lesson":
        lesson = db.scalar(select(Lesson).where(Lesson.slug == step.ref))
        if lesson is None:
            return False, f"/learn/{step.ref}"
        ids = list(db.scalars(select(LessonItem.exercise_id).where(LessonItem.lesson_id == lesson.id)))
        need = min(LESSON_CORRECT_TO_COMPLETE, len(ids))
        return _correct_items(db, user_id, ids) >= need, f"/learn/{step.ref}"
    if step.kind == "listening":
        ep = episodes().get(step.ref)
        ext = list(ep.questions) if ep else []
        ids = list(db.scalars(select(ExerciseItem.id).where(ExerciseItem.external_id.in_(ext))))
        return bool(ids) and _correct_items(db, user_id, ids) >= len(ids), f"/app/listening?episodio={step.ref}"
    if step.kind == "reading":
        rd = readings().get(step.ref)
        ext = list(rd.questions) if rd else []
        ids = list(db.scalars(select(ExerciseItem.id).where(ExerciseItem.external_id.in_(ext))))
        return bool(ids) and _correct_items(db, user_id, ids) >= len(ids), f"/app/reading?texto={step.ref}"
    if step.kind == "writing":
        item_id = db.scalar(select(ExerciseItem.id).where(ExerciseItem.external_id == step.ref))
        graded = db.scalar(
            select(func.count())
            .select_from(Attempt)
            .join(Evaluation, Evaluation.attempt_id == Attempt.id)
            .where(Attempt.user_id == user_id, Attempt.exercise_id == item_id, Evaluation.status == "graded")
        )
        return bool(graded), f"/app/writing?consigna={item_id}"
    finished = db.scalar(
        select(func.count())
        .select_from(SpeakingSession)
        .where(
            SpeakingSession.user_id == user_id,
            SpeakingSession.scenario == step.ref,
            SpeakingSession.finished_at.is_not(None),
        )
    )
    return bool(finished), f"/app/speaking?tema={step.ref}"


def list_missions(db: Session, user_id: uuid.UUID, interests: list[str]) -> list[s.MissionProgressOut]:
    out: list[s.MissionProgressOut] = []
    for m in missions():
        steps: list[s.MissionStepOut] = []
        current_found = False
        for st in m.steps:
            done, href = _step_done(db, user_id, st)
            state = "done" if done else ("now" if not current_found else "todo")
            current_found = current_found or not done
            steps.append(s.MissionStepOut(kind=st.kind, title_es=st.title_es, href=href, state=state))
        out.append(
            s.MissionProgressOut(
                slug=m.slug,
                title_es=m.title_es,
                situation_es=m.situation_es,
                level=m.level,
                topic=m.topic,
                icon=m.icon,
                steps=steps,
                done=sum(x.state == "done" for x in steps),
                recommended=m.topic in interests,
            )
        )
    # Primero lo que coincide con tus objetivos e intereses; luego la que tiene más avance.
    return sorted(out, key=lambda x: (not x.recommended, -x.done))
