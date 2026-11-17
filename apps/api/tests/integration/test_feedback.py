"""«¿Algo no funcionó?»: cualquiera envía; solo el equipo lee."""

from fastapi.testclient import TestClient

from tests.conftest import login
from tests.integration.test_admin_and_writing import make_staff


def test_feedback_is_sent_and_only_staff_reads(client: TestClient, pg_url: str) -> None:
    student, staff = login(client), login(client)
    make_staff(pg_url, staff, client)
    res = client.post(
        "/api/v1/feedback",
        headers=student,
        json={"kind": "bug", "message": "No suena el audio", "page": "/app/listening"},
    )
    assert res.status_code == 204
    assert client.post("/api/v1/feedback", headers=student, json={"message": "x"}).status_code == 422
    assert client.get("/api/v1/admin/feedback", headers=student).status_code == 403
    items = client.get("/api/v1/admin/feedback", headers=staff).json()
    assert any(i["message"] == "No suena el audio" and i["page"] == "/app/listening" for i in items)
