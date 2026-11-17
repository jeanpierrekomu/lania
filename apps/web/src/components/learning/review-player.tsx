"use client";

import { CalendarCheck2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useProgress, useReviewSession } from "@/lib/api/queries";
import { longDate } from "@/lib/format";

import { ExercisePlayer, type PlayerOutcome } from "./exercise-player";
import { SessionSummary } from "./session-summary";

export function ReviewPlayer() {
  const session = useReviewSession();
  const progress = useProgress();
  const [outcomes, setOutcomes] = useState<PlayerOutcome[] | null>(null);

  if (session.isPending) return <LoadingState label="Buscando tus repasos…" />;
  if (session.isError) return <ErrorState message={session.error.message} onRetry={() => void session.refetch()} />;

  if (outcomes) {
    return (
      <SessionSummary outcomes={outcomes} serverNow={progress.data ? new Date(progress.data.server_now) : undefined} />
    );
  }

  const { due, exercises, next_due_at } = session.data;
  if (exercises.length === 0) {
    return (
      <Card className="flex flex-col items-start gap-3">
        <CalendarCheck2 className="size-8 text-success" aria-hidden />
        <CardTitle>No tienes repasos pendientes hoy</CardTitle>
        <p className="text-ink-muted">
          {next_due_at
            ? `Tu próximo repaso es el ${longDate(next_due_at)}. Repasar antes de tiempo no ayuda tanto como hacerlo cuando toca.`
            : "Cuando practiques y cometas errores, aquí aparecerán repasos programados."}
        </p>
        <Button asChild variant="secondary">
          <Link href="/app">Volver al inicio</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Revancha</h1>
        <p className="text-ink-muted">
          {due.map((d) => d.skill_name_es).join(", ")}. Ejercicios nuevos, sin explicación previa: así comprobamos que
          lo recuerdas de verdad.
        </p>
      </div>
      <ExercisePlayer
        exercises={exercises}
        mode="review"
        storageKey={`modo.review.${exercises.map((e) => e.id).join(".")}`}
        onFinish={(o) => {
          setOutcomes(o);
          void session.refetch();
          void progress.refetch();
        }}
      />
    </div>
  );
}
