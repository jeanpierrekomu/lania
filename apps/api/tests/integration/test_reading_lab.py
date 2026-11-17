"""Reading Lab: lecturas reales, claves ocultas, corrección en el servidor, audio solo del catálogo."""

import uuid
from typing import Any

from fastapi.testclient import TestClient

from tests.conftest import login


def test_texts_list_and_detail_hide_answers(client: TestClient) -> None:
    h = login(client)
    texts = client.get("/api/v1/reading/texts", headers=h).json()
    assert len(texts) == 5 and {t["level"] for t in texts} == {"A1", "A2", "B1"}
    detail = client.get("/api/v1/reading/texts/job-ad", headers=h).json()
    assert len(detail["paragraphs"]) == 4 and len(detail["questions"]) == 3 and detail["glossary"]
    assert "correct_option" not in str(detail) and "option_feedback" not in str(detail)


def test_answer_counts_as_reading_evidence(client: TestClient) -> None:
    h = login(client)
    q = client.get("/api/v1/reading/texts/new-neighbor", headers=h).json()["questions"][0]
    wrong = client.post(
        "/api/v1/attempts",
        headers=h,
        json={
            "exercise_id": q["exercise_id"],
            "client_submission_id": str(uuid.uuid4()),
            "mode": "practice",
            "option_id": "a",
        },
    ).json()
    assert wrong["evaluation"]["verdict"] == "incorrect" and "Arequipa" in wrong["evaluation"]["feedback_es"]
    right = client.post(
        "/api/v1/attempts",
        headers=h,
        json={
            "exercise_id": q["exercise_id"],
            "client_submission_id": str(uuid.uuid4()),
            "mode": "practice",
            "option_id": "b",
        },
    ).json()
    assert right["evaluation"]["verdict"] == "correct"
    assert client.get("/api/v1/reading/texts/new-neighbor", headers=h).json()["questions"][0]["solved"] is True
    skills = {s["skill_code"] for s in client.get("/api/v1/progress", headers=h).json()["skills"]}
    assert "reading.specific_information" in skills


def test_read_aloud_only_from_catalog(client: TestClient, fake_speech: Any) -> None:
    h = login(client)
    assert client.get("/api/v1/reading/texts/screen-time/audio", params={"what": "p:0"}, headers=h).status_code == 200
    assert client.get("/api/v1/reading/texts/screen-time/audio", params={"what": "w:1"}, headers=h).status_code == 200
    assert fake_speech.synth_calls[-1] == "rest"
    assert client.get("/api/v1/reading/texts/screen-time/audio", params={"what": "p:9"}, headers=h).status_code == 404
    bad = client.get("/api/v1/reading/texts/screen-time/audio", params={"what": "hola mundo"}, headers=h)
    assert bad.status_code == 422
