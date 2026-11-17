"""Revisión docente de disputas (con auditoría) y validación de la evaluación de escritura."""

import uuid
from typing import Any

import psycopg
from fastapi.testclient import TestClient

from app.ai.outputs import WritingError
from app.ai.providers.base import LLMRequest
from app.domain.writing.evaluator import anchor_errors
from tests.conftest import SAMPLE_TEXT, login


def make_staff(pg_url: str, headers: dict[str, str], client: TestClient) -> None:
    me = client.get("/api/v1/me", headers=headers).json()
    with psycopg.connect(pg_url) as conn:
        conn.execute("update profiles set role = 'teacher_reviewer' where id = %s", (me["id"],))


def test_students_cannot_access_review_panel(client: TestClient, auth: dict[str, str]) -> None:
    assert client.get("/api/v1/admin/disputes", headers=auth).status_code == 403
    assert client.get("/api/v1/admin/ai-usage", headers=auth).status_code == 403


def test_accepting_a_dispute_overturns_and_recomputes(client: TestClient, pg_url: str) -> None:
    student, reviewer = login(client), login(client)
    make_staff(pg_url, reviewer, client)
    ex = client.get("/api/v1/lessons/present-simple-basics", headers=student).json()["exercises"][1]
    answer = "She works at the design studio downtown"  # válida en contexto, pero el corrector no la reconoce
    res = client.post(
        "/api/v1/attempts",
        headers=student,
        json={
            "exercise_id": ex["id"],
            "client_submission_id": str(uuid.uuid4()),
            "mode": "practice",
            "answer_text": answer,
        },
    ).json()
    assert res["evaluation"]["verdict"] == "incorrect"
    ev_id = res["evaluation"]["id"]
    client.post(f"/api/v1/evaluations/{ev_id}/dispute", headers=student, json={"reason": "Cambié el sujeto por she"})

    queue = client.get("/api/v1/admin/disputes", headers=reviewer).json()
    item = next(d for d in queue if d["learner_answer"] == answer)
    resolved = client.post(
        f"/api/v1/admin/disputes/{item['id']}/resolve",
        headers=reviewer,
        json={"decision": "accept", "note": "Pronombre válido en lugar del sujeto."},
    ).json()
    assert resolved["status"] == "accepted" and resolved["verdict"] == "valid_alternative"
    again = client.post(
        f"/api/v1/admin/disputes/{item['id']}/resolve",
        headers=reviewer,
        json={"decision": "reject", "note": "otra vez"},
    )
    assert again.status_code == 409

    progress = client.get("/api/v1/progress", headers=student).json()
    skill = next(s for s in progress["skills"] if s["skill_code"].startswith("grammar.present_simple"))
    assert "1 de 1" in skill["rationale_es"]  # la evidencia ahora cuenta como correcta
    with psycopg.connect(pg_url) as conn:
        audit = conn.execute(
            "select action, metadata_safe->'previous'->>'verdict' from audit_events where object_id = %s", (item["id"],)
        ).fetchone()
    assert audit == ("dispute.accepted", res["evaluation"]["verdict"])


def test_ai_usage_summary(client: TestClient, pg_url: str, fake_ai: Any) -> None:
    reviewer = login(client)
    make_staff(pg_url, reviewer, client)
    conv = client.post("/api/v1/tutor/conversations", json={}, headers=reviewer).json()
    client.post(
        f"/api/v1/tutor/conversations/{conv['id']}/messages",
        headers=reviewer,
        json={"client_message_id": str(uuid.uuid4()), "text": "hi"},
    )
    usage = client.get("/api/v1/admin/ai-usage", headers=reviewer).json()
    assert usage["requests"] >= 1 and usage["input_tokens"] >= 100
    assert usage["estimated_cost_usd"] is None and usage["cost_known_for_all"] is False  # sin precios: no inventamos


def test_anchor_errors_drops_invented_spans() -> None:
    errs = [
        WritingError(
            span="i drink coffee",
            type="grammar",
            severity="primary",
            rule_code=None,
            explanation_es="x",
            minimal_correction="I drink coffee",
        ),
        WritingError(
            span="I goes",
            type="grammar",
            severity="primary",
            rule_code=None,
            explanation_es="inventado",
            minimal_correction="I go",
        ),
    ]
    kept, dropped = anchor_errors(SAMPLE_TEXT, errs)
    assert (
        dropped == 1 and kept[0]["span"] == "I drink coffee" and SAMPLE_TEXT[kept[0]["start"] :].startswith("I drink")
    )


