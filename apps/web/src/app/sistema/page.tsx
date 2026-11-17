import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BrandSystem } from "@/ui/screens";

export const metadata: Metadata = { title: "Sistema de diseño" };

export default function Page() {
  // Páginas internas del equipo: solo en desarrollo local, nunca en el piloto publicado.
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Suspense>
      <BrandSystem />
    </Suspense>
  );
}
