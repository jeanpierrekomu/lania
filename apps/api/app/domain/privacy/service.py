"""Derechos del alumno sobre sus datos (docs/security/privacy.md): exportar, borrar y retención."""

import uuid
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import delete, select, text
from sqlalchemy.orm import Session

from app.core.errors import ApiError
from app.db.models import AuditEvent, AuthUser, Profile, TtsCache, TutorConversation

# Tablas con datos de la persona (columna, tabla). Las respuestas a ítems y las claves de corrección
# del catálogo NO se exportan: son contenido de LANIA, no datos personales.
USER_TABLES: tuple[tuple[str, str], ...] = (
    ("id", "profiles"),
    ("user_id", "learning_preferences"),
    ("user_id", "learner_goals"),
    ("user_id", "attempts"),
    ("user_id", "evaluation_disputes"),
    ("user_id", "skill_evidence"),
    ("user_id", "skill_mastery"),
    ("user_id", "review_schedule"),
    ("user_id", "diagnostic_runs"),
    ("user_id", "tutor_conversations"),
    ("user_id", "tutor_messages"),
    ("user_id", "speaking_sessions"),
    ("user_id", "speaking_turns"),
    ("user_id", "room_members"),
    ("user_id", "room_messages"),
    ("user_id", "pilot_feedback"),
)


def _jsonable(value: Any) -> Any:
    if isinstance(value, uuid.UUID | datetime):
        return str(value)
    if isinstance(value, dict):
        return {k: _jsonable(v) for k, v in value.items()}
    if isinstance(value, list | tuple):
        return [_jsonable(v) for v in value]
    if value is None or isinstance(value, bool | int | float | str):
        return value
    return str(value)


def export_data(db: Session, user_id: uuid.UUID, now: datetime) -> dict[str, Any]:
    user = db.get(AuthUser, user_id)
    if user is None:
        raise ApiError(404, "NOT_FOUND", "No encontramos tu cuenta.")
    tables: dict[str, list[dict[str, Any]]] = {}
    for column, table in USER_TABLES:
        # Nombres de tabla/columna fijos de la lista de arriba, nunca entrada del usuario.
        rows = db.execute(text(f"select * from public.{table} where {column} = :uid"), {"uid": user_id})
        tables[table] = [_jsonable(dict(r._mapping)) for r in rows]
    db.add(
        AuditEvent(
            actor_id=user_id,
            action="privacy.export",
            object_type="user",
            object_id=user_id,
            metadata_safe={},
            created_at=now,
        )
    )
    return {"exported_at": now.isoformat(), "email": user.email, "tables": tables}


def delete_account(db: Session, user_id: uuid.UUID, now: datetime) -> None:
    """Borra la cuenta y, en cascada, todos sus datos. Queda un registro de auditoría sin PII."""
    user = db.get(AuthUser, user_id)
    if user is None:
        raise ApiError(404, "NOT_FOUND", "No encontramos tu cuenta.")
    db.add(
        AuditEvent(
            actor_id=None,
            action="privacy.delete_account",
            object_type="user",
            object_id=user_id,
            metadata_safe={},
            created_at=now,
        )
    )
    db.execute(delete(AuthUser).where(AuthUser.id == user_id))
    db.flush()


def record_pilot_consent(db: Session, user_id: uuid.UUID, now: datetime) -> None:
    profile = db.get(Profile, user_id)
    if profile is None:
        raise ApiError(404, "NOT_FOUND", "No encontramos tu perfil.")
    if profile.pilot_consent_at is None:
        profile.pilot_consent_at = now
        db.add(
            AuditEvent(
                actor_id=user_id,
                action="privacy.pilot_consent",
                object_type="user",
                object_id=user_id,
                metadata_safe={},
                created_at=now,
            )
        )
    db.flush()


def purge_expired_conversations(db: Session, now: datetime) -> int:
    """Borra las conversaciones con la tutora vencidas (90 días, `expires_at`); los mensajes caen en cascada."""
    ids = list(db.scalars(select(TutorConversation.id).where(TutorConversation.expires_at < now)))
    if ids:
        db.execute(delete(TutorConversation).where(TutorConversation.id.in_(ids)))
    return len(ids)


REPLY_AUDIO_RETENTION = timedelta(days=30)


def purge_reply_audio(db: Session, now: datetime) -> int:
    """El audio de las reacciones de Lania se regenera si hace falta; los episodios de listening se conservan."""
    res = db.execute(
        delete(TtsCache).where(TtsCache.kind == "reply", TtsCache.created_at < now - REPLY_AUDIO_RETENTION)
    )
    return int(res.rowcount or 0)  # type: ignore[attr-defined]
