"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { isOutage, ServiceDown } from "@/components/layout/service-down";
import { api, unwrap } from "@/lib/api/client";
import { getSession, saveSession } from "@/lib/auth/session";
import { startGuest } from "@/lib/auth/supabase";
import { Lania } from "@/ui/components/illustrations/Lania";

/** Correo interno (nunca se usa para escribir a nadie) para el acceso de prueba en desarrollo local. */
function devGuestEmail() {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
  return `invitado-${id}@guest.lania.app`;
}

/**
 * Entrar a practicar sin registrarse: crea una cuenta de invitado y lleva a la bienvenida.
 * Si ya hay una sesión en este navegador, la reutiliza (no se pierde el progreso).
 */
export function GuestStart() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [down, setDown] = useState(false);
  const started = useRef(false);

  async function begin() {
    setError(null);
    setDown(false);
    try {
      if (!getSession()) {
        await startGuest(async () => {
          const res = await unwrap(api.POST("/api/v1/dev/session", { body: { email: devGuestEmail() } }));
          saveSession({
            accessToken: res.access_token,
            expiresAt: Date.now() + res.expires_in * 1000,
            displayName: null,
            guest: true,
          });
        });
      }
      router.replace("/app");
    } catch (err) {
      if (isOutage(err)) setDown(true);
      else setError(err instanceof Error ? err.message : "No pudimos preparar tu espacio de práctica.");
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se ejecuta una sola vez al abrir la página
  }, []);

  if (down) return <ServiceDown onRetry={() => void begin()} />;

  return (
    <main id="contenido" className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-5 text-center">
      <BrandMark className="h-10" />
      <div className="w-56">
        <Lania expression={error ? "thinking" : "welcome"} className="w-full" />
      </div>
      {error ? (
        <div role="alert" className="flex flex-col items-center gap-4">
          <p className="text-lg">{error}</p>
          <Button type="button" size="lg" onClick={() => void begin()}>
            <RefreshCw aria-hidden /> Intentar de nuevo
          </Button>
        </div>
      ) : (
        <p role="status" className="text-lg font-semibold text-ink">
          Preparando tu espacio de práctica…
        </p>
      )}
    </main>
  );
}
