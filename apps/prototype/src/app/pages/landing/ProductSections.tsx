import { useState } from 'react'
import {
  ArrowRight,
  Briefcase,
  Check,
  Clapperboard,
  Cpu,
  GraduationCap,
  Guitar,
  Mic,
  PenLine,
  Plane,
  Rocket,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { Logo } from '@/app/components/brand/Logo'
import { Lania } from '@/app/components/illustrations/Lania'
import { Badge } from '@/app/components/ui/Badge'
import { ButtonLink } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { ProgressBar } from '@/app/components/ui/Progress'
import { Tabs } from '@/app/components/ui/Tabs'
import { Eyebrow, Heading } from '@/app/components/ui/Typography'
import { ChoiceOption } from '@/app/components/exercise/ChoiceOption'
import { FeedbackBanner } from '@/app/components/exercise/FeedbackBanner'
import { MicButton } from '@/app/components/exercise/MicButton'
import { VoiceWave } from '@/app/components/exercise/VoiceWave'
import { Container, SectionIntro } from './shared'

const TOPICS: { label: string; icon: LucideIcon }[] = [
  { label: 'Entrevistas', icon: Briefcase },
  { label: 'Viajes', icon: Plane },
  { label: 'Series y cine', icon: Clapperboard },
  { label: 'Universidad', icon: GraduationCap },
  { label: 'Tecnología', icon: Cpu },
  { label: 'Emprendimiento', icon: Rocket },
  { label: 'Música', icon: Guitar },
]

export function Topics() {
  return (
    <section aria-label="Temas de práctica" className="border-y border-line bg-surface">
      <Container className="flex flex-col items-center gap-4 py-6 lg:flex-row lg:justify-between">
        <p className="shrink-0 text-sm font-semibold text-ink-soft">Practica con temas que te importan</p>
        <ul className="flex flex-wrap justify-center gap-2">
          {TOPICS.map((t) => (
            <li key={t.label} className="inline-flex h-9 items-center gap-2 rounded-full bg-mist px-3.5 text-sm font-semibold text-ink">
              <t.icon size={15} className="text-violet-600" aria-hidden />
              {t.label}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

export function Benefits() {
  return (
    <section id="beneficios" className="scroll-mt-24 py-20 lg:py-28" aria-labelledby="benefits-title">
      <Container>
        <SectionIntro
          center
          id="benefits-title"
          eyebrow="Por qué LANIA"
          title="Una academia que se adapta a ti, no al revés"
          lead="Tres promesas simples que guían cada pantalla, cada ejercicio y cada conversación."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <Card padding="none" className="overflow-hidden" interactive>
            <div className="relative h-52 bg-violet-100 p-6">
              <div className="absolute bottom-0 left-6 h-36 w-36 overflow-hidden rounded-t-full bg-violet-200">
                <Lania crop="head" expression="explaining" className="h-full w-full" />
              </div>
              <div className="absolute right-5 top-7 w-44 rounded-2xl rounded-bl-md bg-surface p-3 text-sm shadow-soft">
                <p className="text-xs font-bold text-violet-700">Lania</p>
                <p className="text-ink">Recuerdo que te cuesta el “did”. ¿Lo practicamos con tu entrevista?</p>
              </div>
            </div>
            <div className="p-6">
              <Heading level={3} size="sm">
                Una profesora personal
              </Heading>
              <p className="reading mt-2 text-ink-soft">
                Lania recuerda tus errores, intereses y ritmo. Explica en español cuando lo necesitas y en inglés cuando estás lista.
              </p>
            </div>
          </Card>
          <Card padding="none" className="overflow-hidden" interactive>
            <div className="flex h-52 flex-col justify-center gap-2.5 bg-mint-50 p-6">
              {(
                [
                  ['Me presento en una entrevista', true],
                  ['Cuento una experiencia pasada', true],
                  ['Negocio un horario por teléfono', false],
                ] as const
              ).map(([t, done]) => (
                <div key={t} className="flex items-center gap-3 rounded-2xl bg-surface px-3.5 py-2.5 shadow-soft">
                  <span className={cn('grid h-6 w-6 place-items-center rounded-full', done ? 'bg-mint-600 text-white' : 'bg-mist text-ink-faint')}>
                    <Check size={14} aria-hidden />
                  </span>
                  <span className={cn('text-sm font-semibold', done ? 'text-ink' : 'text-ink-soft')}>{t}</span>
                  <span className="sr-only">{done ? '(dominado)' : '(pendiente)'}</span>
                </div>
              ))}
            </div>
            <div className="p-6">
              <Heading level={3} size="sm">
                Progreso real, no puntos vacíos
              </Heading>
              <p className="reading mt-2 text-ink-soft">
                Medimos lo que puedes demostrar —“puedo presentarme en una entrevista”—, no minutos frente a la pantalla ni clics.
              </p>
            </div>
          </Card>
          <Card padding="none" className="overflow-hidden" interactive>
            <div className="flex h-52 items-center justify-center gap-6 bg-coral-100 p-6" aria-hidden>
              <div inert>
                <MicButton state="listening" onClick={() => undefined} className="pointer-events-none" />
              </div>
              <div className="space-y-2">
                <div className="rounded-2xl rounded-bl-md bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-soft">I went to a concert!</div>
                <div className="flex items-center gap-2 text-coral-600">
                  <VoiceWave active bars={6} />
                  <span className="text-xs font-semibold text-coral-800">0:12</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <Heading level={3} size="sm">
                Práctica oral sin juicio
              </Heading>
              <p className="reading mt-2 text-ink-soft">
                Habla con Lania cuando quieras y únete a salas pequeñas moderadas. Equivocarte aquí es parte del plan.
              </p>
            </div>
          </Card>
        </div>
      </Container>
    </section>
  )
}

type PreviewTab = 'aula' | 'speaking' | 'writing'

const PREVIEW_META: Record<PreviewTab, { crumb: string; to: string; step: number }> = {
  aula: { crumb: 'Unidad 2 · El pasado simple', to: '/app/aula', step: 3 },
  speaking: { crumb: 'Speaking Lab · Fin de semana', to: '/app/speaking', step: 2 },
  writing: { crumb: 'Writing Lab · Correo formal', to: '/app/writing', step: 4 },
}

export function ClassPreview() {
  const [tab, setTab] = useState<PreviewTab>('aula')
  const meta = PREVIEW_META[tab]
  return (
    <section id="clases" className="scroll-mt-24 bg-surface py-20 lg:py-28" aria-labelledby="preview-title">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionIntro
            id="preview-title"
            eyebrow="Vista previa"
            title="Así se siente una clase con Lania"
            lead="Una instrucción por pantalla, pistas cuando las pides y explicaciones breves justo donde las necesitas."
          />
          <Tabs<PreviewTab>
            label="Vista previa de clases"
            idPrefix="preview"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'aula', label: 'Aula guiada', icon: GraduationCap },
              { id: 'speaking', label: 'Speaking Lab', icon: Mic },
              { id: 'writing', label: 'Writing Lab', icon: PenLine },
            ]}
          />
        </div>

        <div
          id={`preview-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`preview-tab-${tab}`}
          className="mt-10 overflow-hidden rounded-4xl bg-canvas shadow-float ring-1 ring-line"
        >
          <div className="flex items-center justify-between gap-4 border-b border-line bg-surface px-5 py-3.5 sm:px-8">
            <div className="flex items-center gap-4">
              <Logo size="sm" />
              <span className="hidden text-sm text-ink-soft sm:inline">{meta.crumb}</span>
            </div>
            <div className="w-32 sm:w-48">
              <ProgressBar value={meta.step} max={5} label="Progreso de la actividad" size="xs" />
            </div>
          </div>

          {tab === 'aula' && (
            <div className="grid gap-6 p-5 sm:p-8 md:grid-cols-[17rem_1fr]">
              <div className="flex flex-col items-center rounded-3xl bg-violet-100 p-4">
                <Lania expression="explaining" crop="portrait" className="w-44" />
                <p className="reading mt-2 rounded-2xl bg-surface p-3 text-sm text-ink shadow-soft">
                  <strong className="text-violet-700">Yesterday</strong> es tu alarma de pasado. ¡Úsala!
                </p>
              </div>
              <div className="space-y-4">
                <Eyebrow>Práctica · 3 de 5</Eyebrow>
                <p className="text-2xl font-bold text-ink">
                  Yesterday I <span className="rounded-lg bg-mint-100 px-2 text-mint-800">went</span> to university.
                </p>
                <div role="radiogroup" aria-label="Opciones de ejemplo" className="grid gap-2 sm:grid-cols-3">
                  <ChoiceOption letter="A" label="go" state="dimmed" disabled />
                  <ChoiceOption letter="B" label="went" state="correct" disabled />
                  <ChoiceOption letter="C" label="goed" state="dimmed" disabled />
                </div>
                <FeedbackBanner kind="correct" title="¡Eso! Went, como una profesional.">
                  <em>go → went</em> es irregular: no lleva -ed. Lo repasaremos mañana para que no se te escape.
                </FeedbackBanner>
              </div>
            </div>
          )}

          {tab === 'speaking' && (
            <div className="grid gap-6 bg-canvas p-5 text-ink sm:p-8 md:grid-cols-[1fr_18rem]">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="grid h-56 w-56 place-items-center overflow-hidden rounded-full bg-violet-50 ring-1 ring-line">
                  <Lania expression="listening" crop="portrait" className="mt-8 w-52" />
                </div>
                <p className="mt-5 max-w-md rounded-2xl bg-ink/5 px-4 py-2.5 text-base">“So, what did you do last weekend?”</p>
                <div className="mt-5 flex items-center gap-4" aria-hidden>
                  <MicButton state="listening" onClick={() => undefined} size="md" className="pointer-events-none" />
                  <span className="text-sm text-violet-700">Te escucho… habla con calma</span>
                </div>
              </div>
              <div className="space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-line">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral-700">Al final de la charla</p>
                <div className="rounded-2xl bg-mist p-3 text-sm">
                  <p className="text-ink-soft line-through">We study for a exam</p>
                  <p className="font-semibold text-mint-700">We studied for an exam</p>
                </div>
                <div className="rounded-2xl bg-mist p-3 text-sm">
                  <p className="font-semibold">Frase nueva</p>
                  <p className="text-ink-soft">“It went really well” = salió muy bien</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'writing' && (
            <div className="grid gap-6 p-5 sm:p-8 md:grid-cols-[1fr_18rem]">
              <div className="reading rounded-3xl bg-surface p-6 text-lg text-ink shadow-soft">
                Dear Ms. Rivera, my name is Valentina and{' '}
                <mark className="rounded-md bg-coral-100 px-1 text-ink underline decoration-coral-500 decoration-2 underline-offset-4">I have 23 years</mark>.{' '}
                <mark className="rounded-md bg-violet-100 px-1 text-ink underline decoration-violet-500 decoration-2 underline-offset-4">Actually</mark> I study
                industrial engineering and I am interested in the data internship.
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl bg-coral-50 p-4 ring-1 ring-coral-200">
                  <Badge tone="coral">Gramática</Badge>
                  <p className="mt-2 text-sm font-semibold text-ink">I have 23 years → I am 23 years old</p>
                  <p className="mt-1 text-sm text-ink-soft">En inglés la edad se dice con “be”, no con “have”.</p>
                </div>
                <div className="rounded-2xl bg-violet-50 p-4 ring-1 ring-violet-200">
                  <Badge tone="violet">Vocabulario</Badge>
                  <p className="mt-2 text-sm font-semibold text-ink">Actually → Currently</p>
                  <p className="mt-1 text-sm text-ink-soft">Falso amigo: actually significa “en realidad”.</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-8 flex justify-center">
          <ButtonLink to={meta.to} variant="soft" iconRight={ArrowRight}>
            Probar esta pantalla
          </ButtonLink>
        </div>
      </Container>
    </section>
  )
}
