# Evaluación de IA — 2026-11-02 19:46 UTC

Base: `https://api.openai.com/v1` · tutor: `gpt-6-luna` (razonamiento: —) · escritura: `gpt-6.1-terra` (razonamiento: medium) · casos: `cases_v1.yaml`

Tokens: 3581 entrada · 1803 salida · costo de esta corrida: US$ 0.0126

**writing: 2/3 casos aprobados** · latencia mediana 7.9 s · máx 11.6 s

| Tarea | Caso | Resultado | Latencia | Problemas |
|---|---|---|---|---|
| writing | w01-typical-errors | ✅ | 7.9 s | — |
| writing | w04-british-valid | ✅ | 4.7 s | — |
| writing | w05-spanish-calques | ❌ | 11.6 s | no detectó ['have 25 years', '25 years']; no detectó ['want celebrate'] |
