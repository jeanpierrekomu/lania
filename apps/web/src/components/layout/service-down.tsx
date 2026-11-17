"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { Lania } from "@/ui/components/illustrations/Lania";

const AUTO_RETRY_SECONDS = 30;

/** ¿El error es porque el servidor no está disponible (sin conexión o 5xx), no por algo de la persona? */
export function isOutage(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 0 || error.status >= 500);
}

/**
 * Pantalla amable cuando el servidor no responde (caída, mantenimiento o sin internet).
 * Reintenta sola cada 30 s; el progreso guardado no se pierde.
 */
export function ServiceDown({ onRetry }: { onRetry: () => void }) {
  const [left, setLeft] = useState(AUTO_RETRY_SECONDS);
  const remaining = useRef(AUTO_RETRY_SECONDS);
  const retry = useRef(onRetry);
  useEffect(() => {
    retry.current = onRetry;
  }, [onRetry]);

  useEffect(() => {
    const id = window.setInterval(() => {
      remaining.current -= 1;
      if (remaining.current <= 0) {
        remaining.current = AUTO_RETRY_SECONDS;
        retry.current();
      }
      setLeft(remaining.current);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <main
      id="contenido"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-5 px-5 text-center"
    >
      <Link href="/" aria-label="LANIA, inicio">
        <BrandMark className="h-10" />
      </Link>
      <div className="w-52">
        <Lania expression="thinking" className="w-full" />
      </div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Lania está descansando un momento</h1>
      <p className="text-ink-muted">
        No podemos conectar con el servidor. Puede ser tu internet o una pausa breve de nuestra parte. Tu progreso está
        guardado: no se pierde nada.
      </p>
      <Button
        type="button"
        size="lg"
        onClick={() => {
          remaining.current = AUTO_RETRY_SECONDS;
          setLeft(AUTO_RETRY_SECONDS);
          onRetry();
        }}
      >
        <RefreshCw aria-hidden /> Intentar ahora
      </Button>
      <p role="status" className="text-sm text-ink-muted">
        Lo volvemos a intentar solos en {left} s.
      </p>
    </main>
  );
}
