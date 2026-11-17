"""Punto de entrada FastAPI."""

import logging
import uuid
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import dev_router, router
from app.core.config import get_settings
from app.core.errors import install_error_handlers

log = logging.getLogger("modo")


def _bootstrap_local_database() -> None:
    """Local/test: migraciones + seed automáticos para que `make dev` funcione sin pasos extra."""
    from app.content.seed import seed_content
    from app.db.migrate import apply_migrations
    from app.db.session import _session_factory, get_engine

    applied = apply_migrations(get_engine().url.render_as_string(hide_password=False))
    if applied:
        log.info("Migraciones aplicadas: %s", applied)
    with _session_factory()() as session, session.begin():
        log.info("Contenido sembrado: %s", seed_content(session))


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    if settings.is_local and settings.auto_migrate:
        _bootstrap_local_database()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=f"{settings.app_name} API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["authorization", "content-type"],
    )

    @app.middleware("http")
    async def request_id(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        request.state.request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
        response = await call_next(request)
        response.headers["x-request-id"] = request.state.request_id
        return response

    install_error_handlers(app)
    app.include_router(router)
    if settings.is_local:
        app.include_router(dev_router)
    return app


app = create_app()
