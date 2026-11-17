import { Suspense } from "react";

import { DiagnosticReport } from "@/components/diagnostic/diagnostic-report";
import { LoadingState } from "@/components/ui/states";

// Depende de la sesión del navegador (ver layout del área del alumno).
export const instant = false;

export default function DiagnosticResultsPage() {
  return (
    <Suspense fallback={<LoadingState label="Preparando tu informe…" />}>
      <DiagnosticReport />
    </Suspense>
  );
}
