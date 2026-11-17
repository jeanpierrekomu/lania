import type { Metadata } from "next";

import { Profile } from "@/ui/screens";

// Datos reales de la cuenta (progreso, repasos, diagnóstico).
export const instant = false;
export const metadata: Metadata = { title: "Mi progreso" };

export default function Page() {
  return <Profile />;
}
