"""Voz por turnos con APIs compatibles con OpenAI: transcripción (STT) y síntesis (TTS).

Verificado contra la documentación oficial (developers.openai.com, 13 nov 2026):
- POST /v1/audio/transcriptions (multipart): file, model, languages[] (gpt-transcribe) → {"text": …}.
- POST /v1/audio/speech (JSON): model, voice, input (≤ 4096 caracteres), instructions, response_format.
"""

from dataclasses import dataclass
from typing import Protocol

import httpx

from app.ai.providers.base import ProviderError
from app.ai.providers.openai_compatible import _error_code

VOICES = frozenset(
    {"alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"}
)


@dataclass(frozen=True)
class SpeechAudio:
    data: bytes
    mime: str


class SpeechProvider(Protocol):
    name: str

    def transcribe(self, audio: bytes, filename: str, mime: str, model: str) -> str: ...

    def synthesize(self, text: str, model: str, voice: str, instructions: str | None) -> SpeechAudio: ...


class OpenAISpeechProvider:
    name = "openai_compatible"

    def __init__(self, base_url: str, api_key: str | None, timeout_seconds: float) -> None:
        self._base = base_url.rstrip("/")
        self._headers = {"authorization": f"Bearer {api_key}"} if api_key else {}
        self._timeout = timeout_seconds

    def _post(self, path: str, **kwargs: object) -> httpx.Response:
        try:
            res = httpx.post(f"{self._base}{path}", headers=self._headers, timeout=self._timeout, **kwargs)  # type: ignore[arg-type]
        except httpx.TimeoutException as exc:
            raise ProviderError("timeout", timeout=True) from exc
        except httpx.HTTPError as exc:
            raise ProviderError("network_error") from exc
        if res.status_code >= 400:
            raise ProviderError(_error_code(res))
        return res

    def transcribe(self, audio: bytes, filename: str, mime: str, model: str) -> str:
        data: dict[str, str] = {"model": model, "response_format": "json"}
        if model == "gpt-transcribe":
            data["languages[]"] = "en"  # aprendemos inglés: no traducir ni «adivinar» español
        else:
            data["language"] = "en"
        res = self._post("/audio/transcriptions", data=data, files={"file": (filename, audio, mime)})
        try:
            return str(res.json()["text"]).strip()
        except (ValueError, KeyError, TypeError) as exc:
            raise ProviderError("malformed_response") from exc

    def synthesize(self, text: str, model: str, voice: str, instructions: str | None) -> SpeechAudio:
        body: dict[str, object] = {"model": model, "voice": voice, "input": text, "response_format": "mp3"}
        if instructions and not model.startswith("tts-1"):
            body["instructions"] = instructions
        res = self._post("/audio/speech", json=body)
        if not res.content:
            raise ProviderError("empty_audio")
        return SpeechAudio(res.content, "audio/mpeg")


class FakeSpeechProvider:
    """SOLO tests (APP_ENV=test): transcripción guionada y un MP3 mínimo."""

    name = "fake"

    def __init__(self, transcript: str = "I am study engineering and I like play football.") -> None:
        self.transcript = transcript
        self.synth_calls: list[str] = []

    def transcribe(self, audio: bytes, filename: str, mime: str, model: str) -> str:
        return self.transcript

    def synthesize(self, text: str, model: str, voice: str, instructions: str | None) -> SpeechAudio:
        self.synth_calls.append(text)
        return SpeechAudio(b"ID3\x03\x00\x00\x00\x00\x00\x00fake-mp3", "audio/mpeg")
