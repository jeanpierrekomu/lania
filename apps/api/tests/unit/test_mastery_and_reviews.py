from datetime import UTC, datetime, timedelta

from app.domain.mastery.rules import EvidencePoint, assess, effective_state
from app.domain.reviews.scheduler import PendingReview, decide

T0 = datetime(2026, 11, 2, 15, 0, tzinfo=UTC)  # 10:00 en Lima


def ev(result: str, *, item: int, day: int = 0, context: str = "practice", hints: int = 0) -> EvidencePoint:
    return EvidencePoint(
        result=result,
        context=context,
        hint_count=hints,  # type: ignore[arg-type]
        exercise_id=f"item-{item}",
        created_at=T0 + timedelta(days=day, minutes=item),
    )


# ── dominio ──
def test_no_evidence_is_not_assessed() -> None:
    assert assess([]).state == "not_assessed"


def test_perfect_single_session_is_never_proficient() -> None:
    """No se asigna «proficient» por una racha en un solo día (spec Fase 3, criterio de salida)."""
    result = assess([ev("correct", item=i) for i in range(10)])
    assert result.state == "developing"
    assert "otro día" in result.rationale_es
    assert "repaso" in result.rationale_es


def test_proficient_requires_days_variety_and_review() -> None:
    evidence = [ev("correct", item=i) for i in range(4)]
    evidence += [ev("correct", item=10 + i, day=1, context="review") for i in range(3)]
    assert assess(evidence).state == "developing"  # un solo repaso no basta
    evidence += [ev("correct", item=20 + i, day=4, context="review") for i in range(3)]
    assert assess(evidence).state == "proficient"


def test_hints_and_retries_do_not_prove_mastery() -> None:
    evidence = [ev("correct", item=i, hints=1) for i in range(4)]
    evidence += [ev("correct", item=10 + i, day=1, context="retry") for i in range(4)]
    assert assess(evidence).state != "proficient"


def test_low_accuracy_is_emerging() -> None:
    evidence = [
        ev("incorrect", item=1),
        ev("incorrect", item=2),
        ev("correct", item=3),
        ev("incorrect", item=4),
    ]
    result = assess(evidence)
    assert result.state == "emerging"
    assert result.confidence == "low"


def test_needs_review_is_excluded() -> None:
    assert assess([ev("needs_review", item=1)]).state == "not_assessed"


def test_effective_state_marks_due_review() -> None:
    assert effective_state("developing", T0, T0 + timedelta(hours=1)) == "review_due"
    assert effective_state("developing", T0 + timedelta(days=1), T0) == "developing"
    assert effective_state("not_assessed", T0, T0 + timedelta(days=1)) == "not_assessed"


# ── repaso ──
def test_error_schedules_review_tomorrow() -> None:
    d = decide(pending=None, context="practice", result="incorrect", hint_count=0, now=T0, prior_review_results=[])
    assert d.create is not None
    assert d.create.due_at == T0 + timedelta(days=1)
    assert d.create.reason == "error"


def test_clean_practice_schedules_retention_in_three_days() -> None:
    d = decide(pending=None, context="practice", result="correct", hint_count=0, now=T0, prior_review_results=[])
    assert d.create is not None and d.create.interval_days == 3 and d.create.reason == "retention"


def test_error_pulls_forward_a_later_review() -> None:
    later = PendingReview(id="r1", due_at=T0 + timedelta(days=3), step=1, interval_days=3)
    d = decide(pending=later, context="practice", result="incorrect", hint_count=0, now=T0, prior_review_results=[])
    assert d.supersede_pending
    assert d.create is not None and d.create.due_at == T0 + timedelta(days=1)


def test_repeated_errors_do_not_duplicate_reviews() -> None:
    soon = PendingReview(id="r1", due_at=T0 + timedelta(days=1), step=0, interval_days=1)
    d = decide(
        pending=soon,
        context="practice",
        result="incorrect",
        hint_count=0,
        now=T0 + timedelta(minutes=5),
        prior_review_results=[],
    )
    assert d.is_noop


def test_due_review_passes_after_three_clean_answers() -> None:
    due = PendingReview(id="r1", due_at=T0, step=0, interval_days=1)
    now = T0 + timedelta(hours=2)
    partial = decide(
        pending=due,
        context="review",
        result="correct",
        hint_count=0,
        now=now,
        prior_review_results=["correct"],
    )
    assert partial.is_noop
    done = decide(
        pending=due,
        context="review",
        result="correct",
        hint_count=0,
        now=now,
        prior_review_results=["correct", "correct"],
    )
    assert done.complete_pending == "passed"
    assert done.create is not None and done.create.step == 1 and done.create.interval_days == 3


def test_failed_review_reschedules_tomorrow() -> None:
    due = PendingReview(id="r1", due_at=T0, step=2, interval_days=7)
    d = decide(pending=due, context="review", result="incorrect", hint_count=0, now=T0, prior_review_results=[])
    assert d.complete_pending == "failed"
    assert d.create is not None and d.create.step == 0 and d.create.reason == "review_failed"


def test_hint_in_review_counts_as_not_passed() -> None:
    due = PendingReview(id="r1", due_at=T0, step=0, interval_days=1)
    d = decide(pending=due, context="review", result="correct", hint_count=1, now=T0, prior_review_results=[])
    assert d.complete_pending == "failed"


def test_interval_caps_at_last_step() -> None:
    due = PendingReview(id="r1", due_at=T0, step=4, interval_days=30)
    d = decide(
        pending=due,
        context="review",
        result="correct",
        hint_count=0,
        now=T0,
        prior_review_results=["correct", "correct"],
    )
    assert d.create is not None and d.create.interval_days == 30
