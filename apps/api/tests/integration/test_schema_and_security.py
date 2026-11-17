"""Deriva ORM↔migraciones y reglas de seguridad de configuración/JWT."""

import uuid
from datetime import UTC, datetime, timedelta

import jwt
import psycopg
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import Settings
from app.db.models import Base


def test_orm_matches_db(pg_url: str, client: TestClient) -> None:
    with psycopg.connect(pg_url) as conn:
        rows = conn.execute(
            "select table_schema, table_name, column_name from information_schema.columns "
            "where table_schema in ('public', 'auth')"
        ).fetchall()
    existing = {(s, t, c) for s, t, c in rows}
    for table in Base.metadata.sorted_tables:
        for column in table.columns:
            assert (table.schema, table.name, column.name) in existing, f"{table.fullname}.{column.name}"


def test_every_public_table_has_rls(pg_url: str, client: TestClient) -> None:
    with psycopg.connect(pg_url) as conn:
        missing = conn.execute(
            "select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace "
            "where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity"
        ).fetchall()
    assert missing == []


def test_local_auth_is_refused_outside_local() -> None:
    with pytest.raises(ValidationError):
        Settings(app_env="production", auth_mode="local", database_url="postgresql://x/y")
    with pytest.raises(ValidationError):
        Settings(app_env="staging", auth_mode="supabase", supabase_url="https://p.supabase.co", database_url=None)


def test_dev_endpoints_do_not_exist_outside_local(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.core.config import get_settings
    from app.main import create_app

    monkeypatch.setenv("APP_ENV", "staging")
    monkeypatch.setenv("AUTH_MODE", "supabase")
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("DATABASE_URL", "postgresql://unused/unused")
    get_settings.cache_clear()
    try:
        app = create_app()
        paths = {getattr(r, "path", "") for r in app.routes}
        assert "/api/v1/dev/session" not in paths and "/api/v1/dev/clock" not in paths
    finally:
        monkeypatch.undo()
        get_settings.cache_clear()


def _token(secret: str, **overrides: object) -> str:
    now = datetime.now(UTC)
    claims = {
        "sub": str(uuid.uuid4()),
        "aud": "authenticated",
        "role": "authenticated",
        "iss": "modo-local-dev",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=5)).timestamp()),
        **overrides,
    }
    return jwt.encode(claims, secret, algorithm="HS256")


@pytest.mark.parametrize(
    "overrides",
    [
        {"exp": int((datetime.now(UTC) - timedelta(minutes=1)).timestamp())},
        {"aud": "anon"},
        {"iss": "someone-else"},
        {"role": "anon"},
    ],
)
def test_rejects_invalid_tokens(client: TestClient, overrides: dict[str, object]) -> None:
    from app.core.config import get_settings

    secret = get_settings().local_jwt_secret.get_secret_value()
    res = client.get("/api/v1/me", headers={"Authorization": f"Bearer {_token(secret, **overrides)}"})
    assert res.status_code == 401


def test_rejects_token_signed_with_other_secret(client: TestClient) -> None:
    res = client.get("/api/v1/me", headers={"Authorization": f"Bearer {_token('x' * 48)}"})
    assert res.status_code == 401 and res.json()["error_code"] == "AUTH_INVALID"


def test_login_works_while_dev_clock_is_advanced(client: TestClient) -> None:
    """Regresión: con el reloj adelantado, el token emitido no puede quedar «en el futuro»."""
    from app.core.clock import clock
    from tests.conftest import login

    clock.offset = timedelta(days=3)
    headers = login(client)
    assert client.get("/api/v1/me", headers=headers).status_code == 200


def test_ready_checks_database(client: TestClient) -> None:
    res = client.get("/api/v1/health/ready")
    assert res.status_code == 200 and res.json() == {"status": "ok", "database": "ok"}
