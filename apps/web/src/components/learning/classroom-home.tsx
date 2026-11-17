"use client";

import { ArrowRight, MessageCircleHeart, Repeat2 } from "lucide-react";

import { ErrorState, LoadingState } from "@/components/ui/states";
import { useMe, useNextMission } from "@/lib/api/queries";
import { Lania } from "@/ui/components/illustrations/Lania";
import { ButtonLink } from "@/ui/components/ui/Button";
import { Card } from "@/ui/components/ui/Card";
import { Eyebrow, Heading } from "@/ui/components/ui/Typography";

const KIND_LABEL = {
  lesson: "Tu siguiente clase",
  review: "Toca repasar",
  diagnostic: "Primero, conocerte",
  none: "Estás al día",
} as const;

const CTA = {
  lesson: "Entrar a la clase",
  review: "Empezar repaso",
  diagnostic: "Hacer el diagnóstico",
  none: "Practicar otra vez",
} as const;

/** Aula con Lania (datos reales): la misión que toca ahora y otras formas de practicar. */
export function ClassroomHome() {
  const next = useNextMission();
  const showAvatar = useMe().data?.preferences.show_avatar !== false;

  if (next.isPending) return <LoadingState label="Preparando tu aula…" />;
  if (next.isError) return <ErrorState message={next.error.message} onRetry={() => void next.refetch()} />;
  const mission = next.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Eyebrow>Aula con Lania</Eyebrow>
        <Heading level={1} size="xl" className="mt-2">
          Una idea a la vez, a tu ritmo
        </Heading>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Calentamiento, explicación corta y práctica con un segundo intento si fallas. Después, tus errores vuelven en
          repasos con ejercicios nuevos.
        </p>
      </div>

      <Card padding="lg" variant="lavender" className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-violet-800">{KIND_LABEL[mission.kind]}</p>
          <Heading level={2} size="lg">
            {mission.title_es}
          </Heading>
          <p className="text-ink">
            <span className="font-semibold">Por qué: </span>
            {mission.reason_es}
          </p>
          {mission.href && (
            <div className="pt-2">
              <ButtonLink to={mission.href} size="lg" iconRight={ArrowRight}>
                {CTA[mission.kind]}
              </ButtonLink>
            </div>
          )}
        </div>
        {showAvatar && (
          <Lania
            expression={mission.kind === "review" ? "thinking" : "explaining"}
            crop="portrait"
            className="mx-auto hidden w-44 sm:block"
          />
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card padding="lg" className="flex flex-col gap-2">
          <Repeat2 size={22} className="text-violet-600" aria-hidden />
          <Heading level={2} size="sm">
            Repaso
          </Heading>
          <p className="text-sm text-ink-soft">Tus errores vuelven días después, en ejercicios distintos.</p>
          <div className="mt-auto pt-3">
            <ButtonLink to="/review" variant="secondary" size="sm" iconRight={ArrowRight}>
              Ir al repaso
            </ButtonLink>
          </div>
        </Card>
        <Card padding="lg" className="flex flex-col gap-2">
          <MessageCircleHeart size={22} className="text-violet-600" aria-hidden />
          <Heading level={2} size="sm">
            Conversar con Lania
          </Heading>
          <p className="text-sm text-ink-soft">Pregúntale una duda o practica frases en inglés o en español.</p>
          <div className="mt-auto pt-3">
            <ButtonLink to="/tutor" variant="secondary" size="sm" iconRight={ArrowRight}>
              Abrir el chat
            </ButtonLink>
          </div>
        </Card>
      </div>
    </div>
  );
}
