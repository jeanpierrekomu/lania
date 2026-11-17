"use client";

import { ArrowRight, Clock, Dumbbell, Lightbulb, Target, Zap } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

import { LaniaMascot } from "@/components/mascot/lania-mascot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconChip } from "@/components/ui/icon-chip";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useLesson, useMe, useProgress } from "@/lib/api/queries";
import { cn } from "@/lib/utils";

import { ExercisePlayer, type PlayerOutcome } from "./exercise-player";
import { LessonTheory } from "./lesson-theory";
import { SessionSummary } from "./session-summary";

export function LessonPlayer() {
  const { slug } = useParams<{ slug: string }>();
  const lesson = useLesson(slug);
  const progress = useProgress();
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro");
  const [outcomes, setOutcomes] = useState<PlayerOutcome[]>([]);
  const showAvatar = useMe().data?.preferences.show_avatar !== false;

  if (lesson.isPending) return <LoadingState label="Preparando tu clase…" />;
  if (lesson.isError) return <ErrorState message={lesson.error.message} onRetry={() => void lesson.refetch()} />;
  const data = lesson.data;

  if (phase === "done") {
    return (
      <SessionSummary
        lessonSlug={data.slug}
        outcomes={outcomes}
        serverNow={progress.data ? new Date(progress.data.server_now) : undefined}
      />
    );
  }

  if (phase === "playing") {
    return (
      <ExercisePlayer
        exercises={data.exercises}
        mode="practice"
        storageKey={`modo.lesson.${data.slug}.v${data.version}`}
        afterWarmup={(next) => <LessonTheory content={data.content} onContinue={next} />}
        onFinish={(o) => {
          setOutcomes(o);
          setPhase("done");
          void progress.refetch();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="primary">{data.level}</Badge>
        {data.review_status === "pilot" && <Badge>Contenido piloto · pendiente de revisión docente</Badge>}
      </div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{data.title_es}</h1>
      <p className="flex gap-2 text-lg">
        <Target className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
        {data.content.goal_es}
      </p>
      <Card className={cn("relative flex flex-col gap-4", showAvatar && "sm:pr-44")}>
        {showAvatar && (
        <LaniaMascot
          pose="studying"
          variant="scene"
          size={150}
          decorative
          className="hidden sm:absolute sm:right-4 sm:bottom-4 sm:block"
        />
        )}
        <h2 className="font-display text-lg font-bold">Cómo será la clase</h2>
        <ol className="flex flex-col gap-3">
          <li className="flex items-center gap-3">
            <IconChip Icon={Zap} tone="yellow" size="sm" />
            <span>
              <span className="sr-only">Paso 1: </span>Un calentamiento sin explicación, para ver qué recuerdas.
            </span>
          </li>
          <li className="flex items-center gap-3">
            <IconChip Icon={Lightbulb} tone="sky" size="sm" />
            <span>
              <span className="sr-only">Paso 2: </span>Una explicación corta con ejemplos.
            </span>
          </li>
          <li className="flex items-center gap-3">
            <IconChip Icon={Dumbbell} tone="peach" size="sm" />
            <span>
              <span className="sr-only">Paso 3: </span>
              {data.exercises.length - 1} ejercicios con corrección y un segundo intento si fallas.
            </span>
          </li>
        </ol>
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Clock className="size-4 shrink-0" aria-hidden /> Unos 5–8 minutos. Puedes pausar cuando quieras y retomar
          donde quedaste.
        </p>
      </Card>
      <div>
        <Button size="lg" onClick={() => setPhase("playing")}>
          Empezar <ArrowRight aria-hidden />
        </Button>
      </div>
    </div>
  );
}
