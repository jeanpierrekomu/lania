"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { LaniaMascot } from "@/components/mascot/lania-mascot";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, unwrap } from "@/lib/api/client";
import { saveSession, useSession } from "@/lib/auth/session";
import { getSupabase, sendMagicLink, supabaseEnabled } from "@/lib/auth/supabase";

export default function LoginPage() {
  const router = useRouter();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Al volver desde el enlace del correo, Supabase lee la sesión de la URL.
  useEffect(() => {
    getSupabase();
  }, []);

  useEffect(() => {
    if (session) router.replace("/app");
  }, [session, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (supabaseEnabled) {
        await sendMagicLink(email, name.trim() || null);
        setSentTo(email);
        setPending(false);
        return;
      }
      const res = await unwrap(
        api.POST("/api/v1/dev/session", { body: { email, display_name: name.trim() || null } }),
      );
      saveSession({
        accessToken: res.access_token,
        expiresAt: Date.now() + res.expires_in * 1000,
        displayName: res.user.display_name,
      });
      router.replace("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos iniciar sesión.");
      setPending(false);
    }
  }

  return (
    <main id="contenido" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-10">
      <Link href="/" className="self-start">
        <BrandMark />
      </Link>
      <Card>
        <div className="flex items-center gap-4">
          <LaniaMascot pose="welcome" size={64} decorative />
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Entrar</h1>
            <p className="text-ink-muted">Primero un diagnóstico corto; después, tu primera clase.</p>
          </div>
        </div>
        {supabaseEnabled ? (
          <p className="mt-5 mb-5 text-sm text-ink-muted">
            Te enviamos un enlace a tu correo para entrar. Sin contraseñas que recordar.
          </p>
        ) : (
          <p className="mt-5 mb-5 rounded-2xl bg-warning-soft p-3 text-sm">
            <strong>Modo desarrollo local.</strong> Este acceso sin contraseña solo existe en tu computadora. En el
            piloto se entra con un enlace enviado al correo.
          </p>
        )}
        {sentTo ? (
          <div role="status" className="rounded-2xl bg-success-soft p-4">
            <p className="font-semibold">Revisa tu correo</p>
            <p className="mt-1 text-sm">
              Enviamos un enlace a <strong>{sentTo}</strong>. Ábrelo en este mismo dispositivo para entrar. Si no
              llega en un par de minutos, mira en spam.
            </p>
            <button type="button" className="mt-3 text-sm font-semibold underline" onClick={() => setSentTo(null)}>
              Usar otro correo
            </button>
          </div>
        ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
              className="min-h-12 rounded-2xl border-2 border-border bg-surface px-4 focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="font-semibold">
              ¿Cómo quieres que te llamemos? <span className="font-normal text-ink-muted">(opcional)</span>
            </label>
            <input
              id="name"
              maxLength={60}
              autoComplete="given-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-12 rounded-2xl border-2 border-border bg-surface px-4 focus:border-primary"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-xl bg-error-soft p-3 text-error">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={pending}>
            <LogIn aria-hidden />{" "}
            {supabaseEnabled ? (pending ? "Enviando…" : "Enviarme el enlace") : pending ? "Entrando…" : "Entrar"}
          </Button>
        </form>
        )}
      </Card>
    </main>
  );
}
