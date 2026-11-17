# ADR-007 — Diagnóstico diag_v1

**Estado:** aceptado · 2026-11-02

## Decisión
- Definición versionada en `packages/content-seeds/diagnostics/diag_v1.yaml`: bloques gramática+vocabulario (22) → lectura (3) → escritura (2). Ítems con `pool: diagnostic`: **nunca** aparecen en lecciones ni repasos.
- **Modo examen:** sin pistas ni correcciones hasta el informe; las claves no salen del backend; solo se puede responder la pregunta actual (409 si no); idempotente por `client_submission_id`; se puede pausar y retomar.
- **«No lo sé»** cuenta como no logrado: preferimos eso a premiar adivinanzas.
- **Adaptación mínima:** si fallan los dos primeros ítems A1 de una habilidad, se saltan sus ítems A2.
- **Bandas** `below_a1 / a1 / a2` por habilidad (`diag_v1_bands`): A2 exige lo básico + evidencia A2; un solo acierto difícil nunca da A2. Confianza máxima «media». No mide por encima de A2 y lo dice.
- **Escritura** evaluada en segundo plano por IA con rúbrica `writing_v1`; sin IA, queda `pending_review` y no cuenta.
- El diagnóstico actualiza el dominio de cada habilidad pero **no programa repasos** (es evaluación, no práctica).
- Informe: lo que ya haces, lo que necesitas, hasta 5 misiones (enlazadas si existe clase), feedback de escritura, cautelas y lo no evaluado (listening/speaking).

## Pendiente
Calibración con docentes y datos reales; ítems de listening/speaking (Entrega 3); mini prueba de confirmación para casos límite (hoy solo se avisa).
