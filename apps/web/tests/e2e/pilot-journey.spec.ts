import { expect, signIn, test } from "./fixtures";

test.setTimeout(180_000);

test("bienvenida con consentimiento del piloto antes de entrar a la app", async ({ page }) => {
  // Desde la landing: «Crear cuenta» → registro → bienvenida.
  await page.goto("/");
  await page.getByRole("link", { name: "Crear cuenta", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Crear cuenta" })).toBeVisible();
  await page.getByLabel(/llamemos/).fill("Piloto");
  await page.getByLabel("Correo").fill(`welcome-${Date.now()}@example.test`);
  const create = page.getByRole("button", { name: "Crear mi cuenta" });
  await expect(create).toBeDisabled(); // sin aceptar el aviso de privacidad no se crea
  await page.getByRole("checkbox").check();
  await create.click();
  await page.waitForURL(/\/onboarding/);

  await expect(page.getByLabel("¿Cómo quieres que te llame?")).toHaveValue("Piloto"); // viene del registro
  await page.getByRole("button", { name: "Empezar" }).click();
  await page.getByRole("radio", { name: /Entrevistas y trabajo/ }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("radio", { name: /Entiendo lo básico/ }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Viajes" }).click();
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Continuar" }).click();

  const explore = page.getByRole("button", { name: "Explorar primero" });
  await expect(explore).toBeDisabled(); // sin consentimiento no se continúa
  await page.getByRole("checkbox").check();
  await explore.click();
  await page.waitForURL(/\/app$/);

  await page.goto("/app/progreso");
  await expect(page.getByRole("heading", { name: "Piloto", level: 1 })).toBeVisible();
  await expect(page.getByText("Entrevistas y trabajo")).toBeVisible();
});

test("Writing, Listening, Speaking, Misiones y comentarios con datos reales", async ({ page }) => {
  await signIn(page, "labs", "Labs");

  // Writing Lab: el texto se corrige en el servidor (proveedor guionado en E2E).
  await page.goto("/app/writing");
  await page.getByLabel("Editor de texto").fill("Hello, my name is Ana and I study engineering. I like travel and music very much.");
  await page.getByRole("button", { name: "Enviar a Lania" }).click();
  await expect(page.getByText("Lo que hiciste bien:")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Tus textos/ })).toBeVisible();

  // Listening Lab: la respuesta se comprueba en el servidor.
  await page.goto("/app/listening?episodio=cafe-order");
  await page.getByRole("radio", { name: /A small coffee with milk/ }).click();
  await page.getByRole("button", { name: "Comprobar" }).first().click();
  await expect(page.getByText("¡Bien escuchado!")).toBeVisible();

  // Reading Lab: glosario y pregunta corregida en el servidor.
  await page.goto("/app/reading?texto=new-neighbor");
  await page.getByRole("button", { name: "nurse: ver significado" }).click();
  await expect(page.getByText("enfermera / enfermero")).toBeVisible();
  await page.getByRole("radio", { name: /Canada/ }).click();
  await page.getByRole("button", { name: "Comprobar" }).first().click();
  await expect(page.getByText("¡Bien leído!")).toBeVisible();

  // Speaking Lab: un turno escrito avanza a la siguiente pregunta.
  await page.goto("/app/speaking?tema=hotel-checkin");
  await page.getByRole("button", { name: "Empezar conversación" }).click();
  await expect(page.getByText("Pregunta 1 de 4")).toBeVisible();
  const skip = page.getByRole("button", { name: "Detener la voz de Lania" });
  if (await skip.isVisible()) await skip.click();
  await page.getByRole("button", { name: "Escribir en lugar de hablar" }).click();
  await page.getByLabel("Escribe tu respuesta en inglés").fill("Yes, I have a reservation under the name Ana.");
  await page.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByText("Pregunta 2 de 4")).toBeVisible();

  // Misiones y progreso reflejan lo que se hizo.
  await page.goto("/app/misiones");
  await expect(page.getByRole("heading", { name: "Practica situaciones reales" })).toBeVisible();
  await page.goto("/app/progreso");
  await expect(page.getByText("1 día seguido")).toBeVisible();

  // Salones: honestos, sin salas inventadas.
  await page.goto("/app/salones");
  await expect(page.getByText("Conversar en grupo llega pronto")).toBeVisible();

  // «¿Algo no funcionó?»
  await page.getByRole("button", { name: "¿Algo no funcionó?" }).click();
  await page.getByLabel("Cuéntanos con tus palabras").fill("Prueba de comentario desde E2E");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page.getByText("¡Gracias!")).toBeVisible();
});

test("iniciar sesión y crear cuenta se enlazan entre sí y el enlace vencido explica qué hacer", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  await page.getByRole("link", { name: "Crea una gratis" }).click();
  await expect(page.getByRole("heading", { name: "Crear cuenta" })).toBeVisible();
  await page.getByRole("link", { name: "Inicia sesión" }).click();
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  await page.goto("/login?error=access_denied&error_description=Email+link+is+invalid+or+has+expired");
  await expect(page.getByRole("heading", { name: "Este enlace ya no sirve" })).toBeVisible();
});
