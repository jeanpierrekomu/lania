import { useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Check,
  Coffee,
  Headphones,
  Hotel,
  KeyRound,
  Lock,
  MapPinned,
  Medal,
  Mic,
  PlaneTakeoff,
  Presentation,
  Trophy,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { Lania } from '@/app/components/illustrations/Lania'
import { PersonAvatar } from '@/app/components/illustrations/PersonAvatar'
import { Badge } from '@/app/components/ui/Badge'
import { Button, ButtonLink } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { ProgressBar } from '@/app/components/ui/Progress'
import { Eyebrow, Heading } from '@/app/components/ui/Typography'
import { PageContainer, PageHeader } from '@/app/components/layout/PageHeader'
import { PEOPLE, type PersonId } from '@/app/data/people'

type SituationState = 'done' | 'now' | 'open' | 'locked'
interface Situation {
  id: string
  label: string
  icon: LucideIcon
  state: SituationState
  practice: string
  status: string
  to?: string
  x: number
  y: number
}

const SITUATIONS: Situation[] = [
  { id: 'cafe', label: 'Pedir en un café', icon: Coffee, state: 'done', practice: 'Pedir, preguntar precios y pagar', status: 'Dominada el 28 may', to: '/app/speaking?tema=fin-de-semana', x: 7, y: 68 },
  { id: 'hotel', label: 'Check-in en el hotel', icon: Hotel, state: 'done', practice: 'Confirmar reservas y pedir ayuda', status: 'Dominada el 2 jun', to: '/app/speaking?tema=viajes', x: 21, y: 30 },
  { id: 'aeropuerto', label: 'En el aeropuerto', icon: PlaneTakeoff, state: 'done', practice: 'Entender anuncios y resolver retrasos', status: 'Dominada el 3 jun', to: '/app/listening', x: 36, y: 66 },
  { id: 'entrevista', label: 'Tu primera entrevista', icon: Briefcase, state: 'now', practice: 'Presentarte, contar tu experiencia y responder preguntas', status: 'En curso · etapa 2 de 4', to: '/app/speaking?tema=entrevista', x: 52, y: 28 },
  { id: 'cena', label: 'Cena con amigos', icon: UtensilsCrossed, state: 'open', practice: 'Hacer planes, sugerir y negociar', status: 'Disponible', to: '/app/salones', x: 66, y: 66 },
  { id: 'reunion', label: 'Reunión de equipo', icon: Users, state: 'locked', practice: 'Opinar, estar de acuerdo y en desacuerdo', status: 'Requiere completar “Tu primera entrevista”', x: 80, y: 30 },
  { id: 'presentacion', label: 'Presentación en clase', icon: Presentation, state: 'locked', practice: 'Estructurar ideas y responder preguntas', status: 'Requiere Speaking B1 (hoy 4 de 10 objetivos)', x: 93, y: 68 },
]

const STATE_STYLE: Record<SituationState, { tile: string; chip: string; label: string; icon: LucideIcon }> = {
  done: { tile: 'bg-mint-600 text-white', chip: 'text-mint-700', label: 'Dominada', icon: BadgeCheck },
  now: { tile: 'bg-primary text-white ring-4 ring-violet-200', chip: 'text-violet-700', label: 'En curso', icon: KeyRound },
  open: { tile: 'bg-surface text-violet-700 ring-2 ring-violet-300', chip: 'text-violet-700', label: 'Disponible', icon: ArrowRight },
  locked: { tile: 'bg-mist text-ink-faint', chip: 'text-ink-soft', label: 'Bloqueada', icon: Lock },
}

const STAGES = [
  { title: 'Preséntate', state: 'done' },
  { title: 'Habla de tu experiencia', state: 'now' },
  { title: 'Responde preguntas difíciles', state: 'todo' },
  { title: 'Entrevista final con Lania', state: 'todo' },
] as const

const MASTERY = [
  { title: 'Presentarte en entrevistas', evidence: '3 de 3 evidencias · 12 jun', done: 3, total: 3 },
  { title: 'Entender anuncios', evidence: '4 de 4 audios sin transcripción', done: 4, total: 4 },
  { title: 'Pasado simple', evidence: 'Falta 1 uso en conversación real', done: 2, total: 3 },
  { title: 'Correo formal', evidence: '1 texto reescrito sin errores de tono', done: 1, total: 3 },
]

const TEAM: { who: PersonId; task: string; done: boolean }[] = [
  { who: 'valentina', task: 'Museo del Oro', done: true },
  { who: 'diego', task: 'Comida típica', done: true },
  { who: 'camila', task: 'Cómo moverse', done: false },
  { who: 'mateo', task: 'Vida nocturna', done: false },
]

function pathThrough(points: { x: number; y: number }[]) {
  const P = points.map((p) => ({ x: p.x * 10, y: p.y * 4 }))
  return P.reduce((d, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = P[i - 1]
    const dx = (p.x - prev.x) / 2
    return `${d} C ${prev.x + dx} ${prev.y} ${p.x - dx} ${p.y} ${p.x} ${p.y}`
  }, '')
}

/** Gamification with purpose: missions, stories, mastery, projects and optional challenges. */
export function Missions() {
  const [selected, setSelected] = useState('entrevista')
  const [challenge, setChallenge] = useState<'pending' | 'accepted' | 'skipped'>('pending')
  const sel = SITUATIONS.find((s) => s.id === selected) ?? SITUATIONS[3]
  const doneUpTo = SITUATIONS.filter((s) => s.state === 'done').length

  return (
    <PageContainer wide className="space-y-6">
      <PageHeader
        eyebrow="Misiones y situaciones"
        title="Avanza desbloqueando situaciones reales"
        description="Cada situación se abre cuando demuestras que puedes resolverla. Sin rachas, sin vidas, sin castigos por faltar."
      />

      {/* Active mission */}
      <Card padding="none" className="overflow-hidden" as="section" aria-labelledby="mission-title">
        <div className="grid lg:grid-cols-[1fr_20rem]">
          <div className="p-6 sm:p-8">
            <Badge tone="violet" icon={KeyRound}>
              Misión activa
            </Badge>
            <Heading level={2} size="lg" id="mission-title" className="mt-3">
              Tu primera entrevista en inglés
            </Heading>
            <p className="mt-2 max-w-2xl text-ink-soft">Conectada con tu objetivo. Al terminarla desbloqueas “Reunión de equipo” y el reconocimiento “Entrevistas B1”.</p>
            <ol className="mt-6 grid gap-3 sm:grid-cols-4">
              {STAGES.map((s, i) => (
                <li
                  key={s.title}
                  className={cn(
                    'rounded-2xl p-4 ring-1',
                    s.state === 'done' && 'bg-mint-50 ring-mint-200',
                    s.state === 'now' && 'bg-violet-50 ring-2 ring-violet-500',
                    s.state === 'todo' && 'bg-surface ring-line',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-8 w-8 place-items-center rounded-full text-sm font-bold',
                      s.state === 'done' ? 'bg-mint-600 text-white' : s.state === 'now' ? 'bg-primary text-white' : 'bg-mist text-ink-soft',
                    )}
                  >
                    {s.state === 'done' ? <Check size={16} aria-label="Completada" /> : i + 1}
                  </span>
                  <p className="mt-3 text-sm font-bold text-ink">{s.title}</p>
                  <p className="text-xs text-ink-soft">{s.state === 'done' ? 'Completada' : s.state === 'now' ? 'En curso' : 'Pendiente'}</p>
                </li>
              ))}
            </ol>
            <ButtonLink to="/app/speaking?tema=entrevista" className="mt-6" icon={Mic}>
              Continuar etapa 2
            </ButtonLink>
          </div>
          <div className="relative hidden items-end justify-center bg-violet-100 lg:flex">
            <Lania expression="explaining" crop="portrait" className="w-64" />
          </div>
        </div>
      </Card>

      {/* Map */}
      <Card padding="lg" as="section" aria-labelledby="map-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Heading level={2} size="sm" id="map-title">
              Mapa de situaciones
            </Heading>
            <p className="mt-1 text-sm text-ink-soft">
              {doneUpTo} de {SITUATIONS.length} dominadas. Elige una para ver qué practicarás.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-semibold text-ink-soft">
            {(['done', 'now', 'open', 'locked'] as const).map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className={cn('h-3 w-3 rounded-full', STATE_STYLE[k].tile)} aria-hidden /> {STATE_STYLE[k].label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mt-6 hidden aspect-[5/2] overflow-hidden rounded-3xl bg-violet-50 md:block">
          <svg viewBox="0 0 1000 400" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
            <path d={pathThrough(SITUATIONS)} fill="none" stroke="var(--color-violet-300)" strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" />
            <path d={pathThrough(SITUATIONS.slice(0, doneUpTo + 1))} fill="none" stroke="var(--color-mint-400)" strokeWidth="5" strokeLinecap="round" />
          </svg>
          {SITUATIONS.map((s) => {
            const st = STATE_STYLE[s.state]
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelected(s.id)}
                aria-pressed={selected === s.id}
                aria-label={`${s.label}: ${st.label}`}
                className="group absolute flex w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 text-center"
                style={{ left: `${s.x}%`, top: `${s.y}%` }}
              >
                <span
                  className={cn(
                    'grid h-14 w-14 place-items-center rounded-2xl shadow-soft transition-transform group-hover:-translate-y-0.5',
                    st.tile,
                    selected === s.id && 'outline-3 outline-offset-4 outline-ink',
                  )}
                >
                  <s.icon size={24} aria-hidden />
                </span>
                <span className="rounded-xl bg-surface/90 px-2 py-1 text-xs font-bold text-ink shadow-soft">{s.label}</span>
              </button>
            )
          })}
        </div>

        <ol className="mt-5 space-y-2 md:hidden">
          {SITUATIONS.map((s) => {
            const st = STATE_STYLE[s.state]
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelected(s.id)}
                  aria-pressed={selected === s.id}
                  className={cn('flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1', selected === s.id ? 'bg-violet-50 ring-violet-400' : 'ring-line')}
                >
                  <span className={cn('grid h-11 w-11 place-items-center rounded-xl', st.tile)}>
                    <s.icon size={20} aria-hidden />
                  </span>
                  <span className="flex-1 font-semibold text-ink">{s.label}</span>
                  <span className={cn('text-xs font-bold', st.chip)}>{st.label}</span>
                </button>
              </li>
            )
          })}
        </ol>

        <div className="mt-5 flex flex-col gap-4 rounded-3xl bg-mist p-5 sm:flex-row sm:items-center" aria-live="polite">
          <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', STATE_STYLE[sel.state].tile)}>
            <sel.icon size={22} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink">{sel.label}</p>
            <p className="text-sm text-ink-soft">Practicarás: {sel.practice}</p>
            <p className={cn('mt-1 flex items-center gap-1.5 text-sm font-semibold', STATE_STYLE[sel.state].chip)}>
              {(() => {
                const I = STATE_STYLE[sel.state].icon
                return <I size={15} aria-hidden />
              })()}
              {sel.status}
            </p>
          </div>
          {sel.to ? (
            <ButtonLink to={sel.to} variant={sel.state === 'done' ? 'secondary' : 'primary'} iconRight={ArrowRight}>
              {sel.state === 'done' ? 'Repasar' : sel.state === 'now' ? 'Continuar' : 'Empezar'}
            </ButtonLink>
          ) : (
            <Button variant="secondary" disabled icon={Lock}>
              Aún bloqueada
            </Button>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stories */}
        <section aria-labelledby="stories-title" className="space-y-4">
          <Heading level={2} size="sm" id="stories-title">
            Historias interactivas
          </Heading>
          {[
            { title: 'Un semestre en Toronto', meta: 'B1 · capítulo 3 de 6', text: 'Tu primera semana de intercambio. ¿A quién le pides ayuda cuando pierdes el bus?', icon: MapPinned, tone: 'bg-coral-100 text-coral-700', progress: 2, total: 6, cta: 'Continuar capítulo 3' },
            { title: 'El misterio del podcast perdido', meta: 'A2+ · nueva', text: 'Escucha pistas en audio y descubre quién borró el episodio antes del estreno.', icon: Headphones, tone: 'bg-violet-100 text-violet-700', progress: 0, total: 5, cta: 'Empezar historia' },
          ].map((s) => (
            <Card key={s.title} padding="md" interactive className="flex gap-4">
              <span className={cn('grid h-20 w-20 shrink-0 place-items-center rounded-3xl', s.tone)}>
                <s.icon size={30} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">{s.meta}</p>
                <p className="font-display text-lg font-bold text-ink">{s.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{s.text}</p>
                <div className="mt-3 flex items-center gap-3">
                  <ProgressBar value={s.progress} max={s.total} label={`${s.title}: ${s.progress} de ${s.total} capítulos`} size="xs" className="max-w-40" />
                  <ButtonLink to="/app/listening" variant="ghost" size="sm" iconRight={ArrowRight}>
                    {s.cta}
                  </ButtonLink>
                </div>
              </div>
            </Card>
          ))}
        </section>

        {/* Weekly challenge + project */}
        <section aria-label="Reto y proyecto" className="space-y-4">
          <Card variant="coral" padding="lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Eyebrow tone="coral">Reto opcional de la semana</Eyebrow>
                <p className="mt-2 font-display text-lg font-bold text-ink">Graba 60 segundos recomendando una serie</p>
                <p className="mt-1 text-sm text-ink-soft">Si lo haces, Lania te deja comentarios de pronunciación. Si no, no pierdes nada.</p>
              </div>
              <Trophy size={26} className="shrink-0 text-coral-700" aria-hidden />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2" aria-live="polite">
              {challenge === 'pending' && (
                <>
                  <Button variant="dark" size="sm" onClick={() => setChallenge('accepted')}>
                    Aceptar el reto
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setChallenge('skipped')}>
                    Esta semana no
                  </Button>
                </>
              )}
              {challenge === 'accepted' && (
                <>
                  <Badge tone="mint" size="md" icon={Check}>
                    Aceptado · hasta el domingo
                  </Badge>
                  <ButtonLink to="/app/speaking?tema=series" size="sm" variant="dark">
                    Grabar ahora
                  </ButtonLink>
                </>
              )}
              {challenge === 'skipped' && (
                <p className="text-sm font-semibold text-ink">
                  Sin problema. Nos vemos con otro reto la próxima semana.{' '}
                  <button type="button" className="underline underline-offset-4" onClick={() => setChallenge('pending')}>
                    Deshacer
                  </button>
                </p>
              )}
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Eyebrow>Proyecto colaborativo</Eyebrow>
                <p className="mt-2 font-display text-lg font-bold text-ink">Guía de Bogotá en inglés</p>
                <p className="mt-1 text-sm text-ink-soft">Con tu salón “Café Internacional”. Cada persona prepara un lugar.</p>
              </div>
              <Badge tone="neutral">2 de 4</Badge>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {TEAM.map((m) => (
                <li key={m.who} className="flex items-center gap-3 rounded-2xl bg-mist p-2.5">
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-violet-100">
                    <PersonAvatar look={PEOPLE[m.who].look} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{m.task}</span>
                    <span className="block text-xs text-ink-soft">{PEOPLE[m.who].name}</span>
                  </span>
                  {m.done ? <BadgeCheck size={18} className="text-mint-600" aria-label="Listo" /> : <span className="text-xs font-semibold text-ink-soft">En curso</span>}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      {/* Mastery */}
      <section aria-labelledby="mastery-title">
        <div className="flex items-center gap-2">
          <Medal size={20} className="text-coral-600" aria-hidden />
          <Heading level={2} size="sm" id="mastery-title">
            Reconocimientos por dominio
          </Heading>
        </div>
        <p className="mt-1 text-sm text-ink-soft">Se ganan con evidencia en contextos distintos, nunca por tocar botones.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MASTERY.map((m) => {
            const done = m.done >= m.total
            return (
              <Card key={m.title} padding="md" variant={done ? 'default' : 'outline'}>
                <span className={cn('grid h-12 w-12 place-items-center rounded-full', done ? 'bg-coral-300 text-ink' : 'bg-mist text-ink-faint')}>
                  <Medal size={22} aria-hidden />
                </span>
                <p className="mt-3 font-bold text-ink">{m.title}</p>
                <p className="text-xs text-ink-soft">{m.evidence}</p>
                <ProgressBar value={m.done} max={m.total} label={`${m.title}: ${m.done} de ${m.total}`} size="xs" barClassName={done ? 'bg-mint-600' : 'bg-coral-500'} className="mt-3" />
              </Card>
            )
          })}
        </div>
      </section>
    </PageContainer>
  )
}
