import { ArrowRight, BookOpen } from "lucide-react";

import { LaniaSays } from "@/components/mascot/lania-mascot";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Schemas } from "@/lib/api/client";
import { useMe } from "@/lib/api/queries";

/** Explicación mínima: un concepto, una analogía, 2–3 ejemplos ES+EN (spec §3.1 paso 2). */
export function LessonTheory({ content, onContinue }: { content: Schemas["LessonContentOut"]; onContinue: () => void }) {
  const showAvatar = useMe().data?.preferences.show_avatar !== false;
  return (
    <div className="flex flex-col gap-5">
      <p className="flex items-center gap-2 font-semibold text-primary">
        <BookOpen className="size-5" aria-hidden /> Explicación mínima
      </p>
      <LaniaSays pose="explaining" showAvatar={showAvatar} size={72}>
        <p className="text-lg">{content.concept_es}</p>
      </LaniaSays>
      <Card className="flex flex-col gap-5">
      <p className="rounded-2xl bg-accent-soft p-4">
        <span className="font-semibold">Piénsalo así: </span>
        {content.analogy_es}
      </p>
      <ul className="flex flex-col gap-3">
        {content.examples.map((ex) => (
          <li key={ex.en} className="rounded-2xl border border-border p-4">
            <p className="font-display text-xl font-semibold" lang="en">
              {ex.en}
            </p>
            <p className="text-ink-muted">{ex.es}</p>
          </li>
        ))}
      </ul>
      {content.spelling_es && content.spelling_es.length > 0 && (
        <div>
          <p className="font-semibold">Ortografía de la -s</p>
          <ul className="list-disc pl-6 text-ink-muted">
            {content.spelling_es.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {content.common_trap_es && (
        <p className="rounded-2xl bg-error-soft p-4">
          <span className="font-semibold">Trampa común: </span>
          {content.common_trap_es}
        </p>
      )}
      </Card>
      <div>
        <Button size="lg" onClick={onContinue}>
          Ir a la práctica <ArrowRight aria-hidden />
        </Button>
      </div>
    </div>
  );
}
