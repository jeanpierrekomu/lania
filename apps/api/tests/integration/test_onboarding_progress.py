"""Bienvenida guardada en el servidor y días de práctica reales (sin puntos inventados)."""

from datetime import date

from fastapi.testclient import TestClient

from app.domain.learning.service import streak_from
from tests.conftest import correct_payload, login

ONBOARDING = {
    "display_name": "  Camila ",
    "goal": "entrevistas",
    "self_level": "a2",
    "interests": ["viajes", "tecnologia", "viajes"],
    "session_minutes": 15,
    "teacher_style": "tranquila",
    "pilot_consent": True,
}


def test_onboarding_saves_goals_persona_and_consent(client: TestClient) -> None:
    h = login(client)
    assert client.get("/api/v1/me", headers=h).json()["onboarding"] is None
    me = client.put("/api/v1/me/onboarding", headers=h, json=ONBOARDING).json()
    assert me["display_name"] == "Camila"
    assert me["onboarding"]["goal"] == "entrevistas"
    assert me["onboarding"]["interests"] == ["viajes", "tecnologia"]
    assert me["preferences"]["tutor_persona"] == "calm"
    assert me["preferences"]["lesson_duration_min"] == 10
    assert me["pilot_consent_at"] is not None
    # Editar después no duplica ni pierde el consentimiento.
    me2 = client.put("/api/v1/me/onboarding", headers=h, json={**ONBOARDING, "goal": "viajes"}).json()
    assert me2["onboarding"]["goal"] == "viajes" and me2["pilot_consent_at"] == me["pilot_consent_at"]


def test_onboarding_requires_consent_and_valid_input(client: TestClient) -> None:
    h = login(client)
    assert (
        client.put("/api/v1/me/onboarding", headers=h, json={**ONBOARDING, "pilot_consent": False}).status_code == 422
    )
    assert client.put("/api/v1/me/onboarding", headers=h, json={**ONBOARDING, "interests": []}).status_code == 422
    assert client.put("/api/v1/me/onboarding", headers=h, json={**ONBOARDING, "goal": "DROP TABLE"}).status_code == 422


def test_progress_counts_only_real_practice_days(client: TestClient) -> None:
    h = login(client)
    before = client.get("/api/v1/progress", headers=h).json()
    assert before["practice_days"] == [] and before["streak_days"] == 0
    ex = client.get("/api/v1/lessons/present-simple-basics", headers=h).json()["exercises"][0]
    client.post("/api/v1/attempts", headers=h, json=correct_payload(ex))
    after = client.get("/api/v1/progress", headers=h).json()
    assert len(after["practice_days"]) == 1 and after["streak_days"] == 1


def test_streak_rules() -> None:
    d = date(2026, 11, 13)
    days = [date(2026, 11, 10), date(2026, 11, 11), date(2026, 11, 12)]
    assert streak_from(days, d) == 3  # hoy todavía no practicó: la racha sigue viva
    assert streak_from([*days, d], d) == 4
    assert streak_from([date(2026, 11, 10)], d) == 0
