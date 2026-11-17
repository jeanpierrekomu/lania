import type { Metadata } from "next";

import { SpeakingLab } from "@/ui/screens";

// Contenido y voz reales (Entrega 3).
export const instant = false;
export const metadata: Metadata = { title: "Speaking Lab" };

export default function Page() {
  return <SpeakingLab />;
}
