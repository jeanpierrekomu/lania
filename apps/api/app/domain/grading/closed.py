"""Corrector determinista para ejercicios cerrados — `grammar_closed_v1` / `closed_v1` (ADR-004).

Orden: oración completa → claves → alternativas → distractores → diagnósticos por regla →
error de escritura → no reconocida. Si no se reconoce, se reintenta con lecturas seguras:
pronombre en lugar del sujeto, «'s + -ing» = is, contracción sin apóstrofo. Nunca usa un LLM.
"""

import re
from dataclasses import dataclass, field, replace
from typing import Literal, TypedDict

from app.content.models import BLANK, ChoiceAnswer, ChoicePrompt, FillBlankAnswer, FillBlankPrompt
from app.domain.grading.normalize import normalize, osa_distance, repair_contractions

GRADER = "deterministic"
GRADER_VERSION = "closed_v2"  # v2: golden set 96 %, reinterpretaciones y ortografía de sufijos

Verdict = Literal["correct", "valid_alternative", "less_natural", "spelling_error", "partial", "incorrect"]
Confidence = Literal["low", "medium", "high"]

SCORES: dict[Verdict, float] = {
    "correct": 1.0,
    "valid_alternative": 1.0,
    "less_natural": 0.75,
    "spelling_error": 0.5,
    "partial": 0.5,
    "incorrect": 0.0,
}


@dataclass(frozen=True)
class GradeError:
    rule_code: str
    explanation_es: str
    span: str | None = None
    minimal_correction: str | None = None


@dataclass(frozen=True)
class GradeResult:
    status: Literal["graded", "needs_review"]
    verdict: Verdict | None
    score: float | None
    matched_rule: str | None
    feedback_es: str
    explanation_es: str
    expected_answer: str
    confidence: Confidence
    interpreted_answer: str | None = None
    errors: list[GradeError] = field(default_factory=list)


class _Common(TypedDict):
    explanation_es: str
    expected: str
    interpreted: str | None


def _graded(
    verdict: Verdict,
    *,
    rule: str | None,
    feedback_es: str,
    explanation_es: str,
    expected: str,
    interpreted: str | None,
    confidence: Confidence = "high",
    errors: list[GradeError] | None = None,
) -> GradeResult:
    return GradeResult(
        status="graded",
        verdict=verdict,
        score=SCORES[verdict],
        matched_rule=rule,
        feedback_es=feedback_es,
        explanation_es=explanation_es,
        expected_answer=expected,
        confidence=confidence,
        interpreted_answer=interpreted,
        errors=errors or [],
    )


# ───────────────────────────── opción múltiple ─────────────────────────────


def grade_choice(prompt: ChoicePrompt, answer: ChoiceAnswer, option_id: str) -> GradeResult:
    options = {o.id: o.text for o in prompt.options}
    expected = options[answer.correct_option]
    if option_id not in options:
        raise ValueError("opción inexistente")
    if option_id == answer.correct_option:
        return _graded(
            "correct",
            rule=None,
            feedback_es="¡Correcto!",
            explanation_es=answer.explanation_es,
            expected=expected,
            interpreted=options[option_id],
        )
    fb = answer.option_feedback[option_id]
    return _graded(
        "incorrect",
        rule=fb.rule,
        feedback_es=fb.feedback_es,
        explanation_es=answer.explanation_es,
        expected=expected,
        interpreted=options[option_id],
        errors=[
            GradeError(
                rule_code=fb.rule,
                explanation_es=fb.feedback_es,
                span=options[option_id],
                minimal_correction=expected,
            )
        ],
    )


# ───────────────────────────── completar hueco ─────────────────────────────

_PRONOUNS: dict[str, tuple[str, ...]] = {
    "1s": ("i",),
    "2s": ("you",),
    "3s": ("he", "she", "it"),
    "1p": ("we",),
    "2p": ("you",),
    "3p": ("they",),
}
_ALL_PRONOUNS = frozenset(p for group in _PRONOUNS.values() for p in group)
_POSITIVE: frozenset[Verdict] = frozenset({"correct", "valid_alternative", "less_natural"})
_BRITISH_COLLECTIVE = "grammar.collective_noun.plural_agreement_british"


def _frame(sentence_en: str) -> tuple[list[str], list[str]]:
    before, after = sentence_en.split(BLANK)
    return normalize(before).split(), normalize(after).split()


