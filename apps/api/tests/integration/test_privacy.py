"""Privacidad del piloto: consentimiento, exportar y borrar la cuenta, retención de conversaciones."""

import uuid
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db.models import AuthUser, Profile, TutorConversation
from app.db.session import _session_factory
from app.domain.privacy.service import purge_expired_conversations
from tests.conftest import correct_payload, login


def test_pilot_consent_is_recorded_once(client: TestClient) -> None:
    h = login(client)
    assert client.get("/api/v1/me", headers=h).json()["pilot_consent_at"] is None
    first = client.post("/api/v1/me/pilot-consent", headers=h).json()["pilot_consent_at"]
    second = client.post("/api/v1/me/pilot-consent", headers=h).json()["pilot_consent_at"]
    assert first is not None and first == second


def test_export_contains_only_own_data(client: TestClient) -> None:
    me, other = login(client), login(client)
    lesson = client.get("/api/v1/lessons/present-simple-basics", headers=me).json()
    ex = lesson["exercises"][0]
    assert client.post("/api/v1/attempts", headers=me, json=correct_payload(ex)).status_code == 200
    client.post("/api/v1/attempts", headers=other, json=correct_payload(ex))

    data = client.get("/api/v1/privacy/export", headers=me).json()
    my_id = client.get("/api/v1/me", headers=me).json()["id"]
    assert data["email"].endswith("@example.test")
    assert len(data["tables"]["attempts"]) == 1
    assert all(r["user_id"] == my_id for r in data["tables"]["attempts"])
    assert data["tables"]["profiles"][0]["id"] == my_id


def test_delete_account_removes_everything(client: TestClient) -> None:
    h = login(client)
    user_id = uuid.UUID(client.get("/api/v1/me", headers=h).json()["id"])
    assert client.delete("/api/v1/privacy/account", headers=h).status_code == 204
    with _session_factory()() as db:
        assert db.get(AuthUser, user_id) is None
        assert db.get(Profile, user_id) is None
    assert client.get("/api/v1/me", headers=h).status_code == 404


def test_retention_purges_only_expired_conversations(client: TestClient) -> None:
    h = login(client)
    user_id = uuid.UUID(client.get("/api/v1/me", headers=h).json()["id"])
    now = datetime.now(UTC)
    with _session_factory()() as db, db.begin():
        for expires in (now - timedelta(days=1), now + timedelta(days=30)):
            db.add(
                TutorConversation(
                    user_id=user_id, persona="fun", context={}, created_at=now, updated_at=now, expires_at=expires
                )
            )
    with _session_factory()() as db, db.begin():
        purge_expired_conversations(db, now)
    with _session_factory()() as db:
        left = list(db.scalars(select(TutorConversation.expires_at).where(TutorConversation.user_id == user_id)))
    assert len(left) == 1 and left[0] > now
