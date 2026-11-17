"""Ciclo completo: login → lección → error → feedback → reintento → repaso diferido (spec §20 Entrega 1)."""

import json
import uuid
from datetime import timedelta
from typing import Any

from fastapi.testclient import TestClient

from app.core.clock import clock
from tests.conftest import correct_payload, login

LESSON = "/api/v1/lessons/present-simple-basics"


def submit(client: TestClient, auth: dict[str, str], **payload: Any) -> dict[str, Any]:
    payload.setdefault("client_submission_id", str(uuid.uuid4()))
    payload.setdefault("mode", "practice")
    res = client.post("/api/v1/attempts", json=payload, headers=auth)
    assert res.status_code == 200, res.text
    return res.json()  # type: ignore[no-any-return]


def skill_of(progress: dict[str, Any], code: str = "grammar.present_simple.subject_verb_agreement") -> dict[str, Any]:
    return next(s for s in progress["skills"] if s["skill_code"] == code)


def lesson_exercises(client: TestClient, auth: dict[str, str]) -> dict[str, dict[str, Any]]:
    res = client.get(LESSON, headers=auth)
    assert res.status_code == 200
    return {e["external_id"].rsplit(".", 1)[-1]: e for e in res.json()["exercises"]}


def test_health(client: TestClient) -> None:
    assert client.get("/api/v1/health").json()["status"] == "ok"


def test_requires_auth_with_typed_error(client: TestClient) -> None:
    res = client.get("/api/v1/progress")
    assert res.status_code == 401
    body = res.json()
    assert body["error_code"] == "AUTH_REQUIRED" and body["request_id"] and body["retryable"] is False
    assert client.get("/api/v1/progress", headers={"Authorization": "Bearer nope"}).status_code == 401


def test_lesson_never_leaks_answer_keys(client: TestClient, auth: dict[str, str]) -> None:
    raw = client.get(LESSON, headers=auth).text
    for secret in (
        "accepted",
        "answer_schema",
        "distractors",
        "correct_option",
        "option_feedback",
        "alternatives",
    ):
        assert secret not in raw, secret
    data = json.loads(raw)
    assert data["exercises"][0]["role"] == "warmup"
    assert len(data["exercises"]) == 6


def test_full_cycle_error_retry_and_spaced_review(client: TestClient, auth: dict[str, str]) -> None:
    ex = lesson_exercises(client, auth)

    # 1) Error real y típico → feedback específico + evidencia + repaso mañana
    wrong = submit(client, auth, exercise_id=ex["002"]["id"], answer_text="work")
    ev = wrong["evaluation"]
    assert ev["verdict"] == "incorrect"
    assert ev["matched_rule"] == "grammar.present_simple.third_person_s"
    assert ev["next_action"] == "retry"
    assert ev["your_answer"] == "work"
    assert ev["correct_sentence"] == "My sister works at a design studio."
    assert wrong["next_review"]["reason"] == "error"
    assert wrong["next_review"]["interval_days"] == 1
    assert wrong["mastery"]["state"] == "emerging"

    # 2) Reintento: cuenta como 'retry' (no prueba dominio) y no duplica el repaso
    retry = submit(
        client,
        auth,
        exercise_id=ex["002"]["id"],
        answer_text="My sister works at a design studio.",
        retry_of=wrong["attempt_id"],
    )
    assert retry["evaluation"]["verdict"] == "correct"
    assert retry["evaluation"]["next_action"] == "continue"
    assert retry["next_review"]["id"] == wrong["next_review"]["id"]

    # 3) Terminar la lección → misión siguiente explicable
    for key in ("001", "003", "004", "005", "006"):
        submit(client, auth, **correct_payload(ex[key]))
    mission = client.get("/api/v1/learning/next", headers=auth).json()
    assert mission["kind"] == "lesson" and mission["href"] == "/learn/past-simple-did"

    session = client.get("/api/v1/reviews/session", headers=auth).json()
    assert session["exercises"] == [] and session["next_due_at"] is not None

    # 4) Pasa un día → el repaso vence, con ítems DISTINTOS a los de la lección (US05)
    clock.offset = timedelta(days=1, minutes=1)
    mission = client.get("/api/v1/learning/next", headers=auth).json()
    assert mission["kind"] == "review" and mission["href"] == "/review"
    progress = client.get("/api/v1/progress", headers=auth).json()
    assert skill_of(progress)["state"] == "review_due"

    session = client.get("/api/v1/reviews/session", headers=auth).json()
    assert len(session["exercises"]) == 3
    lesson_ids = {e["id"] for e in ex.values()}
    assert not lesson_ids & {e["id"] for e in session["exercises"]}

    results = [submit(client, auth, **correct_payload(e, mode="review")) for e in session["exercises"]]
    final = results[-1]["next_review"]
    assert final["reason"] == "review_passed"
    assert final["interval_days"] == 3
    assert client.get("/api/v1/learning/next", headers=auth).json()["kind"] == "lesson"

    # 5) Aun así no está «dominada»: un solo día de práctica sin ayuda no basta
    progress = client.get("/api/v1/progress", headers=auth).json()
    skill = skill_of(progress)
    assert skill["state"] == "developing"
    assert skill["evidence_count"] == 10
    assert progress["recent_mistakes"][0]["your_answer"] == "work"


