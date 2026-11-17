import type { Page } from "@playwright/test";

import { expect, signIn, test } from "./fixtures";

import { answerKey, CORRECT_OPTIONS } from "./answers";

const KEY = answerKey();
const SAMPLE =
  "Every weekday I wake up at seven and drink coffee. Then I go to the university by bus. In the afternoon I work " +
  "in a small design studio and at night I study English for one hour.";

async function progressText(page: Page) {
  // Durante la transición al informe el contador desaparece: no esperar indefinidamente.
  return (await page.getByText(/\d+ de \d+ respondidas/).textContent({ timeout: 1000 }).catch(() => "")) ?? "";
}

async function answerDiagnosticItem(page: Page) {
  const before = await progressText(page);
  const textarea = page.getByLabel("Tu texto");
  if (await textarea.isVisible()) {
    await textarea.fill(SAMPLE);
  } else if (await page.locator("legend").count()) {
    const q = (await page.locator("legend").innerText()).trim();
    const labels = await page.getByRole("radio").evaluateAll((els) =>
      els.map((el) => (el.closest("label")?.textContent ?? "").trim()),
    );
    const right = labels.find((l) => CORRECT_OPTIONS.has(`${q}||${l}`));
    await page.getByRole("radio", { name: right!, exact: true }).check();
  } else {
    const sentence = await page.locator("p[lang=en]").first().innerText();
    const tail = [...KEY.keys()].filter((k) => k && sentence.includes(k)).sort((x, y) => y.length - x.length)[0];
    await page.getByLabel("Tu respuesta").fill(KEY.get(tail)!.text!);
  }
  await page.getByRole("button", { name: "Siguiente" }).click();
  // Esperar a la siguiente pregunta (o al informe) antes de leerla: evita carreras con la anterior.
  await expect(async () => {
    const done = page.url().includes("/results/") || (await page.getByRole("button", { name: "Empezar bloque" }).isVisible());
    expect(done || (await progressText(page)) !== before).toBe(true);
  }).toPass({ timeout: 15_000 });
}

test.setTimeout(240_000);

test("diagnóstico por bloques: pausa y retoma, modo examen, informe con escritura evaluada", async ({ page }) => {
  await signIn(page, "diag");
  await page.getByRole("link", { name: "Ir al diagnóstico" }).click();
  await page.getByRole("button", { name: "Empezar diagnóstico" }).click();
  await page.getByRole("button", { name: "Empezar bloque" }).click();

  // Modo examen: sin pistas; «No lo sé» disponible
  await expect(page.getByText(/pista/i)).toHaveCount(0);
  await page.getByRole("button", { name: "No lo sé" }).click();
  await expect(page.getByText("1 de 27 respondidas")).toBeVisible();

  // Pausar y retomar exactamente donde quedó
  await page.getByRole("link", { name: "Pausar" }).click();
  await expect(page.getByRole("link", { name: "Ir al diagnóstico" })).toBeVisible();
  await expect(page.getByText("Continúa tu diagnóstico")).toBeVisible();
  await page.getByRole("link", { name: "Ir al diagnóstico" }).click();
  await expect(page.getByText("1 de 27 respondidas")).toBeVisible();

  for (let i = 0; i < 40 && !page.url().includes("/results/"); i++) {
    const startBlock = page.getByRole("button", { name: "Empezar bloque" });
    if (await startBlock.isVisible()) await startBlock.click();
    await answerDiagnosticItem(page);
  }

  await expect(page).toHaveURL(/\/diagnostic\/results\//);
  await expect(page.getByRole("heading", { name: "Así está tu inglés hoy" })).toBeVisible();
  await expect(page.getByText("Lo que ya haces")).toBeVisible();
  await expect(page.getByText(/no es un nivel MCER certificado/)).toBeVisible();
  // La escritura se evalúa en segundo plano y la página se actualiza sola
  await expect(page.getByText("Precisión: 2/3").first()).toBeVisible();
  await expect(page.getByText(/ingles|inglés/).first()).toBeVisible();
});
