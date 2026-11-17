"""Preparar la base de un entorno publicado (staging/producción) antes de arrancar la API.

Aplica las migraciones pendientes de `supabase/migrations/` sobre el proyecto Supabase (sin la capa de
compatibilidad local) y siembra el contenido versionado. Es idempotente: se ejecuta en cada despliegue.
Uso: `uv run python -m app.db.deploy`.
"""

import logging

from app.content.seed import seed_content
from app.core.config import get_settings
from app.db.migrate import apply_migrations
from app.db.session import _session_factory

log = logging.getLogger("modo")


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    settings = get_settings()
    assert settings.database_url, "DATABASE_URL es obligatorio"
    applied = apply_migrations(settings.database_url, local_compat=settings.is_local)
    log.info("Migraciones aplicadas: %s", applied or "ninguna pendiente")
    with _session_factory()() as session, session.begin():
        log.info("Contenido sembrado: %s", seed_content(session))


if __name__ == "__main__":
    main()
