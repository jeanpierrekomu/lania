"use client";

import { ArrowRight, CalendarClock, FlaskConical, History, Sprout } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { IconChip } from "@/components/ui/icon-chip";
import { ErrorState, LoadingState } from "@/components/ui/states";
import type { Schemas } from "@/lib/api/client";
import { useDevClock, useDiagnosticCurrent, useHealth, useMe, useNextMission, useProgress } from "@/lib/api/queries";
import { longDate, relativeDay } from "@/lib/format";

import { LaniaMascot } from "@/components/mascot/lania-mascot";

import { confidenceLabel, SkillLevelBadge } from "./mastery-badge";

const REVIEW_REASON: Record<Schemas["ReviewOut"]["reason"], string> = {
  error: "por un error reciente",
  retention: "para comprobar que lo recuerdas",
  review_passed: "para fijarlo a más largo plazo",
  review_failed: "el último repaso costó",
};

export function Dashboard() {
  const me = useMe();
  const next = useNextMission();
  const progress = useProgress();
  const health = useHealth();
  const diagnostic = useDiagnosticCurrent();
  const lastReport = diagnostic.data?.last_completed_run_id;

  if (next.isPending || progress.isPending) return <LoadingState />;
  if (next.isError) return <ErrorState message={next.error.message} onRetry={() => void next.refetch()} />;
  if (progress.isError) return <ErrorState message={progress.error.message} onRetry={() => void progress.refetch()} />;

  const mission = next.data;
  const p = progress.data;
  const serverNow = new Date(p.server_now);
  const name = me.data?.display_name;
  const showAvatar = me.data?.preferences.show_avatar !== false;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          {name ? `¡Hola, ${name}!` : "¡Hola!"}
        </h1>
        <p className="text-ink-muted">¿Vamos con tu próxima misión? Un paso a la vez.</p>
      </div>

      <Card
        className="flex flex-col gap-4 border-2 border-primary/25 bg-primary-soft shadow-raised sm:flex-row sm:items-center"
        aria-labelledby="mission-title"
      >
        {showAvatar && (
          <LaniaMascot
            pose={
              ({ review: "encouraging", lesson: "welcome", diagnostic: "thinking", none: "resting" } as const)[
                mission.kind
              ]
            }
            size={96}
            className="self-center"
          />
        )}
        <div className="flex flex-1 flex-col gap-3">
          <p className="text-sm font-bold tracking-wide text-primary uppercase">
            {mission.kind === "review"
              ? "Toca repasar"
              : mission.kind === "lesson"
                ? "Tu siguiente misión"
                : mission.kind === "diagnostic"
                  ? "Primero, conocerte"
                  : "Al día"}
          </p>
          <CardTitle id="mission-title" className="text-2xl">
            {mission.title_es}
          </CardTitle>
          <p>
            <span className="font-semibold">Por qué: </span>
            {mission.reason_es}
          </p>
          {mission.kind === "none" && mission.due_at && (
            <p className="text-ink-muted">Próximo repaso: {longDate(mission.due_at)}.</p>
          )}
          {mission.href && (
            <div>
              <Button asChild size="lg" variant={mission.kind === "none" ? "secondary" : "primary"}>
                <Link href={mission.href}>
                  {
                    {
                      review: "Empezar repaso",
                      lesson: "Continuar clase",
                      diagnostic: "Ir al diagnóstico",
                      none: "Practicar otra vez",
                    }[mission.kind]
                  }
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </Card>

      {lastReport && (
        <p className="-mt-2 text-sm">
          <Link className="font-semibold text-primary underline underline-offset-4" href={`/diagnostic/results/${lastReport}`}>
            Ver mi informe de diagnóstico
          </Link>
        </p>
      )}

      <Card aria-labelledby="reviews-title">
        <CardTitle id="reviews-title" className="mb-3 flex items-center gap-2">
          <IconChip Icon={CalendarClock} tone="lavender" /> Repasos programados
        </CardTitle>
        {p.reviews.length === 0 ? (
          <p className="text-ink-muted">Aún no hay repasos. Se programan solos cuando practicas.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {p.reviews.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="font-semibold">{r.skill_name_es}</span>{" "}
                  <span className="text-ink-muted">· {REVIEW_REASON[r.reason]}</span>
                </span>
                {r.is_due ? (
                  <Badge tone="warning">Disponible ahora</Badge>
                ) : (
                  <Badge tone="neutral">
                    {relativeDay(r.due_at, serverNow)} · {longDate(r.due_at)}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <section aria-labelledby="progress-title" className="flex flex-col gap-3">
        <div>
          <h2 id="progress-title" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
            <IconChip Icon={Sprout} tone="sky" /> Tus habilidades
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Basado solo en tus respuestas reales. Es una estimación orientativa, no un nivel certificado.
          </p>
        </div>
        {p.skills.length === 0 ? (
          <Card>
            <p className="text-ink-muted">Aún no hay práctica registrada. Tu primera clase llenará esta sección.</p>
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {p.skills.map((s) => (
              <li
                key={s.skill_code}
                className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-card"
              >
                <span className="font-display font-bold">{s.skill_name_es}</span>
                <div>
                  <SkillLevelBadge state={s.state} />
                </div>
                <p className="text-sm text-ink-muted">
                  {s.evidence_count} respuesta(s) evaluada(s) · {confidenceLabel(s.confidence)}. {s.rationale_es}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {p.recent_mistakes.length > 0 && (
        <Card aria-labelledby="mistakes-title">
          <CardTitle id="mistakes-title" className="mb-3 flex items-center gap-2">
            <IconChip Icon={History} tone="peach" /> Errores recientes
          </CardTitle>
          <ul className="flex flex-col gap-3">
            {p.recent_mistakes.map((m) => (
              <li key={m.attempt_id} className="border-b border-border pb-3 last:border-0" lang="en">
                <del className="decoration-error">{m.your_answer}</del> → <strong>{m.correction}</strong>
                <p className="text-sm text-ink-muted" lang="es-419">
                  {m.feedback_es}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {health.data?.app_env === "local" && <DevClock />}
    </div>
  );
}

/** Solo desarrollo: adelanta el reloj del servidor para probar el repaso diferido hoy mismo. */
function DevClock() {
  const { query, mutation } = useDevClock(true);
  const offset = query.data?.offset_days ?? 0;
  return (
    <section
      aria-labelledby="dev-title"
      className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-sm"
    >
      <h2 id="dev-title" className="flex items-center gap-2 font-semibold">
        <FlaskConical className="size-4" aria-hidden /> Herramienta de desarrollo (solo local)
      </h2>
      <p className="text-ink-muted">
        Simula el paso del tiempo en el servidor para probar los repasos sin esperar.
        {offset > 0 && ` Reloj adelantado ${offset.toFixed(0)} día(s).`}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabled={mutation.isPending} onClick={() => mutation.mutate({ advance_days: 1 })}>
          Adelantar 1 día
        </Button>
        {offset > 0 && (
          <Button size="sm" variant="ghost" disabled={mutation.isPending} onClick={() => mutation.mutate({ reset: true })}>
            Volver a la hora real
          </Button>
        )}
      </div>
    </section>
  );
}
