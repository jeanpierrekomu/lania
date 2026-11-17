"""Writing Lab: consignas propias, corrección con rúbrica, historial, idempotencia y cuota diaria."""

import uuid
from typing import Any

from fastapi.testclient import TestClient

from app.core.config import get_settings
from tests.conftest import SAMPLE_TEXT, login
from tests.integration.test_onboarding_progress import ONBOARDING


def _submit(client: TestClient, h: dict[str, str], exercise_id: str, text: str = SAMPLE_TEXT, key: str | None = None):
    return client.post(
        "/api/v1/writing/submissions",
        headers=h,
        json={"exercise_id": exercise_id, "client_submission_id": key or str(uuid.uuid4()), "text": text},
    )


def test_prompts_put_my_interests_first(client: TestClient) -> None:
    h = login(client)
    client.put("/api/v1/me/onboarding", headers=h, json={**ONBOARDING, "interests": ["entretenimiento"]})
    prompts = client.get("/api/v1/writing/prompts", headers=h).json()
    assert len(prompts) == 8
    assert {prompts[0]["topic"], prompts[1]["topic"]} <= {"entretenimiento", "entrevistas"}


def test_submission_is_graded_and_listed(client: TestClient, fake_ai: Any) -> None:
    h = login(client)
    prompt = client.get("/api/v1/writing/prompts", headers=h).json()[0]
    key = str(uuid.uuid4())
    res = _submit(client, h, prompt["id"], key=key)
    assert res.status_code == 200, res.text
    out = res.json()
    assert out["feedback"]["status"] == "graded"
    assert set(out["feedback"]["criteria"]) == {"task_fulfillment", "accuracy", "coherence", "range"}
    assert out["feedback"]["your_text"] == SAMPLE_TEXT
    # Reenviar el mismo texto no lo duplica ni vuelve a llamar a la IA.
    calls = len(fake_ai.calls)
    assert _submit(client, h, prompt["id"], key=key).json()["attempt_id"] == out["attempt_id"]
    assert len(fake_ai.calls) == calls
    history = client.get("/api/v1/writing/submissions", headers=h).json()
    assert [x["attempt_id"] for x in history] == [out["attempt_id"]]
    # Cuenta como práctica real del día.
    assert client.get("/api/v1/progress", headers=h).json()["streak_days"] == 1


def test_without_ai_text_is_saved_for_review(client: TestClient) -> None:
    h = login(client)
    prompt = client.get("/api/v1/writing/prompts", headers=h).json()[0]
    out = _submit(client, h, prompt["id"]).json()
    assert out["feedback"]["status"] == "needs_review" and out["feedback"]["criteria"] is None


def test_writing_lab_items_cannot_be_sent_as_closed_attempts(client: TestClient) -> None:
    h = login(client)
    prompt = client.get("/api/v1/writing/prompts", headers=h).json()[0]
    res = client.post(
        "/api/v1/attempts",
        headers=h,
        json={
            "exercise_id": prompt["id"],
            "client_submission_id": str(uuid.uuid4()),
            "mode": "practice",
            "answer_text": "hello",
        },
    )
    assert res.status_code == 404


def test_daily_quota(client: TestClient, fake_ai: Any, monkeypatch: Any) -> None:
    monkeypatch.setattr(get_settings(), "writing_daily_eval_limit", 1)
    h = login(client)
    prompt = client.get("/api/v1/writing/prompts", headers=h).json()[0]
    assert _submit(client, h, prompt["id"]).status_code == 200
    blocked = _submit(client, h, prompt["id"])
    assert blocked.status_code == 429 and blocked.json()["error_code"] == "QUOTA_EXCEEDED"
    assert _submit(client, login(client), prompt["id"]).status_code == 200  # otra persona no se ve afectada
