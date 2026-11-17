"use client";

import { ArrowRight, Info, Loader2, MessageCircleQuestion, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ErrorState, LoadingState } from "@/components/ui/states";
import type { Schemas } from "@/lib/api/client";
import { useDiagnosticReport } from "@/lib/api/queries";
import { TUTOR_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

type Section = Schemas["SectionOut"];

const DOMAINS: { id: string; title: string }[] = [
  { id: "grammar", title: "Gramática" },
  { id: "vocabulary", title: "Vocabulario" },
  { id: "reading", title: "Lectura" },
  { id: "writing", title: "Escritura" },
];

const STEPS = ["below_a1", "a1", "a2"] as const;
const CRITERIA_ES: Record<string, string> = {
  task_fulfillment: "Cumplir la tarea",
  accuracy: "Precisión",
  coherence: "Coherencia",
  range: "Variedad",
};
const CONFIDENCE_ES = { low: "confianza baja", medium: "confianza media", high: "confianza alta" } as const;

/** Escala de 3 tramos (no porcentajes): evita aparentar una precisión que no tenemos. */
function BandScale({ band }: { band: Section["band"] }) {
  const reached = STEPS.indexOf(band as (typeof STEPS)[number]);
  if (reached < 0) return null;
  return (
    <div className="flex gap-1" aria-hidden>
      {STEPS.map((step, i) => (
        <span
          key={step}
          className={cn("h-2 w-10 rounded-full", i <= reached ? "bg-primary" : "bg-surface-2")}
        />
      ))}
    </div>
  );
}

function bandTone(band: Section["band"]) {
  return band === "a2" ? "success" : band === "a1" ? "primary" : band === "below_a1" ? "accent" : "neutral";
}

export function DiagnosticReport() {
  const { runId } = useParams<{ runId: string }>();
  const report = useDiagnosticReport(runId);

  if (report.isPending) return <LoadingState label="Preparando tu informe…" />;
  if (report.isError) return <ErrorState message={report.error.message} onRetry={() => void report.refetch()} />;
  const r = report.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-2">
        <Eyebrow>Tu informe de diagnóstico</Eyebrow>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Así está tu inglés hoy</h1>
        <p className="mt-2 text-ink-muted">
          Cada habilidad se mide por separado. Es una foto orientativa para decidir qué practicar primero.
        </p>
      </div>

      {r.pending_evaluations > 0 && (
        <p role="status" className="flex items-center gap-2 rounded-2xl bg-primary-soft p-4">
          <Loader2 className="size-5 animate-spin" aria-hidden /> Estamos evaluando tu escritura. Esta página se
          actualiza sola.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle className="mb-2 flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-success" aria-hidden /> Lo que ya haces
          </CardTitle>
          <ul className="list-disc space-y-1 pl-5">
            {r.strengths_es.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle className="mb-2 flex items-center gap-2 text-lg">
            <Target className="size-5 text-accent-ink" aria-hidden /> Lo que necesitas
          </CardTitle>
          {r.needs_es.length ? (
            <ul className="list-disc space-y-1 pl-5">
              {r.needs_es.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-muted">En lo que medimos no apareció una brecha clara. ¡Toca subir de nivel!</p>
          )}
        </Card>
      </div>

      {r.missions.length > 0 && (
        <Card aria-labelledby="missions-title">
          <CardTitle id="missions-title" className="mb-3">
            Tus primeras misiones
          </CardTitle>
          <ol className="flex flex-col gap-3">
            {r.missions.map((m, i) => (
              <li key={m.skill_code} className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  <span className="font-semibold">
                    {i + 1}. {m.title_es}
                  </span>
                  <span className="block text-sm text-ink-muted">{m.why_es}</span>
                </span>
                {m.available && m.href ? (
                  <Button asChild size="sm">
                    <Link href={m.href}>
                      Ir a la clase <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                ) : (
                  <Badge>Clase en preparación</Badge>
                )}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {DOMAINS.map((d) => {
        const sections = r.sections.filter((s) => s.domain === d.id);
        if (!sections.length) return null;
        return (
          <Card key={d.id} aria-labelledby={`domain-${d.id}`}>
            <CardTitle id={`domain-${d.id}`} className="mb-3">
              {d.title}
            </CardTitle>
            <ul className="flex flex-col gap-4">
              {sections.map((s) => (
                <li key={s.skill_code} className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{s.skill_name_es}</span>
                    <Badge tone={bandTone(s.band)}>{s.band_label_es}</Badge>
                    <BandScale band={s.band} />
                  </div>
                  <p className="text-sm text-ink-muted">
                    {s.notes_es} <span className="whitespace-nowrap">({CONFIDENCE_ES[s.confidence]})</span>
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}

      {r.writing.map((w, i) => (
        <Card key={w.exercise_id} aria-labelledby={`writing-${i}`} className="flex flex-col gap-3">
          <CardTitle id={`writing-${i}`} className="text-lg">
            Tu texto {i + 1}
          </CardTitle>
          <p className="text-sm text-ink-muted" lang="en">
            {w.task_en}
          </p>
          <blockquote className="rounded-2xl bg-surface-2 p-4 whitespace-pre-line" lang="en">
            {w.your_text}
          </blockquote>
          {w.status === "pending" ? (
            <p className="flex items-center gap-2 text-ink-muted">
              <Loader2 className="size-4 animate-spin" aria-hidden /> En evaluación…
            </p>
          ) : (
            <p>{w.feedback_es}</p>
          )}
          {w.criteria && (
            <dl className="grid gap-2 sm:grid-cols-2">
              {Object.entries(w.criteria).map(([name, c]) => (
                <div key={name} className="rounded-xl border border-border p-3">
                  <dt className="font-semibold">
                    {CRITERIA_ES[name] ?? name}: {c.score}/3
                  </dt>
                  <dd className="text-sm text-ink-muted">{c.comment_es}</dd>
                </div>
              ))}
            </dl>
          )}
          {w.errors.length > 0 && (
            <ul className="flex flex-col gap-2">
              {w.errors.map((e) => (
                <li key={`${e.span}-${e.minimal_correction}`} className="text-sm">
                  <span lang="en">
                    <del className="decoration-error">{e.span}</del> → <strong>{e.minimal_correction}</strong>
                  </span>
                  <span className="block text-ink-muted">{e.explanation_es}</span>
                </li>
              ))}
            </ul>
          )}
          {w.natural_version_en && (
            <details className="rounded-xl border border-border p-3">
              <summary className="cursor-pointer font-semibold">Ver una versión más natural</summary>
              <p className="mt-2" lang="en">
                {w.natural_version_en}
              </p>
            </details>
          )}
          {w.notes_es.map((n) => (
            <p key={n} className="text-sm text-ink-muted">
              {n}
            </p>
          ))}
        </Card>
      ))}

      <Card className="flex flex-col gap-2 bg-surface-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Info className="size-5" aria-hidden /> Cómo leer este informe
        </CardTitle>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {[...r.caveats_es, ...r.not_assessed_es].map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        {r.confirmation_suggested && (
          <p className="text-sm font-semibold">
            Algunas habilidades quedaron en el límite entre A1 y A2: en tus próximas prácticas lo confirmaremos.
          </p>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/app">Ir a mi inicio</Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/tutor">
            <MessageCircleQuestion aria-hidden /> Hablar del resultado con {TUTOR_NAME}
          </Link>
        </Button>
      </div>
    </div>
  );
}
