"""Aplica `supabase/migrations/*.sql` en orden — SOLO local/test (ADR-006).

En Supabase hospedado se usa `supabase db push`; este runner se niega a correr fuera de local.
"""

from pathlib import Path

import psycopg

from app.core.config import REPO_ROOT

MIGRATIONS_DIR = REPO_ROOT / "supabase" / "migrations"
COMPAT_SQL = REPO_ROOT / "supabase" / "local" / "00_supabase_compat.sql"


def to_libpq(url: str) -> str:
    return url.replace("postgresql+psycopg://", "postgresql://", 1)


def apply_migrations(
    database_url: str, migrations_dir: Path = MIGRATIONS_DIR, *, local_compat: bool = True
) -> list[str]:
    """Aplica las migraciones pendientes. `local_compat=False` en un proyecto Supabase real (ya trae auth y roles)."""
    applied: list[str] = []
    with psycopg.connect(to_libpq(database_url), autocommit=True) as conn:
        if local_compat:
            conn.execute(COMPAT_SQL.read_text(encoding="utf-8"))
        conn.execute("create schema if not exists supabase_migrations")
        conn.execute(
            "create table if not exists supabase_migrations.schema_migrations "
            "(version text primary key, name text, applied_at timestamptz not null default now())"
        )
        done = {row[0] for row in conn.execute("select version from supabase_migrations.schema_migrations")}
        for path in sorted(migrations_dir.glob("*.sql")):
            version, _, name = path.stem.partition("_")
            if version in done:
                continue
            with conn.transaction():
                conn.execute(path.read_text(encoding="utf-8"))
                conn.execute(
                    "insert into supabase_migrations.schema_migrations (version, name) values (%s, %s)",
                    (version, name),
                )
            applied.append(path.name)
    return applied
