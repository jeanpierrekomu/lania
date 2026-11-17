import {
  ArrowRight,
  BadgeCheck,
  Ban,
  Briefcase,
  CalendarClock,
  ClipboardCheck,
  Coffee,
  Focus,
  Gauge,
  GraduationCap,
  Hotel,
  KeyRound,
  Lightbulb,
  Lock,
  Mic,
  ShieldCheck,
  Sparkles,
  Timer,
  Type,
  Users,
  Waves,
} from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { Lania } from '@/app/components/illustrations/Lania'
import { PersonAvatar } from '@/app/components/illustrations/PersonAvatar'
import { Badge } from '@/app/components/ui/Badge'
import { ButtonLink } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { Eyebrow, Heading } from '@/app/components/ui/Typography'
import { TONE_CLASSES } from '@/app/data/skills'
import { ROOMS } from '@/app/data/rooms'
import { PEOPLE } from '@/app/data/people'
import { Container, SectionIntro } from './shared'

const STEPS = [
  { icon: ClipboardCheck, title: 'Diagnóstico', text: 'Descubres tu punto de partida en las 5 habilidades, sin presión.' },
  { icon: GraduationCap, title: 'Clase guiada', text: 'Una idea a la vez, con ejemplos de tu mundo y tus intereses.' },
  { icon: Mic, title: 'Práctica activa', text: 'Hablas, escuchas y escribes. Lania espera tu respuesta y te da pistas.' },
  { icon: CalendarClock, title: 'Repaso a tiempo', text: 'Vuelves a cada tema justo antes de olvidarlo.' },
]

const INCLUSIVE = [
  { icon: Focus, label: 'Modo concentración' },
  { icon: Timer, label: 'Actividades cortas' },
  { icon: Lightbulb, label: 'Pistas opcionales' },
  { icon: Waves, label: 'Control de animaciones' },
  { icon: Gauge, label: 'Velocidad del audio' },
  { icon: Type, label: 'Texto fácil de leer' },
]

