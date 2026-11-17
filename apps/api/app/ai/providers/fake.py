"""Proveedor guionado SOLO para tests (APP_ENV=test). Nunca se usa para «simular» IA ante el alumno."""

import json
from collections.abc import Callable
from typing import Any

from app.ai.providers.base import LLMRequest, LLMResponse, ProviderError

Responder = Callable[[LLMRequest], dict[str, Any] | str]


def _default(request: LLMRequest) -> dict[str, Any] | str:
    """Respuestas deterministas y plausibles para E2E: válidas según el esquema pedido."""
    if request.schema_name == "tutor_reply":
        return {
            "message": "¡Buena pregunta! Con he/she/it el verbo lleva -s: she works. Try it: what does your friend do?",
            "corrections": [],
            "practice_prompt_en": "What does your best friend do on weekends?",
            "suggested_skill_code": "grammar.present_simple.subject_verb_agreement",
        }
    if request.schema_name == "speaking_turn":
        return {
            "on_task": True,
            "corrections": [],
            "natural_version_en": None,
            "feedback_es": "Respondiste a la pregunta con una frase completa.",
            "reply_en": "Thank you, that's clear.",
        }
    return {
        "task_fulfillment": {"score": 2, "comment_es": "Respondes a la consigna con ideas propias."},
        "accuracy": {"score": 2, "comment_es": "Algunos errores, pero se entiende."},
        "coherence": {"score": 2, "comment_es": "Las ideas siguen un orden claro."},
        "range": {"score": 1, "comment_es": "Vocabulario y estructuras todavía básicos."},
        "strengths_es": "Comunicas tu idea principal de forma comprensible.",
        "errors": [],
        "natural_version_en": None,
        "uncertain": False,
        "uncertainty_reason_es": None,
    }


class FakeProvider:
    name = "fake"

    def __init__(self, responder: Responder | None = None) -> None:
        self.responder = responder or _default
        self.calls: list[LLMRequest] = []

    def complete(self, request: LLMRequest) -> LLMResponse:
        self.calls.append(request)
        out = self.responder(request)
        if isinstance(out, dict) and out.get("_raise"):
            raise ProviderError(str(out["_raise"]))
        if isinstance(out, dict):
            out = {k: v for k, v in out.items() if not k.startswith("_")}
        text = out if isinstance(out, str) else json.dumps(out, ensure_ascii=False)
        return LLMResponse(text=text, model=request.model, input_tokens=100, output_tokens=50)
