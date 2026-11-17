import type { Metadata } from "next";

import { Dashboard } from "@/components/learning/dashboard";

export const instant = false;
export const metadata: Metadata = { title: "Inicio" };

export default function HomePage() {
  return <Dashboard />;
}
