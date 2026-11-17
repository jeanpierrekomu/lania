"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import type { Schemas } from "@/lib/api/client";
import { useAdminFeedback, useAiUsage, useDisputes, useMe, useResolveDispute } from "@/lib/api/queries";

const STAFF = ["content_editor", "teacher_reviewer", "admin"];

/** Panel docente: disputas de corrección («esta corrección no es justa») y uso/costo de IA. */
export function QaPanel() {
  const me = useMe();
  const [status, setStatus] = useState<"open" | "accepted" | "rejected">("open");
  const isStaff = !!me.data && STAFF.includes(me.data.role);
  if (me.isPending) return <LoadingState />;
  if (!isStaff) {
    return (
      <Card>
        <CardTitle>Solo para el equipo docente</CardTitle>
        <p className="text-ink-muted">Tu cuenta no tiene permisos de revisión.</p>
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Revisión de correcciones</h1>
      <AiUsageCard />
      <FeedbackCard />
      <div role="tablist" aria-label="Estado" className="flex gap-2">
        {(["open", "accepted", "rejected"] as const).map((s) => (
          <Button
            key={s}
            role="tab"
            aria-selected={status === s}
            variant={status === s ? "primary" : "secondary"}
            size="sm"
            onClick={() => setStatus(s)}
          >
            {{ open: "Abiertas", accepted: "Aceptadas", rejected: "Rechazadas" }[s]}
          </Button>
        ))}
      </div>
      <DisputeList status={status} />
    </div>
  );
}

function AiUsageCard() {
  const usage = useAiUsage();
  if (!usage.data) return null;
  const u = usage.data;
  return (
    <Card>
      <CardTitle className="mb-2 text-lg">Uso de IA este mes</CardTitle>
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-ink-muted">Llamadas</dt>
          <dd className="text-xl font-bold">{u.requests}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Salidas inválidas / errores</dt>
          <dd className="text-xl font-bold">
            {u.invalid_output} / {u.errors}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Latencia p50 / p95</dt>
          <dd className="text-xl font-bold">
            {u.p50_latency_ms ?? "–"} / {u.p95_latency_ms ?? "–"} ms
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Costo estimado</dt>
          <dd className="text-xl font-bold">
            {u.estimated_cost_usd === null ? "Sin precio configurado" : `US$ ${u.estimated_cost_usd.toFixed(4)}`}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-ink-muted">
        Tokens: {u.input_tokens} entrada · {u.output_tokens} salida.
        {!u.cost_known_for_all && u.requests > 0 && " El costo no incluye llamadas sin precio configurado."}
      </p>
    </Card>
  );
}

function DisputeList({ status }: { status: "open" | "accepted" | "rejected" }) {
  const disputes = useDisputes(status);
  if (disputes.isPending) return <LoadingState />;
  if (disputes.isError) return <ErrorState message={disputes.error.message} />;
  if (!disputes.data.length) return <p className="text-ink-muted">No hay disputas en este estado.</p>;
  return (
    <ul className="flex flex-col gap-4">
      {disputes.data.map((d) => (
        <DisputeCard key={d.id} dispute={d} />
      ))}
    </ul>
  );
}

function DisputeCard({ dispute: d }: { dispute: Schemas["DisputeReviewOut"] }) {
  const resolve = useResolveDispute();
  const [note, setNote] = useState("");
  return (
    <li>
      <Card className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
          <Badge>{d.item_external_id}</Badge>
          <span>
            {d.rubric_version} · {d.grader_version} · regla {d.matched_rule ?? "—"}
          </span>
        </div>
        <p className="font-display text-lg font-semibold" lang="en">
          {d.prompt_en}
        </p>
        <p>
          <span className="font-semibold">Respuesta del alumno: </span>
          <span lang="en">{d.learner_answer}</span> <Badge tone="error">{d.verdict ?? "sin veredicto"}</Badge>
        </p>
        <p>
          <span className="font-semibold">Esperada: </span>
          <span lang="en">{d.expected_answer}</span>
        </p>
        <p className="rounded-xl bg-surface-2 p-3">
          <span className="font-semibold">Motivo del alumno: </span>
          {d.reason}
        </p>
        {d.status === "open" && (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => e.preventDefault()}
            aria-label={`Resolver disputa de ${d.item_external_id}`}
          >
            <label htmlFor={`note-${d.id}`} className="text-sm font-semibold">
              Nota de revisión (queda en la auditoría)
            </label>
            <textarea
              id={`note-${d.id}`}
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-xl border-2 border-border bg-surface p-2"
            />
            {resolve.isError && <p className="text-sm text-error">{resolve.error.message}</p>}
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={note.trim().length < 3 || resolve.isPending}
                onClick={() => resolve.mutate({ id: d.id, body: { decision: "accept", note } })}
              >
                Aceptar: la respuesta es válida
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={note.trim().length < 3 || resolve.isPending}
                onClick={() => resolve.mutate({ id: d.id, body: { decision: "reject", note } })}
              >
                Mantener la corrección
              </Button>
            </div>
          </form>
        )}
      </Card>
    </li>
  );
}


const FEEDBACK_KIND: Record<string, string> = { bug: "Error", content: "Contenido", idea: "Idea", other: "Otro" };

function FeedbackCard() {
  const feedback = useAdminFeedback();
  if (!feedback.data) return null;
  return (
    <Card>
      <CardTitle className="mb-2 text-lg">Comentarios del piloto ({feedback.data.length})</CardTitle>
      {feedback.data.length === 0 ? (
        <p className="text-sm text-ink-muted">Todavía no hay comentarios.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {feedback.data.map((f) => (
            <li key={f.id} className="py-3 text-sm">
              <p className="text-ink-muted">
                {new Date(f.created_at).toLocaleString("es")} · {FEEDBACK_KIND[f.kind]} · {f.author ?? "Sin nombre"}
                {f.page ? ` · ${f.page}` : ""}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{f.message}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
