"""Puerta única a la voz (STT/TTS): disponibilidad, validación del audio, costo, presupuesto y caché.

- El audio del alumno se valida (tipo real por cabecera, tamaño, duración) y NO se guarda (ADR-005).
- Cada llamada queda medida en `ai_requests` (sin texto ni audio del alumno).
- El audio sintetizado se guarda en `tts_cache` por hash de (modelo, voz, instrucciones, texto): los
  episodios de listening se generan una sola vez.
"""

import hashlib
import time
import uuid
from datetime import UTC, datetime
from decimal import Decimal
from typing import Literal

from sqlalchemy.orm import Session

from app.ai.gateway import _persist_independently, month_spend_usd
from app.ai.providers.base import ProviderError
from app.ai.providers.speech import VOICES, FakeSpeechProvider, OpenAISpeechProvider, SpeechAudio, SpeechProvider
from app.core.config import Settings
from app.core.errors import ApiError
from app.db.models import AiRequest, TtsCache

PROMPT_VERSION = "voice_v1"
_override: SpeechProvider | None = None

# Firmas de los formatos que graban los navegadores (MediaRecorder) y los habituales.
_MAGIC: tuple[tuple[str, int, bytes], ...] = (
    ("audio/webm", 0, b"\x1a\x45\xdf\xa3"),
    ("audio/ogg", 0, b"OggS"),
    ("audio/mp4", 4, b"ftyp"),
    ("audio/wav", 8, b"WAVE"),
    ("audio/mpeg", 0, b"ID3"),
)
_EXT = {"audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/wav": "wav", "audio/mpeg": "mp3"}


def set_speech_override(provider: SpeechProvider | None) -> None:
    """Solo tests: inyecta un proveedor guionado."""
    global _override
    _override = provider


def _provider(settings: Settings) -> SpeechProvider | None:
    if _override is not None:
        return _override
    if settings.llm_provider == "openai_compatible":
        key = settings.llm_api_key.get_secret_value() if settings.llm_api_key else None
        return OpenAISpeechProvider(settings.llm_base_url, key, settings.llm_timeout_seconds)
    if settings.llm_provider == "fake":
        return FakeSpeechProvider()
    return None


def _scripted(settings: Settings) -> bool:
    return _override is not None or settings.llm_provider == "fake"


def stt_available(settings: Settings) -> bool:
    return _provider(settings) is not None and (bool(settings.stt_model) or _scripted(settings))


def tts_available(settings: Settings) -> bool:
    return _provider(settings) is not None and (bool(settings.tts_model) or _scripted(settings))


def sniff_audio(audio: bytes) -> str | None:
    """Tipo real del archivo por su cabecera (no confiamos en el nombre ni en el Content-Type)."""
    for mime, offset, magic in _MAGIC:
        if audio[offset : offset + len(magic)] == magic:
            return mime
    if len(audio) > 2 and audio[0] == 0xFF and audio[1] & 0xE0 == 0xE0:  # MP3 sin etiqueta ID3
        return "audio/mpeg"
    return None


def _check_budget(db: Session, settings: Settings) -> None:
    limit = settings.monthly_ai_spend_limit_usd
    if limit is not None and month_spend_usd(db, datetime.now(UTC)) >= Decimal(str(limit)):
        raise ApiError(
            429,
            "QUOTA_EXCEEDED",
            "Se alcanzó el presupuesto mensual de IA del piloto. Puedes responder por escrito.",
        )


def _row(settings: Settings, task: str, user_id: uuid.UUID | None, model: str, provider: str) -> AiRequest:
    return AiRequest(
        id=uuid.uuid4(),
        user_id=user_id,
        task=task,
        provider=provider,
        model=model,
        prompt_version=PROMPT_VERSION,
        request_key=None,
        status="ok",
        created_at=datetime.now(UTC),
    )


