import type { Metadata } from "next";

import { ListeningLab } from "@/ui/screens";

// Contenido y voz reales (Entrega 3).
export const instant = false;
export const metadata: Metadata = { title: "Listening Lab" };

export default function Page() {
  return <ListeningLab />;
}
