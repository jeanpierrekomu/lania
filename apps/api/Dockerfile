# API de LANIA para entornos publicados. Construir desde la RAÍZ del repo:
#   docker build -f apps/api/Dockerfile .
# Necesita las migraciones (supabase/migrations) y el contenido (packages/content-seeds) del monorepo.
FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.5.11 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PROJECT_ENVIRONMENT=/opt/venv PATH="/opt/venv/bin:$PATH"

WORKDIR /repo/apps/api
COPY apps/api/pyproject.toml apps/api/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY apps/api/app ./app
COPY supabase/migrations /repo/supabase/migrations
COPY packages/content-seeds /repo/packages/content-seeds

RUN useradd --create-home lania
USER lania
EXPOSE 8000
# Migraciones + contenido (idempotente) y luego la API. Render asigna el puerto en $PORT.
CMD ["sh", "-c", "python -m app.db.deploy && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers"]
