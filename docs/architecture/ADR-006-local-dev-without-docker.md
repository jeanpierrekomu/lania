# ADR-006 — Desarrollo local sin Docker

**Estado:** aceptado · 2026-11-02

## Contexto
La máquina del fundador no tiene Docker ni Supabase CLI, y el spec exige poder levantar todo en local con migraciones reales.

## Decisión
- En `APP_ENV=local` sin `DATABASE_URL`, la API arranca un **PostgreSQL 16 embebido** (`pgserver`, binarios oficiales empaquetados en pip) en `~/.modo-english/pgdata`. Ruta corta a propósito: los sockets Unix tienen límite de longitud y la carpeta del proyecto contiene espacios.
- Antes de las migraciones se aplica `supabase/local/00_supabase_compat.sql`: roles `anon`/`authenticated`/`service_role`, esquema `auth` con `auth.users` y `auth.uid()`, y **los mismos privilegios por defecto que Supabase** (para que los `revoke` de nuestras migraciones se prueben de verdad).
- Las migraciones de `supabase/migrations/` se aplican igual que en Supabase y se registran en `supabase_migrations.schema_migrations`.
- Los tests crean un Postgres temporal propio y lo destruyen al terminar.

## Consecuencias
- Con Docker + Supabase CLI se puede usar `supabase start` y apuntar `DATABASE_URL` allí; nada del código cambia.
- La capa de compatibilidad **no** es Supabase Auth: el login local es solo para desarrollo (ADR-002).
