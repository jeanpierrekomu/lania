"""Motor de dominio MVP — reglas versionadas y auditables (spec §3.2). Sin ML.

`proficient` exige evidencia SIN ayuda, en ítems variados, en al menos dos días distintos y repasos
espaciados acertados en al menos dos días: nadie queda «dominado» por una racha en una sola sesión.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Literal
from zoneinfo import ZoneInfo

ALGORITHM_VERSION = "mastery_v1"

State = Literal["not_assessed", "emerging", "developing", "proficient", "review_due"]
Confidence = Literal["low", "medium", "high"]
Result = Literal["correct", "partial", "incorrect", "needs_review"]
Context = Literal["practice", "review", "retry", "diagnostic"]

RESULT_VALUE: dict[str, float] = {"correct": 1.0, "partial": 0.5, "incorrect": 0.0}
WINDOW = 12  # evidencias recientes consideradas
PROFICIENT_SAMPLE = 6  # evidencias sin ayuda necesarias
PROFICIENT_ACCURACY = 0.85
PROFICIENT_MIN_ITEMS = 4
PROFICIENT_MIN_DAYS = 2
PROFICIENT_MIN_REVIEW_DAYS = 2  # retención comprobada al menos dos veces


@dataclass(frozen=True)
class EvidencePoint:
    result: Result
    context: Context
    hint_count: int
    exercise_id: str
    created_at: datetime


@dataclass(frozen=True)
class MasteryAssessment:
    state: State
    confidence: Confidence
    evidence_count: int
    recent_accuracy: float | None
    distinct_days: int
    rationale_es: str
    algorithm_version: str = ALGORITHM_VERSION


def _day(ts: datetime, tz: ZoneInfo) -> str:
    return ts.astimezone(tz).date().isoformat()


def assess(evidence: list[EvidencePoint], timezone: str = "America/Lima") -> MasteryAssessment:
    tz = ZoneInfo(timezone)
    graded = sorted((e for e in evidence if e.result != "needs_review"), key=lambda e: e.created_at)
    if not graded:
        return MasteryAssessment(
            "not_assessed", "low", 0, None, 0, "Todavía no hay respuestas evaluadas para esta habilidad."
        )

    recent = graded[-WINDOW:]
    accuracy = sum(RESULT_VALUE[e.result] for e in recent) / len(recent)
    days = len({_day(e.created_at, tz) for e in graded})
    # Retries (tras ver feedback) cuentan como práctica, no como prueba de dominio.
    unassisted = [e for e in graded if e.hint_count == 0 and e.context != "retry"]
    sample = unassisted[-PROFICIENT_SAMPLE:]
    sample_acc = sum(RESULT_VALUE[e.result] for e in sample) / len(sample) if sample else 0.0
    sample_items = len({e.exercise_id for e in sample})
    sample_days = len({_day(e.created_at, tz) for e in unassisted})
    review_days = len(
        {
            _day(e.created_at, tz)
            for e in graded
            if e.context == "review" and e.result == "correct" and e.hint_count == 0
        }
    )

    if len(graded) >= 12 and days >= 3:
        confidence: Confidence = "high"
    elif len(graded) >= 5:
        confidence = "medium"
    else:
        confidence = "low"

    correct = sum(1 for e in recent if e.result == "correct")
    base = f"{correct} de {len(recent)} respuestas recientes correctas, en {days} día(s)."

    if (
        len(sample) >= PROFICIENT_SAMPLE
        and sample_acc >= PROFICIENT_ACCURACY
        and sample_items >= PROFICIENT_MIN_ITEMS
        and sample_days >= PROFICIENT_MIN_DAYS
        and review_days >= PROFICIENT_MIN_REVIEW_DAYS
    ):
        return MasteryAssessment(
            "proficient",
            confidence,
            len(graded),
            accuracy,
            days,
            f"{base} Respondes bien sin ayuda, en ejercicios distintos y en días distintos.",
        )

    missing: list[str] = []
    if sample_days < PROFICIENT_MIN_DAYS:
        missing.append("practicar en otro día")
    if review_days < PROFICIENT_MIN_REVIEW_DAYS:
        missing.append(f"acertar repasos espaciados en {PROFICIENT_MIN_REVIEW_DAYS} días distintos")
    if len(sample) < PROFICIENT_SAMPLE or sample_acc < PROFICIENT_ACCURACY:
        missing.append("más respuestas correctas sin pistas")
    next_step = f" Para considerarla dominada falta: {', '.join(missing)}." if missing else ""

    if len(graded) >= 3 and accuracy >= 0.5:
        return MasteryAssessment("developing", confidence, len(graded), accuracy, days, base + next_step)
    return MasteryAssessment("emerging", confidence, len(graded), accuracy, days, base + next_step)


def effective_state(stored: State, review_due_at: datetime | None, now: datetime) -> State:
    """Una habilidad en progreso pasa a `review_due` cuando su repaso venció."""
    if review_due_at is not None and review_due_at <= now and stored in ("developing", "proficient", "emerging"):
        return "review_due"
    return stored
