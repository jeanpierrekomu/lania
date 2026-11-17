import { expect, signIn, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await signIn(page, "tutor");
  await expect(page.getByRole("heading", { name: "Hola" })).toBeVisible();
});

test("Lania responde, se declara IA y explica un error desde la clase", async ({ page }) => {
  await page.getByRole("link", { name: "Conversar con Lania" }).click();
  await expect(page.getByText("Tutora con IA, no una persona")).toBeVisible();
  await page.getByLabel("Mensaje para Lania").fill("How do I say: ella trabaja en marketing?");
  await page.keyboard.press("Enter");
  await expect(page.getByText(/she works/).first()).toBeVisible();
  await expect(page.getByText(/Te quedan \d+ mensajes hoy/)).toBeVisible();

  // Desde un error en la clase: «Pregúntale a Lania por qué» abre una conversación con ese contexto
  await page.goto("/learn/present-simple-basics");
  await page.getByRole("button", { name: "Empezar" }).click();
  await page.getByRole("radio", { name: "She work in marketing." }).check();
  await page.getByRole("button", { name: "Comprobar" }).click();
  await page.getByRole("link", { name: /Pregúntale a Lania por qué/ }).click();
  await expect(page.getByText("Conversando sobre:")).toBeVisible();
});

test("preferencias se guardan y el modo baja estimulación se aplica", async ({ page }) => {
  await page.getByRole("link", { name: "Ajustes de Lania" }).click();
  await page.getByRole("radio", { name: /^Tranquila/ }).check();
  await page.getByRole("radio", { name: /^Sin humor/ }).check();
  await page.getByRole("radio", { name: /^Ocultar/ }).check();
  await page.getByRole("radio", { name: /^Reducir/ }).check();
  await page.getByRole("radio", { name: /^Activado/ }).check();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Guardado")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-low-stim", "");
  await expect(page.locator("html")).toHaveAttribute("data-reduce-motion", "");
  await page.reload();
  await expect(page.getByRole("radio", { name: /^Tranquila/ })).toBeChecked();
  await expect(page.getByRole("radio", { name: /^Sin humor/ })).toBeChecked();
  // Avatar oculto: el inicio ya no muestra la imagen de Lania
  await page.getByRole("link", { name: "Inicio", exact: true }).click();
  await expect(page.getByRole("img", { name: /Lania, tutora con IA/ })).toHaveCount(0);
});
