"""Golden dataset del corrector cerrado (`closed_v1`, ADR-004) contra veredictos docentes.

`tests/golden/closed_grader_v1.yaml` registra lo que decidiría un docente cuidadoso. Los casos en los
que el corrector actual discrepa llevan `known_issue` y se marcan xfail(strict=True): cuando alguien
arregle el corrector, el caso pasa a XPASS, el test falla y hay que quitar `known_issue`.

`pytest -s tests/unit/test_golden_grader.py` imprime precisión, falsos negativos y falsos positivos.
"""

from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pytest
import yaml

from app.content.loader import load_content
from app.content.models import ChoiceAnswer, ChoicePrompt, FillBlankAnswer, FillBlankPrompt
from app.domain.grading.closed import grade_choice, grade_fill_blank

GOLDEN_PATH = Path(__file__).resolve().parents[1] / "golden" / "closed_grader_v1.yaml"

VERDICTS = {"correct", "valid_alternative", "less_natural", "spelling_error", "partial", "incorrect", "needs_review"}
CATEGORIES = {
    "key",
    "case_punct",
    "contraction",
    "full_sentence",
    "typo",
    "grammar_error",
    "task_mismatch",
    "br_us_variation",
    "collective_noun",
    "emphatic",
    "unrecognized",
    "distractor",
    "adversarial",
}
REQUIRED = {"id", "item", "expected_verdict", "category", "rationale_es"}
OPTIONAL = {"answer", "option", "expected_rule", "known_issue"}

# Docente aprueba (crédito completo o casi) / corrector castiga.
APPROVED_BY_TEACHER = {"correct", "valid_alternative", "less_natural"}
PUNISHED_BY_GRADER = {"incorrect", "partial"}
# Docente dice incorrect / corrector da cualquier crédito.
CREDITED_BY_GRADER = {"correct", "valid_alternative", "less_natural", "spelling_error", "partial"}

CASES: list[dict[str, Any]] = yaml.safe_load(GOLDEN_PATH.read_text(encoding="utf-8"))
ITEMS = {i.id: i for i in load_content().items}


@dataclass(frozen=True)
class Outcome:
    verdict: str
    rule: str | None


def grade(case: dict[str, Any]) -> Outcome:
    item = ITEMS[case["item"]]
    if "option" in case:
        assert isinstance(item.prompt, ChoicePrompt) and isinstance(item.answer, ChoiceAnswer)
        result = grade_choice(item.prompt, item.answer, case["option"])
    else:
        assert isinstance(item.prompt, FillBlankPrompt) and isinstance(item.answer, FillBlankAnswer)
        result = grade_fill_blank(item.prompt, item.answer, case["answer"])
    verdict = "needs_review" if result.status == "needs_review" else result.verdict
    assert verdict is not None
    return Outcome(verdict=verdict, rule=result.matched_rule)


def matches(case: dict[str, Any], outcome: Outcome) -> bool:
    if outcome.verdict != case["expected_verdict"]:
        return False
    return "expected_rule" not in case or outcome.rule == case["expected_rule"]


def _param(case: dict[str, Any]) -> Any:
    marks = [pytest.mark.xfail(strict=True, reason=case["known_issue"])] if "known_issue" in case else []
    return pytest.param(case, id=case["id"], marks=marks)


# ── integridad del dataset ──
def test_golden_dataset_is_well_formed() -> None:
    assert len(CASES) >= 100
    ids = [c["id"] for c in CASES]
    assert len(ids) == len(set(ids)), [i for i, n in Counter(ids).items() if n > 1]
    for case in CASES:
        keys = set(case)
        assert keys >= REQUIRED, (case["id"], REQUIRED - keys)
        assert keys <= REQUIRED | OPTIONAL, (case["id"], keys - REQUIRED - OPTIONAL)
        assert ("answer" in case) != ("option" in case), case["id"]
        assert case["expected_verdict"] in VERDICTS, case["id"]
        assert case["category"] in CATEGORIES, case["id"]
        assert case["item"] in ITEMS, case["id"]
        is_choice = isinstance(ITEMS[case["item"]].answer, ChoiceAnswer)
        assert is_choice == ("option" in case), case["id"]
        assert str(case["rationale_es"]).strip(), case["id"]
        if "known_issue" in case:
            assert str(case["known_issue"]).strip(), case["id"]


def test_golden_dataset_covers_every_practice_item() -> None:
    covered = {c["item"] for c in CASES}
    expected = {i for i in ITEMS if i.startswith("grammar.present_simple.sva.")}
    assert expected <= covered, sorted(expected - covered)


# ── un test por caso ──
@pytest.mark.parametrize("case", [_param(c) for c in CASES])
def test_golden_case(case: dict[str, Any]) -> None:
    outcome = grade(case)
    assert outcome.verdict == case["expected_verdict"], (
        f"{case['id']}: docente={case['expected_verdict']} corrector={outcome.verdict} ({outcome.rule})"
    )
    if "expected_rule" in case:
        assert outcome.rule == case["expected_rule"], f"{case['id']}: regla {outcome.rule} ≠ {case['expected_rule']}"


# ── resumen: precisión, falsos negativos y falsos positivos ──
def test_golden_summary_has_no_unknown_false_positives() -> None:
    outcomes = {c["id"]: grade(c) for c in CASES}
    verdict_hits = sum(outcomes[c["id"]].verdict == c["expected_verdict"] for c in CASES)
    full_hits = sum(matches(c, outcomes[c["id"]]) for c in CASES)
    false_negatives = [
        c
        for c in CASES
        if c["expected_verdict"] in APPROVED_BY_TEACHER and outcomes[c["id"]].verdict in PUNISHED_BY_GRADER
    ]
    false_positives = [
        c for c in CASES if c["expected_verdict"] == "incorrect" and outcomes[c["id"]].verdict in CREDITED_BY_GRADER
    ]
    other = [
        c for c in CASES if not matches(c, outcomes[c["id"]]) and c not in false_negatives and c not in false_positives
    ]

    def line(c: dict[str, Any]) -> str:
        o = outcomes[c["id"]]
        tag = "known" if "known_issue" in c else "NEW"
        return f"  [{tag}] {c['id']}: docente={c['expected_verdict']} corrector={o.verdict} ({o.rule})"

    total = len(CASES)
    print(f"\n── Golden closed_v1: {total} casos ──")
    print(f"Veredicto exacto: {verdict_hits}/{total} ({verdict_hits / total:.1%})")
    print(f"Veredicto + regla: {full_hits}/{total} ({full_hits / total:.1%})")
    print(f"known_issue: {sum('known_issue' in c for c in CASES)}")
    print(f"Falsos negativos (docente aprueba, corrector castiga): {len(false_negatives)}")
    for c in false_negatives:
        print(line(c))
    print(f"Falsos positivos (docente: incorrect, corrector da crédito): {len(false_positives)}")
    for c in false_positives:
        print(line(c))
    print(f"Otras discrepancias (crédito parcial, needs_review o regla): {len(other)}")
    for c in other:
        print(line(c))
    by_category = Counter(c["category"] for c in CASES)
    print("Casos por categoría: " + ", ".join(f"{k}={v}" for k, v in sorted(by_category.items())))

    unknown_fp = [c["id"] for c in false_positives if "known_issue" not in c]
    assert not unknown_fp, f"Falsos positivos sin known_issue: {unknown_fp}"
    unexplained = [c["id"] for c in CASES if not matches(c, outcomes[c["id"]]) and "known_issue" not in c]
    assert not unexplained, f"Discrepancias sin known_issue: {unexplained}"
