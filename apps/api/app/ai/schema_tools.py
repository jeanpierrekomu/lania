"""Convierte modelos Pydantic en JSON Schema aceptado por Structured Outputs en modo estricto.

El modo estricto exige `additionalProperties: false`, todos los campos en `required` y no admite
varias restricciones (longitudes, rangos). Las restricciones se validan DESPUÉS con Pydantic.
"""

from typing import Any

from pydantic import BaseModel

_UNSUPPORTED = {
    "title",
    "default",
    "minLength",
    "maxLength",
    "minimum",
    "maximum",
    "minItems",
    "maxItems",
    "pattern",
    "format",
    "description",
    "examples",
}


def _clean(node: Any) -> Any:
    if isinstance(node, dict):
        out = {k: _clean(v) for k, v in node.items() if k not in _UNSUPPORTED}
        if out.get("type") == "object" and "properties" in out:
            out["additionalProperties"] = False
            out["required"] = list(out["properties"].keys())
        return out
    if isinstance(node, list):
        return [_clean(v) for v in node]
    return node


def strict_schema(model: type[BaseModel]) -> dict[str, Any]:
    cleaned: dict[str, Any] = _clean(model.model_json_schema())
    return cleaned
