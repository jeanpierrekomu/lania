"""Diagnóstico por bloques con persistencia (spec §2.2, US01).

Modo examen: sin pistas ni correcciones durante la prueba; las respuestas se evalúan igual que en
práctica, pero el alumno solo ve el informe final. Las claves nunca salen del backend. Se puede
cerrar el navegador y retomar donde quedó. La escritura se evalúa en segundo plano (IA + rúbrica).
"""

import logging
import uuid
from datetime import datetime
from functools import lru_cache
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.v1 import schemas as s
from app.content.loader import load_content
from app.content.models import DiagnosticSpec, OpenResponseAnswer, OpenResponsePrompt
from app.core.config import Settings
from app.core.errors import ApiError
from app.db.models import (
    Attempt,
    DiagnosticRun,
    DiagnosticRunItem,
    DiagnosticSection,
    Evaluation,
    ExerciseItem,
    Lesson,
    Skill,
    SkillEvidence,
)
from app.domain.diagnostics import engine
from app.domain.grading.closed import GRADER, GRADER_VERSION
from app.domain.learning import service as learning
from app.domain.writing.evaluator import WritingOutcome, evaluate_writing

log = logging.getLogger("modo.diagnostics")
WRITING_CRITERIA = {
    "writing.task_fulfillment": "task_fulfillment",
    "writing.accuracy": "accuracy",
    "writing.coherence": "coherence",
    "writing.range": "range",
}


@lru_cache
def diagnostic_spec() -> DiagnosticSpec:
    specs = load_content().diagnostics
    if not specs:
        raise RuntimeError("No hay diagnóstico definido en packages/content-seeds/diagnostics")
    return specs[-1]


# ───────────────────────────── consultas internas ─────────────────────────────


def _rows(db: Session, run_id: uuid.UUID) -> list[tuple[DiagnosticRunItem, ExerciseItem, Skill]]:
    return [
        (ri, item, skill)
        for ri, item, skill in db.execute(
            select(DiagnosticRunItem, ExerciseItem, Skill)
            .join(ExerciseItem, ExerciseItem.id == DiagnosticRunItem.exercise_id)
            .join(Skill, Skill.id == ExerciseItem.skill_id)
            .where(DiagnosticRunItem.run_id == run_id)
            .order_by(DiagnosticRunItem.position)
        ).all()
    ]


def _evaluations(db: Session, run_id: uuid.UUID) -> dict[uuid.UUID, Evaluation]:
    rows = db.execute(
        select(DiagnosticRunItem.attempt_id, Evaluation)
        .join(Evaluation, Evaluation.attempt_id == DiagnosticRunItem.attempt_id)
        .where(DiagnosticRunItem.run_id == run_id)
    ).all()
    return {attempt_id: ev for attempt_id, ev in rows if attempt_id is not None}


def _outcome(ri: DiagnosticRunItem, ev: Evaluation | None) -> engine.Outcome:
    if ri.status == "skipped":
        return "adaptive_skip" if ri.skip_reason == "adaptive" else "unsure"
    if ri.status == "pending":
        return "pending"
    if ev is None or ev.status != "graded" or ev.verdict is None:
        return "needs_review"
    return learning.VERDICT_TO_RESULT[ev.verdict]  # type: ignore[return-value]


def _own_run(db: Session, user_id: uuid.UUID, run_id: uuid.UUID) -> DiagnosticRun:
    run = db.get(DiagnosticRun, run_id)
    if run is None or run.user_id != user_id:
        raise ApiError(404, "NOT_FOUND", "No encontramos ese diagnóstico.")
    return run


# ───────────────────────────── flujo ─────────────────────────────


