# Evaluación de IA — 2026-11-02 19:42 UTC

Base: `https://api.openai.com/v1` · tutor: `gpt-6-luna` (razonamiento: —) · escritura: `gpt-6-luna` (razonamiento: medium) · casos: `cases_v1.yaml`

Tokens: 3581 entrada · 2632 salida · costo de esta corrida: US$ 0.0017

**writing: 2/3 casos aprobados** · latencia mediana 10.0 s · máx 14.4 s

| Tarea | Caso | Resultado | Latencia | Problemas |
|---|---|---|---|---|
| writing | w01-typical-errors | ✅ | 10.0 s | — |
| writing | w04-british-valid | ✅ | 4.5 s | — |
| writing | w05-spanish-calques | ❌ | 14.4 s | no detectó ['have 25 years', '25 years']; no detectó ['want celebrate']; no detectó ['will to leave'] |
