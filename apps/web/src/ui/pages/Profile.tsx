import { Link } from '@/ui/router'
import { ArrowRight, BadgeCheck, CalendarDays, ClipboardCheck, Flame, Info, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/ui/lib/cn'
import { Lania } from '@/ui/components/illustrations/Lania'
import { Badge } from '@/ui/components/ui/Badge'
import { Button, ButtonLink } from '@/ui/components/ui/Button'
import { Card } from '@/ui/components/ui/Card'
import { Eyebrow, Heading } from '@/ui/components/ui/Typography'
import { PageContainer } from '@/ui/components/layout/PageHeader'
import { ErrorState, LoadingState } from '@/components/ui/states'
import { useDiagnosticCurrent, useMe, useNextMission, useProgress } from '@/lib/api/queries'
import { useLearner } from '@/ui/state/learner'
import { useUi } from '@/ui/state/ui'
import { SKILLS, TONE_CLASSES } from '@/ui/data/skills'
import { GOAL_BY_ID } from '@/ui/data/content'

const STATE_LABEL: Record<string, { label: string; tone: 'mint' | 'violet' | 'amber' | 'neutral' }> = {
  proficient: { label: 'Dominada', tone: 'mint' },
  developing: { label: 'En progreso', tone: 'violet' },
  emerging: { label: 'Empezando', tone: 'amber' },
  review_due: { label: 'Toca repasar', tone: 'amber' },
  not_assessed: { label: 'Sin datos', tone: 'neutral' },
}

const dateFmt = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' })
const monthFmt = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' })

function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Últimas 4 semanas: un cuadro por día, marcado si hubo práctica real ese día. */
function PracticeCalendar({ days }: { days: string[] }) {
  const have = new Set(days)
  const today = new Date()
  const cells = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (27 - i))
    return d
  })
  return (
    <ol className="grid grid-cols-7 gap-1.5" aria-label="Días con práctica en las últimas 4 semanas">
      {cells.map((d) => {
        const on = have.has(isoDay(d))
        return (
          <li
            key={isoDay(d)}
            title={`${dateFmt.format(d)}${on ? ' · practicaste' : ''}`}
            aria-label={`${dateFmt.format(d)}: ${on ? 'practicaste' : 'sin práctica'}`}
            className={cn('aspect-square rounded-lg', on ? 'bg-primary' : 'bg-mist')}
          />
        )
      })}
    </ol>
  )
}

