"""Validación de JWT en backend (ADR-002). El propietario SIEMPRE sale del `sub` verificado."""

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from functools import lru_cache
from typing import Annotated, Any

import jwt
from fastapi import Depends, Request
from jwt.types import Options

from app.core.config import Settings, get_settings
from app.core.errors import ApiError
from app.core.ratelimit import RateLimiter


@dataclass(frozen=True)
class CurrentUser:
    id: uuid.UUID


@lru_cache
def _limiter(per_minute: int) -> RateLimiter:
    return RateLimiter(per_minute, 60)


@lru_cache
def _jwks_client(url: str) -> jwt.PyJWKClient:
    return jwt.PyJWKClient(url, cache_keys=True)


def issue_local_token(settings: Settings, user_id: uuid.UUID, now: datetime) -> tuple[str, int]:
    if settings.auth_mode != "local" or not settings.is_local:
        raise RuntimeError("Los tokens locales solo existen en desarrollo")
    ttl = settings.local_token_ttl_minutes * 60
    claims = {
        "sub": str(user_id),
        "aud": settings.jwt_audience,
        "role": "authenticated",
        "iss": settings.local_jwt_issuer,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=ttl)).timestamp()),
    }
    return jwt.encode(claims, settings.local_jwt_secret.get_secret_value(), algorithm="HS256"), ttl


def decode_token(token: str, settings: Settings) -> dict[str, Any]:
    options: Options = {"require": ["exp", "sub", "aud", "iss"]}
    try:
        if settings.auth_mode == "local":
            return jwt.decode(
                token,
                settings.local_jwt_secret.get_secret_value(),
                algorithms=["HS256"],
                audience=settings.jwt_audience,
                issuer=settings.local_jwt_issuer,
                options=options,
            )
        issuer = settings.supabase_issuer
        assert issuer is not None
        signing_key = _jwks_client(f"{issuer}/.well-known/jwks.json").get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience=settings.jwt_audience,
            issuer=issuer,
            options=options,
        )
    except jwt.ExpiredSignatureError as exc:
        raise ApiError(401, "AUTH_INVALID", "Tu sesión expiró. Vuelve a entrar.") from exc
    except jwt.PyJWTError as exc:
        raise ApiError(401, "AUTH_INVALID", "Sesión no válida. Vuelve a entrar.") from exc


def get_current_user(request: Request, settings: Annotated[Settings, Depends(get_settings)]) -> CurrentUser:
    header = request.headers.get("authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise ApiError(401, "AUTH_REQUIRED", "Necesitas iniciar sesión.")
    claims = decode_token(token, settings)
    if claims.get("role") != "authenticated":
        raise ApiError(401, "AUTH_INVALID", "Sesión no válida. Vuelve a entrar.")
    try:
        user = CurrentUser(id=uuid.UUID(str(claims["sub"])))
    except ValueError as exc:
        raise ApiError(401, "AUTH_INVALID", "Sesión no válida. Vuelve a entrar.") from exc
    _limiter(settings.rate_limit_per_minute).check(user.id)
    return user


UserDep = Annotated[CurrentUser, Depends(get_current_user)]
