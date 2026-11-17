import { useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  CalendarClock,
  Check,
  ChevronRight,
  Clock,
  Info,
  KeyRound,
  Medal,
  Play,
  Repeat,
  Shuffle,
  Target,
  Users,
} from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { greeting } from '@/app/lib/tone'
import { Lania } from '@/app/components/illustrations/Lania'
import { PersonAvatar } from '@/app/components/illustrations/PersonAvatar'
import { Blob, Spark } from '@/app/components/illustrations/Decor'
import { Badge } from '@/app/components/ui/Badge'
import { Button, ButtonLink } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { Modal } from '@/app/components/ui/Modal'
import { ProgressBar } from '@/app/components/ui/Progress'
import { Eyebrow, Heading } from '@/app/components/ui/Typography'
import { PageContainer } from '@/app/components/layout/PageHeader'
import { useLearner } from '@/app/state/learner'
import { usePreferences } from '@/app/state/preferences'
import { SKILLS, SKILL_BY_ID, TONE_CLASSES } from '@/app/data/skills'
import { GOAL_BY_ID, HISTORY, REVIEWS } from '@/app/data/content'
import { ROOMS } from '@/app/data/rooms'
import { PEOPLE } from '@/app/data/people'

const NEXT_LEVEL: Record<string, string> = { A1: 'A2', A2: 'B1', 'A2+': 'B1', B1: 'B2', 'B1+': 'B2', B2: 'C1', 'B2+': 'C1', C1: 'C2' }

const PLANS = [
  { id: 'full', title: 'Lección completa', desc: 'El pasado simple con Lania + práctica oral.', minutes: 15, icon: Play, to: '/app/aula' },
  { id: 'review', title: 'Solo repasar', desc: 'Tus 3 repasos pendientes, sin contenido nuevo.', minutes: 5, icon: Repeat, to: '/app/aula' },
  { id: 'talk', title: 'Conversar un rato', desc: 'Speaking Lab con el tema que elijas.', minutes: 10, icon: Shuffle, to: '/app/speaking' },
]