def transcribe(
    db: Session, settings: Settings, *, user_id: uuid.UUID, audio: bytes, seconds: float | None
) -> tuple[str, float | None]:
    """Devuelve (texto, segundos). Lanza 422 si el audio no es válido y 503 si el proveedor falla."""
    provider = _provider(settings)
    if provider is None or not stt_available(settings):
        raise ApiError(503, "AI_NOT_CONFIGURED", "La transcripción de voz no está disponible. Responde por escrito.")
    if not audio or len(audio) > settings.max_audio_upload_bytes:
        raise ApiError(
            422, "INVALID_INPUT", "La grabación está vacía o es demasiado grande. Prueba con algo más corto."
        )
    mime = sniff_audio(audio)
    if mime is None:
        raise ApiError(422, "INVALID_INPUT", "No reconocimos el formato del audio. Vuelve a grabar, por favor.")
    secs = None if seconds is None else max(0.0, min(float(seconds), float(settings.max_audio_seconds)))
    if seconds is not None and seconds > settings.max_audio_seconds:
        raise ApiError(422, "INVALID_INPUT", f"Graba como máximo {settings.max_audio_seconds} segundos por turno.")
    _check_budget(db, settings)
    model = settings.stt_model or "test-stt"
    row = _row(settings, "speech_to_text", user_id, model, provider.name)
    started = time.monotonic()
    try:
        text = provider.transcribe(audio, f"turn.{_EXT[mime]}", mime, model)
    except ProviderError as exc:
        row.status, row.error_code = ("timeout" if exc.timeout else "provider_error"), exc.code
        row.latency_ms = int((time.monotonic() - started) * 1000)
        _persist_independently(row)
        raise ApiError(
            503, "PROVIDER_UNAVAILABLE", "No pudimos escuchar tu audio. Intenta de nuevo.", retryable=True
        ) from exc
    row.latency_ms = int((time.monotonic() - started) * 1000)
    if settings.stt_price_per_minute_usd is not None and secs is not None:
        row.estimated_cost_usd = Decimal(str(round(secs / 60 * settings.stt_price_per_minute_usd, 6)))
    db.add(row)
    return text, secs


def cache_key(settings: Settings, text: str, voice: str, instructions: str | None) -> str:
    raw = "\x1f".join([settings.tts_model or "test-tts", voice, instructions or "", text])
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def synthesize(
    db: Session,
    settings: Settings,
    *,
    text: str,
    voice: str | None = None,
    instructions: str | None = None,
    kind: Literal["listening", "reply"],
) -> SpeechAudio:
    provider = _provider(settings)
    if provider is None or not tts_available(settings):
        raise ApiError(503, "AI_NOT_CONFIGURED", "La voz de Lania no está disponible en este entorno.")
    text = text.strip()
    if not text or len(text) > 1200:
        raise ApiError(422, "INVALID_INPUT", "Texto vacío o demasiado largo para leerlo en voz alta.")
    voice = voice or settings.tts_voice_lania
    if voice not in VOICES:
        raise ApiError(422, "INVALID_INPUT", "Esa voz no existe.")
    key = cache_key(settings, text, voice, instructions)
    cached = db.get(TtsCache, key)
    if cached is not None:
        return SpeechAudio(bytes(cached.data), cached.mime)
    _check_budget(db, settings)
    model = settings.tts_model or "test-tts"
    row = _row(settings, "text_to_speech", None, model, provider.name)
    started = time.monotonic()
    try:
        audio = provider.synthesize(text, model, voice, instructions)
    except ProviderError as exc:
        row.status, row.error_code = ("timeout" if exc.timeout else "provider_error"), exc.code
        row.latency_ms = int((time.monotonic() - started) * 1000)
        _persist_independently(row)
        raise ApiError(
            503, "PROVIDER_UNAVAILABLE", "La voz de Lania no respondió. Intenta de nuevo.", retryable=True
        ) from exc
    row.latency_ms = int((time.monotonic() - started) * 1000)
    if settings.tts_price_per_million_chars_usd is not None:
        row.estimated_cost_usd = Decimal(str(round(len(text) / 1e6 * settings.tts_price_per_million_chars_usd, 6)))
    db.add(row)
    db.add(
        TtsCache(
            key=key, kind=kind, model=model, voice=voice, mime=audio.mime, data=audio.data, created_at=datetime.now(UTC)
        )
    )
    db.flush()
    return audio
