# ADR-001 — Stack y estructura del monorepo

**Estado:** aceptado · 2026-11-02

## Contexto
El spec (§4) define Next.js + FastAPI + Supabase y pide no mezclar estrategias de migración.

## Decisión
- `apps/web`: Next.js App Router, TypeScript estricto, Tailwind CSS v4, componentes estilo shadcn/ui (código propio en `src/components/ui`), Lucide, TanStack Query para datos remotos. Sin Zustand: no hay estado cliente compartido que lo justifique.
- `apps/api`: Python 3.12, FastAPI, Pydantic v2, **SQLAlchemy 2 (ORM tipado)**, psycopg 3. Endpoints síncronos (pool de hilos de FastAPI): más simple y suficiente para el piloto.
- **Migraciones:** SQL en `supabase/migrations/` es la única fuente de verdad del esquema. El ORM solo *mapea* tablas existentes; un test (`test_orm_matches_db`) falla si el ORM y la base divergen. No se usa Alembic.
- **Contratos:** FastAPI genera `packages/contracts/openapi.json`; `openapi-typescript` genera los tipos TS que consume `openapi-fetch` en la web. Nadie escribe tipos de API a mano en dos lados.
- **Contenido:** ítems y lecciones en YAML versionado (`packages/content-seeds/`), cargados a la base con un seed idempotente.
- Herramientas: pnpm (JS), uv (Python), ruff + mypy, ESLint + tsc, pytest, Vitest + Testing Library, Playwright.

## Consecuencias
- Cambiar el esquema = nueva migración SQL + ajustar el mapeo ORM (el test de deriva lo exige).
- La web nunca importa Python; habla con la API por HTTP/JSON tipado.
