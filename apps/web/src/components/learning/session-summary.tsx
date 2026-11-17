import { CalendarClock, CheckCircle2, RotateCcw, Star } from "lucide-react";
import Link from "next/link";

import { LaniaMascot } from "@/components/mascot/lania-mascot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useMe } from "@/lib/api/queries";
import { longDate, relativeDay } from "@/lib/format";

import type { PlayerOutcome } from "./exercise-player";
import { confidenceLabel, SkillLevelBadge } from "./mastery-badge";
import { VERDICTS, verdictOf } from "./verdict";

/** Resumen honesto: aciertos al primer intento, qué falló y cuándo vuelve el repaso. */
export function SessionSummary({
  outcomes,
  serverNow,
  lessonSlug,
}: {
  outcomes: PlayerOutcome[];
  serverNow?: Date;
  lessonSlug?: string;
}) {
  const last = outcomes.at(-1)?.last;
  const firstTry = outcomes.filter((o) => ["correct", "valid_alternative", "less_natural"].includes(o.first.evaluation.verdict ?? ""));
  const toReview = outcomes.filter((o) => !firstTry.includes(o));
  const nextReview = last?.next_review;
  const showAvatar = useMe().data?.preferences.show_avatar !== false;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-start gap-4 rounded-[var(--radius-card)] bg-celebrate-soft p-6 sm:flex-row sm:items-center">
        {showAvatar && (
          <LaniaMascot pose={last?.mastery.state === "proficient" ? "celebrating" : "encouraging"} size={72} />
        )}
        <div className="flex flex-col items-start gap-2">
          <Badge tone="celebrate">
            <Star aria-hidden /> Sesión terminada
          </Badge>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {firstTry.length} de {outcomes.length} al primer intento
          </h1>
        </div>
      </div>

      {last && (
        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>{last.mastery.skill_name_es}</CardTitle>
            <SkillLevelBadge state={last.mastery.state} />
          </div>
          <p className="text-ink-muted">
            {last.mastery.rationale_es} <span className="whitespace-nowrap">({confidenceLabel(last.mastery.confidence)})</span>
          </p>
        </Card>
      )}

      {nextReview && (
        <Card className="flex items-start gap-3 bg-primary-soft">
          <CalendarClock className="mt-1 size-6 shrink-0 text-primary" aria-hidden />
          <div>
            <CardTitle className="text-lg">
              Próximo repaso: {relativeDay(nextReview.due_at, serverNow)}
            </CardTitle>
            <p className="text-ink-muted">
              {longDate(nextReview.due_at)}. Usaremos ejercicios distintos para comprobar que lo recuerdas, no que
              memorizaste la respuesta.
            </p>
          </div>
        </Card>
      )}

      {toReview.length > 0 && (
        <Card>
          <CardTitle className="mb-3 text-lg">Para tu revancha</CardTitle>
          <ul className="flex flex-col gap-3">
            {toReview.map((o) => {
              const meta = VERDICTS[verdictOf(o.first.evaluation)];
              return (
                <li key={o.exercise.id} className="flex flex-col gap-1 border-b border-border pb-3 last:border-0">
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink-muted">
                    <meta.Icon className="size-4" aria-hidden /> {meta.label}
                    {o.last !== o.first && o.last.evaluation.verdict === "correct" && (
                      <span className="inline-flex items-center gap-1 text-success">
                        · <CheckCircle2 className="size-4" aria-hidden /> corregido en el reintento
                      </span>
                    )}
                  </span>
                  <span lang="en">
                    <del className="decoration-error">{o.first.evaluation.your_answer}</del> →{" "}
                    <strong>{o.first.evaluation.correct_sentence ?? o.first.evaluation.expected_answer}</strong>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/app">Volver al inicio</Link>
        </Button>
        {lessonSlug && (
          <Button asChild variant="secondary" size="lg">
            <Link href={`/learn/${lessonSlug}`}>
              <RotateCcw aria-hidden /> Practicar otra vez
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
