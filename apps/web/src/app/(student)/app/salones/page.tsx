import type { Metadata } from "next";

import { RoomsComingSoon } from "@/ui/screens";

// Salones: base preparada en la API, apagada en el piloto (ROOMS_ENABLED=false).
export const instant = false;
export const metadata: Metadata = { title: "Salones" };

export default function Page() {
  return <RoomsComingSoon />;
}
