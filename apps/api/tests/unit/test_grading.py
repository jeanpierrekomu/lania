"""Corrector determinista: alternativas válidas, oración completa, errores típicos (spec §3.6, US02)."""

import pytest

from app.content.loader import load_content
from app.content.models import ChoiceAnswer, ChoicePrompt, FillBlankAnswer, FillBlankPrompt, ItemSpec
from app.domain.grading.closed import extract_blank, grade_choice, grade_fill_blank
from app.domain.grading.normalize import normalize, osa_distance, repair_contractions

ITEMS = {i.id: i for i in load_content().items}


def fill(item_id: str, text: str):  # type: ignore[no-untyped-def]
    item: ItemSpec = ITEMS[f"grammar.present_simple.sva.{item_id}"]
    assert isinstance(item.prompt, FillBlankPrompt) and isinstance(item.answer, FillBlankAnswer)
    return grade_fill_blank(item.prompt, item.answer, text)


def choice(item_id: str, option: str):  # type: ignore[no-untyped-def]
    item = ITEMS[f"grammar.present_simple.sva.{item_id}"]
    assert isinstance(item.prompt, ChoicePrompt) and isinstance(item.answer, ChoiceAnswer)
    return grade_choice(item.prompt, item.answer, option)


# ── normalización ──
@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("Works", "works"),
        ("  works.  ", "works"),
        ("doesn’t drink", "does not drink"),
        ("Doesn't  Drink!", "does not drink"),
        ("I'm studying", "i am studying"),
        ("'ll work", "will work"),
        ("won't", "will not"),
        ("'works'", "works"),
        ("He's", "he's"),  # 's es ambiguo: no se expande
        ("doesn´t drink", "does not drink"),  # tilde del teclado español: antes de NFKC
        ("wo\u200brks", "works"),  # zero-width space
        ("works 👍", "works"),
        ("at 9am", "at 9 am"),
        ("at 9 a.m.", "at 9 am"),
        ("at 9:00 a.m.", "at 9 am"),
        ("at 9.00 AM", "at 9 am"),
        ("at 9:30 p.m.", "at 9 30 pm"),
        ("9 amigos", "9 amigos"),
    ],
)
def test_normalize(raw: str, expected: str) -> None:
    assert normalize(raw) == expected


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("dont work", "do not work"),
        ("doesnt drink", "does not drink"),
        ("does'nt drink", "does not drink"),
        ("wont", "will not"),
        ("cant", "can not"),
        ("works", None),
        ("want", None),  # termina en -nt pero no es contracción
    ],
)
def test_repair_contractions(raw: str, expected: str | None) -> None:
    assert repair_contractions(normalize(raw)) == expected


def test_osa_distance_counts_transposition_as_one() -> None:
    assert osa_distance("wroks", "works") == 1
    assert osa_distance("work", "works") == 1
    assert osa_distance("has", "have") == 2


# ── aceptación justa ──
@pytest.mark.parametrize(
    "text",
    [
        "works",
        "Works",
        "WORKS.",
        " works ",
        "My sister works at a design studio.",
        "my sister works at a design studio",
    ],
)
def test_accepts_key_in_any_case_and_full_sentence(text: str) -> None:
    result = fill("002", text)
    assert result.verdict == "correct", text
    assert result.score == 1.0


@pytest.mark.parametrize(
    "text",
    [
        "doesn't drink",
        "does not drink",
        "Doesn’t drink",
        "He doesn't drink coffee in the afternoon.",
        "he does not drink coffee in the afternoon",
    ],
)
def test_contractions_and_full_sentence_on_negatives(text: str) -> None:
    assert fill("005", text).verdict == "correct"


def test_question_full_sentence() -> None:
    assert fill("006", "Does your startup have a website?").verdict == "correct"


def test_collective_noun_british_plural_is_valid_alternative() -> None:
    """US02: «My team work/are working» no se marca automáticamente como falso."""
    result = fill("016", "work")
    assert result.verdict == "valid_alternative"
    assert result.score == 1.0
    are_working = fill("016", "are working")
    assert are_working.verdict == "partial"  # inglés válido, otra forma verbal que la pedida
    assert are_working.score == 0.5


