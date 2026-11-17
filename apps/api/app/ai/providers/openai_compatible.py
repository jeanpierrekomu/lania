"""Adaptador para APIs compatibles con OpenAI Chat Completions + Structured Outputs.

Sirve para OpenAI y para modelos abiertos servidos con la misma interfaz (p. ej. Ollama en
http://localhost:11434/v1). Verificado contra la documentación oficial de Structured Outputs
(2 nov 2026) y contra Ollama 0.40.

Modelos de razonamiento (`reasoning_effort` definido): se envía `reasoning_effort` y
`max_completion_tokens` (que incluye los tokens de razonamiento) y NO se envía `temperature`.
"""

import httpx

from app.ai.providers.base import LLMRequest, LLMResponse, ProviderError


def _error_code(res: httpx.Response) -> str:
    """Código depurable a partir del error del proveedor (sin contenido del alumno ni claves)."""
    code = f"http_{res.status_code}"
    try:
        err = res.json().get("error") or {}
        detail = ":".join(str(err.get(k)) for k in ("code", "param") if err.get(k))
    except (ValueError, AttributeError):
        detail = ""
    return f"{code}:{detail}"[:120] if detail else code


class OpenAICompatibleProvider:
    name = "openai_compatible"

    def __init__(self, base_url: str, api_key: str | None, timeout_seconds: float, strict: bool = True) -> None:
        self._url = base_url.rstrip("/") + "/chat/completions"
        self._headers = {"content-type": "application/json"}
        if api_key:
            self._headers["authorization"] = f"Bearer {api_key}"
        self._timeout = timeout_seconds
        self._strict = strict

    def complete(self, request: LLMRequest) -> LLMResponse:
        body: dict[str, object] = {
            "model": request.model,
            "messages": [{"role": m.role, "content": m.content} for m in request.messages],
            "response_format": {
                "type": "json_schema",
                "json_schema": {"name": request.schema_name, "strict": self._strict, "schema": request.json_schema},
            },
        }
        if request.reasoning_effort:
            body["reasoning_effort"] = request.reasoning_effort
            body["max_completion_tokens"] = request.max_output_tokens
        else:
            body["temperature"] = request.temperature
            body["max_tokens"] = request.max_output_tokens
        try:
            res = httpx.post(self._url, json=body, headers=self._headers, timeout=self._timeout)
        except httpx.TimeoutException as exc:
            raise ProviderError("timeout", timeout=True) from exc
        except httpx.HTTPError as exc:
            raise ProviderError("network_error") from exc
        if res.status_code >= 400:
            raise ProviderError(_error_code(res))
        try:
            data = res.json()
            choice = data["choices"][0]
            text = choice["message"]["content"] or ""
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise ProviderError("malformed_response") from exc
        usage = data.get("usage") or {}
        return LLMResponse(
            text=text,
            model=str(data.get("model") or request.model),
            input_tokens=usage.get("prompt_tokens"),
            output_tokens=usage.get("completion_tokens"),
            raw_meta={"finish_reason": choice.get("finish_reason")},
        )
