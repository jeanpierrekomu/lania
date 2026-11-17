"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";

import { FeedbackButton } from "@/components/layout/feedback-button";
import { isOutage, ServiceDown } from "@/components/layout/service-down";
import { LoadingState } from "@/components/ui/states";
import { useMe } from "@/lib/api/queries";
import { useSession } from "@/lib/auth/session";
import { signOutEverywhere } from "@/lib/auth/supabase";
import { AppShell } from "@/ui/components/layout/AppShell";
import { ShellUserContext, type ShellUser } from "@/ui/state/ui";

/** Secciones con diseño propio a pantalla completa (vista previa del diseño LANIA). */
const FULL_BLEED = [/^\/app\/(speaking|listening|reading|writing|salones|misiones|progreso)(\/|$)/];

/**
 * Área del alumno con el diseño LANIA: menú lateral, recorrido guiado y preferencias de lectura.
 * Exige sesión (si no hay, lleva a /login) y aplica las preferencias de la cuenta (baja estimulación, movimiento).
 */
export function LaniaShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const me = useMe();
  const lowStim = me.data?.preferences.low_stim_mode ?? false;
  const reduceMotion = me.data?.preferences.reduce_motion ?? false;
  const isStaff = !!me.data && ["content_editor", "teacher_reviewer", "admin"].includes(me.data.role);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-low-stim", lowStim);
    document.documentElement.toggleAttribute("data-reduce-motion", reduceMotion);
    return () => {
      document.documentElement.removeAttribute("data-low-stim");
      document.documentElement.removeAttribute("data-reduce-motion");
    };
  }, [lowStim, reduceMotion]);

  useEffect(() => {
    if (session === null) router.replace("/empezar");
  }, [session, router]);

  // Primera vez: la bienvenida (objetivo, intereses y consentimiento del piloto) va antes que todo lo demás.
  const needsOnboarding = me.isSuccess && !me.data.onboarding;
  useEffect(() => {
    if (needsOnboarding) router.replace("/onboarding");
  }, [needsOnboarding, router]);

  const user = useMemo<ShellUser>(
    () => ({
      name: me.data?.display_name || session?.displayName || "Tu cuenta",
      subtitle: "Tu cuenta LANIA",
      isStaff,
      // Invitado: cerrar sesión borraría su progreso de este navegador, así que no se ofrece.
      onLogout: session?.guest
        ? undefined
        : () => {
            void signOutEverywhere().finally(() => router.replace("/"));
          },
    }),
    [me.data?.display_name, session?.displayName, session?.guest, isStaff, router],
  );

  // Servidor caído o sin internet: aviso amable en vez de errores sueltos en cada pantalla.
  if (session && me.isError && isOutage(me.error)) {
    return <ServiceDown onRetry={() => void me.refetch()} />;
  }

  if (!session || needsOnboarding) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4">
        <LoadingState label="Verificando tu sesión…" />
      </main>
    );
  }

  const fullBleed = FULL_BLEED.some((r) => r.test(pathname));
  return (
    <ShellUserContext.Provider value={user}>
      <AppShell>
        {fullBleed ? (
          children
        ) : (
          <div id="contenido" className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-8 lg:py-10">
            {children}
          </div>
        )}
        <FeedbackButton />
      </AppShell>
    </ShellUserContext.Provider>
  );
}
