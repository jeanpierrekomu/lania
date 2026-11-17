import { expect, test } from "@playwright/test";

import { signIn } from "./fixtures";

/** Primera visita: Lania muestra dónde está cada cosa; se puede saltar y volver a ver. */
test("recorrido guiado: aparece la primera vez, se salta con Esc y se repite desde «Ver recorrido»", async ({ page }) => {
  await signIn(page, "tour");

  const dialog = page.getByRole("dialog", { name: "¡Hola! Soy Lania" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Empezar recorrido" }).click();
  await expect(page.getByRole("dialog", { name: "Tu inicio" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: "Aula con Lania" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // No vuelve a abrirse solo…
  await page.reload();
  await expect(page.getByRole("heading", { name: "Hola" })).toBeVisible();
  await page.waitForTimeout(900);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // …pero se puede repetir.
  await page.getByRole("button", { name: "Ver recorrido" }).click();
  await expect(page.getByRole("dialog", { name: "¡Hola! Soy Lania" })).toBeVisible();
});
