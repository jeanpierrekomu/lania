import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";

export const metadata: Metadata = { title: "Cómo cuidamos tus datos" };

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

/** Aviso de privacidad del piloto (docs/security/privacy.md). Texto claro, sin letra pequeña. */
export default function PrivacyPage() {
  return (
    <main id="contenido" className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-10">
      <Link href="/" className="self-start">
        <BrandMark />
      </Link>
      <header>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Cómo cuidamos tus datos</h1>
        <p className="mt-3 text-lg text-ink-muted">
          LANIA está en piloto: un grupo pequeño de personas la prueba para ayudarnos a mejorarla. Esto es lo que
          guardamos, para qué y cómo puedes borrarlo.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-bold">Qué guardamos</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Tu correo, para que puedas entrar con un enlace (sin contraseña).</li>
          <li>El nombre o apodo que elijas, tu objetivo, tus intereses y tus preferencias.</li>
          <li>Tus respuestas, textos y conversaciones con Lania, y las correcciones que recibiste.</li>
          <li>Tu progreso: qué temas practicaste, qué dominas y cuándo toca repasar.</li>
        </ul>
        <p>
          No pedimos datos de salud, documentos de identidad ni datos de pago. Si grabas tu voz, el audio se transcribe y
          se borra; solo lo guardamos si tú lo autorizas.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-bold">Para qué los usamos</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Para enseñarte: corregirte, recordar tus errores y preparar tus repasos.</li>
          <li>Para mejorar LANIA durante el piloto, mirando el uso de forma agregada.</li>
        </ul>
        <p>No vendemos tus datos ni los usamos para publicidad.</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-bold">Quién más los procesa</h2>
        <p>Usamos servicios externos para que la app funcione:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Supabase</strong>: base de datos y acceso por correo.
          </li>
          <li>
            <strong>OpenAI</strong>: el modelo de IA que corrige tus textos y conversa contigo. Solo recibe el texto
            necesario para responderte, sin tu correo.
          </li>
          <li>
            <strong>Render y Vercel</strong>: los servidores donde corre la app.
          </li>
        </ul>
        <p>Estos servicios pueden estar fuera de tu país.</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-bold">Cuánto tiempo</h2>
        <p>
          Las conversaciones con Lania se borran solas a los 90 días. El resto se guarda mientras tengas tu cuenta. Si la
          borras, se elimina todo de inmediato.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-bold">Tus derechos</h2>
        <p>
          Desde <strong>Preferencias → Tus datos</strong> puedes descargar todo lo que guardamos de ti o borrar tu
          cuenta, cuando quieras y sin dar explicaciones. También puedes dejar el piloto en cualquier momento.
        </p>
        <p>
          {CONTACT ? (
            <>
              Para cualquier duda escríbenos a{" "}
              <a href={`mailto:${CONTACT}`} className="font-semibold text-primary underline underline-offset-4">
                {CONTACT}
              </a>
              .
            </>
          ) : (
            <>Para cualquier duda, usa el botón «¿Algo no funcionó?» dentro de la app.</>
          )}
        </p>
      </section>
    </main>
  );
}
