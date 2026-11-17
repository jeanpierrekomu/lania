# ADR-002 — Autenticación, autorización y RLS

**Estado:** aceptado · 2026-11-02

## Decisión
1. **Toda tabla de `public` tiene RLS activado.** Se revocan los privilegios por defecto de Supabase (`anon`, `authenticated`) y se otorgan solo los mínimos:
   - Contenido (`skills`, `lessons`, `exercise_items`): `SELECT` para `authenticated`, solo publicado. En `exercise_items` el `SELECT` es **por columnas**: `answer_schema` (claves y distractores) no es legible desde el cliente.
   - Datos del alumno (`attempts`, `evaluations`, `skill_evidence`, `skill_mastery`, `review_schedule`, `evaluation_disputes`): solo `SELECT` de filas propias (`auth.uid() = user_id`). **Ningún** `INSERT/UPDATE/DELETE` desde el cliente: nadie puede subir su propio nivel.
   - `profiles`: `SELECT` propio y `UPDATE` solo de `display_name`, `locale`, `timezone` (grant por columna). `role` no es editable por el usuario.
   - `learning_preferences`: `SELECT/UPDATE` propio.
2. El backend escribe con la conexión de servicio y **decide el propietario por el `sub` del JWT**, nunca por un `user_id` del payload.
3. Validación de JWT en backend (firma, `exp`, `aud=authenticated`, `iss`):
   - Supabase: JWKS del proyecto (claves asimétricas) — `AUTH_MODE=supabase`.
   - Local: HS256 con `LOCAL_JWT_SECRET`, emitido por `POST /api/v1/dev/session` — `AUTH_MODE=local`. Este endpoint **no existe** si `APP_ENV != local`, y la app se niega a arrancar con `AUTH_MODE=local` fuera de local.
4. Entrega 1: la web lee todo a través de la API (en local no hay PostgREST). Las políticas RLS ya están listas para cuando la web lea directo con el SDK de Supabase.
5. Tests RLS en pytest contra Postgres real, cambiando a `ROLE authenticated` con claims simulados: A no ve filas de B, no puede insertar evidencia, no puede leer `answer_schema`, no puede cambiar su `role` ni su dominio.

## Pendiente
Login real con Supabase Auth en la web (adaptador ya separado en `src/lib/auth`), roles de staff y `supabase test db` (pgTAP) en CI cuando exista proyecto Supabase.