def _split_frame(sentence_en: str, answer_text: str) -> tuple[str, bool]:
    """Quita del texto lo que pertenece al enunciado. Devuelve (hueco, ¿el alumno copió el sujeto/prefijo?).

    Además del prefijo/sufijo exactos, recorta un solapamiento parcial: «goes to» → «goes»
    (el alumno copió también la primera palabra del sufijo) o «Luis checks» → «checks».
    """
    norm_answer = normalize(answer_text)
    prefix, suffix = _frame(sentence_en)
    tokens = norm_answer.split()
    if not tokens:
        return norm_answer, False
    prefix_seen = False
    if prefix and tokens[: len(prefix)] == prefix:
        if len(tokens) == len(prefix):
            return norm_answer, True
        tokens, prefix_seen = tokens[len(prefix) :], True
    else:
        for k in range(len(prefix) - 1, 0, -1):  # final del prefijo («luis checks» con «every morning luis»)
            if len(tokens) > k and tokens[:k] == prefix[-k:]:
                tokens, prefix_seen = tokens[k:], True
                break
    if suffix and len(tokens) > len(suffix) and tokens[-len(suffix) :] == suffix:
        tokens = tokens[: -len(suffix)]
    else:
        for k in range(min(len(suffix), len(tokens) - 1), 0, -1):  # inicio del sufijo («goes to»)
            if tokens[-k:] == suffix[:k]:
                tokens = tokens[:-k]
                break
    return " ".join(tokens) or norm_answer, prefix_seen


def extract_blank(sentence_en: str, answer_text: str) -> str:
    """Si el alumno escribió la oración completa, devuelve solo lo que corresponde al hueco."""
    return _split_frame(sentence_en, answer_text)[0]


def _pronoun_substitution(sentence_en: str, person: str, norm_answer: str) -> tuple[str, str] | None:
    """«She works at a design studio» para «My sister ___ …»: devuelve (oración con el sujeto original, pronombre).

    Solo si el pronombre concuerda con la persona del ítem y reemplaza a un sujeto que no era ya un
    pronombre («He ___» → «She doesn't…» cambia de sujeto, no lo sustituye).
    """
    prefix, _ = _frame(sentence_en)
    tokens = norm_answer.split()
    for i in range(len(prefix)):
        replaced = prefix[i:]
        if any(t in _ALL_PRONOUNS for t in replaced):
            continue
        if len(tokens) > i + 1 and tokens[:i] == prefix[:i] and tokens[i] in _PRONOUNS.get(person, ()):
            return " ".join(prefix + tokens[i + 1 :]), tokens[i]
    return None


def _expand_s_before_ing(norm_answer: str) -> str:
    """«my sister's working» / «she's watching»: 's + verbo en -ing solo puede ser is."""
    tokens = norm_answer.split()
    out = [
        f"{tok[:-2]} is" if tok.endswith("'s") and i + 1 < len(tokens) and tokens[i + 1].endswith("ing") else tok
        for i, tok in enumerate(tokens)
    ]
    return " ".join(out)


def _be_for(person: str) -> str:
    return {"1s": "am", "3s": "is"}.get(person, "are")


def _do_for(person: str) -> str:
    return "does" if person == "3s" else "do"


_INFLECTIONS = ("s", "es", "ing", "ed", "d")


def _is_inflection_of(longer: str, shorter: str) -> bool:
    """longer = shorter + sufijo gramatical (work/works, do/does, start/started). «workss» no lo es."""
    return any(longer == shorter + suffix and not (suffix == "s" and shorter.endswith("s")) for suffix in _INFLECTIONS)


def _is_typo(given: str, key: str) -> bool:
    """Error de escritura: un solo token difiere, sin ser un cambio de terminación gramatical."""
    g_tokens, k_tokens = given.split(), key.split()
    if len(g_tokens) != len(k_tokens):
        return False
    diffs = [(g, k) for g, k in zip(g_tokens, k_tokens, strict=True) if g != k]
    if len(diffs) != 1:
        return False
    g, k = diffs[0]
    if len(k) < 3 or _is_inflection_of(g, k) or _is_inflection_of(k, g):
        return False  # work/works, do/does: eso es gramática, no ortografía
    limit = 2 if len(k) >= 8 else 1
    return osa_distance(g, k) <= limit


def _third_person_spelling_rule(third: str) -> str:
    if third.endswith("ies"):
        return "spelling.third_person.consonant_y_ies"
    if third.endswith("oes"):
        return "spelling.third_person.o_es"
    if third.endswith("ches"):
        return "spelling.third_person.ch_es"
    if third.endswith(("shes", "sses", "xes", "zes")):
        return "spelling.third_person.sibilant_es"
    return "spelling.third_person.plain_s"