/** J · Perfil y progreso académico, con datos reales de la cuenta. */
export function Profile() {
  const { learner } = useLearner()
  const { openPreferences } = useUi()
  const me = useMe()
  const progress = useProgress()
  const next = useNextMission()
  const current = useDiagnosticCurrent()
  const goal = GOAL_BY_ID[learner.goal]
  const diag = learner.diagnostic
  const lastRun = current.data?.last_completed_run_id

  if (progress.isPending || me.isPending) {
    return (
      <PageContainer wide>
        <LoadingState label="Cargando tu progreso…" />
      </PageContainer>
    )
  }
  if (progress.isError || me.isError) {
    return (
      <PageContainer wide>
        <ErrorState message="No pudimos cargar tu progreso." onRetry={() => void progress.refetch()} />
      </PageContainer>
    )
  }

  const p = progress.data
  const since = me.data.onboarding?.onboarded_at
  const mastered = p.skills.filter((s) => s.state === 'proficient')

  return (
    <PageContainer wide className="space-y-6">
      <Card padding="lg" className="relative overflow-hidden">
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <span className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-mint-100 ring-4 ring-white shadow-soft">
            <Lania crop="head" expression="welcome" />
          </span>
          <div className="min-w-0 flex-1">
            <Eyebrow>Mi progreso</Eyebrow>
            <Heading level={1} size="lg" className="mt-1">
              {learner.name || 'Tu cuenta'}
            </Heading>
            <p className="mt-1 text-ink-soft">
              {goal ? (
                <>
                  Objetivo: <strong className="text-ink">{goal.label}</strong>
                </>
              ) : (
                <Link to="/onboarding" className="font-semibold text-violet-700 underline-offset-4 hover:underline">
                  Cuéntale a Lania tu objetivo
                </Link>
              )}
              {since && <> · Estudiando desde {monthFmt.format(new Date(since))}</>}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="flex items-center gap-3">
              <span className="grid h-16 min-w-16 place-items-center rounded-3xl bg-ink px-4 font-display text-2xl font-extrabold text-white">
                {diag?.overall ?? '—'}
              </span>
              <p className="max-w-48 text-sm text-ink-soft">
                {diag
                  ? `Nivel estimado con tu diagnóstico. Llevas ${p.total_attempts} respuestas corregidas.`
                  : 'Haz el diagnóstico para estimar tu nivel por habilidad.'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" icon={SlidersHorizontal} onClick={openPreferences}>
                Preferencias
              </Button>
              <ButtonLink to="/diagnostic" variant="ghost" size="sm" icon={RotateCcw}>
                {diag ? 'Repetir diagnóstico' : 'Hacer diagnóstico'}
              </ButtonLink>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card padding="lg" as="section" aria-labelledby="history-title" className="lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Heading level={2} size="sm" id="history-title">
                Nivel por habilidad
              </Heading>
              <p className="mt-1 text-sm text-ink-soft">
                {diag ? `Según tu diagnóstico del ${dateFmt.format(new Date(diag.completedAt))}.` : 'Aún no hay diagnóstico.'}
              </p>
            </div>
            <Badge tone="neutral" icon={Info}>
              Estimaciones, no certificación
            </Badge>
          </div>
          <ul className="mt-6 space-y-4">
            {SKILLS.map((s) => {
              const est = diag?.skills[s.id]
              const t = TONE_CLASSES[s.tone]
              return (
                <li key={s.id} className="flex items-center gap-3">
                  <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', t.soft, t.fg)}>
                    <s.icon size={18} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-ink">{s.label}</p>
                    <p className="text-xs text-ink-soft">{est ? est.evidence : 'Todavía no lo medimos'}</p>
                  </div>
                  {est ? (
                    <span className="flex items-center gap-2">
                      <Badge tone={est.confidence === 'baja' ? 'amber' : 'mint'}>Confianza {est.confidence}</Badge>
                      <span className="grid h-10 min-w-12 place-items-center rounded-xl bg-ink px-2 font-display font-extrabold text-white">
                        {est.level}
                      </span>
                    </span>
                  ) : (
                    <Badge tone="neutral">Sin datos</Badge>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>

        <Card padding="lg" as="section" aria-labelledby="activity-title">
          <div className="flex items-center justify-between">
            <Heading level={2} size="sm" id="activity-title">
              Tu constancia
            </Heading>
            <Flame size={20} className="text-coral-600" aria-hidden />
          </div>
          <p className="mt-1 text-sm text-ink-soft">Días en que practicaste de verdad: ejercicios o conversación con Lania.</p>
          <p className="mt-4 font-display text-3xl font-extrabold text-ink">
            {p.streak_days} {p.streak_days === 1 ? 'día seguido' : 'días seguidos'}
          </p>
          <p className="text-sm text-ink-soft">{p.practice_days.length} días con práctica en los últimos 60</p>
          <div className="mt-4">
            <PracticeCalendar days={p.practice_days} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card padding="lg" as="section" aria-labelledby="mastery-title" className="lg:col-span-2">
          <Heading level={2} size="sm" id="mastery-title">
            Temas que estás aprendiendo
          </Heading>
          <p className="mt-1 text-sm text-ink-soft">
            Un tema se marca como dominado solo cuando aciertas sin ayuda en días distintos y pasas sus repasos.
          </p>
          {p.skills.length === 0 ? (
            <p className="mt-5 text-sm text-ink-soft">Cuando hagas tu primera clase verás aquí cómo avanzas en cada tema.</p>
          ) : (
            <ul className="mt-5 divide-y divide-line">
              {p.skills.map((s) => {
                const st = STATE_LABEL[s.state] ?? STATE_LABEL.not_assessed
                return (
                  <li key={s.skill_code} className="flex flex-wrap items-center gap-3 py-3.5">
                    {s.state === 'proficient' && <BadgeCheck size={20} className="shrink-0 text-mint-600" aria-hidden />}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-ink">{s.skill_name_es}</p>
                      <p className="text-sm text-ink-soft">{s.rationale_es}</p>
                    </div>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </li>
                )
              })}
            </ul>
          )}
          {mastered.length > 0 && (
            <p className="mt-4 text-sm font-semibold text-mint-700">
              Ya dominas {mastered.length} {mastered.length === 1 ? 'tema' : 'temas'}.
            </p>
          )}
        </Card>

        <Card padding="lg" as="section" aria-labelledby="reviews-title">
          <div className="flex items-center justify-between">
            <Heading level={2} size="sm" id="reviews-title">
              Próximos repasos
            </Heading>
            <CalendarDays size={20} className="text-violet-600" aria-hidden />
          </div>
          {p.reviews.length === 0 ? (
            <p className="mt-5 text-sm text-ink-soft">No tienes repasos pendientes. Lania los programa cuando aprendes algo nuevo.</p>
          ) : (
            <ol className="mt-5 space-y-3">
              {p.reviews.map((r) => (
                <li key={r.id} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs font-bold uppercase text-ink-soft">
                    {r.is_due ? 'Hoy' : dateFmt.format(new Date(r.due_at))}
                  </span>
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', r.is_due ? 'bg-coral-500' : 'bg-violet-400')} aria-hidden />
                  <span className="min-w-0 flex-1 text-sm font-semibold text-ink">{r.skill_name_es}</span>
                </li>
              ))}
            </ol>
          )}
          {p.reviews.some((r) => r.is_due) && (
            <ButtonLink to="/review" size="sm" className="mt-5" iconRight={ArrowRight}>
              Repasar ahora
            </ButtonLink>
          )}
        </Card>
      </div>

      <Card padding="lg" as="section" aria-labelledby="errors-title">
        <Heading level={2} size="sm" id="errors-title">
          Tus errores recientes
        </Heading>
        <p className="mt-1 text-sm text-ink-soft">Lania los vuelve a traer en tus repasos, con ejercicios distintos.</p>
        {p.recent_mistakes.length === 0 ? (
          <p className="mt-5 text-sm text-ink-soft">Sin errores recientes. Cuando te equivoques, aparecerán aquí con su corrección.</p>
        ) : (
          <ul className="mt-5 divide-y divide-line">
            {p.recent_mistakes.map((m) => (
              <li key={m.attempt_id} className="grid gap-1 py-3.5 sm:grid-cols-[1fr_1fr]">
                <div className="min-w-0">
                  <p className="text-sm text-ink-soft">{m.prompt_en}</p>
                  <p className="font-semibold text-ink">
                    <span className="text-coral-700 line-through">{m.your_answer}</span> → {m.correction}
                  </p>
                </div>
                <p className="text-sm text-ink-soft">{m.feedback_es}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding="lg" as="section" aria-labelledby="assess-title">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={20} className="text-violet-600" aria-hidden />
          <Heading level={2} size="sm" id="assess-title">
            Diagnóstico
          </Heading>
        </div>
        {lastRun && diag ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-ink">
              Último diagnóstico: <strong>{dateFmt.format(new Date(diag.completedAt))}</strong> · nivel estimado{' '}
              <Badge tone="violet">{diag.overall}</Badge>
            </p>
            <ButtonLink to={`/diagnostic/results/${lastRun}`} variant="secondary" size="sm" iconRight={ArrowRight}>
              Ver informe completo
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-ink-soft">Aún no has hecho el diagnóstico. Toma unos 12 minutos y puedes pausarlo.</p>
            <ButtonLink to="/diagnostic" size="sm" iconRight={ArrowRight}>
              Empezar diagnóstico
            </ButtonLink>
          </div>
        )}
      </Card>

      {next.data && next.data.kind !== 'none' && next.data.href && (
        <Card variant="lavender" padding="lg" as="section" aria-labelledby="next-title">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-violet-200 ring-4 ring-white">
              <Lania crop="head" expression="explaining" />
            </span>
            <div className="min-w-0 flex-1">
              <Eyebrow>Lania recomienda</Eyebrow>
              <Heading level={2} size="sm" id="next-title" className="mt-1">
                {next.data.title_es}
              </Heading>
              <p className="mt-1 text-sm text-ink-soft">{next.data.reason_es}</p>
            </div>
            <ButtonLink to={next.data.href} iconRight={ArrowRight}>
              Empezar
            </ButtonLink>
          </div>
        </Card>
      )}

      <p className="flex items-start gap-2 text-sm text-ink-soft">
        <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
        Cómo medimos: solo mostramos lo que se sustenta con tus actividades corregidas. Los niveles son aproximados y se
        ajustan con nueva evidencia. No hay puntos ni castigos.
      </p>
    </PageContainer>
  )
}
