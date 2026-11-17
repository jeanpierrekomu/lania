import { useState } from 'react'
import { ArrowRight, BadgeCheck, BookOpen, Briefcase, Coffee, GraduationCap, Headphones, Mic, PenLine, PlaneTakeoff, Users, type LucideIcon } from 'lucide-react'
import { cn } from '@/ui/lib/cn'
import { Link } from '@/ui/router'
import { Lania } from '@/ui/components/illustrations/Lania'
import { Badge } from '@/ui/components/ui/Badge'
import { ButtonLink } from '@/ui/components/ui/Button'
import { Card } from '@/ui/components/ui/Card'
import { ProgressBar } from '@/ui/components/ui/Progress'
import { Eyebrow, Heading } from '@/ui/components/ui/Typography'
import { PageContainer, PageHeader } from '@/ui/components/layout/PageHeader'
import { ErrorState, LoadingState } from '@/components/ui/states'
import { useMissions } from '@/lib/api/queries'

const MISSION_ICON: Record<string, LucideIcon> = { briefcase: Briefcase, plane: PlaneTakeoff, users: Users, coffee: Coffee }
const STEP_ICON: Record<string, LucideIcon> = { lesson: GraduationCap, listening: Headphones, reading: BookOpen, writing: PenLine, speaking: Mic }
const STEP_LABEL: Record<string, string> = { lesson: 'Clase', listening: 'Escucha', reading: 'Lectura', writing: 'Escritura', speaking: 'Conversación' }

/** E · Misiones — situaciones reales; el avance sale de lo que hiciste de verdad. */
export function Missions() {
  const q = useMissions()
  const [selected, setSelected] = useState<string | null>(null)

  if (q.isPending) {
    return (
      <PageContainer wide>
        <LoadingState label="Cargando tus misiones…" />
      </PageContainer>
    )
  }
  if (q.isError) {
    return (
      <PageContainer wide>
        <ErrorState message="No pudimos cargar las misiones." onRetry={() => void q.refetch()} />
      </PageContainer>
    )
  }
  const list = q.data
  const mission = list.find((m) => m.slug === selected) ?? list[0]
  if (!mission) return null
  const next = mission.steps.find((st) => st.state === 'now')
  const Icon = MISSION_ICON[mission.icon] ?? Briefcase

  return (
    <PageContainer wide>
      <PageHeader
        eyebrow="Misiones"
        title="Practica situaciones reales"
        description="Cada misión junta una clase, un audio, una lectura, un texto y una conversación. Avanzas cuando lo logras de verdad, sin puntos ni rachas."
      />

      <div role="radiogroup" aria-label="Misiones" className="mt-8 grid gap-4 md:grid-cols-3">
        {list.map((m) => {
          const MIcon = MISSION_ICON[m.icon] ?? Briefcase
          const on = m.slug === mission.slug
          return (
            <button
              key={m.slug}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setSelected(m.slug)}
              className={cn('flex flex-col gap-3 rounded-3xl bg-surface p-5 text-left ring-2 transition-colors', on ? 'ring-primary' : 'ring-line hover:bg-mist')}
            >
              <span className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700">
                  <MIcon size={20} aria-hidden />
                </span>
                <span className="min-w-0 flex-1 font-bold text-ink">{m.title_es}</span>
              </span>
              <span className="flex flex-wrap gap-2">
                <Badge tone="dark">{m.level}</Badge>
                {m.recommended && <Badge tone="mint">Para tu objetivo</Badge>}
                {m.done === m.steps.length && (
                  <Badge tone="mint" icon={BadgeCheck}>
                    Completada
                  </Badge>
                )}
              </span>
              <ProgressBar value={m.done} max={m.steps.length} label={`${m.done} de ${m.steps.length} etapas`} size="xs" />
              <span className="text-xs font-semibold text-ink-soft">
                {m.done} de {m.steps.length} etapas
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card padding="lg" as="section" aria-labelledby="mission-title">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-white">
              <Icon size={26} aria-hidden />
            </span>
            <div>
              <Eyebrow>Misión · {mission.level}</Eyebrow>
              <Heading level={2} size="sm" id="mission-title" className="mt-1">
                {mission.title_es}
              </Heading>
              <p className="mt-1 text-ink-soft">{mission.situation_es}</p>
            </div>
          </div>
          <ol className="mt-6 space-y-3">
            {mission.steps.map((st, i) => {
              const SIcon = STEP_ICON[st.kind] ?? BookOpen
              return (
                <li key={`${st.kind}-${i}`}>
                  <Link
                    to={st.href}
                    className={cn(
                      'flex items-center gap-4 rounded-2xl p-4 ring-1 transition-colors hover:bg-mist',
                      st.state === 'now' ? 'bg-violet-50 ring-2 ring-primary' : 'ring-line',
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                        st.state === 'done' ? 'bg-mint-600 text-white' : st.state === 'now' ? 'bg-primary text-white' : 'bg-mist text-ink-soft',
                      )}
                    >
                      {st.state === 'done' ? <BadgeCheck size={18} aria-hidden /> : <SIcon size={18} aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                        Etapa {i + 1} · {STEP_LABEL[st.kind]}
                      </span>
                      <span className="block font-semibold text-ink">{st.title_es}</span>
                    </span>
                    <span className="text-sm font-semibold text-ink-soft">
                      {st.state === 'done' ? 'Lograda' : st.state === 'now' ? 'Siguiente' : 'Pendiente'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </Card>

        <Card variant="lavender" padding="lg" as="aside" className="h-fit">
          <span className="block h-20 w-20 overflow-hidden rounded-full bg-violet-200 ring-4 ring-white">
            <Lania crop="head" expression={next ? 'explaining' : 'celebrating'} />
          </span>
          <p className="mt-4 font-bold text-ink">{next ? 'Tu siguiente paso' : '¡Misión completada!'}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {next
              ? `${next.title_es}. Puedes hacer las etapas en otro orden si prefieres.`
              : 'Lo demostraste con tus respuestas, tu texto y tu conversación. Elige otra misión cuando quieras.'}
          </p>
          {next && (
            <ButtonLink to={next.href} className="mt-4" iconRight={ArrowRight}>
              Empezar
            </ButtonLink>
          )}
        </Card>
      </div>
    </PageContainer>
  )
}
