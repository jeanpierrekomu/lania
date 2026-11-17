# Modelo de datos (v1 Entrega 1 + v2 Entrega 2)

Fuente única: [`supabase/migrations/20261102000100_core_learning_schema.sql`](../../supabase/migrations/20261102000100_core_learning_schema.sql). Todas las tablas tienen RLS (ADR-002) y un test que lo verifica.

| Tabla | Para qué | Cliente puede | Escribe |
|---|---|---|---|
| `profiles` | Perfil mínimo (sin email ni datos sensibles) | leer propio; editar `display_name`, `locale`, `timezone` | trigger al registrarse |
| `learning_preferences` | Estilo de Lania, humor (0–5), avatar, animaciones, feedback, duración, baja estimulación | leer/editar propio | trigger + usuario |
| `skills` | Catálogo de habilidades (spec §2.3) | leer | seed |
| `exercise_items` | Banco de ítems; `prompt` público, `answer_schema` **privado** | leer publicados, sin `answer_schema` | seed |
| `lessons`, `lesson_items` | Microclases y su secuencia | leer publicadas | seed |
| `attempts` | Respuesta original **inmutable** + idempotencia (`client_submission_id`) | leer propios | backend |
| `evaluations` | Veredicto, regla aplicada, versión de rúbrica y corrector | leer propias | backend |
| `evaluation_disputes` | «Esta corrección no es justa» | leer propias | backend |
| `skill_evidence` | Una evidencia por intento (contexto, pistas, dificultad, resultado) | leer propia | backend |
| `skill_mastery` | Estado de dominio + razón legible + versión del algoritmo | leer propio | backend |
| `review_schedule` | Repasos por habilidad (pendiente/completado/reemplazado) con historial | leer propios | backend |
| `diagnostic_runs` / `diagnostic_run_items` / `diagnostic_sections` | Diagnóstico por bloques, orden y estado de cada pregunta, banda por habilidad | leer propios | backend |
| `ai_requests` | Cada llamada a IA: tarea, modelo, versión de prompt, tokens, latencia, costo (o NULL), estado | — | backend |
| `tutor_conversations` / `tutor_messages` | Tutora Lania; retención 90 días (`expires_at`); idempotencia por `client_message_id` | leer propios | backend |
| `audit_events` | Acciones de staff (p. ej. resolver disputas) sin PII | — | backend |

v2 añade a `exercise_items.pool` (práctica / diagnóstico) y el tipo `open_response`; a `evaluations` los campos de IA y `retry_hint_es`; a `evaluation_disputes` revisor y nota.

Pendiente para entregas siguientes (spec §6.1): `audio_assets`, salas, suscripciones y un job que borre conversaciones vencidas.