def _diagnose(spec: FillBlankAnswer, given: str) -> tuple[Verdict, str, str, str | None] | None:
    """Diagnósticos genéricos por regla para afirmativas con formas verbales declaradas."""
    verb = spec.verb
    if verb is None or spec.polarity != "affirmative" or spec.tense != "present_simple":
        return None
    person, expected = spec.subject, spec.accepted[0]
    third = person == "3s"
    tokens = given.split()
    base, third_form, ing = normalize(verb.base), normalize(verb.third), normalize(verb.ing)

    if given == base and third:
        return (
            "incorrect",
            "grammar.present_simple.third_person_s",
            f"Bien elegido el verbo. Con he / she / it lleva -s: {verb.third}.",
            verb.third,
        )
    if given == third_form and not third:
        return (
            "incorrect",
            "grammar.present_simple.no_s_non_third",
            f"La -s es solo para he / she / it. Aquí va {verb.base}.",
            verb.base,
        )
    # Ortografía de la terminación de 3.ª persona (studyes, checkes): es la regla que se enseña, no una errata.
    if third and given != third_form and given in {base + "s", base + "es"}:
        return (
            "incorrect",
            _third_person_spelling_rule(third_form),
            f"Bien la idea de la tercera persona; falla la ortografía de la terminación. Se escribe {verb.third}.",
            verb.third,
        )
    if given == ing:
        return (
            "incorrect",
            "grammar.present_continuous.missing_be",
            f"{verb.ing} necesita am / is / are delante y significaría «ahora mismo». "
            f"La consigna pide presente simple: {expected}.",
            expected,
        )
    if len(tokens) == 2 and tokens[0] in {"am", "is", "are"}:
        be, main = tokens
        if main in {base, third_form}:
            return (
                "incorrect",
                "grammar.present_simple.no_be_with_main_verb",
                f"No usamos {be} con un verbo normal en presente simple (es como «es trabaja»). "
                f"Solo el verbo: {expected}.",
                expected,
            )
        if main == ing:
            if be == _be_for(person):
                return (
                    "partial",
                    "task.tense_mismatch.present_continuous",
                    f"«{be} {verb.ing}» es inglés correcto (presente continuo: ahora / temporal), "
                    f"pero la consigna pide presente simple: {expected}.",
                    expected,
                )
            return (
                "incorrect",
                "grammar.be.agreement",
                f"El presente continuo con este sujeto usaría {_be_for(person)}, y la consigna "
                f"pide presente simple: {expected}.",
                expected,
            )
    if len(tokens) == 2 and tokens[0] in {"do", "does"}:
        aux, main = tokens
        # Si el ítem acepta la concordancia plural británica (my team work), «do work» también es válido.
        british_plural = any(a.rule == _BRITISH_COLLECTIVE for a in spec.alternatives)
        aux_ok = aux == _do_for(person) or (british_plural and aux == "do")
        if main == base and aux_ok:
            return (
                "less_natural",
                "style.emphatic_do",
                f"«{aux} {verb.base}» es correcto, pero es enfático («sí que…»). En una afirmación "
                f"neutra decimos {expected}.",
                expected,
            )
        if main == third_form:
            return (
                "incorrect",
                "grammar.do_does.base_form",
                f"Después de do / does el verbo va en base, y en una afirmación neutra no hace falta "
                f"auxiliar: {expected}.",
                expected,
            )
        return (
            "incorrect",
            "grammar.do_does.agreement",
            f"En una afirmación no hace falta do / does: {expected}.",
            expected,
        )
    return None


_UNRECOGNIZED_FEEDBACK = (
    "No reconocemos esta respuesta como correcta para esta consigna. Si crees que tu respuesta "
    "también es válida, puedes pedir que la revisemos."
)


