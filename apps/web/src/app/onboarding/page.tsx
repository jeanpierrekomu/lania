import type { Metadata } from "next";
import { Suspense } from "react";

import { Onboarding } from "@/ui/screens";

export const metadata: Metadata = { title: "Bienvenida" };

export default function Page() {
  return (
    <Suspense>
      <Onboarding />
    </Suspense>
  );
}
