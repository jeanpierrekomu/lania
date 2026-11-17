"""Listening y Speaking Lab: contenido real, preguntas corregidas en el servidor, voz validada y cacheada."""

import uuid
from typing import Any

from fastapi.testclient import TestClient

from app.ai.voice import sniff_audio
from tests.conftest import login

WEBM = b"\x1a\x45\xdf\xa3" + b"\x00" * 200


def test_episodes_list_and_detail_hide_answers(client: TestClient) -> None:
    h = login(client)
    eps = client.get("/api/v1/listening/episodes", headers=h).json()
    assert len(eps) == 5 and all(e["questions"] == 3 and e["solved"] == 0 for e in eps)
    ep = client.get("/api/v1/listening/episodes/cafe-order", headers=h).json()
    assert len(ep["segments"]) == 8 and len(ep["questions"]) == 3
    assert "correct_option" not in str(ep) and ep["server_audio"] is False


def test_listening_answer_counts_as_evidence(client: TestClient) -> None:
    h = login(client)
    q = client.get("/api/v1/listening/episodes/cafe-order", headers=h).json()["questions"][0]
    res = client.post(
        "/api/v1/attempts",
        headers=h,
        json={
            "exercise_id": q["exercise_id"],
            "client_submission_id": str(uuid.uuid4()),
            "mode": "practice",
            "option_id": "b",
        },
    ).json()
    assert res["evaluation"]["verdict"] == "correct"
    assert client.get("/api/v1/listening/episodes", headers=h).json()[0]["solved"] >= 0
    detail = client.get("/api/v1/listening/episodes/cafe-order", headers=h).json()
    assert detail["questions"][0]["solved"] is True


def test_segment_audio_is_cached(client: TestClient, fake_speech: Any) -> None:
    h = login(client)
    url = "/api/v1/listening/episodes/airport-gate/segments/0/audio"
    first = client.get(url, headers=h)
    assert first.status_code == 200 and first.headers["content-type"] == "audio/mpeg"
    client.get(url, headers=login(client))
    assert len(fake_speech.synth_calls) == 1  # la segunda persona recibe el audio ya generado
    assert client.get("/api/v1/listening/episodes/airport-gate/segments/99/audio", headers=h).status_code == 404


def test_audio_without_tts_is_unavailable(client: TestClient) -> None:
    res = client.get("/api/v1/listening/episodes/cafe-order/segments/0/audio", headers=login(client))
    assert res.status_code == 503 and res.json()["error_code"] == "AI_NOT_CONFIGURED"


def test_speaking_turn_by_voice_advances_and_corrects(client: TestClient, fake_ai: Any, fake_speech: Any) -> None:
    def responder(req: Any) -> dict[str, Any]:
        return {
            "on_task": True,
            "corrections": [
                {"original": "I am study", "corrected": "I study", "explanation_es": "Sin am con otro verbo."},
                {"original": "texto inventado", "corrected": "x", "explanation_es": "no existe"},
            ],
            "natural_version_en": "I study engineering and I like playing football.",
            "feedback_es": "Te presentaste con claridad. Ojo con am + verbo.",
            "reply_en": "Nice to meet you! Engineering sounds great.",
        }

    fake_ai.responder = responder
    h = login(client)
    sess = client.post("/api/v1/speaking/sessions", headers=h, json={"scenario": "job-interview"}).json()
    assert sess["current"]["step"] == 0 and sess["voice_input"] is True
    key = str(uuid.uuid4())
    res = client.post(
        f"/api/v1/speaking/sessions/{sess['id']}/turns",
        headers=h,
        data={"client_turn_id": key, "seconds": "6.5"},
        files={"audio": ("turn.webm", WEBM, "audio/webm")},
    )
    assert res.status_code == 200, res.text
    out = res.json()
    turn = out["turns"][0]
    assert turn["input_mode"] == "voice" and turn["transcript"].startswith("I am study")
    assert [c["original"] for c in turn["corrections"]] == ["I am study"]  # la inventada se descarta
    assert out["current"]["step"] == 1
    # Reenvío idéntico: no duplica ni vuelve a avanzar.
    again = client.post(
        f"/api/v1/speaking/sessions/{sess['id']}/turns",
        headers=h,
        data={"client_turn_id": key},
        files={"audio": ("turn.webm", WEBM, "audio/webm")},
    ).json()
    assert len(again["turns"]) == 1 and again["current"]["step"] == 1
    # La voz de Lania solo lee textos de esta conversación.
    ok = client.get(f"/api/v1/speaking/sessions/{sess['id']}/audio", params={"what": f"turn:{turn['id']}"}, headers=h)
    assert ok.status_code == 200
    other = login(client)
    assert client.get(f"/api/v1/speaking/sessions/{sess['id']}", headers=other).status_code == 404
    assert client.get("/api/v1/progress", headers=h).json()["streak_days"] == 1


def test_speaking_rejects_bad_audio_and_off_task_stays(client: TestClient, fake_ai: Any, fake_speech: Any) -> None:
    fake_ai.responder = lambda req: {
        "on_task": False,
        "corrections": [],
        "natural_version_en": None,
        "feedback_es": "Respondiste en español.",
        "reply_en": "Could you try that in English?",
    }
    h = login(client)
    sess = client.post("/api/v1/speaking/sessions", headers=h, json={"scenario": "hotel-checkin"}).json()
    bad = client.post(
        f"/api/v1/speaking/sessions/{sess['id']}/turns",
        headers=h,
        data={"client_turn_id": str(uuid.uuid4())},
        files={"audio": ("x.webm", b"not audio at all", "audio/webm")},
    )
    assert bad.status_code == 422
    typed = client.post(
        f"/api/v1/speaking/sessions/{sess['id']}/turns",
        headers=h,
        data={"client_turn_id": str(uuid.uuid4()), "text": "Hola, tengo una reserva"},
    ).json()
    assert typed["turns"][0]["input_mode"] == "text" and typed["current"]["step"] == 0


def test_sniff_audio() -> None:
    assert sniff_audio(WEBM) == "audio/webm"
    assert sniff_audio(b"\x00\x00\x00\x18ftypM4A ") == "audio/mp4"
    assert sniff_audio(b"<html>") is None
