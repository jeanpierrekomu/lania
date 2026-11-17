"use client";

import { ArrowRight, ClipboardCheck, Pause } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { QuestionRenderer, type Answer } from "@/components/learning/question-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { LaniaSays } from "@/components/mascot/lania-mascot";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { ApiError, type Schemas } from "@/lib/api/client";
import { useAnswerDiagnostic, useDiagnosticCurrent, useMe, useStartDiagnostic } from "@/lib/api/queries";

type State = Schemas["DiagnosticStateOut"];

/** Diagnóstico en modo examen: sin pistas ni correcciones hasta el informe final (spec §2.2). */
export function DiagnosticPlayer() {
  const router = useRouter();
  const current = useDiagnosticCurrent();
  const start = useStartDiagnostic();
  const answer = useAnswerDiagnostic();
  const [local, setState] = useState<State | null>(null);
  const state = local ?? current.data?.active ?? null;
  const [blockSeen, setBlockSeen] = useState<string | null>(null);
  const showAvatar = useMe().data?.preferences.show_avatar !== false;
  const submissionId = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    if (state?.status === "completed") router.replace(`/diagnostic/results/${state.run_id}`);
  }, [state, router]);

  if (current.isPending) return <LoadingState label="Buscando tu diagnóstico…" />;
  if (current.isError) return <ErrorState message={current.error.message} onRetry={() => void current.refetch()} />;

  if (!state) {
    const lastRun = current.data.last_completed_run_id;
    return (
      <div className="flex flex-col gap-5">
        <Eyebrow>Diagnóstico inicial</Eyebrow>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Veamos qué ya sabes, habilidad por habilidad
        </h1>
        <LaniaSays pose="thinking" showAvatar={showAvatar} size={72}>
          <p className="text-lg">
            Quiero conocerte antes de enseñarte. No hay respuestas «malas»: cada una me dice qué practicar primero.
          </p>
        </LaniaSays>
        <ul className="list-disc space-y-1 pl-6 text-lg">
          <li>Tres bloques: gramática y vocabulario, lectura y escritura. Unos 20–30 minutos.</li>
          <li>Es modo examen: no hay pistas ni correcciones hasta el final.</li>
          <li>
            Si no sabes algo, elige <strong>«No lo sé»</strong>: nos ayuda más que adivinar.
          </li>
          <li>Puedes pausar cuando quieras y retomar exactamente donde quedaste.</li>
        </ul>
        <p className="rounded-2xl bg-surface-2 p-4 text-sm">
          El resultado es una estimación orientativa para planificar tus clases. No es un nivel certificado ni equivale a
          ningún examen oficial.
        </p>
        {start.isError && <ErrorState message={start.error.message} />}
        <div className="flex flex-wrap gap-3">
          <Button size="lg" disabled={start.isPending} onClick={() => start.mutate(undefined, { onSuccess: setState })}>
            <ClipboardCheck aria-hidden /> {lastRun ? "Hacer otro diagnóstico" : "Empezar diagnóstico"}
          </Button>
          {lastRun && (
            <Button asChild variant="secondary" size="lg">
              <Link href={`/diagnostic/results/${lastRun}`}>Ver mi último informe</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (state.status === "completed" || !state.item || !state.block) return <LoadingState label="Preparando tu informe…" />;

  const block = state.block;
  if (state.first_in_block && blockSeen !== block.id) {
    return (
      <Card className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-ink-muted">
          Bloque {block.index + 1} de {block.total_blocks}
        </p>
        <CardTitle className="text-2xl">{block.title_es}</CardTitle>
        <p className="text-lg">{block.intro_es}</p>
        <div>
          <Button size="lg" onClick={() => setBlockSeen(block.id)}>
            Empezar bloque <ArrowRight aria-hidden />
          </Button>
        </div>
      </Card>
    );
  }

  function send(body: Answer | { unsure: true }) {
    if (!state?.item) return;
    answer.mutate(
      {
        runId: state.run_id,
        body: { exercise_id: state.item.id, client_submission_id: submissionId.current, ...body },
      },
      {
        onSuccess: (next) => {
          try {
            window.sessionStorage.removeItem(`draft:diag:${state.item?.id}`);
          } catch {
            /* ignorar */
          }
          submissionId.current = crypto.randomUUID();
          setState(next);
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink-muted">
          {block.title_es} · {state.answered} de {state.total} respondidas
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
        aria-label="Progreso del diagnóstico"
        aria-valuemin={0}
        aria-valuemax={state.total}
        aria-valuenow={state.answered}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${(state.answered / state.total) * 100}%` }} />
      </div>
      <QuestionRenderer
        key={state.item.id}
        exercise={state.item}
        mode="diagnostic"
        disabled={answer.isPending}
        onSubmit={send}
        onUnsure={() => send({ unsure: true })}
        draftKey={`draft:diag:${state.item.id}`}
      />
      {answer.isError && (
        <ErrorState
          message={`${answer.error.message} Tu respuesta no se perdió: vuelve a enviarla.`}
          onRetry={() => {
            answer.reset();
            if (answer.error instanceof ApiError && answer.error.status === 409) void current.refetch().then((r) => r.data?.active && setState(r.data.active));
          }}
        />
      )}
    </div>
  );
}
