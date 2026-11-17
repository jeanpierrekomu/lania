# Evaluación de IA — 2026-11-02 19:41 UTC

Base: `https://api.openai.com/v1` · tutor: `gpt-6-luna` (razonamiento: —) · escritura: `gpt-6-luna` (razonamiento: medium) · casos: `cases_v1.yaml`

Tokens: 3581 entrada · 2579 salida · costo de esta corrida: US$ 0.0016

**writing: 2/3 casos aprobados** · latencia mediana 10.3 s · máx 15.1 s

| Tarea | Caso | Resultado | Latencia | Problemas |
|---|---|---|---|---|
| writing | w01-typical-errors | ✅ | 10.3 s | — |
| writing | w04-british-valid | ✅ | 5.0 s | — |
| writing | w05-spanish-calques | ❌ | 15.1 s | no detectó ['have 25 years', '25 years']; no detectó ['want celebrate'] |
