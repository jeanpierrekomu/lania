"""Motor y sesiones de base de datos."""

from collections.abc import Iterator
from functools import lru_cache
from typing import Annotated

from fastapi import Depends
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import Settings, get_settings


def resolve_database_url(settings: Settings) -> str:
    if settings.database_url:
        return settings.database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    if not settings.is_local:
        raise RuntimeError("DATABASE_URL es obligatorio fuera de local")
    from app.db.local import ensure_local_server

    return ensure_local_server(settings.local_pg_dir, settings.local_pg_cleanup)


@lru_cache
def get_engine() -> Engine:
    return create_engine(resolve_database_url(get_settings()), pool_pre_ping=True)


@lru_cache
def _session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), expire_on_commit=False)


def get_db() -> Iterator[Session]:
    session = _session_factory()()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# scope="function": se guarda (commit) ANTES de responder. Con el valor por defecto («request») FastAPI
# respondía primero y guardaba después: una petición inmediata no veía los datos y un fallo al guardar
# llegaba al alumno como éxito.
DbDep = Annotated[Session, Depends(get_db, scope="function")]
