"""Contratos de proveedor (spec §8.1). Sin nombres de SDK ni de modelos: todo por configuración."""

from dataclasses import dataclass, field
from typing import Any, Protocol


@dataclass(frozen=True)
class ChatMessage:
    role: str  # system | user | assistant
    content: str


@dataclass(frozen=True)
class LLMRequest:
    model: str
    messages: list[ChatMessage]
    schema_name: str
    json_schema: dict[str, Any]
    temperature: float = 0.2
    max_output_tokens: int = 900
    # Modelos de razonamiento (p. ej. familia gpt-6 de OpenAI): None = modelo clásico.
    reasoning_effort: str | None = None


@dataclass(frozen=True)
class LLMResponse:
    text: str
    model: str
    input_tokens: int | None
    output_tokens: int | None
    raw_meta: dict[str, Any] = field(default_factory=dict)


class ProviderError(Exception):
    """El proveedor falló (red, 5xx, credenciales). `code` es apto para registrar, sin datos del alumno."""

    def __init__(self, code: str, *, timeout: bool = False) -> None:
        super().__init__(code)
        self.code = code
        self.timeout = timeout


class LLMProvider(Protocol):
    name: str

    def complete(self, request: LLMRequest) -> LLMResponse: ...
