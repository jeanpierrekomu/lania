import { Suspense, type ReactNode } from "react";

import { LaniaShell } from "@/components/layout/lania-shell";
import { LoadingState } from "@/components/ui/states";

// Contenido que depende de la sesión del navegador: no se espera navegación instantánea (docs: instant).
export const instant = false;

// El área del alumno depende de la sesión del navegador: se renderiza en cliente (dentro de Suspense
// para que Cache Components no bloquee el prerender por usePathname/useSearchParams).
export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingState label="Cargando…" />}>
      <LaniaShell>{children}</LaniaShell>
    </Suspense>
  );
}
