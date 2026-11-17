"""Salones: base lista y apagada por defecto; con el flag, cupo, mensajes solo para miembros y reportes."""

import uuid
from datetime import UTC, datetime
from typing import Any

import psycopg
from fastapi.testclient import TestClient

from app.core.config import get_settings
from tests.conftest import login


def _make_room(pg_url: str, capacity: int = 2, status: str = "open") -> str:
    with psycopg.connect(pg_url) as conn:
        row = conn.execute(
            "insert into rooms (slug, title_es, topic_es, goal_es, level, capacity, status) "
            "values (%s, 'Café', 'Planes', 'Acordar un plan', 'A2', %s, %s) returning id",
            (f"cafe-{uuid.uuid4().hex[:6]}", capacity, status),
        ).fetchone()
        assert row is not None
        return str(row[0])


def test_rooms_are_off_by_default(client: TestClient) -> None:
    assert client.get("/api/v1/rooms", headers=login(client)).status_code == 404


def test_rooms_flow_when_enabled(client: TestClient, pg_url: str, monkeypatch: Any) -> None:
    monkeypatch.setattr(get_settings(), "rooms_enabled", True)
    room = _make_room(pg_url)
    a, b, c = login(client), login(client), login(client)
    assert client.get(f"/api/v1/rooms/{room}/messages", headers=a).status_code == 403  # aún no es miembro
    assert client.post(f"/api/v1/rooms/{room}/join", headers=a).json()["joined"] is True
    assert client.post(f"/api/v1/rooms/{room}/join", headers=b).json()["members"] == 2
    assert client.post(f"/api/v1/rooms/{room}/join", headers=c).status_code == 409  # cupo lleno
    sent = client.post(f"/api/v1/rooms/{room}/messages", headers=a, json={"text": "Hi everyone!"}).json()
    seen = client.get(f"/api/v1/rooms/{room}/messages", headers=b).json()
    assert [m["text"] for m in seen] == ["Hi everyone!"] and seen[0]["mine"] is False
    after = datetime.fromisoformat(sent["created_at"]).astimezone(UTC).isoformat()
    assert client.get(f"/api/v1/rooms/{room}/messages", headers=b, params={"after": after}).json() == []
    assert client.post(f"/api/v1/rooms/{room}/messages/{sent['id']}/report", headers=b).status_code == 204
    client.post(f"/api/v1/rooms/{room}/leave", headers=a)
    assert client.post(f"/api/v1/rooms/{room}/join", headers=c).status_code == 200  # se liberó un lugar


def test_rls_only_members_read_room_messages(client: TestClient, pg_url: str, monkeypatch: Any) -> None:
    monkeypatch.setattr(get_settings(), "rooms_enabled", True)
    room = _make_room(pg_url, capacity=5)
    member, outsider = login(client), login(client)
    client.post(f"/api/v1/rooms/{room}/join", headers=member)
    client.post(f"/api/v1/rooms/{room}/messages", headers=member, json={"text": "Hello"})
    outsider_id = client.get("/api/v1/me", headers=outsider).json()["id"]
    import json

    with psycopg.connect(pg_url) as conn:
        conn.execute("set role authenticated")
        conn.execute("select set_config('request.jwt.claims', %s, true)", (json.dumps({"sub": outsider_id}),))
        assert conn.execute("select count(*) from room_messages where room_id = %s", (room,)).fetchone() == (0,)
        assert conn.execute("select count(*) from room_members where room_id = %s", (room,)).fetchone() == (0,)
        conn.rollback()
