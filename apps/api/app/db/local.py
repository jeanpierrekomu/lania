"""Postgres embebido para desarrollo sin Docker (ADR-006)."""

from pathlib import Path


def ensure_local_server(data_dir: Path, cleanup: str = "none") -> str:
    """Arranca (o reutiliza) el servidor embebido y devuelve una URL para SQLAlchemy."""
    import pgserver

    data_dir.mkdir(parents=True, exist_ok=True)
    server = pgserver.get_server(str(data_dir), cleanup_mode=None if cleanup == "none" else cleanup)  # type: ignore[attr-defined]
    uri: str = server.get_uri()
    return uri.replace("postgresql://", "postgresql+psycopg://", 1)