def start_or_resume(db: Session, user_id: uuid.UUID, now: datetime) -> s.DiagnosticStateOut:
    run = db.scalar(
        select(DiagnosticRun).where(DiagnosticRun.user_id == user_id, DiagnosticRun.status == "in_progress")
    )
    if run is None:
        spec = diagnostic_spec()
        ids = [i for b in spec.blocks for i in b.items]
        items = {
            i.external_id: i
            for i in db.scalars(
                select(ExerciseItem).where(
                    ExerciseItem.external_id.in_(ids), ExerciseItem.pool == "diagnostic", ExerciseItem.published
                )
            )
        }
        missing = [i for i in ids if i not in items]
        if missing:
            raise ApiError(500, "INTERNAL", "El diagnóstico no está completo en la base de datos.")
        run = DiagnosticRun(
            id=uuid.uuid4(), user_id=user_id, version=spec.version, status="in_progress", started_at=now
        )
        try:
            with db.begin_nested():
                db.add(run)
                db.flush()
        except IntegrityError:  # dos pestañas empezando a la vez: usar la existente
            return start_or_resume(db, user_id, now)
        position = 0
        for block in spec.blocks:
            for external_id in block.items:
                db.add(
                    DiagnosticRunItem(
                        run_id=run.id,
                        user_id=user_id,
                        exercise_id=items[external_id].id,
                        position=position,
                        block=block.id,
                        status="pending",
                    )
                )
                position += 1
        db.flush()
    return _state(db, run, now)


def current(db: Session, user_id: uuid.UUID, now: datetime) -> s.DiagnosticCurrentOut:
    active = db.scalar(
        select(DiagnosticRun).where(DiagnosticRun.user_id == user_id, DiagnosticRun.status == "in_progress")
    )
    last = db.scalar(
        select(DiagnosticRun.id)
        .where(DiagnosticRun.user_id == user_id, DiagnosticRun.status == "completed")
        .order_by(DiagnosticRun.completed_at.desc())
        .limit(1)
    )
    return s.DiagnosticCurrentOut(active=_state(db, active, now) if active else None, last_completed_run_id=last)


def _state(db: Session, run: DiagnosticRun, now: datetime) -> s.DiagnosticStateOut:
    spec = diagnostic_spec()
    rows = _rows(db, run.id)
    evals = _evaluations(db, run.id)
    results_by_skill: dict[str, list[engine.ItemResult]] = {}
    next_row: tuple[DiagnosticRunItem, ExerciseItem, Skill] | None = None

    for ri, item, skill in rows:
        cefr = item.cefr_estimate or "A1"
        earlier = results_by_skill.setdefault(skill.code, [])
        if ri.status == "pending":
            if ri.block == "grammar_vocab" and engine.should_skip_adaptively(cefr, earlier):
                ri.status, ri.skip_reason = "skipped", "adaptive"
            else:
                next_row = (ri, item, skill)
                break
        earlier.append(engine.ItemResult(skill.code, cefr, _outcome(ri, evals.get(ri.attempt_id or uuid.uuid4()))))
    db.flush()

    answered = sum(1 for ri, _, _ in rows if ri.status == "answered" or ri.skip_reason == "unsure")
    total = sum(1 for ri, _, _ in rows if ri.skip_reason != "adaptive")
    if next_row is None and run.status == "in_progress":
        run.status, run.completed_at = "completed", now
        db.flush()
        build_report(db, run)

    block_out: s.DiagnosticBlockOut | None = None
    first_in_block = False
    item_out: s.ExerciseOut | None = None
    if next_row is not None:
        ri, item, skill = next_row
        index = next(i for i, b in enumerate(spec.blocks) if b.id == ri.block)
        block = spec.blocks[index]
        block_out = s.DiagnosticBlockOut(
            id=block.id, title_es=block.title_es, intro_es=block.intro_es, index=index, total_blocks=len(spec.blocks)
        )
        first_in_block = not any(
            r.block == ri.block and r.status != "pending" and r.skip_reason != "adaptive" for r, _, _ in rows
        )
        item_out = learning._exercise_out(item, skill.code, "diagnostic")
    return s.DiagnosticStateOut(
        run_id=run.id,
        version=run.version,
        status=run.status,
        answered=answered,
        total=total,
        block=block_out,
        first_in_block=first_in_block,
        item=item_out,
        not_assessed_es=list(spec.not_assessed_es),
    )


