# Brief de implementación — Entrega 1

**Fecha:** 2 nov 2026 · **Fuente:** `MODO_English_Especificacion_Maestra_Claude.md` v1.0 · **Nombre:** provisional (ver «Pendientes»).

## Qué entrega esta etapa

Un *vertical slice* real y persistente del ciclo académico más pequeño:

`login → dashboard → microclase de presente simple → responder → corrección determinista justa → guardar attempt + evaluation + skill_evidence → actualizar dominio → programar y mostrar el próximo repaso → hacer el repaso con ítems distintos`.

## Decisiones fijas

| Tema | Decisión | ADR |
|---|---|---|
| Stack | Next.js (App Router) + TS + Tailwind + componentes estilo shadcn/ui · FastAPI + Pydantic v2 + SQLAlchemy 2 · PostgreSQL/Supabase | 001 |
| Migraciones | **Una sola fuente:** SQL en `supabase/migrations/`. Sin Alembic. | 001 |
| Seguridad de datos | RLS en todas las tablas; el cliente solo **lee** lo suyo; dominio, evidencias y notas solo las escribe el backend | 002 |
| Auth | Backend valida JWT con la misma lógica para Supabase (JWKS) y modo local (HS256). Login local solo con `APP_ENV=local` | 002 |
| IA | Interfaz `LLMProvider` + router por tarea. **La Entrega 1 no llama a ningún LLM**: lo cerrado se corrige de forma determinista | 003 |
| Corrección | Normalización + alternativas registradas + diagnósticos por regla + tolerancia a oración completa; veredictos diferenciados; apelación | 004 |
| Audio | No se retiene audio por defecto; bucket privado, URLs firmadas, TTL (implementación en Entrega 3) | 005 |
| Desarrollo local | Postgres 16 embebido (`pgserver`) + capa de compatibilidad Supabase, porque esta máquina no tiene Docker | 006 |

## Supuestos (prudentes, revisables)

- Piloto solo 18+, web responsiva (no PWA), sin pagos, tutor «fun» por defecto, sin guardar audio (sección 19 del spec).
- Los 16 ítems de presente simple son **originales**, escritos para el piloto y marcados `review_status: pilot` — **pendientes de revisión docente**.
- Los intervalos de repaso (1/3/7/14/30 días) son un punto de partida ajustable, no un intervalo «probado».

## Fuera de esta entrega (explícito)

Diagnóstico completo, tutor con LLM, writing abierto, voz/listening, preferencias editables en UI, salas, pagos, admin de contenido, exportar/borrar cuenta. Ver `docs/pending-checklist.md`.

## Riesgos principales

1. **Falsos negativos del corrector** → alternativas por ítem, diagnósticos por regla, botón «discutir corrección» y tests con casos tipo US02.
2. **Falsa precisión de nivel** → el estado de dominio exige evidencia sin ayuda en ≥2 días y un repaso; siempre se muestra la razón y la confianza.
3. **Deriva entre entorno local y Supabase** → la capa de compatibilidad replica roles, `auth.uid()` y los privilegios por defecto de Supabase; las mismas migraciones corren en ambos.
4. **Contenido sin revisión docente** → marcado como `pilot`; ningún reporte usa etiquetas MCER como certificación.
