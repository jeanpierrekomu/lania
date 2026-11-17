"""Revisión de contenido y operación (staff). Toda acción queda en audit_events (spec §10.2).

Si un revisor ACEPTA una disputa, la corrección se revierte: el veredicto pasa a «alternativa válida»,
la evidencia cuenta como correcta y el dominio se recalcula. Rechazarla deja todo como estaba.
"""

import statistics
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1 import schemas as s
from app.core.errors import ApiError
from app.db.models import (
    AiRequest,
    Attempt,
    AuditEvent,
    Evaluation,
    EvaluationDispute,
    ExerciseItem,
    PilotFeedback,
    Profile,
    SkillEvidence,
)
from app.domain.learning import service as learning

STAFF_ROLES = {"content_editor", "teacher_reviewer", "admin"}


def require_staff(db: Session, user_id: uuid.UUID) -> None:
    profile = db.get(Profile, user_id)
    if profile is None or profile.role not in STAFF_ROLES:  # el rol vive en la base; el cliente no lo edita
        raise ApiError(403, "FORBIDDEN", "Esta sección es solo para el equipo docente.")


def list_disputes(db: Session, status: str) -> list[s.DisputeReviewOut]:
    rows = db.execute(
        select(EvaluationDispute, Evaluation, Attempt, ExerciseItem)
        .join(Evaluation, Evaluation.id == EvaluationDispute.evaluation_id)
        .join(Attempt, Attempt.id == Evaluation.attempt_id)
        .join(ExerciseItem, ExerciseItem.id == Attempt.exercise_id)
        .where(EvaluationDispute.status == status)
        .order_by(EvaluationDispute.created_at)
        .limit(200)
    ).all()
    out = []
    for d, ev, att, item in rows:
        p = item.prompt
        answer = att.original_answer
        if item.type == "choice":
            answer = next((o["text"] for o in p["options"] if o["id"] == answer), answer)
        out.append(
            s.DisputeReviewOut(
                id=d.id,
                created_at=d.created_at,
                status=d.status,
                reason=d.reason,
                item_external_id=item.external_id,
                prompt_en=p.get("sentence_en") or p.get("question_en") or p.get("task_en", ""),
                learner_answer=answer,
                verdict=ev.verdict,
                matched_rule=ev.matched_rule,
                expected_answer=ev.expected_answer,
                feedback_es=ev.feedback_es,
                rubric_version=ev.rubric_version,
                grader_version=ev.grader_version,
            )
        )
    return out


def resolve_dispute(
    db: Session, actor_id: uuid.UUID, dispute_id: uuid.UUID, payload: s.DisputeResolveIn, now: datetime
) -> s.DisputeReviewOut:
    dispute = db.get(EvaluationDispute, dispute_id)
    if dispute is None:
        raise ApiError(404, "NOT_FOUND", "No encontramos esa disputa.")
    if dispute.status != "open":
        raise ApiError(409, "CONFLICT", "Esa disputa ya fue resuelta.")
    ev = db.get_one(Evaluation, dispute.evaluation_id)
    accept = payload.decision == "accept"
    dispute.status = "accepted" if accept else "rejected"
    dispute.reviewer_id, dispute.resolved_at, dispute.resolution_note = actor_id, now, payload.note
    ev.review_status = "overturned" if accept else "upheld"
    previous = {"verdict": ev.verdict, "rule": ev.matched_rule}
    if accept:
        ev.verdict, ev.score, ev.status = "valid_alternative", 1, "graded"  # type: ignore[assignment]
        ev.feedback_es = f"Revisado por el equipo docente: tu respuesta es válida. {payload.note}"
        evidence = db.scalar(select(SkillEvidence).where(SkillEvidence.attempt_id == ev.attempt_id))
        if evidence is not None:
            evidence.result = "correct"
            db.flush()
            learning._update_mastery(db, evidence.user_id, evidence.skill_id, now)
    db.add(
        AuditEvent(
            actor_id=actor_id,
            action=f"dispute.{dispute.status}",
            object_type="evaluation_dispute",
            object_id=dispute.id,
            created_at=now,
            metadata_safe={"evaluation_id": str(ev.id), "previous": previous},
        )
    )
    db.flush()
    return next(d for d in list_disputes(db, dispute.status) if d.id == dispute.id)


def ai_usage(db: Session, now: datetime) -> s.AiUsageOut:
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    rows = db.scalars(select(AiRequest).where(AiRequest.created_at >= start)).all()
    latencies = sorted(r.latency_ms for r in rows if r.latency_ms is not None)
    costs = [r.estimated_cost_usd for r in rows]

    def pct(q: float) -> int | None:
        if not latencies:
            return None
        if len(latencies) == 1:
            return latencies[0]
        return int(statistics.quantiles(latencies, n=100, method="inclusive")[int(q) - 1])

    known = [c for c in costs if c is not None]
    return s.AiUsageOut(
        period_start=start,
        requests=len(rows),
        ok=sum(r.status == "ok" for r in rows),
        invalid_output=sum(r.status == "invalid_output" for r in rows),
        errors=sum(r.status in ("provider_error", "timeout") for r in rows),
        input_tokens=sum(r.input_tokens or 0 for r in rows),
        output_tokens=sum(r.output_tokens or 0 for r in rows),
        estimated_cost_usd=float(sum(known)) if known else None,
        cost_known_for_all=bool(rows) and len(known) == len(rows),
        p50_latency_ms=pct(50),
        p95_latency_ms=pct(95),
    )


def list_feedback(db: Session, limit: int = 100) -> list[s.FeedbackOut]:
    rows = db.execute(
        select(PilotFeedback, Profile.display_name)
        .outerjoin(Profile, Profile.id == PilotFeedback.user_id)
        .order_by(PilotFeedback.created_at.desc())
        .limit(limit)
    ).all()
    return [
        s.FeedbackOut(
            id=f.id, kind=f.kind, message=f.message, page=f.page, status=f.status, author=name, created_at=f.created_at
        )
        for f, name in rows
    ]
