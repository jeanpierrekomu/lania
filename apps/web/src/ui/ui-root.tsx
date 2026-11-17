"use client";

import { useMemo, useState, type ReactNode } from "react";

import { PreferencesPanel } from "@/ui/components/layout/PreferencesPanel";
import { LearnerProvider } from "@/ui/state/learner";
import { PreferencesProvider } from "@/ui/state/preferences";
import { UiContext } from "@/ui/state/ui";

/** Proveedores del diseño LANIA para toda la app: preferencias de lectura, panel de accesibilidad y alumno demo. */
export function UiRoot({ children }: { children: ReactNode }) {
  const [prefsOpen, setPrefsOpen] = useState(false);
  const ui = useMemo(() => ({ openPreferences: () => setPrefsOpen(true), openScreens: () => undefined }), []);
  return (
    <PreferencesProvider>
      <LearnerProvider>
        <UiContext.Provider value={ui}>
          {children}
          <PreferencesPanel open={prefsOpen} onClose={() => setPrefsOpen(false)} />
        </UiContext.Provider>
      </LearnerProvider>
    </PreferencesProvider>
  );
}
