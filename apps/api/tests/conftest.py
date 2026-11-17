"""Fixtures: Postgres embebido temporal por sesión de tests (nada se comparte con tu base local)."""

import os
import shutil
import tempfile
import uuid
from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.content.loader import load_content
from app.content.models import ChoiceAnswer, FillBlankAnswer
from app.core.clock import clock


@pytest.fixture(scope="session")
def pg_url() -> Iterator[str]:
    import pgserver

    data_dir = tempfile.mkdtemp(prefix="modo-pg-")
    server = pgserver.get_server(data_dir, cleanup_mode="stop")
    yield server.get_uri()
    server.cleanup()
    shutil.rmtree(data_dir, ignore_errors=True)


@pytest.fixture(scope="session")
def client(pg_url: str) -> Iterator[TestClient]:
    # Aislado del .env local del desarrollador (p. ej. si usa Ollama): sin IA salvo `fake_ai`.
    os.environ.update(
        APP_ENV="test",
        AUTH_MODE="local",
        DATABASE_URL=pg_url,
        AUTO_MIGRATE="true",
        LLM_PROVIDER="none",
        RATE_LIMIT_PER_MINUTE="0",
    )
    from app.core.config import get_settings
    from app.db.session import _session_factory, get_engine

    get_settings.cache_clear()
    get_engine.cache_clear()
    _session_factory.cache_clear()
    from app.main import create_app

    with TestClient(create_app()) as c:
        yield c


@pytest.fixture(autouse=True)
def reset_clock() -> Iterator[None]:
    clock.offset = clock.offset * 0
    yield
    clock.offset = clock.offset * 0


def login(client: TestClient, email: str | None = None) -> dict[str, str]:
    email = email or f"student-{uuid.uuid4().hex[:8]}@example.test"
    res = client.post("/api/v1/dev/session", json={"email": email, "display_name": "Test"})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture
def auth(client: TestClient) -> dict[str, str]:
    return login(client)


KEYS: dict[str, Any] = {}
for _item in load_content().items:
    if isinstance(_item.answer, FillBlankAnswer):
        KEYS[_item.id] = {"answer_text": _item.answer.accepted[0]}
    elif isinstance(_item.answer, ChoiceAnswer):
        KEYS[_item.id] = {"option_id": _item.answer.correct_option}


def correct_payload(exercise: dict[str, Any], mode: str = "practice") -> dict[str, Any]:
    return {
        "exercise_id": exercise["id"],
        "client_submission_id": str(uuid.uuid4()),
        "mode": mode,
        **KEYS[exercise["external_id"]],
    }


CEFR: dict[str, str] = {i.id: i.cefr_estimate or "A1" for i in load_content().items}
SKILL_OF: dict[str, str] = {i.id: i.skill for i in load_content().items}

SAMPLE_TEXT = (
    "Every weekday I wake up at seven and I drink coffee. Then I go to the university by bus. "
    "In the afternoon I work in a small design studio and at night I study English for one hour."
)


@pytest.fixture
def fake_ai() -> Iterator[Any]:
    """Proveedor guionado (solo tests). Se restablece al terminar."""
    from app.ai.gateway import set_provider_override
    from app.ai.providers.fake import FakeProvider

    provider = FakeProvider()
    set_provider_override(provider)
    yield provider
    set_provider_override(None)


@pytest.fixture
def fake_speech() -> Iterator[Any]:
    """Voz guionada (solo tests): transcripción fija y un MP3 mínimo."""
    from app.ai.providers.speech import FakeSpeechProvider
    from app.ai.voice import set_speech_override

    provider = FakeSpeechProvider()
    set_speech_override(provider)
    yield provider
    set_speech_override(None)
