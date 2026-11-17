"""Configuración por entorno. Los secretos llegan solo por variables de entorno (spec §10.2)."""

import os
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[4]
_DEV_ONLY_SECRET = "local-dev-only-secret-do-not-use-outside-localhost-0001"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(REPO_ROOT / ".env", ".env"), extra="ignore")

    app_name: str = "LANIA"
    app_env: Literal["local", "test", "staging", "production"] = "local"

    # Base de datos: si está vacío en local/test se usa Postgres embebido (ADR-006).
    database_url: str | None = None
    local_pg_dir: Path = Path.home() / ".modo-english" / "pgdata"
    # none: el servidor embebido sigue vivo entre recargas; delete: se borra al salir (tests E2E).
    local_pg_cleanup: Literal["none", "stop", "delete"] = "none"
    auto_migrate: bool = True

    # Auth (ADR-002)
    auth_mode: Literal["local", "supabase"] = "local"
    local_jwt_secret: SecretStr = SecretStr(_DEV_ONLY_SECRET)
    supabase_url: str | None = None
    jwt_audience: str = "authenticated"
    local_jwt_issuer: str = "modo-local-dev"
    local_token_ttl_minutes: int = 8 * 60

    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # ── IA (ADR-003). Sin proveedor configurado, el tutor y la corrección de escritura quedan
    # «no disponibles» (no se simula). `fake` solo existe en APP_ENV=test.
    llm_provider: Literal["none", "openai_compatible", "fake"] = "none"
    llm_base_url: str = "https://api.openai.com/v1"  # Ollama local: http://localhost:11434/v1
    llm_api_key: SecretStr | None = None
    llm_fast_model: str | None = None  # IDs reales del proveedor, nunca inventados
    llm_deep_model: str | None = None
    llm_timeout_seconds: float = 90
    # Solo para modelos de razonamiento (verificar en la ficha oficial del modelo). Vacío = modelo clásico.
    llm_fast_reasoning_effort: Literal["none", "low", "medium", "high"] | None = None
    llm_deep_reasoning_effort: Literal["none", "low", "medium", "high"] | None = None
    llm_strict_schema: bool = True
    # Precios en USD por millón de tokens, copiados de la página oficial del proveedor con fecha.
    # Si faltan, el costo queda NULL (desconocido) en lugar de inventarse.
    llm_fast_price_in_per_mtok: float | None = None
    llm_fast_price_out_per_mtok: float | None = None
    llm_deep_price_in_per_mtok: float | None = None
    llm_deep_price_out_per_mtok: float | None = None
    tutor_daily_message_limit: int = 80
    # ── Voz (ADR-003/ADR-005). Mismo proveedor y clave que LLM_*. Vacío = sin voz del servidor
    # (la app usa la voz del navegador y permite responder por escrito). IDs reales, nunca inventados.
    stt_model: str | None = None  # p. ej. gpt-transcribe
    tts_model: str | None = None  # p. ej. gpt-4o-mini-tts (OpenAI lo retira el 2027-01-06: ver cost-model.md)
    tts_voice_lania: str = "marin"
    tts_instructions_lania: str = (
        "Voice of Lania, a warm and patient English teacher for Spanish speakers. Speak clearly, at a calm pace, "
        "with a friendly and encouraging tone."
    )
    stt_price_per_minute_usd: float | None = None
    tts_price_per_million_chars_usd: float | None = None
    max_audio_upload_bytes: int = 8_000_000
    max_audio_seconds: int = 120
    speaking_daily_turn_limit: int = 60
    # Salones (grupos con Lania): base preparada, apagada en el piloto.
    rooms_enabled: bool = False
    # Peticiones por persona y minuto (0 = sin límite). Protege la API y el presupuesto de IA.
    rate_limit_per_minute: int = 120
    writing_daily_eval_limit: int = 20
    monthly_ai_spend_limit_usd: float | None = None

    @property
    def is_local(self) -> bool:
        return self.app_env in ("local", "test")

    @property
    def supabase_issuer(self) -> str | None:
        return f"{self.supabase_url.rstrip('/')}/auth/v1" if self.supabase_url else None

    @model_validator(mode="after")
    def guard_dev_only_features(self) -> "Settings":
        if not self.is_local:
            if self.auth_mode == "local":
                raise ValueError("AUTH_MODE=local solo está permitido con APP_ENV=local/test")
            if not self.database_url:
                raise ValueError("DATABASE_URL es obligatorio fuera de local")
        if self.llm_provider == "fake" and self.app_env != "test":
            raise ValueError("LLM_PROVIDER=fake solo está permitido con APP_ENV=test")
        if self.llm_provider == "openai_compatible" and not (self.llm_fast_model and self.llm_deep_model):
            raise ValueError("LLM_PROVIDER=openai_compatible requiere LLM_FAST_MODEL y LLM_DEEP_MODEL")
        if self.auth_mode == "supabase" and not self.supabase_url:
            raise ValueError("AUTH_MODE=supabase requiere SUPABASE_URL")
        return self


@lru_cache
def get_settings() -> Settings:
    # En tests no se lee el .env del desarrollador (claves, precios, Ollama): solo variables explícitas.
    if os.environ.get("APP_ENV") == "test":
        return Settings(_env_file=None)
    return Settings()
