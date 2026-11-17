import type { Metadata } from "next";
import { Suspense } from "react";

import { TutorChat } from "@/components/tutor/tutor-chat";
import { LoadingState } from "@/components/ui/states";
import { TUTOR_NAME } from "@/lib/brand";

// Depende de la sesión del navegador (ver layout del área del alumno).
export const instant = false;

export const metadata: Metadata = { title: TUTOR_NAME };

export default function TutorPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TutorChat />
    </Suspense>
  );
}
