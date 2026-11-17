import { expect, test as base, type Page } from "@playwright/test";

import { E2E_API } from "./env";

/**
 * Igual que `test` de Playwright, pero marca el recorrido guiado como ya visto:
 * así no tapa la pantalla en las pruebas que no lo evalúan. El recorrido tiene su propia prueba.
 */
export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("lania.tour.v1", "done");
      } catch {
        /* sin almacenamiento */
      }
    });
    await provide(page);
  },
});

export { expect };

/**
 * Entra como invitado y completa la bienvenida por la API (objetivo + consentimiento del piloto),
 * para que las pruebas que no evalúan la bienvenida empiecen en el inicio. La bienvenida tiene su propia prueba.
 */
export async function signIn(page: Page, prefix: string, name = "E2E") {
  await page.goto("/");
  await page.evaluate(() => localStorage.removeItem("modo.session.v1"));
  void prefix; // cada invitado es una cuenta nueva
  await page.goto("/empezar");
  await page.waitForURL(/\/(onboarding|app)/);
  await page.evaluate(
    async ({ api, displayName }) => {
      const token = JSON.parse(localStorage.getItem("modo.session.v1") ?? "{}").accessToken;
      const res = await fetch(`${api}/api/v1/me/onboarding`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          goal: "entrevistas",
          self_level: "a2",
          interests: ["viajes"],
          session_minutes: 15,
          teacher_style: "divertida",
          pilot_consent: true,
        }),
      });
      if (!res.ok) throw new Error(`onboarding ${res.status}`);
    },
    { api: E2E_API, displayName: name },
  );
  await page.goto("/app");
}
