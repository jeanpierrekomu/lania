"""Programador de repaso espaciado por HABILIDAD — `review_v1` (spec §3.1 paso 7, §3.2).

Intervalos iniciales ajustables (1/3/7/14/30 días). No se presentan como «clínicamente probados».
- Error en práctica → repaso mañana (o se adelanta uno existente).
- Práctica sin errores y sin repaso pendiente → repaso de retención en 3 días.
- Repaso vencido: 3 aciertos sin ayuda lo aprueban (siguiente intervalo); un fallo lo reprograma a mañana.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Literal

ALGORITHM_VERSION = "review_v1"
INTERVALS_DAYS: tuple[int, ...] = (1, 3, 7, 14, 30)
ITEMS_TO_PASS_REVIEW = 3

Reason = Literal["error", "retention", "review_passed", "review_failed"]


@dataclass(frozen=True)
class PendingReview:
    id: str
    due_at: datetime
    step: int
    interval_days: int


@dataclass(frozen=True)
class NewReview:
    due_at: datetime
    step: int
    interval_days: int
    reason: Reason


@dataclass(frozen=True)
class ReviewDecision:
    complete_pending: Literal["passed", "failed"] | None = None  # cerrar el pendiente con este resultado
    supersede_pending: bool = False  # reemplazar el pendiente (adelantar)
    create: NewReview | None = None

    @property
    def is_noop(self) -> bool:
        return self.complete_pending is None and not self.supersede_pending and self.create is None


def _new(now: datetime, step: int, reason: Reason) -> NewReview:
    step = min(step, len(INTERVALS_DAYS) - 1)
    days = INTERVALS_DAYS[step]
    return NewReview(due_at=now + timedelta(days=days), step=step, interval_days=days, reason=reason)


def decide(
    *,
    pending: PendingReview | None,
    context: str,
    result: str,
    hint_count: int,
    now: datetime,
    prior_review_results: list[str],
) -> ReviewDecision:
    """`prior_review_results`: resultados en contexto review desde que venció el pendiente (sin este)."""
    if result == "needs_review":
        return ReviewDecision()

    clean_correct = result == "correct" and hint_count == 0
    if context == "review" and pending is not None and pending.due_at <= now:
        if not clean_correct:
            return ReviewDecision(complete_pending="failed", create=_new(now, 0, "review_failed"))
        results = [*prior_review_results, result]
        if len(results) >= ITEMS_TO_PASS_REVIEW and all(r == "correct" for r in results):
            return ReviewDecision(complete_pending="passed", create=_new(now, pending.step + 1, "review_passed"))
        return ReviewDecision()

    if result in ("incorrect", "partial"):
        tomorrow = _new(now, 0, "error")
        if pending is None:
            return ReviewDecision(create=tomorrow)
        if pending.due_at <= tomorrow.due_at and pending.step == 0:
            return ReviewDecision()  # ya hay un repaso igual o más próximo
        return ReviewDecision(supersede_pending=True, create=tomorrow)

    if pending is None and context in ("practice", "diagnostic"):
        return ReviewDecision(create=_new(now, 1, "retention"))
    return ReviewDecision()
