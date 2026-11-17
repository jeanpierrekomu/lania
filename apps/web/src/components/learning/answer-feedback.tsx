"use client";

import { ArrowRight, CalendarClock, Eye, Flag, MessageCircleQuestion, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { LaniaMascot } from "@/components/mascot/lania-mascot";
import { Button } from "@/components/ui/button";
import type { Schemas } from "@/lib/api/client";
import { useDispute, useHealth, useMe } from "@/lib/api/queries";
import { TUTOR_NAME } from "@/lib/brand";
import { longDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { TONE_CLASSES, TONE_TEXT, VERDICTS, verdictOf } from "./verdict";

type Props = {
  result: Schemas["AttemptResultOut"];
  /** true si este resultado programó o adelantó un repaso. */
  reviewScheduled: boolean;
  onRetry?: () => void;
  onContinue: () => void;
  continueLabel: string;
};

/**
 * Feedback según spec §3.1/§3.6: qué estuvo bien, el error prioritario con su regla,
 * oportunidad de reintento ANTES de revelar la respuesta, y opción de pedir revisión.
 */
export function AnswerFeedback({ result, reviewScheduled, onRetry, onContinue, continueLabel }: Props) {
  const ev = result.evaluation;
  const meta = VERDICTS[verdictOf(ev)];
  const canRetry = ev.next_action === "retry" && onRetry;
  const [revealed, setRevealed] = useState(!canRetry);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const aiAvailable = useHealth().data?.ai_available ?? false;
  const showAvatar = useMe().data?.preferences.show_avatar !== false;

  useEffect(() => {
    headingRef.current?.focus();
  }, [ev.id]);

  const error = ev.errors[0];
  const isPositive = meta.tone === "success";

  return (
    <div className={cn("flex flex-col gap-4 rounded-[var(--radius-card)] border-2 p-5", TONE_CLASSES[meta.tone])}>
      <div role="status" aria-live="polite" className="flex flex-col gap-2">
        <h3
          ref={headingRef}
          tabIndex={-1}
          className={cn("flex items-center gap-2 font-display text-2xl font-bold outline-none", TONE_TEXT[meta.tone])}
        >
          {showAvatar && (
            <LaniaMascot
              pose={isPositive ? "encouraging" : canRetry && !revealed ? "thinking" : "correcting"}
              size={48}
              decorative
            />
          )}
          <meta.Icon className="size-7" aria-hidden /> {meta.label}
        </h3>
        {/* Si acertó, el «por qué» es más útil que repetir «¡Correcto!» */}
        <p className="text-lg">
          {ev.verdict === "correct"
            ? ev.explanation_es
            : canRetry && !revealed && ev.retry_hint_es
              ? ev.retry_hint_es
              : ev.feedback_es}
        </p>
        {canRetry && !revealed && ev.retry_hint_es && (
          <p className="text-sm text-ink-muted">Pista para tu segundo intento: no te damos la respuesta todavía.</p>
        )}
      </div>

      {!isPositive && error?.minimal_correction && error.span && revealed && (
        <p className="flex flex-wrap items-center gap-2 text-lg" lang="en">
          <span className="sr-only">Tu respuesta:</span>
          <del className="rounded-lg bg-surface px-2 decoration-error decoration-2">{error.span}</del>
          <ArrowRight className="size-5 text-ink-muted" aria-label="se corrige como" />
          <ins className="rounded-lg bg-surface px-2 font-semibold no-underline">{error.minimal_correction}</ins>
        </p>
      )}

      {revealed && (ev.correct_sentence || ev.verdict !== "correct") && (
        <div className="rounded-2xl bg-surface p-4">
          {ev.correct_sentence && (
            <>
              <p className="text-sm font-semibold text-ink-muted">{isPositive ? "La oración" : "Versión correcta"}</p>
              <p className="font-display text-xl font-semibold" lang="en">
                {ev.correct_sentence}
              </p>
            </>
          )}
          {ev.verdict !== "correct" && (
            <p className={cn("text-ink-muted", ev.correct_sentence && "mt-2")}>
              <span className="font-semibold text-ink">¿Por qué? </span>
              {ev.explanation_es}
            </p>
          )}
        </div>
      )}

      {reviewScheduled && result.next_review && !isPositive && (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <CalendarClock className="size-4" aria-hidden />
          Volveremos a practicar esta habilidad con otro ejercicio el {longDate(result.next_review.due_at)}.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {canRetry ? (
          <>
            <Button onClick={onRetry}>
              <RotateCcw aria-hidden /> Intentar de nuevo
            </Button>
            {!revealed && (
              <Button variant="secondary" onClick={() => setRevealed(true)}>
                <Eye aria-hidden /> Ver la respuesta
              </Button>
            )}
            <Button variant="ghost" onClick={onContinue}>
              {continueLabel}
            </Button>
          </>
        ) : (
          <Button onClick={onContinue}>
            {continueLabel} <ArrowRight aria-hidden />
          </Button>
        )}
      </div>

      {!isPositive && aiAvailable && (
        <Button asChild variant="link" className="self-start text-sm">
          <Link href={`/tutor?evaluation=${ev.id}`}>
            <MessageCircleQuestion aria-hidden className="size-4" /> Pregúntale a {TUTOR_NAME} por qué
          </Link>
        </Button>
      )}

      {!isPositive && ev.status === "graded" && <DisputeForm evaluationId={ev.id} alreadyDisputed={ev.review_status === "disputed"} />}
    </div>
  );
}

function DisputeForm({ evaluationId, alreadyDisputed }: { evaluationId: string; alreadyDisputed: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const dispute = useDispute();

  if (alreadyDisputed || dispute.isSuccess) {
    return (
      <p role="status" className="text-sm text-ink-muted">
        Enviado a revisión de contenido. Tu nota no cambia automáticamente; si tenías razón, corregiremos el ejercicio.
      </p>
    );
  }
  if (!open) {
    return (
      <Button variant="link" className="self-start text-sm" onClick={() => setOpen(true)}>
        <Flag aria-hidden className="size-4" /> ¿Crees que tu respuesta es válida? Pide una revisión
      </Button>
    );
  }
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (reason.trim().length >= 3) dispute.mutate({ evaluationId, reason: reason.trim() });
      }}
    >
      <label htmlFor={`dispute-${evaluationId}`} className="text-sm font-semibold">
        ¿Por qué crees que es correcta?
      </label>
      <textarea
        id={`dispute-${evaluationId}`}
        value={reason}
        maxLength={500}
        rows={2}
        onChange={(e) => setReason(e.target.value)}
        className="rounded-xl border-2 border-border bg-surface p-3"
      />
      {dispute.isError && <p className="text-sm text-error">{dispute.error.message}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={reason.trim().length < 3 || dispute.isPending}>
          Enviar a revisión
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
