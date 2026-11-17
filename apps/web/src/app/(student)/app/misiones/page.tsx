import type { Metadata } from "next";

import { Missions } from "@/ui/screens";

// Avance calculado con evidencia real.
export const instant = false;
export const metadata: Metadata = { title: "Misiones" };

export default function Page() {
  return <Missions />;
}
