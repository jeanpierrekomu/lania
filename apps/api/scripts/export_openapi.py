"""Exporta el contrato OpenAPI a packages/contracts/openapi.json (fuente de los tipos TS)."""

import json

from app.core.config import REPO_ROOT
from app.main import create_app

target = REPO_ROOT / "packages" / "contracts" / "openapi.json"
target.write_text(json.dumps(create_app().openapi(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"OpenAPI → {target.relative_to(REPO_ROOT)}")
