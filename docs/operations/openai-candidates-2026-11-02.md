# Candidatos OpenAI para el piloto — verificado el 2 nov 2026

Fuentes oficiales consultadas hoy: <https://developers.openai.com/api/docs/pricing>, <https://developers.openai.com/api/docs/models> y la ficha de `gpt-6-luna`. Revalidar antes de lanzar: los precios cambian.

| Modelo | Uso propuesto | Entrada / salida (USD por 1M tokens, estándar) | Notas oficiales |
|---|---|---|---|
| `gpt-6-luna` | Tutor (rápido) y candidato para escritura | 0,10 / 0,50 | «Most efficient model for focused, high-volume tasks». Chat Completions + Structured Outputs. Razonamiento: none…max (por defecto medium). |
| `gpt-6.1-terra` | Alternativa intermedia | 1,00 / 5,00 | «Fast, efficient… clear, natural writing». |
| `gpt-6.1-sol` | Escritura si los otros fallan | 2,00 / 10,00 | «Near-Astra performance… at a lower cost». |

Los tres son modelos de razonamiento: el adaptador envía `reasoning_effort` y `max_completion_tokens` y no envía `temperature` (configurable con `LLM_FAST_REASONING_EFFORT` / `LLM_DEEP_REASONING_EFFORT`). Los tokens de razonamiento se cobran como salida.

## Plan de evaluación (costo estimado de las 3 corridas: menos de US$ 1)

```bash
cd apps/api
uv run python -m scripts.eval_ai --base-url https://api.openai.com/v1 --fast gpt-6-luna --fast-effort low --deep gpt-6-luna --deep-effort medium --price-in 0.10 --price-out 0.50
uv run python -m scripts.eval_ai --base-url https://api.openai.com/v1 --fast gpt-6.1-terra --fast-effort low --deep gpt-6.1-terra --deep-effort medium --price-in 1 --price-out 5
uv run python -m scripts.eval_ai --base-url https://api.openai.com/v1 --fast gpt-6.1-sol --fast-effort low --deep gpt-6.1-sol --deep-effort medium --price-in 2 --price-out 10
```

**Criterio de selección:** 11/11 en «inglés válido sin tocar» (no negociable), ≥ 90 % en el resto, latencia mediana del tutor ≤ 8 s, y luego el costo más bajo.

## Resultado y decisión (2 nov 2026)

| Configuración | Tutor (27 casos) | Inglés válido sin tocar | Escritura (5 casos) | Latencia | Costo medido |
|---|---|---|---|---|---|
| `gemma3:12b` local (Ollama) | 9/12 (arnés v1) | 0/3 ❌ | 3/3 (v1) | 25–190 s | US$ 0 |
| **`gpt-6-luna`** tutor `low` | **27/27** | **11/11** | 4/5 con `medium` | ~2,5 s | US$ 0,0057 los 32 casos |
| `gpt-6-luna` escritura `high` | — | — | **3/3 en 3 de 3 repeticiones** | 10–15 s (en segundo plano) | ~US$ 0,0007 por texto |
| `gpt-6.1-terra` escritura `medium` | — | — | 2/3 en 3 de 3 repeticiones | ~7 s | ~US$ 0,004 por texto (10× luna) |

**Decisión:** `gpt-6-luna` para todo: tutor con razonamiento `low`, escritura con `high`. Terra y Sol no aportan en estos casos y cuestan 10–20 veces más. Informe completo: `ai-eval-gpt-6-luna-gpt-6-luna-2026-11-02-1940.md`; repeticiones de escritura en `writing-trials/`.

**Costo real medido:** unos US$ 0,0002 por mensaje con Nico y US$ 0,0007 por texto corregido. Uso intensivo por texto (60 mensajes/día y 30 textos/mes): **~US$ 0,35/mes**, menos que lo estimado antes. La voz (Entrega 3) se mide aparte.

**Volver a evaluar** antes de cambiar el prompt o el modelo, y cuando el arnés crezca (meta del spec: más de 100 casos).
