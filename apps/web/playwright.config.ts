import os from "node:os";
import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

import { API_PORT, WEB_PORT } from "./tests/e2e/env";

/**
 * E2E aislado: API en :8100 con Postgres embebido TEMPORAL (se borra al terminar) y web en :3100.
 * No toca tu base local ni tus servidores de desarrollo. Sin credenciales reales.
 */
const pgDir = (process.env.MODO_E2E_PG_DIR ??= path.join(os.tmpdir(), `modo-e2e-${Date.now()}`));

export default defineConfig({
  testDir: "./tests/e2e",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
    locale: "es-PE",
    timezoneId: "America/Lima",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /a11y/ },
  ],
  webServer: [
    {
      command: `uv run --directory ../api uvicorn app.main:app --port ${API_PORT}`,
      url: `http://localhost:${API_PORT}/api/v1/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        APP_ENV: "test",
        AUTH_MODE: "local",
        DATABASE_URL: "",
        LOCAL_PG_DIR: pgDir,
        LOCAL_PG_CLEANUP: "delete",
        LLM_PROVIDER: "fake", // proveedor guionado: E2E sin red ni costos (solo APP_ENV=test)
        CORS_ORIGINS: JSON.stringify([`http://localhost:${WEB_PORT}`]),
      },
    },
    {
      command: `pnpm exec next build && pnpm exec next start --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 240_000,
      env: { NEXT_PUBLIC_API_BASE_URL: `http://localhost:${API_PORT}` },
    },
  ],
});

