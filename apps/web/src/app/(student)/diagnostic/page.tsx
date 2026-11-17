import type { Metadata } from "next";

import { DiagnosticPlayer } from "@/components/diagnostic/diagnostic-player";

// Depende de la sesión del navegador (ver layout del área del alumno).
export const instant = false;

export const metadata: Metadata = { title: "Diagnóstico" };

export default function DiagnosticPage() {
  return <DiagnosticPlayer />;
}
