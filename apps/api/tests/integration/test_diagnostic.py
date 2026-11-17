"""Diagnóstico por bloques (spec §2.2, US01): persistencia, modo examen, adaptación, informe honesto."""

import uuid
from collections.abc import Callable
from typing import Any

from fastapi.testclient import TestClient

from tests.conftest import CEFR, KEYS, SAMPLE_TEXT, SKILL_OF

Answerer = Callable[[dict[str, Any]], dict[str, Any]]


def correct(item: dict[str, Any]) -> dict[str, Any]:
    if item["type"] == "open_response":
        return {"answer_text": SAMPLE_TEXT}
    return dict(KEYS[item["external_id"]])


def run_all(client: TestClient, auth: dict[str, str], answerer: Answerer = correct) -> tuple[str, list[str]]:
    state = client.post("/api/v1/diagnostics", headers=auth).json()
    seen: list[str] = []
    while state["status"] == "in_progress":
        item = state["item"]
        seen.append(item["external_id"])
        body = {"exercise_id": item["id"], "client_submission_id": str(uuid.uuid4()), **answerer(item)}
        res = client.post(f"/api/v1/diagnostics/{state['run_id']}/answers", json=body, headers=auth)
        assert res.status_code == 200, res.text
        state = res.json()
    return state["run_id"], seen


def section(report: dict[str, Any], code: str) -> dict[str, Any]:
    return next(s for s in report["sections"] if s["skill_code"] == code)


def test_exam_mode_hides_keys_and_hints(client: TestClient, auth: dict[str, str]) -> None:
    res = client.post("/api/v1/diagnostics", headers=auth)
    raw = res.text
    for secret in ("accepted", "answer_schema", "distractors", "correct_option", "option_feedback", "reviewer_notes"):
        assert secret not in raw
    state = res.json()
    assert state["item"]["hint_es"] is None and state["item"]["role"] == "diagnostic"
    assert state["block"]["id"] == "grammar_vocab" and state["first_in_block"]
    assert any("speaking" in n.lower() for n in state["not_assessed_es"])


def test_resume_where_you_left_off(client: TestClient, auth: dict[str, str]) -> None:
    first = client.post("/api/v1/diagnostics", headers=auth).json()
    item = first["item"]
    body = {"exercise_id": item["id"], "client_submission_id": str(uuid.uuid4()), **correct(item)}
    after = client.post(f"/api/v1/diagnostics/{first['run_id']}/answers", json=body, headers=auth).json()
    again = client.post("/api/v1/diagnostics", headers=auth).json()
    assert again["run_id"] == first["run_id"]
    assert again["answered"] == 1 and again["item"]["id"] == after["item"]["id"]
    current = client.get("/api/v1/diagnostics/current", headers=auth).json()
    assert current["active"]["run_id"] == first["run_id"]
    # reenvío idempotente: no cuenta dos veces
    replay = client.post(f"/api/v1/diagnostics/{first['run_id']}/answers", json=body, headers=auth).json()
    assert replay["answered"] == 1


def test_cannot_answer_a_different_question(client: TestClient, auth: dict[str, str]) -> None:
    state = client.post("/api/v1/diagnostics", headers=auth).json()
    res = client.post(
        f"/api/v1/diagnostics/{state['run_id']}/answers",
        headers=auth,
        json={"exercise_id": str(uuid.uuid4()), "client_submission_id": str(uuid.uuid4()), "unsure": True},
    )
    assert res.status_code == 409


def test_full_run_with_ai_writing_produces_honest_report(
    client: TestClient, auth: dict[str, str], fake_ai: Any
) -> None:
    run_id, seen = run_all(client, auth)
    assert len(seen) == 27
    report = client.get(f"/api/v1/diagnostics/{run_id}/report", headers=auth).json()
    assert section(report, "grammar.future.will_base_form")["band"] == "a2"
    assert all(s["confidence"] in ("low", "medium") for s in report["sections"])  # nunca «alta»
    assert section(report, "writing.task_fulfillment")["band"] == "a1"  # 2/3 en ambos textos
    assert report["pending_evaluations"] == 0
    assert len(report["writing"]) == 2 and report["writing"][0]["criteria"]["accuracy"]["score"] == 2
    assert any("MCER" in c for c in report["caveats_es"])
    assert any("IA" in c for c in report["caveats_es"])
    # Ya terminado: no se puede seguir respondiendo ni empezar otro sin querer
    mission = client.get("/api/v1/learning/next", headers=auth).json()
    assert mission["kind"] in ("lesson", "none")


def test_adaptive_skip_and_unsure_count_as_not_achieved(client: TestClient, auth: dict[str, str]) -> None:
    target = "grammar.present_continuous.auxiliary_be_ing"  # 2 ítems A1 + 1 A2 en diag_v1

    def answerer(item: dict[str, Any]) -> dict[str, Any]:
        if SKILL_OF[item["external_id"]] == target:
            return {"unsure": True}
        return correct(item)

    run_id, seen = run_all(client, auth, answerer)
    will_seen = [i for i in seen if SKILL_OF[i] == target]
    assert will_seen and all(CEFR[i] == "A1" for i in will_seen)  # los A2 se saltaron por adaptación
    report = client.get(f"/api/v1/diagnostics/{run_id}/report", headers=auth).json()
    sec = section(report, target)
    assert sec["band"] == "below_a1" and "A2" in sec["notes_es"]
    assert any(m["skill_code"] == target and m["available"] is False for m in report["missions"])  # sin clase aún
    assert report["missions"][0]["skill_code"] == target  # lo más débil primero


def test_without_ai_writing_stays_pending_and_does_not_count(client: TestClient, auth: dict[str, str]) -> None:
    run_id, _ = run_all(client, auth)
    report = client.get(f"/api/v1/diagnostics/{run_id}/report", headers=auth).json()
    assert section(report, "writing.task_fulfillment")["band"] == "pending_review"
    assert all(w["status"] == "needs_review" and w["criteria"] is None for w in report["writing"])
    assert report["writing"][0]["your_text"] == SAMPLE_TEXT  # original intacto


def test_diagnostic_does_not_schedule_reviews(client: TestClient, auth: dict[str, str]) -> None:
    run_all(client, auth, lambda item: {"unsure": True})
    progress = client.get("/api/v1/progress", headers=auth).json()
    assert progress["reviews"] == []


def test_report_is_private(client: TestClient, auth: dict[str, str]) -> None:
    from tests.conftest import login

    run_id, _ = run_all(client, auth)
    other = login(client)
    assert client.get(f"/api/v1/diagnostics/{run_id}/report", headers=other).status_code == 404
