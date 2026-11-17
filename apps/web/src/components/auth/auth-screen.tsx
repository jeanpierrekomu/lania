"use client";

import { ArrowLeft, LogIn, MailCheck, RefreshCw, TriangleAlert, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { api, unwrap } from "@/lib/api/client";
import { saveSession, useSession } from "@/lib/auth/session";
import { getSupabase, NoAccountError, sendMagicLink, supabaseEnabled, type MagicLinkMode } from "@/lib/auth/supabase";
import { Lania } from "@/ui/components/illustrations/Lania";

const RESEND_SECONDS = 60;

const COPY: Record<MagicLinkMode, { title: string; lead: string; cta: string; icon: typeof LogIn }> = {
  login: {
    title: "Iniciar sesión",
    lead: "Qué bueno verte de nuevo. Escribe tu correo y te enviamos un enlace para entrar.",
    cta: "Iniciar sesión",
    icon: LogIn,
  },
  signup: {
    title: "Crear cuenta",
    lead: "Es gratis y no necesitas contraseña: te enviamos un enlace a tu correo para entrar.",
    cta: "Crear mi cuenta",
    icon: UserPlus,
  },
};

const inputClass = "min-h-12 rounded-2xl border-2 border-border bg-surface px-4 focus:border-primary";

/**
 * Acceso a LANIA con enlace mágico (Supabase) o, en desarrollo local, con el acceso de prueba.
 * Pantallas: formulario → «Revisa tu correo» (con reenvío) · «El enlace ya no sirve» si vuelve con error.
 */
export function AuthScreen({ mode }: { mode: MagicLinkMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noAccount, setNoAccount] = useState(false);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const timer = useRef<number | null>(null);
  // Supabase devuelve ?error_description=… cuando el enlace venció o ya se usó.
  const linkError = params.get("error_description") ?? params.get("error");
  const copy = COPY[mode];

  useEffect(() => {
    getSupabase(); // al volver desde el correo, lee la sesión de la URL
  }, []);
  useEffect(() => {
    if (session) router.replace("/app");
  }, [session, router]);
  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  function startCooldown() {
    setWait(RESEND_SECONDS);
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setWait((w) => {
        if (w <= 1 && timer.current) window.clearInterval(timer.current);
        return Math.max(0, w - 1);
      });
    }, 1000);
  }

  async function send(target: string) {
    setPending(true);
    setError(null);
    setNoAccount(false);
    try {
      if (supabaseEnabled) {
        await sendMagicLink(target, mode === "signup" ? name.trim() || null : null, mode);
        setSentTo(target);
        startCooldown();
        return;
      }
      const res = await unwrap(
        api.POST("/api/v1/dev/session", { body: { email: target, display_name: name.trim() || null } }),
      );
      saveSession({
        accessToken: res.access_token,
        expiresAt: Date.now() + res.expires_in * 1000,
        displayName: res.user.display_name,
      });
      router.replace("/app");
    } catch (err) {
      if (err instanceof NoAccountError) setNoAccount(true);
      else setError(err instanceof Error ? err.message : "No pudimos continuar. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(email.trim());
  }

  const Icon = copy.icon;

  return (
    <main id="contenido" className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-violet-100 p-10 lg:flex" aria-hidden>
        <BrandMark className="h-9 self-start" />
        <div className="relative mx-auto w-full max-w-md">
          <p className="mb-6 rounded-3xl rounded-bl-lg bg-surface p-5 text-lg font-semibold text-ink shadow-raised">
            {mode === "signup"
              ? "¡Hola! Soy Lania. En dos minutos armamos tu plan para hablar inglés sin miedo."
              : "¡Volviste! Sigamos donde lo dejamos."}
          </p>
          <Lania expression={mode === "signup" ? "welcome" : "celebrating"} className="w-full" />
        </div>
      </aside>

      <section className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:invisible" aria-label="LANIA, inicio">
            <BrandMark />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden /> Volver al inicio
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {linkError && !sentTo ? (
            <div className="flex flex-col gap-4" role="alert">
              <span className="grid size-14 place-items-center rounded-2xl bg-warning-soft text-ink">
                <TriangleAlert aria-hidden />
              </span>
              <h1 className="font-display text-3xl font-extrabold tracking-tight">Este enlace ya no sirve</h1>
              <p className="text-ink-muted">
                Los enlaces vencen después de un rato y solo se pueden usar una vez. No pasa nada: pide uno nuevo.
              </p>
              <Button type="button" size="lg" onClick={() => router.replace(mode === "signup" ? "/registro" : "/login")}>
                <RefreshCw aria-hidden /> Pedir un enlace nuevo
              </Button>
            </div>
          ) : sentTo ? (
            <div className="flex flex-col gap-4" role="status">
              <span className="grid size-14 place-items-center rounded-2xl bg-success-soft text-success">
                <MailCheck aria-hidden />
              </span>
              <h1 className="font-display text-3xl font-extrabold tracking-tight">Revisa tu correo</h1>
              <p>
                Te enviamos un enlace a <strong>{sentTo}</strong>.{" "}
                {mode === "signup" ? "Ábrelo y tu cuenta quedará creada." : "Ábrelo para entrar."}
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
                <li>Ábrelo en este mismo dispositivo y navegador.</li>
                <li>Si no llega en 2 minutos, revisa spam o promociones.</li>
                <li>El enlace vence en 1 hora y sirve una sola vez.</li>
              </ul>
              {error && (
                <p role="alert" className="rounded-xl bg-error-soft p-3 text-error">
                  {error}
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="secondary" disabled={wait > 0 || pending} onClick={() => void send(sentTo)}>
                  <RefreshCw aria-hidden /> {wait > 0 ? `Reenviar en ${wait} s` : pending ? "Enviando…" : "Reenviar enlace"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setSentTo(null)}>
                  Usar otro correo
                </Button>
              </div>
            </div>
          ) : (
            <>
              <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Icon aria-hidden />
              </span>
              <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight">{copy.title}</h1>
              <p className="mt-2 text-ink-muted">{copy.lead}</p>

              {!supabaseEnabled && (
                <p className="mt-5 rounded-2xl bg-warning-soft p-3 text-sm">
                  <strong>Modo desarrollo local.</strong> Este acceso sin enlace solo existe en tu computadora; en la web
                  publicada llega un enlace al correo.
                </p>
              )}

              <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
                {mode === "signup" && (
                  <div className="flex flex-col gap-1">
                    <label htmlFor="name" className="font-semibold">
                      ¿Cómo quieres que te llamemos?
                    </label>
                    <input
                      id="name"
                      required
                      maxLength={60}
                      autoComplete="given-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="font-semibold">
                    Correo
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
                {mode === "signup" && (
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      required
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                      className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
                    />
                    <span>
                      Leí{" "}
                      <Link href="/privacidad" target="_blank" className="font-semibold text-primary underline underline-offset-4">
                        cómo cuidan mis datos
                      </Link>{" "}
                      y quiero crear mi cuenta.
                    </span>
                  </label>
                )}
                {noAccount && (
                  <div role="alert" className="rounded-2xl bg-warning-soft p-4 text-sm">
                    <p className="font-semibold">No encontramos una cuenta con ese correo.</p>
                    <p className="mt-1">
                      ¿Es tu primera vez?{" "}
                      <Link href="/registro" className="font-semibold text-primary underline underline-offset-4">
                        Crea tu cuenta gratis
                      </Link>
                      .
                    </p>
                  </div>
                )}
                {error && (
                  <p role="alert" className="rounded-xl bg-error-soft p-3 text-error">
                    {error}
                  </p>
                )}
                <Button type="submit" size="lg" disabled={pending || (mode === "signup" && !accepted)}>
                  <Icon aria-hidden /> {pending ? "Un momento…" : supabaseEnabled ? "Enviarme el enlace" : copy.cta}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-ink-muted">
                {mode === "signup" ? "¿Ya tienes cuenta? " : "¿Todavía no tienes cuenta? "}
                <Link
                  href={mode === "signup" ? "/login" : "/registro"}
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  {mode === "signup" ? "Inicia sesión" : "Crea una gratis"}
                </Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
