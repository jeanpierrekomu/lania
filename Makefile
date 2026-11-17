# MODO English — comandos de desarrollo. Requiere: Node ≥22, pnpm, uv (ver README).
.PHONY: setup dev dev-api dev-web test test-api test-web e2e lint typecheck contracts check

setup:            ## Instala dependencias (Python 3.12 vía uv, paquetes JS, navegador de Playwright)
	cd apps/api && uv sync
	pnpm install
	pnpm --filter @modo/web exec playwright install chromium

dev:              ## API (:8000) + web (:3000). Postgres local embebido, migraciones y seed automáticos.
	$(MAKE) -j2 dev-api dev-web

dev-api:
	cd apps/api && uv run uvicorn app.main:app --reload --port 8000

dev-web:
	pnpm --filter @modo/web dev

contracts:        ## Regenera OpenAPI + tipos TS desde la API
	cd apps/api && uv run python -m scripts.export_openapi
	pnpm contracts

lint:
	cd apps/api && uv run ruff check . && uv run ruff format --check .
	pnpm --filter @modo/web lint

typecheck:
	cd apps/api && uv run mypy app
	pnpm --filter @modo/web typecheck

test-api:         ## pytest: unitarios + integración + RLS (Postgres temporal)
	cd apps/api && uv run pytest

test-web:         ## Vitest + Testing Library
	pnpm --filter @modo/web test

test: test-api test-web

e2e:              ## Playwright: ciclo completo + accesibilidad (servidores y base temporales propios)
	pnpm --filter @modo/web e2e

check: lint typecheck test e2e   ## Todo lo que corre en CI
