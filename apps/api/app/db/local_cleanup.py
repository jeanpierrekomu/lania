"""Apaga y BORRA un Postgres embebido temporal. Solo acepta carpetas `modo-e2e-*` (uso: tests E2E).

No usamos la limpieza automática de pgserver porque Playwright mata la API sin dejarle cerrar
sus «handles», y pgserver cree que el servidor sigue en uso.
"""

import contextlib
import shutil
import subprocess
import sys
from pathlib import Path

import pgserver


def main(path: str) -> None:
    data_dir = Path(path).resolve()
    if not data_dir.name.startswith("modo-e2e-") or not (data_dir / "PG_VERSION").exists():
        raise SystemExit(f"Me niego a borrar {data_dir}: no es una base temporal de E2E")
    with contextlib.suppress(subprocess.CalledProcessError):  # ya estaba detenido
        pgserver.pg_ctl(["-w", "-m", "fast", "stop"], pgdata=data_dir)  # type: ignore[attr-defined]
    shutil.rmtree(data_dir)


if __name__ == "__main__":
    main(sys.argv[1])
