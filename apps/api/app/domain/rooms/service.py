"""Salones: base para conversación en grupos pequeños (máx. 5) con Lania moderando.

ESTADO: preparado, desactivado en el piloto (`ROOMS_ENABLED=false` → 404). Ya existen: salas creadas por el
equipo, unirse/salir con cupo, mensajes de texto con lectura incremental (`after`) y reporte. Falta para
activarlo: moderación de Lania por turnos (tarea `room_moderation`), notas de voz transcritas, panel docente
de reportes/expulsión y la pantalla real en /app/salones. Diseño en el plan del piloto (F5).
"""

import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.v1 import schemas as s
from app.core.config import Settings
from app.core.errors import ApiError
from app.db.models import Profile, Room, RoomMember, RoomMessage


def require_enabled(settings: Settings) -> None:
    if not settings.rooms_enabled:
        raise ApiError(404, "NOT_FOUND", "Los salones todavía no están disponibles.")


def _active_members(db: Session, room_id: uuid.UUID) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(RoomMember)
            .where(RoomMember.room_id == room_id, RoomMember.left_at.is_(None))
        )
        or 0
    )


def _room_out(db: Session, room: Room, user_id: uuid.UUID) -> s.RoomOut:
    me = db.get(RoomMember, (room.id, user_id))
    return s.RoomOut(
        id=room.id,
        slug=room.slug,
        title_es=room.title_es,
        topic_es=room.topic_es,
        goal_es=room.goal_es,
        level=room.level,
        capacity=room.capacity,
        members=_active_members(db, room.id),
        starts_at=room.starts_at,
        status=room.status,
        joined=me is not None and me.left_at is None,
    )


def list_rooms(db: Session, user_id: uuid.UUID) -> list[s.RoomOut]:
    rooms = db.scalars(select(Room).where(Room.status != "closed").order_by(Room.starts_at.nulls_last())).all()
    return [_room_out(db, r, user_id) for r in rooms]


def _room(db: Session, room_id: uuid.UUID) -> Room:
    room = db.get(Room, room_id)
    if room is None or room.status == "closed":
        raise ApiError(404, "NOT_FOUND", "Ese salón no existe o ya cerró.")
    return room


def join(db: Session, user_id: uuid.UUID, room_id: uuid.UUID, now: datetime) -> s.RoomOut:
    room = _room(db, room_id)
    me = db.get(RoomMember, (room.id, user_id))
    if me is not None and me.left_at is None:
        return _room_out(db, room, user_id)
    if _active_members(db, room.id) >= room.capacity:
        raise ApiError(409, "CONFLICT", "El salón está completo. Prueba otro horario.")
    if me is None:
        db.add(RoomMember(room_id=room.id, user_id=user_id, role="member", joined_at=now, left_at=None))
    else:
        me.joined_at, me.left_at = now, None
    db.flush()
    return _room_out(db, room, user_id)


def leave(db: Session, user_id: uuid.UUID, room_id: uuid.UUID, now: datetime) -> None:
    me = db.get(RoomMember, (room_id, user_id))
    if me is not None and me.left_at is None:
        me.left_at = now
        db.flush()


def _require_member(db: Session, user_id: uuid.UUID, room_id: uuid.UUID) -> None:
    me = db.get(RoomMember, (room_id, user_id))
    if me is None or me.left_at is not None:
        raise ApiError(403, "FORBIDDEN", "Únete al salón para ver y enviar mensajes.")


def messages(db: Session, user_id: uuid.UUID, room_id: uuid.UUID, after: datetime | None) -> list[s.RoomMessageOut]:
    _room(db, room_id)
    _require_member(db, user_id, room_id)
    q = (
        select(RoomMessage, Profile.display_name)
        .outerjoin(Profile, Profile.id == RoomMessage.user_id)
        .where(RoomMessage.room_id == room_id, RoomMessage.hidden_at.is_(None))
    )
    if after is not None:
        q = q.where(RoomMessage.created_at > after)
    rows = db.execute(q.order_by(RoomMessage.created_at).limit(200)).all()
    return [
        s.RoomMessageOut(
            id=m.id,
            author="Lania" if m.user_id is None else (name or "Participante"),
            mine=m.user_id == user_id,
            kind=m.kind,
            text=m.text,
            created_at=m.created_at,
        )
        for m, name in rows
    ]


def post(db: Session, user_id: uuid.UUID, room_id: uuid.UUID, text: str, now: datetime) -> s.RoomMessageOut:
    room = _room(db, room_id)
    if room.status != "open":
        raise ApiError(409, "CONFLICT", "El salón todavía no está abierto.")
    _require_member(db, user_id, room_id)
    msg = RoomMessage(
        id=uuid.uuid4(),
        room_id=room_id,
        user_id=user_id,
        kind="text",
        text=text.strip(),
        reported_at=None,
        hidden_at=None,
        created_at=now,
    )
    db.add(msg)
    db.flush()
    name = db.scalar(select(Profile.display_name).where(Profile.id == user_id))
    return s.RoomMessageOut(
        id=msg.id, author=name or "Participante", mine=True, kind="text", text=msg.text, created_at=now
    )


def report(db: Session, user_id: uuid.UUID, room_id: uuid.UUID, message_id: uuid.UUID, now: datetime) -> None:
    _require_member(db, user_id, room_id)
    msg = db.get(RoomMessage, message_id)
    if msg is None or msg.room_id != room_id:
        raise ApiError(404, "NOT_FOUND", "Ese mensaje no existe.")
    if msg.reported_at is None:
        msg.reported_at = now
        db.flush()
