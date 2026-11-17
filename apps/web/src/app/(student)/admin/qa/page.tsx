import type { Metadata } from "next";

import { QaPanel } from "@/components/admin/qa-panel";

// Depende de la sesión del navegador (ver layout del área del alumno).
export const instant = false;

export const metadata: Metadata = { title: "Revisión" };

export default function QaPage() {
  return <QaPanel />;
}
