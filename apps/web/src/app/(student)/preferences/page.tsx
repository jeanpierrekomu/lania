import type { Metadata } from "next";

import { PreferencesForm } from "@/components/preferences/preferences-form";
import { PrivacySection } from "@/components/preferences/privacy-section";

// Depende de la sesión del navegador (ver layout del área del alumno).
export const instant = false;

export const metadata: Metadata = { title: "Preferencias" };

export default function PreferencesPage() {
  return (
    <>
      <PreferencesForm />
      <PrivacySection />
    </>
  );
}
