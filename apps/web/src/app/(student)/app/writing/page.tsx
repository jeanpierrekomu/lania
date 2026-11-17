import type { Metadata } from "next";

import { WritingLab } from "@/ui/screens";

// Consignas y correcciones reales (rúbrica writing_v1).
export const instant = false;
export const metadata: Metadata = { title: "Writing Lab" };

export default function Page() {
  return <WritingLab />;
}
