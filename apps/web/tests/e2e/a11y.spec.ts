import AxeBuilder from "@axe-core/playwright";
import { expect, signIn, test } from "./fixtures";

/** Accesibilidad básica automatizada (WCAG 2.x A/AA) en las pantallas clave. No reemplaza pruebas con lector de pantalla. */
async function audit(page: import("@playwright/test").Page) {
  // Espera a que terminen las animaciones de entrada (si no, axe mide colores a medio aparecer).
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity),
  );
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.length}`);
}

test("landing, login, registro y privacidad sin violaciones WCAG detectables", async ({ page }) => {
  await page.goto("/");
  expect(await audit(page)).toEqual([]);
  await page.goto("/login");
  expect(await audit(page)).toEqual([]);
  await page.goto("/registro");
  expect(await audit(page)).toEqual([]);
  await page.goto("/privacidad");
  expect(await audit(page)).toEqual([]);
});

test("dashboard y ejercicio sin violaciones WCAG detectables", async ({ page }) => {
  await signIn(page, "a11y");
  await expect(page.getByRole("heading", { name: "Hola" })).toBeVisible();
  expect(await audit(page)).toEqual([]);
  // «Cerrar sesión» está a la vista y el menú no se sale de la pantalla, también en móvil (375 px).
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeInViewport({ ratio: 1 });
  const tabBar = page.getByRole("navigation", { name: "Navegación", exact: true });
  if (await tabBar.isVisible()) {
    for (const link of await tabBar.getByRole("link").all()) await expect(link).toBeInViewport({ ratio: 1 });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await page.goto("/learn/present-simple-basics");
  await page.getByRole("button", { name: "Empezar" }).click();
  await expect(page.getByRole("button", { name: "Comprobar" })).toBeVisible();
  expect(await audit(page)).toEqual([]);
});

test("diagnóstico, tutor y preferencias sin violaciones WCAG detectables", async ({ page }) => {
  await signIn(page, "a11y2");
  await expect(page.getByRole("heading", { name: "Hola" })).toBeVisible();
  for (const path of ["/diagnostic", "/tutor", "/preferences", "/app/aula"]) {
    await page.goto(path);
    await expect(page.locator("main h1").first()).toBeVisible();
    expect(await audit(page), path).toEqual([]);
  }
  await page.goto("/diagnostic");
  await page.getByRole("button", { name: "Empezar diagnóstico" }).click();
  await page.getByRole("button", { name: "Empezar bloque" }).click();
  await expect(page.getByRole("button", { name: "No lo sé" })).toBeVisible();
  expect(await audit(page), "pregunta de diagnóstico").toEqual([]);
});

test("labs, misiones, salones y progreso (datos reales) sin violaciones WCAG detectables", async ({ page }) => {
  await signIn(page, "a11y3");
  await expect(page.getByRole("heading", { name: "Hola" })).toBeVisible();
  for (const path of ["/app/speaking", "/app/listening", "/app/reading", "/app/writing", "/app/salones", "/app/misiones", "/app/progreso"]) {
    await page.goto(path);
    await expect(page.getByRole("note").filter({ hasText: "Vista previa" })).toHaveCount(0);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(await audit(page), path).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), path).toBeLessThanOrEqual(0);
  }
});