def _grade_given(spec: FillBlankAnswer, given: str) -> GradeResult:
    """Pipeline sobre el hueco ya extraído: claves → alternativas → distractores → reglas → errata."""
    expected = spec.accepted[0]
    common = _Common(explanation_es=spec.explanation_es, expected=expected, interpreted=given)

    if given in {normalize(a) for a in spec.accepted}:
        return _graded("correct", rule=None, feedback_es="¡Correcto!", **common)

    for alt in spec.alternatives:
        if given in {normalize(a) for a in alt.answers}:
            return _graded(alt.verdict, rule=alt.rule, feedback_es=alt.feedback_es, **common)

    for dis in spec.distractors:
        if given in {normalize(a) for a in dis.answers}:
            return _graded(
                "incorrect",
                rule=dis.rule,
                feedback_es=dis.feedback_es,
                **common,
                errors=[
                    GradeError(
                        rule_code=dis.rule,
                        explanation_es=dis.feedback_es,
                        span=given,
                        minimal_correction=dis.minimal_correction or expected,
                    )
                ],
            )

    diagnosis = _diagnose(spec, given)
    if diagnosis is not None:
        verdict, rule, feedback, correction = diagnosis
        errors = (
            []
            if verdict in ("less_natural",)
            else [GradeError(rule_code=rule, explanation_es=feedback, span=given, minimal_correction=correction)]
        )
        return _graded(verdict, rule=rule, feedback_es=feedback, errors=errors, **common)

    # Errata de una clave o de una alternativa válida (p. ej. «wrok» → work, plural británico).
    positive_alts = [a for alt in spec.alternatives if alt.verdict != "partial" for a in alt.answers]
    typo_targets = [*spec.accepted, *positive_alts]
    for key in typo_targets:
        if _is_typo(given, normalize(key)):
            feedback = f"Es la forma correcta con un error de escritura: se escribe «{key}»."
            return _graded(
                "spelling_error",
                rule="spelling.typo",
                feedback_es=feedback,
                **common,
                errors=[
                    GradeError(rule_code="spelling.typo", explanation_es=feedback, span=given, minimal_correction=key)
                ],
            )

    if not re.search(r"[a-z]", given):
        return GradeResult(
            status="needs_review",
            verdict=None,
            score=None,
            matched_rule=None,
            feedback_es="No pudimos interpretar tu respuesta. No cuenta en tu progreso; intenta escribirla de nuevo.",
            explanation_es=spec.explanation_es,
            expected_answer=expected,
            confidence="low",
            interpreted_answer=given,
        )

    return _graded(
        "incorrect",
        rule="unrecognized",
        feedback_es=_UNRECOGNIZED_FEEDBACK,
        confidence="medium",
        **common,
        errors=[
            GradeError(
                rule_code="unrecognized", explanation_es=_UNRECOGNIZED_FEEDBACK, span=given, minimal_correction=expected
            )
        ],
    )


def _unrecognized(result: GradeResult) -> bool:
    return result.matched_rule == "unrecognized"


def _grade_text(prompt: FillBlankPrompt, spec: FillBlankAnswer, norm_answer: str) -> GradeResult:
    """Extrae el hueco y califica; si no se reconoce, prueba la sustitución del sujeto por un pronombre."""
    given, prefix_seen = _split_frame(prompt.sentence_en, norm_answer)
    result = _grade_given(spec, given)
    if not _unrecognized(result) or prefix_seen:
        return result  # «My sister she works»: el sujeto ya estaba; el pronombre sobra (doble sujeto)
    substitution = _pronoun_substitution(prompt.sentence_en, spec.subject, norm_answer)
    if substitution is None:
        return result
    rewritten, pronoun = substitution
    sub_result = _grade_given(spec, _split_frame(prompt.sentence_en, rewritten)[0])
    if sub_result.verdict == "correct":
        feedback = (
            f"Válido: usaste el pronombre {pronoun} en lugar del sujeto del enunciado y la forma verbal es correcta. "
            f"En el ejercicio el sujeto era otro, pero la concordancia es la misma: {spec.accepted[0]}."
        )
        return replace(
            sub_result,
            verdict="valid_alternative",
            score=SCORES["valid_alternative"],
            matched_rule="grammar.subject.pronoun_substitution",
            feedback_es=feedback,
        )
    if sub_result.verdict == "valid_alternative" or _unrecognized(sub_result):
        return result  # «It work remotely»: el plural británico no vale con it
    return sub_result


def grade_fill_blank(prompt: FillBlankPrompt, spec: FillBlankAnswer, answer_text: str) -> GradeResult:
    norm_answer = normalize(answer_text)
    result = _grade_text(prompt, spec, norm_answer)
    if not _unrecognized(result):
        return result

    # Reinterpretaciones seguras, solo cuando la lectura literal no se reconoce.
    with_is = _expand_s_before_ing(norm_answer)
    if with_is != norm_answer:
        reread = _grade_text(prompt, spec, with_is)
        if not _unrecognized(reread):
            return reread

    repaired = repair_contractions(norm_answer)
    if repaired is not None:
        reread = _grade_text(prompt, spec, repaired)
        if reread.verdict in _POSITIVE:
            expected = spec.accepted[0]
            feedback = f"La estructura es correcta; solo falta o sobra un apóstrofo. Se escribe «{expected}»."
            return replace(
                reread,
                verdict="spelling_error",
                score=SCORES["spelling_error"],
                matched_rule="spelling.apostrophe",
                feedback_es=feedback,
                errors=[
                    GradeError(
                        rule_code="spelling.apostrophe",
                        explanation_es=feedback,
                        span=extract_blank(prompt.sentence_en, norm_answer),
                        minimal_correction=expected,
                    )
                ],
            )
        if not _unrecognized(reread):
            return reread  # p. ej. «dont drink» con he → distractor de concordancia
    return result


def fill_sentence(sentence_en: str, answer: str) -> str:
    """Oración con el hueco completado (para mostrar la versión correcta)."""
    filled = sentence_en.replace(BLANK, answer)
    return filled[0].upper() + filled[1:] if filled else filled