def test_present_continuous_is_valid_english_but_task_mismatch() -> None:
    """US02: «is working» es gramatical; solo no cumple la consigna explícita de presente simple."""
    result = fill("002", "is working")
    assert result.verdict == "partial"
    assert result.matched_rule == "task.tense_mismatch.present_continuous"
    assert "correcto" in result.feedback_es


def test_generic_diagnostic_catches_continuous_on_unlisted_item() -> None:
    result = fill("014", "is checking")  # no está registrado en el YAML
    assert result.verdict == "partial"
    assert result.matched_rule == "task.tense_mismatch.present_continuous"


def test_emphatic_do_is_less_natural_not_wrong() -> None:
    result = fill("014", "does check")
    assert result.verdict == "less_natural"
    assert result.score == 0.75


# ── errores típicos de hispanohablantes ──
def test_missing_third_person_s() -> None:
    result = fill("002", "work")
    assert result.verdict == "incorrect"
    assert result.matched_rule == "grammar.present_simple.third_person_s"
    assert result.errors[0].minimal_correction == "works"


def test_i_am_study_pattern() -> None:
    result = fill("014", "is check")
    assert result.verdict == "incorrect"
    assert result.matched_rule == "grammar.present_simple.no_be_with_main_verb"


def test_third_person_s_on_plural_subject() -> None:
    assert fill("007", "lives").matched_rule == "grammar.present_simple.no_s_non_third"


def test_registered_distractor_with_specific_feedback() -> None:
    result = fill("004", "studys")
    assert result.verdict == "incorrect"
    assert result.matched_rule == "spelling.third_person.consonant_y_ies"
    assert result.errors[0].minimal_correction == "studies"


def test_wrong_auxiliary_agreement_in_negative() -> None:
    assert fill("005", "don't drink").matched_rule == "grammar.do_does.agreement"
    assert fill("005", "doesn't drinks").matched_rule == "grammar.do_does.base_form"


# ── ortografía vs gramática ──
def test_typo_is_spelling_error_not_grammar_error() -> None:
    result = fill("014", "chekcs")
    assert result.verdict == "spelling_error"
    assert result.score == 0.5


def test_dropping_suffix_is_not_treated_as_typo() -> None:
    assert fill("014", "check").verdict == "incorrect"


def test_typo_inside_multiword_answer() -> None:
    assert fill("005", "doesn't drnik").verdict == "spelling_error"


# ── no reconocida / no interpretable ──
def test_unrecognized_answer_is_incorrect_with_medium_confidence() -> None:
    result = fill("002", "sleeps")
    assert result.verdict == "incorrect"
    assert result.confidence == "medium"
    assert result.matched_rule == "unrecognized"


def test_non_text_answer_needs_review_and_has_no_score() -> None:
    result = fill("002", "???")
    assert result.status == "needs_review"
    assert result.score is None


# ── opción múltiple ──
def test_choice_correct_and_distractor_feedback() -> None:
    assert choice("001", "b").verdict == "correct"
    wrong = choice("001", "c")
    assert wrong.verdict == "incorrect"
    assert wrong.matched_rule == "grammar.present_simple.no_be_with_main_verb"


def test_choice_rejects_unknown_option() -> None:
    with pytest.raises(ValueError):
        choice("001", "z")


def test_extract_blank_only_strips_exact_frame() -> None:
    assert extract_blank("My sister ___ at a design studio.", "works") == "works"
    assert extract_blank("___ you speak Portuguese?", "Do you speak Portuguese?") == "do"
    assert extract_blank("My sister ___ at a design studio.", "She works at a design studio") == ("she works")


# ── lecturas seguras cuando la respuesta literal no se reconoce ──
@pytest.mark.parametrize(
    ("item_id", "text"),
    [
        ("002", "She works at a design studio."),
        ("007", "They live in Arequipa."),
        ("014", "Every morning, he checks his email before breakfast."),
        ("016", "It works remotely."),
    ],
)
def test_pronoun_for_subject_is_valid_alternative(item_id: str, text: str) -> None:
    result = fill(item_id, text)
    assert result.verdict == "valid_alternative"
    assert result.matched_rule == "grammar.subject.pronoun_substitution"
    assert result.score == 1.0


