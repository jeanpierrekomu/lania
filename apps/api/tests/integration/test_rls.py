"""RLS y privilegios contra Postgres real (ADR-002, spec §12.3 «Tests RLS»).

Simula exactamente lo que hace Supabase/PostgREST: SET ROLE authenticated + request.jwt.claims.
"""

import json
import uuid
from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

import psycopg
import pytest
from fastapi.testclient import TestClient

from tests.conftest import login
from tests.integration.test_onboarding_progress import ONBOARDING


@pytest.fixture(scope="module")
def two_users(client: TestClient, pg_url: str) -> dict[str, Any]:
    """Alice y Bob con un intento cada uno, creados por la API (camino real de escritura)."""
    users: dict[str, Any] = {}
    for name in ("alice", "bob"):
        email = f"{name}-{uuid.uuid4().hex[:6]}@example.test"
        headers = login(client, email)
        lesson = client.get("/api/v1/lessons/present-simple-basics", headers=headers).json()
        ex = lesson["exercises"][1]
        client.post(
            "/api/v1/attempts",
            headers=headers,
            json={
                "exercise_id": ex["id"],
                "client_submission_id": str(uuid.uuid4()),
                "mode": "practice",
                "answer_text": "work",
            },
        )
        client.put("/api/v1/me/onboarding", headers=headers, json=ONBOARDING)
        client.post("/api/v1/speaking/sessions", headers=headers, json={"scenario": "job-interview"})
        with psycopg.connect(pg_url) as conn:
            row = conn.execute("select id from auth.users where email = %s", (email,)).fetchone()
            assert row is not None
            users[name] = row[0]
    return users


@contextmanager
def as_role(pg_url: str, role: str, user_id: uuid.UUID | None = None) -> Iterator[psycopg.Connection[Any]]:
    with psycopg.connect(pg_url) as conn:
        conn.execute(f"set role {role}")
        if user_id is not None:
            claims = json.dumps({"sub": str(user_id), "role": role})
            conn.execute("select set_config('request.jwt.claims', %s, true)", (claims,))
        yield conn
        conn.rollback()


USER_TABLES = [
    "attempts",
    "evaluations",
    "skill_evidence",
    "skill_mastery",
    "review_schedule",
    "learner_goals",
    "speaking_sessions",
]


@pytest.mark.parametrize("table", USER_TABLES)
def test_user_reads_only_own_rows(pg_url: str, two_users: dict[str, Any], table: str) -> None:
    with as_role(pg_url, "authenticated", two_users["alice"]) as conn:
        owners = {r[0] for r in conn.execute(f"select user_id from public.{table}").fetchall()}
    assert owners == {two_users["alice"]}


@pytest.mark.parametrize("table", USER_TABLES)
def test_user_cannot_write_learning_records(pg_url: str, two_users: dict[str, Any], table: str) -> None:
    with (
        as_role(pg_url, "authenticated", two_users["alice"]) as conn,
        pytest.raises(psycopg.errors.InsufficientPrivilege),
    ):
        conn.execute(f"delete from public.{table}")


def test_user_cannot_raise_own_mastery(pg_url: str, two_users: dict[str, Any]) -> None:
    with (
        as_role(pg_url, "authenticated", two_users["alice"]) as conn,
        pytest.raises(psycopg.errors.InsufficientPrivilege),
    ):
        conn.execute("update public.skill_mastery set state = 'proficient'")


def test_answer_keys_are_not_readable_by_clients(pg_url: str, two_users: dict[str, Any]) -> None:
    with psycopg.connect(pg_url) as admin:
        published = admin.execute("select count(*) from public.exercise_items where published").fetchone()
    with as_role(pg_url, "authenticated", two_users["alice"]) as conn:
        assert conn.execute("select count(*) from public.exercise_items").fetchone() == published
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            conn.execute("select answer_schema from public.exercise_items")


def test_profile_role_is_not_self_editable(pg_url: str, two_users: dict[str, Any]) -> None:
    with as_role(pg_url, "authenticated", two_users["alice"]) as conn:
        updated = conn.execute("update public.profiles set display_name = 'Ali' returning id").fetchall()
        assert updated == [(two_users["alice"],)]  # solo su propia fila
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            conn.execute("update public.profiles set role = 'admin'")


def test_cannot_edit_other_users_preferences(pg_url: str, two_users: dict[str, Any]) -> None:
    with as_role(pg_url, "authenticated", two_users["alice"]) as conn:
        changed = conn.execute(
            "update public.learning_preferences set low_stim_mode = true where user_id = %s returning user_id",
            (two_users["bob"],),
        ).fetchall()
    assert changed == []


def test_anonymous_has_no_access(pg_url: str, two_users: dict[str, Any]) -> None:
    with as_role(pg_url, "anon") as conn, pytest.raises(psycopg.errors.InsufficientPrivilege):
        conn.execute("select * from public.skills")


def test_original_answers_are_immutable_even_for_backend(pg_url: str, two_users: dict[str, Any]) -> None:
    with psycopg.connect(pg_url) as conn, pytest.raises(psycopg.errors.RestrictViolation):
        conn.execute("update public.attempts set original_answer = 'edited'")


def test_tts_cache_is_backend_only(pg_url: str, two_users: dict[str, Any]) -> None:
    with (
        as_role(pg_url, "authenticated", two_users["alice"]) as conn,
        pytest.raises(psycopg.errors.InsufficientPrivilege),
    ):
        conn.execute("select key from public.tts_cache")
