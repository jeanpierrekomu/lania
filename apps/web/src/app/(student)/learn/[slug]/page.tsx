import { Suspense } from "react";

import { LessonPlayer } from "@/components/learning/lesson-player";
import { LoadingState } from "@/components/ui/states";

// Depende de la sesión del navegador (ver layout del área del alumno).
export const instant = false;

export default function LessonPage() {
  return (
    <Suspense fallback={<LoadingState label="Preparando tu clase…" />}>
      <LessonPlayer />
    </Suspense>
  );
}
