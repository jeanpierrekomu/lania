import type { Metadata } from "next";

import { ReviewPlayer } from "@/components/learning/review-player";

// Depende de la sesión del navegador (ver layout del área del alumno).
export const instant = false;

export const metadata: Metadata = { title: "Repaso" };

export default function ReviewPage() {
  return <ReviewPlayer />;
}