def _writing_responder(**overrides: Any):  # type: ignore[no-untyped-def]
    def responder(req: LLMRequest) -> dict[str, Any]:
        base = {
            "task_fulfillment": {"score": 3, "comment_es": "ok"},
            "accuracy": {"score": 3, "comment_es": "ok"},
            "coherence": {"score": 3, "comment_es": "ok"},
            "range": {"score": 3, "comment_es": "ok"},
            "strengths_es": "Bien.",
            "errors": [],
            "natural_version_en": None,
            "uncertain": False,
            "uncertainty_reason_es": None,
        }
        base.update(overrides)
        return base

    return responder


def _diagnostic_until_writing(client: TestClient, auth: dict[str, str]) -> dict[str, Any]:
    from tests.integration.test_diagnostic import correct

    state = client.post("/api/v1/diagnostics", headers=auth).json()
    while state["item"]["type"] != "open_response":
        item = state["item"]
        state = client.post(
            f"/api/v1/diagnostics/{state['run_id']}/answers",
            headers=auth,
            json={"exercise_id": item["id"], "client_submission_id": str(uuid.uuid4()), **correct(item)},
        ).json()
    return state


def test_short_text_cannot_score_full_task(client: TestClient, auth: dict[str, str], fake_ai: Any) -> None:
    fake_ai.responder = _writing_responder()
    state = _diagnostic_until_writing(client, auth)
    for _ in range(2):
        item = state["item"]
        state = client.post(
            f"/api/v1/diagnostics/{state['run_id']}/answers",
            headers=auth,
            json={"exercise_id": item["id"], "client_submission_id": str(uuid.uuid4()), "answer_text": "I work."},
        ).json()
    report = client.get(f"/api/v1/diagnostics/{state['run_id']}/report", headers=auth).json()
    w = report["writing"][0]
    assert w["criteria"]["task_fulfillment"]["score"] == 1 and any("corto" in n for n in w["notes_es"])


def test_uncertain_ai_goes_to_review(client: TestClient, auth: dict[str, str], fake_ai: Any) -> None:
    fake_ai.responder = _writing_responder(uncertain=True, uncertainty_reason_es="El texto está en español.")
    state = _diagnostic_until_writing(client, auth)
    for _ in range(2):
        item = state["item"]
        state = client.post(
            f"/api/v1/diagnostics/{state['run_id']}/answers",
            headers=auth,
            json={
                "exercise_id": item["id"],
                "client_submission_id": str(uuid.uuid4()),
                "answer_text": "Todos los días estudio diseño y trabajo en una agencia pequeña de Lima.",
            },
        ).json()
    report = client.get(f"/api/v1/diagnostics/{state['run_id']}/report", headers=auth).json()
    assert all(w["status"] == "needs_review" for w in report["writing"])
    assert next(s for s in report["sections"] if s["skill_code"] == "writing.accuracy")["band"] == "pending_review"


def test_spanish_text_is_not_graded_as_english_and_skips_ai(
    client: TestClient, auth: dict[str, str], fake_ai: Any
) -> None:
    from app.domain.writing.evaluator import looks_not_english

    assert looks_not_english("Todos los días me levanto temprano y después voy a la universidad a estudiar.")
    assert not looks_not_english(SAMPLE_TEXT)
    state = _diagnostic_until_writing(client, auth)
    calls_before = len(fake_ai.calls)
    for _ in range(2):
        item = state["item"]
        state = client.post(
            f"/api/v1/diagnostics/{state['run_id']}/answers",
            headers=auth,
            json={
                "exercise_id": item["id"],
                "client_submission_id": str(uuid.uuid4()),
                "answer_text": "Todos los días me levanto temprano, desayuno con mi familia y voy a la universidad.",
            },
        ).json()
    report = client.get(f"/api/v1/diagnostics/{state['run_id']}/report", headers=auth).json()
    assert all(w["status"] == "needs_review" and "español" in w["feedback_es"] for w in report["writing"])
    assert len(fake_ai.calls) == calls_before  # no se gastó IA