export function Method() {
  return (
    <section id="metodo" className="relative scroll-mt-24 overflow-hidden bg-violet-50 py-20 text-ink lg:py-28" aria-labelledby="method-title">
      <Container className="relative">
        <div className="grid items-end gap-10 lg:grid-cols-[1fr_18rem]">
          <SectionIntro
            tone="light"
            id="method-title"
            eyebrow="Nuestro método"
            title="Aprender, recordar, usar. En ese orden."
            lead="Combinamos recuperación activa, repetición espaciada y retroalimentación amable en situaciones reales de comunicación."
          />
          <div className="hidden justify-end lg:flex">
            <div className="h-64 w-64 overflow-hidden rounded-full bg-violet-100">
              <Lania expression="explaining" crop="portrait" className="mt-5 w-full" />
            </div>
          </div>
        </div>
        <ol className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-3xl bg-surface shadow-soft p-6 ring-1 ring-line">
              <span className="font-display text-5xl font-extrabold text-violet-600" aria-hidden>
                0{i + 1}
              </span>
              <span className="absolute right-6 top-6 grid h-11 w-11 place-items-center rounded-2xl bg-coral-300 text-ink">
                <s.icon size={20} aria-hidden />
              </span>
              <h3 className="mt-3 text-xl font-bold">{s.title}</h3>
              <p className="reading mt-2 text-violet-700">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-col gap-5 rounded-3xl bg-surface shadow-soft p-6 ring-1 ring-line lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-bold">Diseñada para distintas formas de concentrarse y aprender</p>
            <p className="mt-1 text-sm text-violet-700">Tú eliges lo que te sirve. Sin etiquetas ni diagnósticos.</p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {INCLUSIVE.map((x) => (
              <li key={x.label} className="inline-flex h-9 items-center gap-2 rounded-full bg-mist px-3.5 text-sm font-semibold">
                <x.icon size={15} className="text-coral-700" aria-hidden />
                {x.label}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}

export function RoomsPreview() {
  const rooms = ROOMS.slice(0, 3)
  return (
    <section id="salones" className="scroll-mt-24 py-20 lg:py-28" aria-labelledby="rooms-preview-title">
      <Container className="grid gap-12 lg:grid-cols-[22rem_1fr] lg:gap-16">
        <div>
          <SectionIntro
            id="rooms-preview-title"
            eyebrow="Salones"
            title="Conversa en grupos pequeños"
            lead="Máximo 5 personas por sala, agrupadas por nivel e intereses. Lania modera, reparte turnos y comparte frases útiles."
          />
          <ul className="mt-8 space-y-3">
            {['Escucha con atención', 'Respeta los turnos', 'Corrige con amabilidad'].map((r) => (
              <li key={r} className="flex items-center gap-3 font-semibold text-ink">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-mint-100 text-mint-700">
                  <ShieldCheck size={15} aria-hidden />
                </span>
                {r}
              </li>
            ))}
          </ul>
          <ButtonLink to="/app/salones" variant="dark" className="mt-8" iconRight={ArrowRight}>
            Explorar salones
          </ButtonLink>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((r, i) => (
            <Card key={r.id} padding="none" interactive className={cn('flex flex-col overflow-hidden', i === 2 && 'sm:col-span-2 xl:col-span-1')}>
              <div className={cn('flex h-28 items-end justify-between p-5', TONE_CLASSES[r.tone].soft)}>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface text-ink shadow-soft">
                  <r.icon size={22} aria-hidden />
                </span>
                <Badge tone={r.status === 'live' ? 'mint' : 'outline'} dot={r.status === 'live'} pulse>
                  {r.status === 'live' ? 'En vivo' : r.when}
                </Badge>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">{r.name}</h3>
                  <Badge tone="dark">{r.level}</Badge>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{r.topic}</p>
                <p className="mt-3 text-sm text-ink">
                  <span className="font-semibold">Objetivo: </span>
                  {r.goal}
                </p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {r.people.slice(0, 4).map((p) => (
                        <span key={p} className="h-8 w-8 overflow-hidden rounded-full bg-violet-100 ring-2 ring-white">
                          <PersonAvatar look={PEOPLE[p].look} />
                        </span>
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-ink-soft">
                      {r.people.length}/{r.capacity}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700">
                    <Sparkles size={13} aria-hidden /> Con Lania
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}

const PATH = [
  { icon: Coffee, label: 'Pedir en un café', state: 'done' },
  { icon: Hotel, label: 'Check-in en el hotel', state: 'done' },
  { icon: Briefcase, label: 'Tu primera entrevista', state: 'now' },
  { icon: Users, label: 'Reunión de equipo', state: 'locked' },
] as const

export function MissionsBand() {
  return (
    <section className="pb-20 lg:pb-28" aria-labelledby="missions-title">
      <Container>
        <div className="grid gap-10 overflow-hidden rounded-4xl bg-coral-100 p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:p-14">
          <div>
            <Eyebrow tone="coral">Gamificación con propósito</Eyebrow>
            <Heading level={2} size="lg" id="missions-title" className="mt-3">
              Misiones que significan algo
            </Heading>
            <p className="reading mt-4 text-ink-soft">
              Desbloqueas situaciones reales cuando demuestras que puedes resolverlas. Historias interactivas, proyectos en equipo y retos
              opcionales: la recompensa es tu autonomía.
            </p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {['Sin rachas que castigan', 'Sin vidas que se agotan', 'Sin rankings que avergüenzan', 'Sin notificaciones insistentes'].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Ban size={16} className="shrink-0 text-coral-700" aria-hidden /> {t}
                </li>
              ))}
            </ul>
            <ButtonLink to="/app/misiones" variant="secondary" className="mt-8" iconRight={ArrowRight}>
              Ver misiones
            </ButtonLink>
          </div>
          <ol className="grid gap-3 self-center sm:grid-cols-4">
            {PATH.map((p) => (
              <li
                key={p.label}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-3xl p-4 text-center',
                  p.state === 'now' ? 'bg-surface shadow-lift ring-2 ring-violet-500' : 'bg-surface/70',
                )}
              >
                <span
                  className={cn(
                    'grid h-14 w-14 place-items-center rounded-2xl',
                    p.state === 'done' && 'bg-mint-100 text-mint-700',
                    p.state === 'now' && 'bg-violet-600 text-white',
                    p.state === 'locked' && 'bg-mist text-ink-faint',
                  )}
                >
                  <p.icon size={24} aria-hidden />
                </span>
                <span className="text-sm font-bold text-ink">{p.label}</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft">
                  {p.state === 'done' && (
                    <>
                      <BadgeCheck size={13} className="text-mint-700" aria-hidden /> Dominada
                    </>
                  )}
                  {p.state === 'now' && (
                    <>
                      <KeyRound size={13} className="text-violet-700" aria-hidden /> En curso
                    </>
                  )}
                  {p.state === 'locked' && (
                    <>
                      <Lock size={13} aria-hidden /> Requiere entrevista
                    </>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  )
}