def answer(
    db: Session,
    settings: Settings,
    user_id: uuid.UUID,
    run_id: uuid.UUID,
    payload: s.DiagnosticAnswerIn,
    now: datetime,
) -> tuple[s.DiagnosticStateOut, uuid.UUID | None]:
    """Registra una respuesta. Devuelve (estado, attempt_id de escritura a evaluar en segundo plano)."""
    run = _own_run(db, user_id, run_id)
    existing = db.scalar(
        select(Attempt).where(Attempt.user_id == user_id, Attempt.client_submission_id == payload.client_submission_id)
    )
    if existing is not None or run.status != "in_progress":
        return _state(db, run, now), None  # reenvío idempotente o diagnóstico ya terminado

    state = _state(db, run, now)
    if state.item is None or state.item.id != payload.exercise_id:
        raise ApiError(409, "CONFLICT", "Esa pregunta ya no es la actual. Recargamos el diagnóstico.", retryable=True)
    ri = db.get_one(DiagnosticRunItem, (run.id, payload.exercise_id))
    item = db.get_one(ExerciseItem, payload.exercise_id)

    if payload.unsure:
        ri.status, ri.skip_reason = "skipped", "unsure"
        db.flush()
        return _state(db, run, now), None

    if item.type == "open_response":
        if payload.answer_text is None:
            raise ApiError(422, "INVALID_INPUT", "Esta consigna necesita un texto escrito.")
        original = payload.answer_text.strip()
        evaluation = Evaluation(
            id=uuid.uuid4(),
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
            feedback_es="Tu texto está guardado y se está evaluando.",
        )
        result_for_evidence = "needs_review"
    else:
        grade, original, _ = learning._grade(item, payload)
        evaluation = Evaluation(
            id=uuid.uuid4(),
            user_id=user_id,
            status=grade.status,
            verdict=grade.verdict,
            score=grade.score,
            max_score=1,
            matched_rule=grade.matched_rule,
            expected_answer=grade.expected_answer,
            errors=[e.__dict__ for e in grade.errors],
            feedback_es=grade.feedback_es,
            grader=GRADER,
            grader_version=GRADER_VERSION,
            rubric_version=item.rubric_version,
            confidence=grade.confidence,
            review_status="none",
            created_at=now,
        )
        result_for_evidence = "needs_review" if grade.verdict is None else learning.VERDICT_TO_RESULT[grade.verdict]

    attempt = Attempt(
        id=uuid.uuid4(),
        user_id=user_id,
        exercise_id=item.id,
        client_submission_id=payload.client_submission_id,
        mode="diagnostic",
        original_answer=original,
        hint_count=0,
        retry_of=None,
        submitted_at=now,
    )
    try:
        with db.begin_nested():
            db.add(attempt)
            db.flush()
    except IntegrityError:
        return _state(db, run, now), None
    evaluation.attempt_id = attempt.id
    db.add(evaluation)
    db.add(
        SkillEvidence(
            user_id=user_id,
            skill_id=item.skill_id,
            attempt_id=attempt.id,
            exercise_id=item.id,
            context="diagnostic",
            hint_count=0,
            difficulty=item.difficulty,
            result=result_for_evidence,
            created_at=now,
        )
    )
    ri.status, ri.attempt_id = "answered", attempt.id
    db.flush()
    learning._update_mastery(db, user_id, item.skill_id, now)  # el diagnóstico no programa repasos
    return _state(db, run, now), attempt.id if item.type == "open_response" else None


# ───────────────────────────── escritura en segundo plano ─────────────────────────────


def apply_writing_outcome(db: Session, attempt: Attempt, outcome: WritingOutcome, now: datetime) -> None:
    ev = db.scalar(select(Evaluation).where(Evaluation.attempt_id == attempt.id))
    assert ev is not None
    ev.status, ev.verdict = outcome.status, outcome.verdict
    ev.score = outcome.score  # type: ignore[assignment]
    ev.grader, ev.confidence, ev.feedback_es = outcome.grader, outcome.confidence, outcome.feedback_es
    ev.criteria_scores = (
        {"criteria": outcome.criteria, "notes": outcome.notes} if outcome.criteria else {"notes": outcome.notes}
    )
    ev.errors, ev.strengths_es, ev.natural_version_en = outcome.errors, outcome.strengths_es, outcome.natural_version_en
    ev.model_id, ev.ai_request_id = outcome.model_id, outcome.ai_request_id
    evidence = db.scalar(select(SkillEvidence).where(SkillEvidence.attempt_id == attempt.id))
    if evidence is not None:
        evidence.result = "needs_review" if outcome.verdict is None else learning.VERDICT_TO_RESULT[outcome.verdict]
    db.flush()
    item = db.get_one(ExerciseItem, attempt.exercise_id)
    learning._update_mastery(db, attempt.user_id, item.skill_id, now)
    ri = db.scalar(select(DiagnosticRunItem).where(DiagnosticRunItem.attempt_id == attempt.id))
    if ri is not None:
        run = db.get_one(DiagnosticRun, ri.run_id)
        if run.status == "completed":
            build_report(db, run)


