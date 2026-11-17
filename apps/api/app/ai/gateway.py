"""Router + medición de toda llamada a IA (spec §8.2, §11). Una sola puerta de salida hacia los modelos.

- Elige modelo por tarea (rápido para tutor, profundo para escritura).
- Valida la salida con Pydantic; si no valida, UN reintento con el error; si vuelve a fallar → None
  (el llamador marca `needs_review`, nunca inventa una nota).
- Registra cada llamada en `ai_requests` (tokens, latencia, costo si hay precio configurado, estado).
- Corta por presupuesto mensual antes de llamar.
"""

import json
import time
import uuid
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ValidationError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.ai.providers.base import ChatMessage, LLMProvider, LLMRequest, ProviderError
from app.ai.schema_tools import strict_schema
from app.core.config import Settings
from app.core.errors import ApiError
from app.db.models import AiRequest

Task = Literal["tutor_reply", "writing_eval", "speaking_turn"]
TIER: dict[Task, Literal["fast", "deep"]] = {"tutor_reply": "fast", "writing_eval": "deep", "speaking_turn": "fast"}

_override: LLMProvider | None = None


def set_provider_override(provider: LLMProvider | None) -> None:
    """Solo tests: inyecta un proveedor guionado."""
    global _override
    _override = provider


def get_provider(settings: Settings) -> LLMProvider | None:
    if _override is not None:
        return _override
    if settings.llm_provider == "openai_compatible":
        from app.ai.providers.openai_compatible import OpenAICompatibleProvider

        key = settings.llm_api_key.get_secret_value() if settings.llm_api_key else None
        return OpenAICompatibleProvider(
            settings.llm_base_url, key, settings.llm_timeout_seconds, strict=settings.llm_strict_schema
        )
    if settings.llm_provider == "fake":
        from app.ai.providers.fake import FakeProvider

        return FakeProvider()
    return None


def ai_available(settings: Settings) -> bool:
    return get_provider(settings) is not None


def _model_for(settings: Settings, task: Task) -> str:
    model = settings.llm_fast_model if TIER[task] == "fast" else settings.llm_deep_model
    return model or "test-model"


def _effort_for(settings: Settings, task: Task) -> str | None:
    effort: str | None = getattr(settings, f"llm_{TIER[task]}_reasoning_effort")
    return effort


def _cost(settings: Settings, task: Task, tokens_in: int | None, tokens_out: int | None) -> Decimal | None:
    tier = TIER[task]
    p_in = getattr(settings, f"llm_{tier}_price_in_per_mtok")
    p_out = getattr(settings, f"llm_{tier}_price_out_per_mtok")
    if p_in is None or p_out is None or tokens_in is None or tokens_out is None:
        return None  # desconocido: no inventamos precios
    return Decimal(str(round((tokens_in * p_in + tokens_out * p_out) / 1_000_000, 6)))


def _error_code(exc: Exception) -> str:
    """Código depurable SIN contenido del alumno: tipo de error + ruta del campo + motivo."""
    if isinstance(exc, ValidationError) and exc.errors():
        first = exc.errors()[0]
        path = ".".join(str(p) for p in first.get("loc", ()))
        return f"ValidationError:{path}:{first.get('type', '')}"[:120]
    return type(exc).__name__


def _persist_independently(row: AiRequest) -> None:
    from app.db.session import _session_factory

    with _session_factory()() as session, session.begin():
        session.add(row)


def month_spend_usd(db: Session, now: datetime) -> Decimal:
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    total = db.scalar(
        select(func.coalesce(func.sum(AiRequest.estimated_cost_usd), 0)).where(AiRequest.created_at >= start)
    )
    return Decimal(total or 0)


@dataclass(frozen=True)
class StructuredResult[T: BaseModel]:
    output: T | None  # None → salida inválida dos veces: tratar como needs_review
    ai_request_id: uuid.UUID
    model: str
    provider: str


def run_structured[T: BaseModel](
    db: Session,
    settings: Settings,
    *,
    task: Task,
    user_id: uuid.UUID | None,
    messages: list[ChatMessage],
    output_model: type[T],
    prompt_version: str,
    request_key: str,
    validate: Callable[[T], T] | None = None,
    temperature: float = 0.2,
    max_output_tokens: int = 900,
) -> StructuredResult[T]:
    provider = get_provider(settings)
    if provider is None:
        raise ApiError(503, "AI_NOT_CONFIGURED", "La tutora con IA no está configurada en este entorno.")
    now = datetime.now(UTC)
    if settings.monthly_ai_spend_limit_usd is not None and month_spend_usd(db, now) >= Decimal(
        str(settings.monthly_ai_spend_limit_usd)
    ):
        raise ApiError(
            429,
            "QUOTA_EXCEEDED",
            "Se alcanzó el presupuesto mensual de IA del piloto. Puedes seguir practicando ejercicios sin IA.",
        )

    model = _model_for(settings, task)
    schema = strict_schema(output_model)
    convo = list(messages)
    last_id: uuid.UUID | None = None
    for attempt in range(2):
        started = time.monotonic()
        row = AiRequest(
            id=uuid.uuid4(),
            user_id=user_id,
            task=task,
            provider=provider.name,
            model=model,
            prompt_version=prompt_version,
            request_key=f"{request_key}:{attempt}",
            status="ok",
            created_at=datetime.now(UTC),
        )
        try:
            response = provider.complete(
                LLMRequest(
                    model=model,
                    messages=convo,
                    schema_name=task,
                    reasoning_effort=_effort_for(settings, task),
                    json_schema=schema,
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                )
            )
        except ProviderError as exc:
            row.status = "timeout" if exc.timeout else "provider_error"
            row.error_code = exc.code
            row.latency_ms = int((time.monotonic() - started) * 1000)
            _persist_independently(row)  # la petición se revierte, pero el fallo debe quedar medido
            raise ApiError(
                503,
                "PROVIDER_UNAVAILABLE",
                "El servicio de IA no respondió. Intenta de nuevo en un momento.",
                retryable=True,
            ) from exc
        row.latency_ms = int((time.monotonic() - started) * 1000)
        row.model = response.model
        row.input_tokens, row.output_tokens = response.input_tokens, response.output_tokens
        row.estimated_cost_usd = _cost(settings, task, response.input_tokens, response.output_tokens)
        try:
            parsed = output_model.model_validate(json.loads(response.text))
            if validate is not None:
                parsed = validate(parsed)
        except (ValueError, ValidationError) as exc:
            row.status, row.error_code = "invalid_output", _error_code(exc)
            db.add(row)
            db.flush()
            last_id = row.id
            convo = [
                *messages,
                ChatMessage("assistant", response.text[:2000]),
                ChatMessage(
                    "user",
                    f"Tu respuesta no cumplió el esquema JSON pedido ({str(exc)[:300]}). Devuelve solo JSON válido.",
                ),
            ]
            continue
        db.add(row)
        db.flush()
        return StructuredResult(output=parsed, ai_request_id=row.id, model=response.model, provider=provider.name)
    assert last_id is not None
    return StructuredResult(output=None, ai_request_id=last_id, model=model, provider=provider.name)
