# LANIA *(nombre temporal de MVP)*

*Tu profe de inglés con IA. Inglés a tu manera. Sin miedo a hablar.*

Academia de inglés con IA para hispanohablantes adultos: diagnostica habilidades reales, corrige con justicia, recuerda tus errores y te los devuelve en ejercicios nuevos cuando toca repasar.

**Estado: listo para piloto** — login por correo, bienvenida con consentimiento, diagnóstico, 3 microclases y repasos, tutora «Lania», Writing/Listening/Speaking Lab con voz, misiones y progreso con datos reales, privacidad (descargar/borrar) y guía de despliegue. Ver [pendientes](docs/pending-checklist.md) y [cómo publicar](docs/operations/deploy-piloto.md).

## Qué puedes probar hoy

La app principal (`apps/web`, <http://localhost:3000>) usa el **diseño LANIA**. Todas las secciones usan datos reales salvo **Salones**, que muestra «Próximamente» (base lista en la API, apagada con `ROOMS_ENABLED=false`).

- **Bienvenida** (`/onboarding`): objetivo, intereses, ritmo, estilo de Lania y consentimiento del piloto.
- **Writing Lab** (`/app/writing`), **Listening Lab** (`/app/listening`), **Speaking Lab** (`/app/speaking`, por voz o escribiendo), **Misiones** (`/app/misiones`) y **Mi progreso** (`/app/progreso`).

- **Inicio** (`/app`) y **Aula con Lania** (`/app/aula`): tu misión real del día.
- **Diagnóstico** (`/diagnostic`): gramática, vocabulario, lectura y escritura en modo examen, con pausa, «No lo sé» e informe por habilidad.
- **Clases** de presente simple, pasado con *did* y futuro con *will*: error → pista sin respuesta → reintento → repaso diferido con ejercicios distintos.
- **Lania** (`/tutor`): tutora con IA (dice que es una IA si le preguntan), botón para preguntarle por qué en cada error.
- **Ajustes** (`/preferences`): estilo de Lania (Divertida / Tranquila / Directa), nivel de humor, avatar visible u oculto, animaciones, cantidad de correcciones, español de apoyo y modo baja estimulación.
- **Revisión docente** (`/admin/qa`, rol docente): disputas de corrección y uso/costo de IA.

## IA en local (gratis, con modelos abiertos)

Instala [Ollama](https://ollama.com), descarga un modelo (`ollama pull gemma3:12b`) y crea `.env` en la raíz:

```dotenv
LLM_PROVIDER=openai_compatible
LLM_BASE_URL=http://localhost:11434/v1
LLM_FAST_MODEL=gemma3:12b
LLM_DEEP_MODEL=gemma3:12b
LLM_TIMEOUT_SECONDS=240
```

Mide la calidad del modelo antes de usarlo con alumnos: `cd apps/api && uv run python -m scripts.eval_ai` (informe en `docs/operations/`). Para darte rol docente en local: `cd apps/api && uv run python -m app.domain.admin.grant_role tu@correo.test teacher_reviewer`.

## Requisitos

- Node ≥ 22 y [pnpm](https://pnpm.io) · [uv](https://docs.astral.sh/uv/) (instala Python 3.12 solo) · **No necesitas Docker ni Supabase** para desarrollo local ([ADR-006](docs/architecture/ADR-006-local-dev-without-docker.md)).

## Arranque

```bash
make setup     # dependencias Python/JS + Chromium para E2E
make dev       # API en :8000 y web en :3000
```

Abre <http://localhost:3000>, entra con cualquier correo (modo local, sin contraseña) y sigue la misión. Al primer arranque la API crea un Postgres embebido en `~/.modo-english/pgdata`, aplica las migraciones de `supabase/migrations/` y siembra el contenido. En el dashboard verás una **herramienta de desarrollo** para adelantar el reloj y probar los repasos sin esperar días.

- Documentación interactiva de la API: <http://localhost:8000/docs>
- Empezar de cero: detén la API y borra la carpeta `~/.modo-english`.

## Calidad

```bash
make lint typecheck   # ruff + mypy (estricto) · eslint + tsc
make test             # pytest (unit, integración, RLS) + Vitest
make e2e              # Playwright: ciclo completo + accesibilidad (axe), con servidores y base temporales
make contracts        # regenera OpenAPI → tipos TypeScript
```

## Estructura

```text
apps/api/        FastAPI · motor pedagógico (corrector, dominio, repasos) · tests
apps/web/        Next.js 16 · páginas del alumno · componentes de aprendizaje · tests
apps/prototype/  Fuente del diseño (Vite, datos de demostración) · referencia visual · `pnpm dev:prototype`
packages/contracts/      OpenAPI generado + tipos TS (no se editan a mano)
packages/content-seeds/  habilidades, ítems y lecciones en YAML versionado
supabase/migrations/     esquema SQL con RLS (fuente única del esquema)
docs/            brief, ADRs, modelo de datos, contratos, rúbricas, privacidad, pendientes
```

## Principios que el código ya hace cumplir

- Una respuesta gramaticalmente válida no se marca como error por no coincidir con una cadena ([ADR-004](docs/architecture/ADR-004-correction-engine.md)).
- Nadie sube su propio nivel: el dominio solo lo escribe el backend a partir de evidencia ([ADR-002](docs/architecture/ADR-002-auth-rls.md)).
- «Dominada» exige evidencia sin ayuda en días distintos y repasos acertados ([rúbricas](docs/pedagogy/rubrics.md)).
- No afirmamos certificación ni equivalencia con MCER, TOEFL ni ICPNA.

## Despliegue (cuando haya usuarios externos)

1. Crear proyecto Supabase y aplicar migraciones con `supabase db push`.
2. API: `APP_ENV=staging`, `AUTH_MODE=supabase`, `SUPABASE_URL`, `DATABASE_URL` (la app se niega a arrancar con login local fuera de local). Sembrar contenido con `uv run python -m app.content.seed`.
3. Web: `NEXT_PUBLIC_API_BASE_URL` + adaptador de Supabase Auth (pendiente).
