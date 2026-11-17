import type { Metadata } from "next";

import { ClassroomHome } from "@/components/learning/classroom-home";

export const instant = false;
export const metadata: Metadata = { title: "Aula con Lania" };

export default function AulaPage() {
  return <ClassroomHome />;
}