function today() {
  const s = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function Dashboard() {
  const { learner } = useLearner()
  const { prefs } = usePreferences()
  const [planOpen, setPlanOpen] = useState(false)
  const goal = GOAL_BY_ID[learner.goal] ?? GOAL_BY_ID.entrevistas
  const GoalIcon = goal.icon ?? Target
  const rooms = ROOMS.filter((r) => r.status !== 'scheduled').slice(0, 2)

  return (
    <PageContainer className="space-y-6 lg:space-y-8">
      {/* Greeting */}
      <section className="relative overflow-hidden rounded-4xl bg-violet-100" aria-labelledby="greeting">
        <Blob className="pointer-events-none absolute -right-16 -top-10 h-[130%] w-[60%] text-violet-200 focus-hide max-md:hidden" />
        <div className="relative grid items-end gap-2 md:grid-cols-[1fr_auto]">
          <div className="p-6 sm:p-8 lg:p-10">
            <Eyebrow>{today()} · Sesión de {learner.sessionMinutes} min</Eyebrow>
            <Heading level={1} size="xl" id="greeting" className="mt-3">
              Hola, {learner.name}.
            </Heading>
            <p className="reading mt-3 max-w-xl text-lg text-ink">
              <span className="font-semibold text-violet-800">Lania: </span>
              {greeting(learner.teacherStyle, learner.name)}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <ButtonLink to="/app/aula" size="lg" icon={Play}>
                Continuar aprendiendo
              </ButtonLink>
              <div className="text-sm text-ink-soft">
                <p className="font-semibold text-ink">Lección 4 de 8 · El pasado simple</p>
                <p className="flex items-center gap-1.5">
                  <Clock size={14} aria-hidden /> 12 min · Unidad 2: Contar experiencias
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPlanOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-800 underline-offset-4 hover:underline"
            >
              <Shuffle size={15} aria-hidden /> Hoy prefiero otra cosa
            </button>
          </div>
          <div className="relative hidden h-full items-end justify-end pr-4 md:flex lg:pr-10">
            <Spark className="absolute left-0 top-12 h-6 w-6 text-coral-500 focus-hide" />
            <Lania expression="welcome" crop="portrait" className="h-72 w-auto lg:h-80" title="Lania te saluda" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Skills */}
        <Card className="lg:col-span-2" padding="lg" as="section" aria-labelledby="skills-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Heading level={2} size="sm" id="skills-title">
                Tus cinco habilidades
              </Heading>
              <p className="mt-1 text-sm text-ink-soft">Cada barra cuenta objetivos “puedo hacer…” que ya demostraste.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="dark" size="md">
                Nivel estimado {learner.diagnostic.overall} · Intermedio
              </Badge>
              <span className="group relative">
                <button type="button" aria-describedby="level-note" className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-mist">
                  <Info size={17} aria-hidden />
                  <span className="sr-only">Cómo se estima tu nivel</span>
                </button>
                <span
                  id="level-note"
                  role="tooltip"
                  className="pointer-events-none absolute right-0 top-10 z-20 w-64 rounded-2xl bg-ink p-3 text-xs leading-relaxed text-white opacity-0 shadow-lift transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                >
                  Estimación basada en tu diagnóstico del 12 de mayo y 47 actividades corregidas. No es una certificación oficial.
                </span>
              </span>
            </div>
          </div>
          <ul className="mt-6 divide-y divide-line">
            {SKILLS.map((s) => {
              const t = TONE_CLASSES[s.tone]
              const est = learner.diagnostic.skills[s.id]
              return (
                <li key={s.id}>
                  <Link to={s.route} className="group -mx-2 flex items-center gap-4 rounded-2xl px-2 py-3.5 transition-colors hover:bg-mist">
                    <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', t.soft, t.fg)}>
                      <s.icon size={20} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="font-bold text-ink">
                          {s.label} <span className="font-medium text-ink-soft">· {est.level}</span>
                        </span>
                        <span className="text-xs font-semibold text-ink-soft">
                          {s.goals.done} de {s.goals.total} objetivos hacia {NEXT_LEVEL[est.level]}
                        </span>
                      </span>
                      <ProgressBar
                        value={s.goals.done}
                        max={s.goals.total}
                        label={`${s.label}: ${s.goals.done} de ${s.goals.total} objetivos`}
                        barClassName={t.bar}
                        className="mt-2"
                      />
                      <span className="mt-1.5 block truncate text-xs text-ink-soft">Siguiente: {s.goals.next}</span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>

        {/* Goal */}
        <Card padding="lg" as="section" aria-labelledby="goal-title" className="flex flex-col">
          <Eyebrow tone="mint">Tu objetivo</Eyebrow>
          <div className="mt-3 flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mint-100 text-mint-700">
              <GoalIcon size={22} aria-hidden />
            </span>
            <div>
              <Heading level={2} size="sm" id="goal-title">
                {goal.label}
              </Heading>
              <p className="text-sm text-ink-soft">{goal.desc}</p>
            </div>
          </div>
          <div className="mt-6 rounded-2xl bg-mist p-4">
            <p className="text-sm font-semibold text-ink">Plan de esta semana · 3 sesiones</p>
            <ol className="mt-3 flex gap-2" aria-label="Sesiones de la semana">
              {['Lun', 'Mié', 'Hoy'].map((d, i) => (
                <li key={d} className="flex flex-1 flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-full text-xs font-bold',
                      i < 2 ? 'bg-mint-600 text-white' : 'bg-surface text-violet-700 ring-2 ring-violet-500',
                    )}
                  >
                    {i < 2 ? <Check size={16} aria-label="Hecha" /> : '3'}
                  </span>
                  <span className="text-xs font-semibold text-ink-soft">{d}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">Sin rachas: si un día no puedes, seguimos donde lo dejaste.</p>
          </div>
          <Link
            to="/app/misiones"
            className="group mt-4 block rounded-2xl p-4 ring-1 ring-line transition-colors hover:bg-mist lg:mt-auto"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-coral-700">
                <KeyRound size={14} aria-hidden /> Misión activa
              </span>
              <span className="text-xs font-semibold text-ink-soft">Etapa 2 de 4</span>
            </span>
            <span className="mt-2 block font-bold text-ink">Tu primera entrevista en inglés</span>
            <ProgressBar value={2} max={4} label="Misión: 2 de 4 etapas" barClassName="bg-coral-500" className="mt-3" />
            <span className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-violet-700">
              Siguiente: habla de tu experiencia
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        </Card>
      </div>

      {prefs.focusMode && (
        <p className="rounded-2xl bg-mist p-4 text-sm text-ink-soft">
          Modo concentración activo: mostramos solo lo esencial. Puedes desactivarlo en la barra lateral o en Preferencias.
        </p>
      )}

      <div className="grid gap-6 focus-hide lg:grid-cols-3">
        {/* Reviews */}
        <Card padding="lg" as="section" aria-labelledby="reviews-title" className="flex flex-col">
          <div className="flex items-center justify-between">
            <Heading level={2} size="sm" id="reviews-title">
              Próximos repasos
            </Heading>
            <CalendarClock size={20} className="text-violet-600" aria-hidden />
          </div>
          <p className="mt-1 text-sm text-ink-soft">Vuelves a cada tema justo antes de olvidarlo.</p>
          <ul className="mt-4 space-y-3">
            {REVIEWS.slice(0, 3).map((r) => {
              const s = SKILL_BY_ID[r.skill]
              const t = TONE_CLASSES[s.tone]
              return (
                <li key={r.id} className="flex items-start gap-3">
                  <span className={cn('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl', t.soft, t.fg)}>
                    <s.icon size={16} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{r.title}</span>
                    <span className="block text-xs text-ink-soft">{r.reason}</span>
                  </span>
                  <Badge tone={r.due === 'Hoy' ? 'coral' : 'neutral'}>{r.due}</Badge>
                </li>
              )
            })}
          </ul>
          <ButtonLink to="/app/aula" variant="soft" className="mt-auto self-start" icon={Repeat}>
            Repasar ahora · 5 min
          </ButtonLink>
        </Card>

        {/* Recommendation */}
        <Card variant="coral" padding="lg" as="section" aria-labelledby="reco-title" className="relative flex flex-col overflow-hidden">
          <div className="flex items-center gap-3">
            <span className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-coral-200 ring-4 ring-white/70">
              <Lania crop="head" expression="thinking" />
            </span>
            <div>
              <Eyebrow tone="coral">Lania recomienda</Eyebrow>
              <Heading level={2} size="sm" id="reco-title">
                10 minutos de entrevista
              </Heading>
            </div>
          </div>
          <p className="reading mt-4 text-sm text-ink">
            Noté que dudas al preguntar en pasado (<em>“What did you…?”</em>). Practiquemos eso en una entrevista simulada: es justo lo que
            necesitas para tu objetivo.
          </p>
          <ButtonLink to="/app/speaking" variant="dark" className="mt-auto self-start" iconRight={ArrowRight}>
            Ir al Speaking Lab
          </ButtonLink>
        </Card>

        {/* Rooms */}
        <Card padding="lg" as="section" aria-labelledby="rooms-title" className="flex flex-col">
          <div className="flex items-center justify-between">
            <Heading level={2} size="sm" id="rooms-title">
              Salas de conversación
            </Heading>
            <Users size={20} className="text-violet-600" aria-hidden />
          </div>
          <ul className="mt-4 space-y-3">
            {rooms.map((r) => (
              <li key={r.id} className="rounded-2xl p-3 ring-1 ring-line">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-ink">{r.name}</p>
                  <Badge tone={r.status === 'live' ? 'mint' : 'violet'} dot={r.status === 'live'} pulse>
                    {r.status === 'live' ? 'En vivo' : r.when}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-ink-soft">
                  {r.topic} · {r.level}
                </p>
                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {r.people.slice(0, 4).map((p) => (
                      <span key={p} className="h-7 w-7 overflow-hidden rounded-full bg-violet-100 ring-2 ring-white">
                        <PersonAvatar look={PEOPLE[p].look} />
                      </span>
                    ))}
                  </div>
                  <Link to={r.status === 'live' ? `/app/salones/${r.id}` : '/app/salones'} className="text-sm font-semibold text-violet-700 hover:underline">
                    {r.status === 'live' ? 'Entrar' : 'Reservar'}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          <ButtonLink to="/app/salones" variant="ghost" className="mt-auto self-start -ml-3" iconRight={ArrowRight}>
            Ver todos los salones
          </ButtonLink>
        </Card>
      </div>

      {/* History & achievements */}
      <Card padding="lg" as="section" aria-labelledby="history-title" className="focus-hide">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Heading level={2} size="sm" id="history-title">
              Historial y logros
            </Heading>
            <p className="mt-1 text-sm text-ink-soft">Solo celebramos lo que demostraste, no los clics.</p>
          </div>
          <ButtonLink to="/app/progreso" variant="secondary" size="sm" iconRight={ArrowRight}>
            Ver mi progreso
          </ButtonLink>
        </div>
        <ul className="mt-5 grid gap-3 md:grid-cols-3">
          {HISTORY.map((h) => {
            const s = SKILL_BY_ID[h.skill]
            const t = TONE_CLASSES[s.tone]
            const Icon = h.kind === 'mastery' ? Medal : h.kind === 'unlock' ? KeyRound : s.icon
            return (
              <li key={h.id} className="flex items-start gap-3 rounded-2xl bg-mist p-4">
                <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', t.soft, t.fg)}>
                  <Icon size={18} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-ink-soft">
                    {h.date} · {s.label}
                  </span>
                  <span className="block text-sm font-bold text-ink">{h.title}</span>
                  <span className="block text-xs text-ink-soft">{h.detail}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </Card>

      <Modal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        title="¿Qué te apetece hoy?"
        description="Tú decides el ritmo. Cualquier opción cuenta para tu objetivo."
        size="sm"
      >
        <ul className="space-y-2">
          {PLANS.map((p) => (
            <li key={p.id}>
              <Link
                to={p.to}
                onClick={() => setPlanOpen(false)}
                className="flex items-center gap-4 rounded-2xl p-3 ring-1 ring-line transition-colors hover:bg-mist"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700">
                  <p.icon size={20} aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block font-bold text-ink">{p.title}</span>
                  <span className="block text-sm text-ink-soft">{p.desc}</span>
                </span>
                <Badge tone="neutral">{p.minutes} min</Badge>
              </Link>
            </li>
          ))}
        </ul>
        <Button variant="ghost" className="mt-3 w-full" onClick={() => setPlanOpen(false)}>
          Seguir con la lección
        </Button>
      </Modal>
    </PageContainer>
  )
}
