import type { Page } from "@playwright/test";

import { expect, signIn, test } from "./fixtures";

import { E2E_API } from "./env";
import { answerKey, CORRECT_OPTIONS } from "./answers";

const KEY = answerKey();

// Restablece el reloj simulado aunque el test falle a mitad de camino.
test.afterEach(async ({ request }) => {
  await request.post(`${E2E_API}/api/v1/dev/clock`, { data: { reset: true } });
});

async function answerCurrent(page: Page) {
  const question = page.locator("legend");
  if (await question.count()) {
    const q = (await question.innerText()).trim();
    const labels = await page.getByRole("radio").evaluateAll((els) =>
      els.map((el) => (el.closest("label")?.textContent ?? "").trim()),
    );
    const right = labels.find((l) => CORRECT_OPTIONS.has(`${q}||${l}`));
    await page.getByRole("radio", { name: right!, exact: true }).check();
  } else {
    const sentence = await page.locator("p[lang=en]").first().innerText();
    const tail = [...KEY.keys()].filter((k) => k && sentence.includes(k)).sort((x, y) => y.length - x.length)[0];
    expect(tail, `sin clave para: ${sentence}`).toBeDefined();
    const entry = KEY.get(tail!);
    await page.getByLabel("Tu respuesta").fill(entry!.text!);
  }
  await page.getByRole("button", { name: "Comprobar" }).click();
}

test("ciclo completo: login → clase → error → reintento → resumen → repaso diferido", async ({ page, request }) => {
  await request.post(`${E2E_API}/api/v1/dev/clock`, { data: { reset: true } });

  // Login (modo local) → dashboard con misión explicable
  await signIn(page, "e2e", "E2E");
  await expect(page.getByRole("heading", { name: "Hola, E2E" })).toBeVisible();
  await expect(page.getByText("Por qué:")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ir al diagnóstico" })).toBeVisible(); // alumno nuevo: primero conocerlo

  // Clase: calentamiento con error → feedback específico → reintento
  await page.goto("/learn/present-simple-basics");
  await page.getByRole("button", { name: "Empezar" }).click();
  await page.getByRole("radio", { name: "She is work in marketing." }).check();
  await page.getByRole("button", { name: "Comprobar" }).click();
  await expect(page.getByRole("heading", { name: "Todavía no" })).toBeVisible();
  await expect(page.getByText(/Volveremos a practicar esta habilidad/)).toBeVisible();
  await page.getByRole("button", { name: "Intentar de nuevo" }).click();
  await page.getByRole("radio", { name: "She works in marketing." }).check();
  await page.getByRole("button", { name: "Comprobar" }).click();
  await expect(page.getByRole("heading", { name: "¡Correcto!" })).toBeVisible();
  await page.getByRole("button", { name: "Siguiente" }).click();

  // Explicación mínima después del calentamiento
  await expect(page.getByText("Explicación mínima")).toBeVisible();
  await page.getByRole("button", { name: "Ir a la práctica" }).click();

  // Error típico + reintento escribiendo la oración completa
  await page.getByLabel("Tu respuesta").fill("work");
  await page.getByRole("button", { name: "Comprobar" }).click();
  await expect(page.getByText(/Pista para tu segundo intento/)).toBeVisible(); // pista sin revelar la respuesta
  await page.getByRole("button", { name: "Intentar de nuevo" }).click();
  await page.getByLabel("Tu respuesta").fill("My sister works at a design studio.");
  await page.getByRole("button", { name: "Comprobar" }).click();
  await expect(page.getByRole("heading", { name: "¡Correcto!" })).toBeVisible();

  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: /Siguiente|Ver resumen/ }).click();
    await answerCurrent(page);
    await expect(page.getByRole("heading", { name: /Correcto/ })).toBeVisible();
  }
  await page.getByRole("button", { name: "Ver resumen" }).click();
  await expect(page.getByText("4 de 6 al primer intento")).toBeVisible();
  await expect(page.getByText("Próximo repaso: mañana")).toBeVisible();

  // Pasa un día (reloj del servidor de pruebas) → toca repasar con ejercicios distintos
  await request.post(`${E2E_API}/api/v1/dev/clock`, { data: { advance_days: 1 } });
  await page.getByRole("link", { name: "Volver al inicio" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.reload();
  await expect(page.getByText("Toca repasar").first()).toBeVisible();
  await page.getByRole("link", { name: "Empezar repaso" }).click();
  await expect(page.getByRole("heading", { name: "Revancha" })).toBeVisible();
  // Next conserva ocultas las páginas anteriores: solo cuenta lo visible.
  await expect(page.getByText("My sister").filter({ visible: true })).toHaveCount(0);

  for (let i = 0; i < 3; i++) {
    if (i > 0) await page.getByRole("button", { name: "Siguiente" }).click();
    await answerCurrent(page);
    await expect(page.getByRole("heading", { name: /Correcto/ })).toBeVisible();
  }
  await page.getByRole("button", { name: "Ver resumen" }).click();
  await expect(page.getByText("3 de 3 al primer intento")).toBeVisible();
  await expect(page.getByText("Próximo repaso: en 3 días")).toBeVisible();
  // Un solo repaso no basta para «dominada»
  await expect(page.getByText("En progreso")).toBeVisible();

  await request.post(`${E2E_API}/api/v1/dev/clock`, { data: { reset: true } });
});
