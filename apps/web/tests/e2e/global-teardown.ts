import { execFileSync } from "node:child_process";
import path from "node:path";

/** Apaga y borra el Postgres temporal del E2E (Playwright mata la API sin esperar su limpieza). */
export default function globalTeardown() {
  const dir = process.env.MODO_E2E_PG_DIR;
  if (!dir) return;
  execFileSync(
    "uv",
    ["run", "--directory", path.resolve(__dirname, "../../../api"), "python", "-m", "app.db.local_cleanup", dir],
    { stdio: "inherit" },
  );
}
