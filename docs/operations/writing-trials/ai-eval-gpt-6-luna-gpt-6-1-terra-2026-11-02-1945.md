# Evaluación de IA — 2026-11-02 19:45 UTC

Base: `https://api.openai.com/v1` · tutor: `gpt-6-luna` (razonamiento: —) · escritura: `gpt-6.1-terra` (razonamiento: medium) · casos: `cases_v1.yaml`

Tokens: 3581 entrada · 1567 salida · costo de esta corrida: US$ 0.0114

**writing: 2/3 casos aprobados** · latencia mediana 7.0 s · máx 10.6 s

| Tarea | Caso | Resultado | Latencia | Problemas |
|---|---|---|---|---|
| writing | w01-typical-errors | ✅ | 7.0 s | — |
| writing | w04-british-valid | ✅ | 4.3 s | — |
| writing | w05-spanish-calques | ❌ | 10.6 s | no detectó ['have 25 years', '25 years']; no detectó ['want celebrate'] |
