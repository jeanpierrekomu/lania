# Contratos de API v1

El contrato completo y tipado está en [`packages/contracts/openapi.json`](../../packages/contracts/openapi.json) (generado desde FastAPI; la web usa los tipos generados en `packages/contracts/src/schema.d.ts`). Con la API corriendo: <http://localhost:8000/docs>.

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/v1/health` | Estado, sin datos sensibles |
| GET | `/api/v1/me` | Perfil y preferencias propias |
| GET | `/api/v1/learning/next` | Próxima misión **con razón explicable** |
| GET | `/api/v1/lessons/{slug}` | Microclase + ejercicios (sin claves) |
| POST | `/api/v1/attempts` | Entregar respuesta → evaluación + dominio + próximo repaso. Idempotente por `client_submission_id` |
| POST | `/api/v1/evaluations/{id}/dispute` | Pedir revisión de una corrección |
| GET | `/api/v1/reviews/session` | Repaso vencido con ítems distintos |
| GET | `/api/v1/progress` | Dominio por habilidad, repasos, errores recientes |
| PUT | `/api/v1/me/preferences` | Preferencias del alumno |
| POST | `/api/v1/diagnostics` | Empezar o retomar el diagnóstico |
| GET | `/api/v1/diagnostics/current` | Diagnóstico activo y último completado |
| POST | `/api/v1/diagnostics/{id}/answers` | Responder la pregunta actual (o «No lo sé»); sin feedback (modo examen) |
| GET | `/api/v1/diagnostics/{id}/report` | Informe por habilidades con cautelas |
| POST | `/api/v1/tutor/conversations` | Nueva conversación (opcional: `evaluation_id` para «explícame este error») |
| GET | `/api/v1/tutor/conversations/latest` · `/{id}` | Historial |
| POST | `/api/v1/tutor/conversations/{id}/messages` | Turno con Lania (idempotente, con cuota diaria) |
| GET | `/api/v1/admin/disputes` | Staff: disputas por estado |
| POST | `/api/v1/admin/disputes/{id}/resolve` | Staff: aceptar (revierte y recalcula) o rechazar; auditado |
| GET | `/api/v1/admin/ai-usage` | Staff: uso y costo de IA del mes |
| POST | `/api/v1/dev/session` | **Solo local**: login sin contraseña |
| GET/POST | `/api/v1/dev/clock` | **Solo local**: simular el paso de días |

Errores: `{error_code, message_es, retryable, request_id}` con códigos `AUTH_REQUIRED`, `AUTH_INVALID`, `NOT_FOUND`, `INVALID_EXERCISE`, `INVALID_INPUT`, `CONFLICT`, `FORBIDDEN`, `QUOTA_EXCEEDED`, `PROVIDER_UNAVAILABLE`, `AI_NOT_CONFIGURED`, `INTERNAL` (spec §7.3).
