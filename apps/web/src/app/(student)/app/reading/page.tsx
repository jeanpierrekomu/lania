import type { Metadata } from "next";

import { ReadingLab } from "@/ui/screens";

// Lecturas originales, glosario con audio y preguntas corregidas en el servidor.
export const instant = false;
export const metadata: Metadata = { title: "Reading Lab" };

export default function Page() {
  return <ReadingLab />;
}
