"""Misiones: el avance sale de evidencia real y el siguiente paso es el primero sin hacer."""

import uuid
from typing import Any

from fastapi.testclient import TestClient

from tests.conftest import correct_payload, login
from tests.integration.test_onboarding_progress import ONBOARDING


def test_new_learner_starts_at_step_one_with_interests_first(client: TestClient) -> None:
    h = login(client)
    client.put("/api/v1/me/onboarding", headers=h, json={**ONBOARDING, "goal": "viajes", "interests": ["viajes"]})
    ms = client.get("/api/v1/missions", headers=h).json()
    assert len(ms) == 3 and ms[0]["slug"] == "viaje" and ms[0]["recommended"] is True
    assert [st["state"] for st in ms[0]["steps"]] == ["now", "todo", "todo", "todo", "todo"]
    assert all(m["done"] == 0 for m in ms)


def test_progress_comes_from_real_evidence(client: TestClient, fake_ai: Any) -> None:
    h = login(client)
    lesson = client.get("/api/v1/lessons/present-simple-basics", headers=h).json()
    for ex in lesson["exercises"][:3]:
        client.post("/api/v1/attempts", headers=h, json=correct_payload(ex))
    ep = client.get("/api/v1/listening/episodes/interview-call", headers=h).json()
    answers = {
        "listening.interview_call.01": "b",
        "listening.interview_call.02": "c",
        "listening.interview_call.03": "a",
    }
    ext = {q["exercise_id"]: q for q in ep["questions"]}
    for q, opt in zip(ext.values(), answers.values(), strict=True):
        client.post(
            "/api/v1/attempts",
            headers=h,
            json={
                "exercise_id": q["exercise_id"],
                "client_submission_id": str(uuid.uuid4()),
                "mode": "practice",
                "option_id": opt,
            },
        )
    m = next(x for x in client.get("/api/v1/missions", headers=h).json() if x["slug"] == "entrevista")
    assert [st["state"] for st in m["steps"]] == ["done", "done", "now", "todo", "todo"]
    assert m["steps"][2]["href"] == "/app/reading?texto=job-ad"
    assert m["steps"][3]["href"].startswith("/app/writing?consigna=")
