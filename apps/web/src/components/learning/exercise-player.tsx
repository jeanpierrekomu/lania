"use client";

import { Pause } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";
import type { Schemas } from "@/lib/api/client";
import { useSubmitAttempt } from "@/lib/api/queries";

import { AnswerFeedback } from "./answer-feedback";
import { QuestionRenderer, type Answer } from "./question-renderer";

type Exercise = Schemas["ExerciseOut"];
type Result = Schemas["AttemptResultOut"];

export type PlayerOutcome = { exercise: Exercise; first: Result; last: Result };

type Saved = { index: number; outcomes: PlayerOutcome[] };

type Props = {
  exercises: Exercise[];
  mode: "practice" | "review";
  /** Guarda la posición para «retomar donde quedaste» tras salir o recargar. */
  storageKey: string;
  /** Se muestra una vez, después del calentamiento (explicación mínima del bucle §3.1). */
  afterWarmup?: (onContinue: () => void) => ReactNode;
  onFinish: (outcomes: PlayerOutcome[]) => void;
};

function load(key: string, exercises: Exercise[]): Saved {
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) ?? "null") as Saved | null;
    const sameSet = saved?.outcomes.every((o, i) => o.exercise.id === exercises[i]?.id);
    if (saved && sameSet && saved.index < exercises.length) return saved;
  } catch {
    /* sin almacenamiento: empezar de cero */
  }
  return { index: 0, outcomes: [] };
}

export function ExercisePlayer({ exercises, mode, storageKey, afterWarmup, onFinish }: Props) {
  const [saved, setSaved] = useState<Saved>(() => load(storageKey, exercises));
  const [result, setResult] = useState<Result | null>(null);
  const [firstResult, setFirstResult] = useState<Result | null>(null);
  const [retryOf, setRetryOf] = useState<string | null>(null);
  const [hintShown, setHintShown] = useState(false);
  const [showTheory, setShowTheory] = useState(false);
  const [attemptKey, setAttemptKey] = useState(0);
  const submissionId = useRef<string>(crypto.randomUUID());
  const submit = useSubmitAttempt();

  const { index, outcomes } = saved;
  const exercise = exercises[index];

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch {
      /* ignorar */
    }
  }, [saved, storageKey]);

  const newAttempt = useCallback(() => {
    submissionId.current = crypto.randomUUID();
    setHintShown(false);
    setAttemptKey((k) => k + 1);
  }, []);

  if (!exercise) return null;

  function handleSubmit(answer: Answer) {
    submit.mutate(
      {
        exercise_id: exercise.id,
        client_submission_id: submissionId.current, // el mismo id si el usuario hace doble click
        mode,
        hint_count: hintShown ? 1 : 0,
        retry_of: retryOf,
        ...answer,
      },
      {
        onSuccess: (res) => {
          if (!retryOf) setFirstResult(res);
          setResult(res);
          try {
            window.sessionStorage.removeItem(`draft:${exercise.id}`);
          } catch {
            /* ignorar */
          }
        },
      },
    );
  }

  function handleRetry() {
    if (!result) return;
    setRetryOf(result.attempt_id);
    setResult(null);
    newAttempt();
  }

  function handleContinue() {
    const outcome: PlayerOutcome = { exercise, first: firstResult ?? result!, last: result! };
    const nextOutcomes = [...outcomes, outcome];
    const finished = index + 1 >= exercises.length;
    setResult(null);
    setFirstResult(null);
    setRetryOf(null);
    newAttempt();
    if (finished) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        /* ignorar */
      }
      onFinish(nextOutcomes);
      return;
    }
    setSaved({ index: index + 1, outcomes: nextOutcomes });
    if (exercise.role === "warmup" && afterWarmup) setShowTheory(true);
  }

  if (showTheory && afterWarmup) return <>{afterWarmup(() => setShowTheory(false))}</>;

  const isLast = index + 1 >= exercises.length;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink-muted">
          {exercise.role === "warmup" ? "Calentamiento · sin explicación previa" : mode === "review" ? "Repaso" : "Práctica"}
          {" · "}
          Ejercicio {index + 1} de {exercises.length}
        </p>
        <Button asChild variant="ghost" size="sm">
          <Link href="/app">
            <Pause aria-hidden /> Pausar
          </Link>
        </Button>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-label="Progreso de la sesión"
        aria-valuemin={0}
        aria-valuemax={exercises.length}
        aria-valuenow={index}
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(index / exercises.length) * 100}%` }} />
      </div>

      {retryOf && !result && (
        <p className="rounded-2xl bg-primary-soft p-3 text-sm">
          Segundo intento: recuerda la explicación y vuelve a construir tu respuesta.
        </p>
      )}

      {!result && (
        <QuestionRenderer
          key={`${exercise.id}-${attemptKey}`}
          exercise={exercise}
          disabled={submit.isPending}
          hintShown={hintShown}
          onShowHint={() => setHintShown(true)}
          onSubmit={handleSubmit}
          draftKey={retryOf ? undefined : `draft:${exercise.id}`}
        />
      )}

      {submit.isError && !result && (
        <ErrorState
          message={`${submit.error.message} Tu respuesta no se perdió: puedes volver a enviarla.`}
          onRetry={submit.reset}
        />
      )}

      {result && (
        <AnswerFeedback
          result={result}
          reviewScheduled={Boolean(result.next_review)}
          onRetry={retryOf ? undefined : handleRetry}
          onContinue={handleContinue}
          continueLabel={isLast ? "Ver resumen" : "Siguiente"}
        />
      )}
    </div>
  );
}