def test_pronoun_substitution_keeps_grammar_diagnosis_and_guards_double_subject() -> None:
    assert fill("002", "She work at a design studio.").matched_rule == "grammar.present_simple.third_person_s"
    assert fill("002", "My sister she works at a design studio.").verdict == "incorrect"
    assert fill("016", "It work remotely.").verdict == "incorrect"  # el plural británico no vale con it


def test_contracted_s_before_ing_reads_as_is() -> None:
    result = fill("002", "My sister's working at a design studio.")
    assert result.verdict == "partial"
    assert result.matched_rule == "task.tense_mismatch.present_continuous"
    assert fill("002", "My sister's works at a design studio.").verdict == "incorrect"


def test_overlap_with_frame_is_trimmed() -> None:
    assert fill("009", "goes to").verdict == "correct"
    assert fill("009", "go to").matched_rule == "grammar.present_simple.third_person_s"


def test_time_formats_in_full_sentence() -> None:
    for text in ("The workshop starts at 9am.", "The workshop starts at 9:00 a.m.", "The workshop starts at 9.00 am"):
        assert fill("013", text).verdict == "correct", text


def test_missing_apostrophe_is_spelling_error_or_keeps_distractor() -> None:
    result = fill("005", "doesnt drink")
    assert result.verdict == "spelling_error"
    assert result.matched_rule == "spelling.apostrophe"
    assert result.score == 0.5
    assert result.errors[0].minimal_correction == "doesn't drink"
    assert fill("010", "I dont work on Sundays.").matched_rule == "spelling.apostrophe"
    assert fill("005", "dont drink").matched_rule == "grammar.do_does.agreement"


def test_third_person_suffix_misspelling_is_not_a_typo() -> None:
    studyes = fill("004", "studyes")
    assert studyes.verdict == "incorrect"
    assert studyes.matched_rule == "spelling.third_person.consonant_y_ies"
    assert fill("014", "checkes").matched_rule == "spelling.third_person.plain_s"
    assert fill("009", "gose").verdict == "spelling_error"  # transposición dentro de -es: errata


def test_typo_rules_only_exclude_grammatical_suffixes() -> None:
    assert fill("002", "workss").verdict == "spelling_error"
    assert fill("007", "liv").verdict == "spelling_error"
    assert fill("016", "wrok").verdict == "spelling_error"  # errata del plural británico válido


def test_british_plural_collective_allows_emphatic_do() -> None:
    result = fill("016", "My team do work remotely.")
    assert result.verdict == "less_natural"
    assert result.matched_rule == "style.emphatic_do"


def test_present_continuous_negative_is_partial_not_be_error() -> None:
    result = fill("010", "I'm not working on Sundays.")
    assert result.verdict == "partial"
    assert result.matched_rule == "task.tense_mismatch.present_continuous"
    assert fill("010", "am not work").matched_rule == "grammar.present_simple.no_be_with_main_verb"


# ── calidad del banco: cada clave debe pasar su propio corrector ──
@pytest.mark.parametrize("item", list(ITEMS.values()), ids=lambda i: i.id)
def test_every_accepted_answer_grades_correct(item: ItemSpec) -> None:
    if isinstance(item.answer, FillBlankAnswer):
        assert isinstance(item.prompt, FillBlankPrompt)
        for key in item.answer.accepted:
            assert grade_fill_blank(item.prompt, item.answer, key).verdict == "correct"
            full = item.prompt.sentence_en.replace("___", key)
            assert grade_fill_blank(item.prompt, item.answer, full).verdict == "correct", full
        for dis in item.answer.distractors:
            for ans in dis.answers:
                assert grade_fill_blank(item.prompt, item.answer, ans).verdict == "incorrect"
        for alt in item.answer.alternatives:
            for ans in alt.answers:
                assert grade_fill_blank(item.prompt, item.answer, ans).verdict == alt.verdict
    elif isinstance(item.answer, ChoiceAnswer):
        assert isinstance(item.prompt, ChoicePrompt)
        assert grade_choice(item.prompt, item.answer, item.answer.correct_option).verdict == "correct"
        for option_id in item.answer.option_feedback:
            assert grade_choice(item.prompt, item.answer, option_id).verdict == "incorrect"
    # open_response: se evalúa con rúbrica por IA (tests en test_writing.py), no por coincidencia
