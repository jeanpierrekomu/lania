"""SOLO LOCAL: asigna un rol de staff a un usuario de desarrollo.

Uso: uv run python -m app.domain.admin.grant_role correo@ejemplo.test teacher_reviewer
En Supabase, los roles se asignan con SQL por un administrador; nunca desde el cliente.
"""

import sys

from sqlalchemy import select

from app.core.config import get_settings
from app.db.models import AuthUser, Profile
from app.db.session import _session_factory

ROLES = {"student", "content_editor", "teacher_reviewer", "moderator", "admin"}


def main(email: str, role: str) -> None:
    if not get_settings().is_local:
        raise SystemExit("Solo disponible con APP_ENV=local/test")
    if role not in ROLES:
        raise SystemExit(f"Rol inválido. Opciones: {sorted(ROLES)}")
    with _session_factory()() as db, db.begin():
        user = db.scalar(select(AuthUser).where(AuthUser.email == email.strip().lower()))
        if user is None:
            raise SystemExit("Ese correo no ha iniciado sesión todavía en este entorno")
        db.get_one(Profile, user.id).role = role
    print(f"{email} → {role}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