def evaluate_writing_attempt(db: Session, settings: Settings, attempt_id: uuid.UUID, now: datetime) -> None:
    attempt = db.get_one(Attempt, attempt_id)
    item = db.get_one(ExerciseItem, attempt.exercise_id)
    try:
        outcome = evaluate_writing(
            db,
            settings,
            user_id=attempt.user_id,
            prompt=OpenResponsePrompt.model_validate(item.prompt),
            spec=OpenResponseAnswer.model_validate(item.answer_schema),
            text=attempt.original_answer,
            request_key=f"writing:{attempt.id}",
        )
    except ApiError as exc:
        log.warning("Evaluación de escritura falló: %s", exc.code)
        outcome = WritingOutcome(
            status="needs_review",
            grader="llm_failed",
            confidence="low",
            feedback_es="No pudimos evaluar tu texto ahora (servicio de IA no disponible). "
            "Queda guardado para evaluarlo después.",
        )
    apply_writing_outcome(db, attempt, outcome, now)


# ───────────────────────────── informe ─────────────────────────────


def build_report(db: Session, run: DiagnosticRun) -> s.DiagnosticReportOut:
    spec = diagnostic_spec()
    rows = _rows(db, run.id)
    evals = _evaluations(db, run.id)
    skills = {sk.code: sk for sk in db.scalars(select(Skill))}
    lessons_by_skill = {
        skill_id: slug for skill_id, slug in db.execute(select(Lesson.skill_id, Lesson.slug).where(Lesson.published))
    }

    closed: dict[str, list[engine.ItemResult]] = {}
    writing_rows: list[tuple[DiagnosticRunItem, ExerciseItem, Evaluation | None]] = []
    for ri, item, skill in rows:
        ev = evals.get(ri.attempt_id) if ri.attempt_id else None
        if ri.block == "writing":
            writing_rows.append((ri, item, ev))
            continue
        closed.setdefault(skill.code, []).append(
            engine.ItemResult(skill.code, item.cefr_estimate or "A1", _outcome(ri, ev))
        )

    bands = [engine.band_for_closed(code, results) for code, results in closed.items()]
    writing_evals: list[dict[str, Any] | None] = []
    for ri, _item, ev in writing_rows:
        if ri.status == "skipped":
            continue
        crit = (ev.criteria_scores or {}).get("criteria") if ev is not None and ev.status == "graded" else None
        writing_evals.append(crit)
    for code, criterion in WRITING_CRITERIA.items():
        if code in skills:
            bands.append(engine.band_for_writing(code, criterion, writing_evals))

    for band in bands:
        sk = skills[band.skill_code]
        section = db.scalar(
            select(DiagnosticSection).where(DiagnosticSection.run_id == run.id, DiagnosticSection.skill_id == sk.id)
        )
        section = section or DiagnosticSection(run_id=run.id, user_id=run.user_id, skill_id=sk.id)
        section.band, section.confidence, section.evidence_count = band.band, band.confidence, band.evidence_count
        section.correct_count = round(band.correct_count, 2)  # type: ignore[assignment]
        section.notes_es, section.algorithm_version = band.notes_es, engine.ALGORITHM_VERSION
        db.add(section)

    sections = [
        s.SectionOut(
            skill_code=b.skill_code,
            skill_name_es=skills[b.skill_code].name_es,
            domain=skills[b.skill_code].domain,
            band=b.band,
            band_label_es=engine.BAND_LABEL_ES[b.band],
            confidence=b.confidence,
            evidence_count=b.evidence_count,
            notes_es=b.notes_es,
        )
        for b in bands
    ]
    strengths = [f"{x.skill_name_es}: bien incluso en preguntas de nivel A2." for x in sections if x.band == "a2"]
    strengths += [
        f"Lo básico de {x.skill_name_es.lower()}."
        for x, b in zip(sections, bands, strict=True)
        if x.band == "a1" and not b.borderline and b.correct_count >= 2
    ]
    needs = [
        f"{x.skill_name_es}: {'empezar por lo básico' if x.band == 'below_a1' else 'consolidar el nivel A2'}."
        for x in sorted(sections, key=lambda x: engine.BAND_ORDER[x.band])
        if x.band in ("below_a1", "a1")
    ]

    missions: list[s.MissionOut] = []
    for x in sorted(sections, key=lambda x: (engine.BAND_ORDER[x.band], x.domain != "grammar")):
        if x.band not in ("below_a1", "a1") or len(missions) >= 5:
            continue
        slug = lessons_by_skill.get(skills[x.skill_code].id)
        why = "Las preguntas básicas costaron." if x.band == "below_a1" else "Lo básico está; falta afianzar A2."
        missions.append(
            s.MissionOut(
                skill_code=x.skill_code,
                title_es=x.skill_name_es,
                why_es=why,
                href=f"/learn/{slug}" if slug else None,
                available=slug is not None,
            )
        )

    writing_out: list[s.WritingFeedbackOut] = []
    for ri, item, ev in writing_rows:
        if ri.status != "answered" or ev is None:
            continue
        attempt = db.get_one(Attempt, ri.attempt_id)
        pending = ev.grader == "pending"
        crit = (ev.criteria_scores or {}).get("criteria")
        writing_out.append(
            s.WritingFeedbackOut(
                exercise_id=item.id,
                task_en=item.prompt.get("task_en", ""),
                your_text=attempt.original_answer,
                status="pending" if pending else ev.status,
                feedback_es=ev.feedback_es,
                criteria=crit if ev.status == "graded" else None,
                errors=[
                    s.WritingErrorOut(
                        **{k: e[k] for k in ("span", "type", "severity", "explanation_es", "minimal_correction")}
                    )
                    for e in ev.errors
                ],
                natural_version_en=ev.natural_version_en,
                notes_es=list((ev.criteria_scores or {}).get("notes", [])),
            )
        )

    caveats = [
        "Es una estimación orientativa con pocas preguntas: no es un nivel MCER certificado ni equivale a un "
        "ciclo del ICPNA u otra institución.",
        "Las preguntas que marcaste como «No lo sé» cuentan como no logradas; así no premiamos adivinar.",
        "Este diagnóstico solo distingue hasta A2: «A2 o más» no significa que tu nivel sea exactamente A2.",
    ]
    if any(w.status == "graded" for w in writing_out):
        caveats.append(
            "Tu escritura la evaluó una IA con una rúbrica pública; puede equivocarse. Si algo no te "
            "parece justo, pide una revisión."
        )
    report = s.DiagnosticReportOut(
        run_id=run.id,
        version=run.version,
        completed_at=run.completed_at or run.started_at,
        sections=sections,
        strengths_es=strengths or ["Aún no hay suficiente evidencia para afirmar fortalezas; ¡vamos a construirla!"],
        needs_es=needs,
        missions=missions,
        writing=writing_out,
        caveats_es=caveats,
        not_assessed_es=list(spec.not_assessed_es),
        confirmation_suggested=any(b.borderline for b in bands),
        pending_evaluations=sum(1 for w in writing_out if w.status == "pending"),
    )
    run.report = report.model_dump(mode="json")
    db.flush()
    return report


def get_report(db: Session, user_id: uuid.UUID, run_id: uuid.UUID) -> s.DiagnosticReportOut:
    run = _own_run(db, user_id, run_id)
    if run.status != "completed":
        raise ApiError(409, "CONFLICT", "El diagnóstico todavía no termina.")
    return build_report(db, run)
