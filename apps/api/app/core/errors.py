"""Errores tipados con request_id, código legible y si se puede reintentar (spec §7.3)."""

from typing import Literal

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel

ErrorCode = Literal[
    "AUTH_REQUIRED",
    "AUTH_INVALID",
    "NOT_FOUND",
    "INVALID_EXERCISE",
    "INVALID_INPUT",
    "CONFLICT",
    "REVIEW_REQUIRED",
    "INTERNAL",
    "FORBIDDEN",
    "QUOTA_EXCEEDED",
    "PROVIDER_UNAVAILABLE",
    "AI_NOT_CONFIGURED",
    "RATE_LIMITED",
]


class ErrorBody(BaseModel):
    error_code: ErrorCode
    message_es: str
    retryable: bool
    request_id: str


class ApiError(Exception):
    def __init__(self, status: int, code: ErrorCode, message_es: str, *, retryable: bool = False) -> None:
        super().__init__(message_es)
        self.status, self.code, self.message_es, self.retryable = status, code, message_es, retryable


def _body(request: Request, code: ErrorCode, message: str, retryable: bool) -> dict[str, object]:
    rid = getattr(request.state, "request_id", "unknown")
    return ErrorBody(error_code=code, message_es=message, retryable=retryable, request_id=rid).model_dump()


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def _api_error(request: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(_body(request, exc.code, exc.message_es, exc.retryable), status_code=exc.status)

    @app.exception_handler(RequestValidationError)
    async def _validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(_body(request, "INVALID_INPUT", "Revisa los datos enviados.", False), status_code=422)

    @app.exception_handler(Exception)
    async def _unexpected(request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            _body(request, "INTERNAL", "Algo falló de nuestro lado. Intenta de nuevo.", True), status_code=500
        )
