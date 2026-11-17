from app.domain.diagnostics.engine import ItemResult, band_for_closed, band_for_writing, should_skip_adaptively

S = "grammar.future.will_base_form"


def r(cefr: str, outcome: str) -> ItemResult:
    return ItemResult(S, cefr, outcome)  # type: ignore[arg-type]


def test_skips_a2_after_two_failed_a1() -> None:
    assert should_skip_adaptively("A2", [r("A1", "incorrect"), r("A1", "unsure")])
    assert not should_skip_adaptively("A2", [r("A1", "incorrect"), r("A1", "correct")])
    assert not should_skip_adaptively("A2", [r("A1", "incorrect")])
    assert not should_skip_adaptively("A1", [r("A1", "incorrect"), r("A1", "incorrect")])


def test_one_hard_item_right_never_gives_a2_without_basics() -> None:
    """US01: no se asigna un nivel alto por acertar una pregunta difícil."""
    band = band_for_closed(S, [r("A1", "incorrect"), r("A1", "incorrect"), r("A2", "correct")])
    assert band.band == "below_a1"


def test_a2_requires_basics_and_a2_evidence() -> None:
    assert band_for_closed(S, [r("A1", "correct"), r("A1", "correct"), r("A2", "correct")]).band == "a2"
    a1 = band_for_closed(S, [r("A1", "correct"), r("A1", "partial"), r("A2", "incorrect")])
    assert a1.band == "a1"


def test_confidence_is_never_high() -> None:
    results = [r("A1", "correct")] * 3 + [r("A2", "correct")] * 3
    assert band_for_closed(S, results).confidence == "medium"
    assert band_for_closed(S, [r("A1", "correct")]).confidence == "low"


def test_unsure_counts_as_not_achieved() -> None:
    assert band_for_closed(S, [r("A1", "unsure"), r("A1", "unsure")]).band == "below_a1"


def test_adaptive_skip_is_explained() -> None:
    band = band_for_closed(S, [r("A1", "incorrect"), r("A1", "incorrect"), r("A2", "adaptive_skip")])
    assert "A2" in band.notes_es


def test_borderline_flag() -> None:
    results = [r("A1", "correct"), r("A1", "correct"), r("A2", "correct"), r("A2", "incorrect")]
    band = band_for_closed(S, results)
    assert band.band == "a1" and band.borderline


def test_no_evidence_and_pending() -> None:
    assert band_for_closed(S, []).band == "not_assessed"
    assert band_for_closed(S, [r("A1", "needs_review")]).band == "pending_review"


def test_writing_bands() -> None:
    ev = {"accuracy": {"score": 2, "comment_es": ""}}
    assert band_for_writing("writing.accuracy", "accuracy", [ev, ev]).band == "a1"
    hi = {"accuracy": {"score": 3, "comment_es": ""}}
    assert band_for_writing("writing.accuracy", "accuracy", [hi, ev]).band == "a2"
    assert band_for_writing("writing.accuracy", "accuracy", [ev, None]).band == "pending_review"
    assert band_for_writing("writing.accuracy", "accuracy", []).band == "not_assessed"
