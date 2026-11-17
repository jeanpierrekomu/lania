# ADR-003 — Orquestación de IA

**Estado:** implementado en Entrega 2 · 2026-11-02

## Decisión
- `LLMProvider`, `SpeechToTextProvider`, `TextToSpeechProvider` como `Protocol` de Python (spec §8.1). Implementaciones concretas por configuración: `LLM_PROVIDER`, `LLM_FAST_MODEL`, `LLM_DEEP_MODEL`. **No se fijan nombres de modelos ni precios en código**: se verifican en la documentación oficial al implementar.
- `ModelRouter` decide por *tarea*: ejercicios cerrados → motor determinista (sin LLM); explicación/chat → modelo rápido; writing abierto y casos dudosos → modelo profundo con rúbrica; siguiente habilidad → reglas del motor pedagógico (el LLM solo redacta).
- Salida estructurada validada con Pydantic; si no valida tras un reintento acotado → `needs_review`, nunca una nota inventada.
- Context packet mínimo (objetivo, habilidad, errores relevantes, últimas N intervenciones); nunca el historial completo. Texto del alumno siempre como *dato*, separado del prompt de sistema.
- Cada llamada registra `ai_requests` (tarea, proveedor, modelo, tokens, latencia, costo estimado) con idempotencia por turno.

## Implementación (Entrega 2)
- `app/ai/gateway.py` es la única salida hacia modelos: elige modelo por tarea (`tutor_reply` → `LLM_FAST_MODEL`, `writing_eval` → `LLM_DEEP_MODEL`), valida con Pydantic, reintenta UNA vez con el error y, si vuelve a fallar, devuelve `None` (el llamador marca `needs_review`). Corta por `MONTHLY_AI_SPEND_LIMIT_USD`.
- Un solo adaptador, `OpenAICompatibleProvider` (Chat Completions + Structured Outputs), sirve para OpenAI y para modelos abiertos servidos con la misma interfaz (Ollama). Verificado contra la documentación oficial de Structured Outputs y Ollama 0.40 el 2 nov 2026.
- `ai_requests` registra tokens, latencia, estado y costo. **El costo solo se calcula si el precio está configurado** (`LLM_*_PRICE_*_PER_MTOK`, copiado de la página oficial con fecha); si no, queda `NULL`. Los fallos del proveedor se guardan en una transacción aparte para que no se pierdan.
- Idempotencia por turno (`request_key`): un doble envío no paga dos veces.
- Anti-alucinación: las correcciones del tutor y los errores de escritura deben citar texto literal del alumno; si no, se descartan. La escritura con más de la mitad de citas inventadas, o marcada `uncertain`, va a revisión.
- `LLM_PROVIDER=fake` (guionado) existe solo con `APP_ENV=test`; sin proveedor, el tutor se muestra «no disponible» en vez de simularse.
- Arnés `scripts/eval_ai.py` + `tests/ai_eval/cases_v1.yaml`: correr antes de cambiar modelo o prompt.

## Por qué la Entrega 1 no usaba LLM
El vertical slice es de ejercicios cerrados: el spec (§8.2, §11.2) pide resolverlos de forma determinista. Añadir un LLM aquí solo sumaría costo y no-determinismo.