def test_new_learner_is_offered_the_diagnostic_first(client: TestClient, auth: dict[str, str]) -> None:
    mission = client.get("/api/v1/learning/next", headers=auth).json()
    assert mission["kind"] == "diagnostic" and mission["href"] == "/diagnostic"


def test_lessons_never_include_diagnostic_items(client: TestClient, auth: dict[str, str]) -> None:
    for slug in ("present-simple-basics", "past-simple-did", "future-will"):
        lesson = client.get(f"/api/v1/lessons/{slug}", headers=auth).json()
        assert lesson["exercises"] and all(not e["external_id"].startswith("diag_") for e in lesson["exercises"])


def test_double_submit_is_idempotent(client: TestClient, auth: dict[str, str]) -> None:
    ex = lesson_exercises(client, auth)
    payload = {
        "exercise_id": ex["002"]["id"],
        "client_submission_id": str(uuid.uuid4()),
        "mode": "practice",
        "answer_text": "works",
    }
    first = client.post("/api/v1/attempts", json=payload, headers=auth).json()
    second = client.post("/api/v1/attempts", json=payload, headers=auth).json()
    assert first["attempt_id"] == second["attempt_id"]
    assert first["idempotent_replay"] is False and second["idempotent_replay"] is True
    assert client.get("/api/v1/progress", headers=auth).json()["total_attempts"] == 1


def test_users_are_isolated(client: TestClient) -> None:
    alice, bob = login(client), login(client)
    ex = lesson_exercises(client, alice)
    a = submit(client, alice, exercise_id=ex["002"]["id"], answer_text="work")

    assert client.get("/api/v1/progress", headers=bob).json()["total_attempts"] == 0
    stolen = client.post(
        f"/api/v1/evaluations/{a['evaluation']['id']}/dispute", json={"reason": "no es mío"}, headers=bob
    )
    assert stolen.status_code == 404
    hijack = client.post(
        "/api/v1/attempts",
        headers=bob,
        json={
            "exercise_id": ex["002"]["id"],
            "client_submission_id": str(uuid.uuid4()),
            "mode": "practice",
            "answer_text": "works",
            "retry_of": a["attempt_id"],
        },
    )
    assert hijack.status_code == 422


def test_dispute_flow(client: TestClient, auth: dict[str, str]) -> None:
    ex = lesson_exercises(client, auth)
    res = submit(client, auth, exercise_id=ex["002"]["id"], answer_text="sleeps")
    assert res["evaluation"]["confidence"] == "medium"
    url = f"/api/v1/evaluations/{res['evaluation']['id']}/dispute"
    d1 = client.post(url, json={"reason": "Creo que mi respuesta es válida"}, headers=auth).json()
    d2 = client.post(url, json={"reason": "otra vez"}, headers=auth).json()
    assert d1["status"] == "open" and d1["id"] == d2["id"]


def test_input_validation(client: TestClient, auth: dict[str, str]) -> None:
    ex = lesson_exercises(client, auth)
    base = {"client_submission_id": str(uuid.uuid4()), "mode": "practice"}
    both = client.post(
        "/api/v1/attempts",
        headers=auth,
        json={**base, "exercise_id": ex["002"]["id"], "answer_text": "x", "option_id": "a"},
    )
    assert both.status_code == 422 and both.json()["error_code"] == "INVALID_INPUT"
    wrong_type = client.post(
        "/api/v1/attempts", headers=auth, json={**base, "exercise_id": ex["002"]["id"], "option_id": "a"}
    )
    assert wrong_type.status_code == 422
    missing = client.post(
        "/api/v1/attempts",
        headers=auth,
        json={**base, "exercise_id": str(uuid.uuid4()), "answer_text": "works"},
    )
    assert missing.status_code == 404 and missing.json()["error_code"] == "INVALID_EXERCISE"
