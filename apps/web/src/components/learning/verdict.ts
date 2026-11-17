import { AlertCircle, CheckCircle2, CircleDot, HelpCircle, PenLine, Sparkles, XCircle, type LucideIcon } from "lucide-react";

import type { Schemas } from "@/lib/api/client";

type Verdict = NonNullable<Schemas["EvaluationOut"]["verdict"]> | "needs_review";
type Tone = "success" | "warning" | "error" | "neutral";

/** Cada veredicto tiene icono + texto: el color nunca es la única señal (spec §5.1). */
export const VERDICTS: Record<Verdict, { label: string; tone: Tone; Icon: LucideIcon }> = {
  correct: { label: "¡Correcto!", tone: "success", Icon: CheckCircle2 },
  valid_alternative: { label: "Respuesta válida", tone: "success", Icon: Sparkles },
  less_natural: { label: "Correcta, pero menos natural", tone: "success", Icon: CircleDot },
  spelling_error: { label: "Casi: error de escritura", tone: "warning", Icon: PenLine },
  partial: { label: "Parcialmente lograda", tone: "warning", Icon: AlertCircle },
  incorrect: { label: "Todavía no", tone: "error", Icon: XCircle },
  needs_review: { label: "No pudimos evaluarla", tone: "neutral", Icon: HelpCircle },
};

export function verdictOf(e: Schemas["EvaluationOut"]): Verdict {
  return e.status === "needs_review" || !e.verdict ? "needs_review" : e.verdict;
}

export const TONE_CLASSES: Record<Tone, string> = {
  success: "border-success/40 bg-success-soft",
  warning: "border-warning/40 bg-warning-soft",
  error: "border-error/40 bg-error-soft",
  neutral: "border-border bg-surface-2",
};

export const TONE_TEXT: Record<Tone, string> = {
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
  neutral: "text-ink-muted",
};
