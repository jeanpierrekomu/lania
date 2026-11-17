"""Adaptador OpenAI-compatible: forma exacta de la petición y errores, sin red (httpx simulado)."""

from typing import Any

import httpx
import pytest

from app.ai.providers.base import ChatMessage, LLMRequest, ProviderError
from app.ai.providers.openai_compatible import OpenAICompatibleProvider


def capture(
    monkeypatch: pytest.MonkeyPatch, status: int = 200, payload: dict[str, Any] | None = None
) -> dict[str, Any]:
    seen: dict[str, Any] = {}

    def fake_post(url: str, json: dict[str, Any], headers: dict[str, str], timeout: float) -> httpx.Response:
        seen.update(url=url, body=json, headers=headers)
        default = {
            "model": "m",
            "choices": [{"message": {"content": "{}"}, "finish_reason": "stop"}],
            "usage": {"prompt_tokens": 10, "completion_tokens": 5},
        }
        return httpx.Response(status, json=payload or default)

    monkeypatch.setattr(httpx, "post", fake_post)
    return seen


def req(**kw: Any) -> LLMRequest:
    return LLMRequest(
        model="m", messages=[ChatMessage("user", "hi")], schema_name="s", json_schema={"type": "object"}, **kw
    )


def test_classic_model_sends_temperature_and_max_tokens(monkeypatch: pytest.MonkeyPatch) -> None:
    seen = capture(monkeypatch)
    out = OpenAICompatibleProvider("https://api.example/v1/", "sk-test", 5).complete(req(temperature=0.3))
    body = seen["body"]
    assert seen["url"] == "https://api.example/v1/chat/completions"
    assert body["temperature"] == 0.3 and body["max_tokens"] == 900 and "reasoning_effort" not in body
    assert body["response_format"]["json_schema"]["strict"] is True
    assert seen["headers"]["authorization"] == "Bearer sk-test"
    assert (out.input_tokens, out.output_tokens) == (10, 5)


def test_reasoning_model_omits_temperature(monkeypatch: pytest.MonkeyPatch) -> None:
    seen = capture(monkeypatch)
    OpenAICompatibleProvider("https://api.example/v1", None, 5).complete(
        req(reasoning_effort="low", max_output_tokens=3000)
    )
    body = seen["body"]
    assert body["reasoning_effort"] == "low" and body["max_completion_tokens"] == 3000
    assert "temperature" not in body and "max_tokens" not in body
    assert "authorization" not in seen["headers"]  # Ollama: sin clave


def test_provider_error_code_is_debuggable_without_content(monkeypatch: pytest.MonkeyPatch) -> None:
    capture(
        monkeypatch,
        400,
        {"error": {"message": "secret details", "code": "unsupported_parameter", "param": "temperature"}},
    )
    with pytest.raises(ProviderError) as exc:
        OpenAICompatibleProvider("https://api.example/v1", "k", 5).complete(req())
    assert exc.value.code == "http_400:unsupported_parameter:temperature"
    assert "secret" not in exc.value.code
