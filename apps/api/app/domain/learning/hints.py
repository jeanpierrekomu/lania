"""Pistas para ANTES del reintento: explican dónde mirar sin revelar la respuesta (spec §3.1 paso 5).

Prioridad: `retry_hint_es` escrito en el ítem → pista genérica por familia de regla → pista general.
"""

from typing import Any

RULE_HINTS: list[tuple[str, str]] = [
    (
        "grammar.present_simple.third_person_s",
        "Fíjate en quién hace la acción. ¿Es he, she o it? Revisa la terminación del verbo.",
    ),
    (
        "grammar.present_simple.no_s_non_third",
        "¿El sujeto es he, she o it? Si no lo es, revisa la terminación del verbo.",
    ),
    (
        "grammar.present_simple.no_be_with_main_verb",
        "¿Hace falta am / is / are delante de un verbo normal en presente simple?",
    ),
    ("grammar.present_simple.negative_needs_auxiliary", "En inglés, la negación necesita un auxiliar antes de not."),
    ("grammar.present_simple.question_needs_do", "Para preguntar, ¿qué palabra va al inicio de la oración?"),
    (
        "grammar.present_continuous.missing_be",
        "Una forma con -ing necesita algo delante… ¿o la consigna pide otro tiempo?",
    ),
    (
        "grammar.do_does",
        "Revisa el auxiliar y el verbo que lo acompaña: ¿concuerdan con el sujeto? ¿El verbo va en base?",
    ),
    ("grammar.be.agreement", "Revisa qué forma de be va con este sujeto."),
    ("grammar.future", "Después de will, ¿cómo va el verbo: con -ing, con to o en su forma base?"),
    ("grammar.past_simple", "Revisa el tiempo: ¿es pasado? Si hay did, ¿cómo queda el verbo principal?"),
    ("grammar.infinitive", "Después de want, ¿qué palabra pequeña necesita el verbo?"),
    ("task.instruction_mismatch", "Tu respuesta tiene sentido, pero vuelve a leer exactamente qué pide la consigna."),
    ("task.verb_hint_mismatch", "Usa el verbo que aparece entre paréntesis."),
    ("task.tense_mismatch", "Tu frase es inglés válido, pero vuelve a leer la consigna: ¿qué tiempo verbal pide?"),
    ("spelling", "La idea es correcta; revisa letra por letra cómo se escribe."),
]
GENERIC_HINT = "Vuelve a leer la consigna: ¿qué tiempo verbal pide y quién hace la acción?"


def retry_hint(answer_schema: dict[str, Any], rule: str | None, option_id: str | None = None) -> str | None:
    if rule is None:
        return None
    if option_id is not None:
        fb = answer_schema.get("option_feedback", {}).get(option_id) or {}
        if fb.get("retry_hint_es"):
            return str(fb["retry_hint_es"])
    for group in ("distractors", "alternatives"):
        for entry in answer_schema.get(group, []):
            if entry.get("rule") == rule and entry.get("retry_hint_es"):
                return str(entry["retry_hint_es"])
    for prefix, hint in RULE_HINTS:
        if rule.startswith(prefix):
            return hint
    return GENERIC_HINT
