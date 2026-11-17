"""Evaluación de escritura abierta con rúbrica writing_v1 (spec §17.2).

La IA propone; este módulo valida: los errores deben citar texto literal del alumno, los puntajes
se limitan por reglas deterministas (p. ej. textos demasiado cortos) y ante duda → needs_review.
El texto original nunca se modifica (vive inmutable en `attempts`).
"""

import re
import uuid
from dataclasses import dataclass, field, replace
from typing import Any, Literal

from sqlalchemy.orm import Session

from app.ai.gateway import ai_available, run_structured
from app.ai.outputs import WritingError, WritingEvalOutput
from app.ai.prompts.academic import BASE_ACADEMIC, WRITING_PROMPT_VERSION, WRITING_RUBRIC, wrap_learner_text
from app.ai.providers.base import ChatMessage
from app.content.models import OpenResponseAnswer, OpenResponsePrompt
from app.core.config import Settings

CRITERIA = ("task_fulfillment", "accuracy", "coherence", "range")
Status = Literal["graded", "needs_review"]


@dataclass
class WritingOutcome:
    status: Status
    grader: str  # llm | none
    feedback_es: str
    confidence: Literal["low", "medium", "high"]
    verdict: str | None = None
    score: float | None = None
    criteria: dict[str, dict[str, Any]] | None = None
    errors: list[dict[str, Any]] = field(default_factory=list)
    strengths_es: str | None = None
    natural_version_en: str | None = None
    model_id: str | None = None
    ai_request_id: uuid.UUID | None = None
    notes: list[str] = field(default_factory=list)


def word_count(text: str) -> int:
    return len(re.findall(r"[A-Za-z']+", text))


_ES = {
    "de",
    "la",
    "que",
    "el",
    "en",
    "y",
    "los",
    "las",
    "del",
    "se",
    "por",
    "para",
    "con",
    "una",
    "mi",
    "me",
    "es",
    "muy",
    "pero",
    "todos",
    "días",
    "después",
    "también",
    "porque",
    "cuando",
    "trabajo",
    "estudio",
}
_EN = {
    "the",
    "and",
    "i",
    "to",
    "a",
    "in",
    "is",
    "my",
    "at",
    "of",
    "with",
    "for",
    "on",
    "every",
    "day",
    "work",
    "study",
    "go",
    "have",
    "we",
    "you",
    "it",
    "are",
    "am",
    "will",
    "do",
    "but",
    "then",
    "after",
}


def looks_not_english(text: str) -> bool:
    """Filtro determinista previo a la IA: un texto mayormente en español no se evalúa como inglés."""
    tokens = re.findall(r"[a-záéíóúñü]+", text.lower())
    if len(tokens) < 5:
        return False
    es = sum(t in _ES for t in tokens) / len(tokens)
    en = sum(t in _EN for t in tokens) / len(tokens)
    return es >= 0.2 and es > 3 * en


def anchor_errors(text: str, errors: list[WritingError]) -> tuple[list[dict[str, Any]], int]:
    """Conserva solo errores cuyo `span` existe en el texto (anti-alucinación). Devuelve (válidos, descartados)."""
    kept: list[dict[str, Any]] = []
    dropped = 0
    lower = text.lower()
    for err in errors:
        pos = text.find(err.span)
        if pos < 0:
            pos = lower.find(err.span.lower())
        if pos < 0:
            dropped += 1
            continue
        item = err.model_dump()
        item["span"] = text[pos : pos + len(err.span)]
        item["start"] = pos
        kept.append(item)
    return kept, dropped


def verdict_for(score: float) -> str:
    if score >= 0.75:
        return "correct"
    if score >= 0.42:
        return "partial"
    return "incorrect"


def build_messages(prompt: OpenResponsePrompt, spec: OpenResponseAnswer, text: str) -> list[ChatMessage]:
    system = f"{BASE_ACADEMIC}\n\nTAREA: evaluar un texto libre del alumno.\n{WRITING_RUBRIC}"
    session = (
        f"Consigna (inglés): {prompt.task_en}\n"
        f"Extensión pedida: {prompt.min_words}–{prompt.max_words} palabras. Nivel esperado: {spec.expected_level}.\n"
        f"Qué debería contener una respuesta que cumple la tarea: {spec.reviewer_notes_es}\n"
        f"Palabras escritas por el alumno: {word_count(text)}.\n\n"
        f"Texto del alumno:\n{wrap_learner_text(text)}"
    )
    return [ChatMessage("system", system), ChatMessage("user", session)]


def evaluate_writing(
    db: Session,
    settings: Settings,
    *,
    user_id: uuid.UUID,
    prompt: OpenResponsePrompt,
    spec: OpenResponseAnswer,
    text: str,
    request_key: str,
) -> WritingOutcome:
    if not ai_available(settings):
        return WritingOutcome(
            status="needs_review",
            grader="none",
            confidence="low",
            feedback_es="Guardamos tu texto tal como lo escribiste. Se evaluará cuando haya un proveedor de IA "
            "configurado o una revisión docente; mientras tanto no cuenta en tu nivel.",
        )
    if looks_not_english(text):
        return WritingOutcome(
            status="needs_review",
            grader="rule",
            confidence="medium",
            feedback_es="Tu texto parece estar en español. Esta consigna evalúa tu inglés: no cuenta en tu nivel. "
            "Si quieres, vuelve a intentarlo en inglés, aunque sea con frases simples.",
        )
    result = run_structured(
        db,
        settings,
        task="writing_eval",
        user_id=user_id,
        messages=build_messages(prompt, spec, text),
        output_model=WritingEvalOutput,
        prompt_version=WRITING_PROMPT_VERSION,
        request_key=request_key,
        temperature=0.1,
        max_output_tokens=1400,
    )
    if result.output is None:
        return WritingOutcome(
            status="needs_review",
            grader="llm",
            confidence="low",
            model_id=result.model,
            ai_request_id=result.ai_request_id,
            feedback_es="No pudimos evaluar tu texto con confianza. Queda para revisión y no cuenta en tu nivel.",
        )
    out = result.output
    criteria = {name: getattr(out, name).model_dump() for name in CRITERIA}
    notes: list[str] = []

    words = word_count(text)
    if words < prompt.min_words / 2 and criteria["task_fulfillment"]["score"] > 1:
        criteria["task_fulfillment"]["score"] = 1  # regla determinista: muy corto no cumple la tarea
        notes.append(f"Texto corto ({words} palabras): cumplimiento de la tarea limitado a 1.")

    errors, dropped = anchor_errors(text, out.errors)
    if dropped:
        notes.append(f"Se descartaron {dropped} corrección(es) que no citaban tu texto literal.")

    base = WritingOutcome(
        status="graded",
        grader="llm",
        feedback_es=out.strengths_es,
        confidence="low" if dropped else "medium",
        criteria=criteria,
        errors=errors,
        strengths_es=out.strengths_es,
        natural_version_en=out.natural_version_en,
        model_id=result.model,
        ai_request_id=result.ai_request_id,
        notes=notes,
    )  # evaluación por IA: la confianza nunca es «alta» sin revisión humana
    if out.uncertain or (out.errors and dropped > len(out.errors) / 2):
        reason = out.uncertainty_reason_es or "La evaluación automática no fue confiable."
        return replace(
            base,
            status="needs_review",
            confidence="low",
            feedback_es=f"{reason} Queda para revisión y no cuenta en tu nivel.",
        )

    score = round(sum(c["score"] for c in criteria.values()) / (3 * len(CRITERIA)), 3)
    return replace(base, verdict=verdict_for(score), score=score)
