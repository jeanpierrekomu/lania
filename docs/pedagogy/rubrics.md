# Rúbricas y reglas versionadas

Cada evaluación guarda `rubric_version`, `grader_version` y `matched_rule`, para reproducir cualquier corrección.

## `grammar_closed_v1` / corrector `closed_v1`
Ver [ADR-004](../architecture/ADR-004-correction-engine.md): normalización, oración completa, alternativas, distractores, diagnósticos por regla, ortografía y apelación. Verificado por `apps/api/tests/unit/test_grading.py`, que además comprueba que **cada clave del banco pasa su propio corrector**.

## `mastery_v1` — estado de dominio
| Estado | Regla |
|---|---|
| `not_assessed` | Sin respuestas evaluadas |
| `emerging` | < 3 respuestas o precisión reciente < 50 % |
| `developing` | ≥ 3 respuestas y precisión reciente ≥ 50 % |
| `proficient` | Últimas 6 respuestas **sin pistas ni reintentos** ≥ 85 %, en ≥ 4 ítems distintos, en ≥ 2 días, y repasos acertados en ≥ 2 días distintos |
| `review_due` | Hay un repaso vencido (se calcula al leer) |

Confianza: baja (< 5 respuestas), media, alta (≥ 12 respuestas en ≥ 3 días). Se muestra siempre junto a la razón.

## `review_v1` — repaso espaciado por habilidad
Intervalos iniciales 1 / 3 / 7 / 14 / 30 días (ajustables; no se presentan como «probados»). Error en práctica → mañana. Práctica limpia → retención en 3 días. Repaso vencido: 3 aciertos sin ayuda lo aprueban (siguiente intervalo); un fallo o una pista lo reprograma a mañana. Los ítems de repaso priorizan los nunca vistos.

## `closed_v2` — corrector cerrado (Entrega 2)
Golden set de 222 casos revisados (`apps/api/tests/golden/closed_grader_v1.yaml`): **96,4 % de acuerdo con el criterio docente, 0 falsos positivos**, 2 falsos negativos conocidos (marcados `known_issue`, xfail estricto). Novedades: apóstrofo de teclado español, horas («9am» = «9:00 a.m.»), contracciones sin apóstrofo como error de escritura, pronombre en lugar del sujeto como alternativa válida, ortografía de sufijos (`studyes`) como error. Cada respuesta incorrecta trae `retry_hint_es`: una pista para el segundo intento que **no revela** la respuesta.

## `writing_v1` — escritura abierta (IA + validación)
Cuatro criterios 0–3: cumplir la tarea, precisión, coherencia, variedad. Reglas deterministas encima de la IA: cada error debe citar texto literal (si no, se descarta); textos con menos de la mitad de las palabras pedidas no pueden pasar de 1 en «cumplir la tarea»; dudas → `needs_review`. Confianza máxima «media» sin revisión humana.

## `diag_v1_bands` — bandas del diagnóstico
Ver [ADR-007](../architecture/ADR-007-diagnostic.md).
