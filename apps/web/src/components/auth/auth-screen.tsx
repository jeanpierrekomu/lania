"use client";

import { ArrowLeft, LogIn, MailCheck, RefreshCw, TriangleAlert, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { api, unwrap } from "@/lib/api/client";
import { saveSession, useSession } from "@/lib/auth/session";
import {
  getSupabase,
  googleEnabled,
  NoAccountError,
  sendMagicLink,
  signInWithGoogle,
  signInWithPassword,
  supabaseEnabled,
  type MagicLinkMode,
} from "@/lib/auth/supabase";
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
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const passwordMode = mode === "login" && supabaseEnabled && usePassword;
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

  async function google() {
    setPending(true);
    setError(null);
    try {
      await signInWithGoogle(); // la página se va a Google; al volver, /login recibe la sesión
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos abrir Google. Inténtalo de nuevo.");
      setPending(false);
    }
  }

  async function withPassword() {
    setPending(true);
    setError(null);
    try {
      await signInWithPassword(email.trim(), password); // al entrar, `session` cambia y se va a /app
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos entrar. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (passwordMode) void withPassword();
    else void send(email.trim());
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

              {googleEnabled && (
                <>
                  <Button type="button" size="lg" variant="secondary" className="mt-6" disabled={pending} onClick={() => void google()}>
                    <GoogleLogo /> Continuar con Google
                  </Button>
                  <p className="mt-2 text-center text-xs text-ink-muted">
                    Al continuar aceptas{" "}
                    <Link href="/privacidad" target="_blank" className="underline underline-offset-4">
                      cómo cuidamos tus datos
                    </Link>
                    .
                  </p>
                  <div className="mt-5 flex items-center gap-3 text-sm text-ink-muted" aria-hidden>
                    <span className="h-px flex-1 bg-border" /> o con tu correo <span className="h-px flex-1 bg-border" />
                  </div>
                </>
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
                {passwordMode && (
                  <div className="flex flex-col gap-1">
                    <label htmlFor="password" className="font-semibold">
                      Contraseña
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}
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
                  <Icon aria-hidden />{" "}
                  {pending ? "Un momento…" : passwordMode ? "Entrar" : supabaseEnabled ? "Enviarme el enlace" : copy.cta}
                </Button>
                {mode === "login" && supabaseEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setUsePassword((v) => !v);
                      setError(null);
                    }}
                    className="text-sm font-semibold text-primary underline underline-offset-4"
                  >
                    {usePassword ? "Mejor envíame un enlace al correo" : "Tengo contraseña"}
                  </button>
                )}
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

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
