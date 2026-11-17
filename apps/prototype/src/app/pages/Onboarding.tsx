import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, Clock, Compass, Sparkles, UserRound } from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { TEACHER_STYLES } from '@/app/lib/tone'
import { useSpeech } from '@/app/lib/speech'
import { Logo } from '@/app/components/brand/Logo'
import { Lania, type LaniaExpression } from '@/app/components/illustrations/Lania'
import { Blob } from '@/app/components/illustrations/Decor'
import { Badge } from '@/app/components/ui/Badge'
import { Button } from '@/app/components/ui/Button'
import { Chip } from '@/app/components/ui/Chip'
import { Field, TextInput } from '@/app/components/ui/Field'
import { ProgressBar } from '@/app/components/ui/Progress'
import { Heading } from '@/app/components/ui/Typography'
import { LaniaSays } from '@/app/components/lania/LaniaSays'
import { PreferencesFields } from '@/app/components/layout/PreferencesPanel'
import { GOALS, GOAL_BY_ID, INTERESTS, SELF_LEVELS, SESSION_OPTIONS } from '@/app/data/content'
import { useLearner, type Learner } from '@/app/state/learner'
import { usePreferences } from '@/app/state/preferences'

const BAR_HEIGHTS = ['h-2', 'h-3', 'h-4', 'h-5']

type Draft = Pick<Learner, 'name' | 'goal' | 'selfLevel' | 'interests' | 'sessionMinutes' | 'teacherStyle'>

interface StepDef {
  id: string
  title: (d: Draft) => string
  hint?: string
  lania: (d: Draft) => string
  expression: LaniaExpression
  valid: (d: Draft) => boolean
}

const STEPS: StepDef[] = [
  {
    id: 'hola',
    title: () => '¡Hola! Soy Lania, tu profesora de inglés.',
    hint: 'En dos minutos armamos un plan a tu medida.',
    lania: () => 'Qué bueno que llegaste. Te haré pocas preguntas, una a la vez. ¿Cómo quieres que te llame?',
    expression: 'welcome',
    valid: (d) => d.name.trim().length > 0,
  },
  {
    id: 'objetivo',
    title: (d) => `${d.name}, ¿para qué quieres aprender inglés?`,
    hint: 'Elige lo más importante ahora. Podrás sumar metas después.',
    lania: () => 'Tu objetivo decide qué practicamos primero. Así cada minuto cuenta.',
    expression: 'listening',
    valid: (d) => Boolean(d.goal),
  },
  {
    id: 'nivel',
    title: () => '¿Cómo te sientes con tu inglés hoy?',
    hint: 'No hay respuesta incorrecta: el diagnóstico lo afinará.',
    lania: () => 'Cuéntame cómo te sientes, no lo que crees que “deberías” saber.',
    expression: 'thinking',
    valid: (d) => Boolean(d.selfLevel),
  },
  {
    id: 'intereses',
    title: () => '¿Qué temas te interesan?',
    hint: 'Elige de 1 a 5. Los usaré en ejemplos, audios y conversaciones.',
    lania: (d) =>
      d.interests.length ? `¡Buen gusto! Ya imagino ejemplos sobre ${INTERESTS.find((i) => i.id === d.interests[0])?.label.toLowerCase()}.` : 'Me encanta enseñar con temas que te importan de verdad.',
    expression: 'explaining',
    valid: (d) => d.interests.length > 0,
  },
  {
    id: 'ritmo',
    title: () => '¿Cuánto tiempo quieres por sesión?',
    hint: 'Puedes cambiarlo cuando quieras. No hay rachas ni castigos.',
    lania: () => 'Mejor poco y frecuente que mucho y agotador.',
    expression: 'neutral',
    valid: () => true,
  },
  {
    id: 'profesora',
    title: () => '¿Cómo prefieres que te enseñe?',
    hint: 'Mira cómo corregiría la misma frase en cada estilo.',
    lania: (d) => TEACHER_STYLES.find((t) => t.id === d.teacherStyle)?.sample ?? '',
    expression: 'correcting',
    valid: () => true,
  },
  {
    id: 'preferencias',
    title: () => 'Ajustemos la experiencia a ti',
    hint: 'Los cambios se aplican al instante. No pedimos información médica.',
    lania: () => 'Cada persona se concentra distinto. Elige lo que te haga sentir cómoda o cómodo.',
    expression: 'listening',
    valid: () => true,
  },
  {
    id: 'plan',
    title: (d) => `¡Listo, ${d.name}! Este es tu punto de partida.`,
    hint: 'Ahora descubramos tu nivel real con un diagnóstico corto.',
    lania: () => 'Me encanta este plan. Ahora quiero escucharte: el diagnóstico toma unos 12 minutos y puedes pausarlo.',
    expression: 'celebrating',
    valid: () => true,
  },
]

function OptionCard({ selected, onClick, icon, title, desc, aside }: { selected: boolean; onClick: () => void; icon?: ReactNode; title: string; desc?: string; aside?: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-4 rounded-3xl p-4 text-left ring-2 transition-[background-color,box-shadow] duration-200',
        selected ? 'bg-violet-50 ring-violet-600' : 'bg-surface ring-line hover:bg-mist hover:ring-line-strong',
      )}
    >
      {icon && (
        <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', selected ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-700')}>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-ink">{title}</span>
        {desc && <span className="mt-0.5 block text-sm text-ink-soft">{desc}</span>}
      </span>
      {aside}
      <span
        className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full ring-2', selected ? 'bg-violet-600 text-white ring-violet-600' : 'ring-line-strong')}
        aria-hidden
      >
        {selected && <Check size={14} />}
      </span>
    </button>
  )
}

export function Onboarding() {
  const { learner, update } = useLearner()
  const { prefs } = usePreferences()
  const navigate = useNavigate()
  const { speak } = useSpeech()
  const [params] = useSearchParams()
  const [step, setStep] = useState(() => Math.min(Math.max(Number(params.get('paso') ?? 1) - 1, 0), STEPS.length - 1) || 0)
  const [draft, setDraft] = useState<Draft>({
    name: learner.name,
    goal: learner.goal,
    selfLevel: learner.selfLevel,
    interests: learner.interests,
    sessionMinutes: learner.sessionMinutes,
    teacherStyle: learner.teacherStyle,
  })
  const def = STEPS[step]
  const last = step === STEPS.length - 1
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const laniaLine = def.lania(draft)

  const next = () => {
    if (!def.valid(draft)) return
    if (last) return
    setStep((s) => s + 1)
  }
  const finish = (to: string) => {
    update({ ...draft, name: draft.name.trim(), onboarded: true })
    navigate(to)
  }

  const prefSummary = useMemo(() => {
    const items: string[] = []
    if (prefs.focusMode) items.push('Modo concentración')
    if (prefs.motion === 'reduce') items.push('Animaciones reducidas')
    if (prefs.textScale !== 'md') items.push(prefs.textScale === 'lg' ? 'Texto grande' : 'Texto muy grande')
    if (prefs.spacing === 'relaxed') items.push('Espaciado amplio')
    if (prefs.hints === 'show') items.push('Pistas visibles')
    if (!prefs.subtitles) items.push('Sin subtítulos')
    if (prefs.audioRate !== 1) items.push(`Audio a ${prefs.audioRate}×`)
    return items.length ? items : ['Configuración estándar']
  }, [prefs])

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Lania panel */}
      <aside className="relative hidden overflow-hidden bg-violet-100 lg:flex lg:flex-col" aria-label="Lania">
        <Blob className="pointer-events-none absolute -left-24 bottom-0 h-[70%] w-[130%] text-violet-200 focus-hide" />
        <div className="relative p-10">
          <Link to="/" aria-label="LANIA, inicio">
            <Logo size="md" />
          </Link>
        </div>
        <div className="relative mt-auto flex flex-col items-center px-10">
          <div key={step} className="mb-6 w-full max-w-md animate-fade-up rounded-3xl rounded-bl-lg bg-surface p-5 shadow-lift">
            <p className="text-xs font-bold text-violet-700">Lania</p>
            <p className="reading mt-1 text-base text-ink">{laniaLine}</p>
            {prefs.laniaVoice && (
              <button
                type="button"
                onClick={() => speak(laniaLine, { lang: 'es', rate: prefs.audioRate })}
                className="mt-2 text-sm font-semibold text-violet-700 underline-offset-4 hover:underline"
              >
                Escuchar a Lania
              </button>
            )}
          </div>
          <Lania expression={def.expression} className="w-full max-w-md" title={`Lania: ${laniaLine}`} />
        </div>
      </aside>

      {/* Step content */}
      <main className="flex min-h-dvh flex-col">
        <header className="flex items-center gap-4 px-5 py-4 sm:px-10 sm:py-6">
          <Link to="/" aria-label="LANIA, inicio" className="lg:hidden">
            <Logo size="sm" />
          </Link>
          <div className="flex flex-1 items-center gap-4">
            <span className="hidden whitespace-nowrap text-sm font-semibold text-ink-soft sm:inline">
              Paso {step + 1} de {STEPS.length}
            </span>
            <ProgressBar value={step + 1} max={STEPS.length} label={`Paso ${step + 1} de ${STEPS.length}`} size="xs" className="max-w-xs" />
          </div>
          <Link to="/app" className="text-sm font-semibold text-ink-soft underline-offset-4 hover:text-ink hover:underline">
            Omitir
          </Link>
        </header>

        <div className="flex flex-1 flex-col px-5 pb-32 sm:px-10 lg:pb-10">
          <div className="mx-auto w-full max-w-2xl flex-1 py-4 lg:py-10">
            <LaniaSays expression={def.expression} size="sm" className="mb-6 lg:hidden" tone="lavender">
              {laniaLine}
            </LaniaSays>

            <div key={def.id} className="animate-fade-up">
              <Heading level={1} size="lg">
                {def.title(draft)}
              </Heading>
              {def.hint && <p className="mt-2 text-base text-ink-soft sm:text-lg">{def.hint}</p>}

              <div className="mt-8">
                {def.id === 'hola' && (
                  <Field label="¿Cómo quieres que te llame?" hint="Solo tu nombre o apodo. Nada más.">
                    {({ id, describedBy }) => (
                      <TextInput
                        id={id}
                        aria-describedby={describedBy}
                        icon={UserRound}
                        inputSize="lg"
                        value={draft.name}
                        maxLength={30}
                        autoComplete="given-name"
                        onChange={(e) => set('name', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && next()}
                      />
                    )}
                  </Field>
                )}

                {def.id === 'objetivo' && (
                  <div role="radiogroup" aria-label="Objetivo principal" className="grid gap-3 sm:grid-cols-2">
                    {GOALS.map((g) => {
                      const Icon = g.icon ?? Compass
                      return (
                        <OptionCard key={g.id} selected={draft.goal === g.id} onClick={() => set('goal', g.id)} icon={<Icon size={22} aria-hidden />} title={g.label} desc={g.desc} />
                      )
                    })}
                  </div>
                )}

                {def.id === 'nivel' && (
                  <div role="radiogroup" aria-label="Nivel autopercibido" className="grid gap-3">
                    {SELF_LEVELS.map((l, i) => (
                      <OptionCard
                        key={l.id}
                        selected={draft.selfLevel === l.id}
                        onClick={() => set('selfLevel', l.id)}
                        icon={
                          <span className="flex items-end gap-0.5" aria-hidden>
                            {[0, 1, 2, 3].map((b) => (
                              <span key={b} className={cn('w-1.5 rounded-full bg-current', BAR_HEIGHTS[b], b > i && 'opacity-25')} />
                            ))}
                          </span>
                        }
                        title={l.label}
                        desc={l.desc}
                        aside={<Badge tone="neutral">≈ {l.cefr}</Badge>}
                      />
                    ))}
                  </div>
                )}

                {def.id === 'intereses' && (
                  <div>
                    <div className="flex flex-wrap gap-2.5">
                      {INTERESTS.map((it) => {
                        const on = draft.interests.includes(it.id)
                        const full = !on && draft.interests.length >= 5
                        return (
                          <Chip
                            key={it.id}
                            selected={on}
                            icon={it.icon}
                            disabled={full}
                            className={cn(full && 'opacity-50')}
                            onClick={() => set('interests', on ? draft.interests.filter((x) => x !== it.id) : [...draft.interests, it.id])}
                          >
                            {it.label}
                          </Chip>
                        )
                      })}
                    </div>
                    <p className="mt-4 text-sm font-semibold text-ink-soft" aria-live="polite">
                      {draft.interests.length} de 5 seleccionados
                    </p>
                  </div>
                )}

                {def.id === 'ritmo' && (
                  <div role="radiogroup" aria-label="Duración de las sesiones" className="grid gap-3 sm:grid-cols-3">
                    {SESSION_OPTIONS.map((o) => {
                      const on = draft.sessionMinutes === o.value
                      return (
                        <button
                          key={o.value}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => set('sessionMinutes', o.value)}
                          className={cn(
                            'flex flex-col items-start rounded-3xl p-5 text-left ring-2 transition-colors',
                            on ? 'bg-violet-50 ring-violet-600' : 'bg-surface ring-line hover:bg-mist',
                          )}
                        >
                          <span className={cn('grid h-11 w-11 place-items-center rounded-2xl', on ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-700')}>
                            <Clock size={20} aria-hidden />
                          </span>
                          <span className="mt-4 font-display text-2xl font-extrabold text-ink">{o.label}</span>
                          <span className="font-bold text-ink">{o.title}</span>
                          <span className="mt-1 text-sm text-ink-soft">{o.desc}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {def.id === 'profesora' && (
                  <div className="space-y-5">
                    <div role="radiogroup" aria-label="Estilo de profesora" className="grid gap-3 sm:grid-cols-3">
                      {TEACHER_STYLES.map((t) => {
                        const on = draft.teacherStyle === t.id
                        const exp: LaniaExpression = t.id === 'divertida' ? 'welcome' : t.id === 'tranquila' ? 'listening' : 'explaining'
                        return (
                          <button
                            key={t.id}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => set('teacherStyle', t.id)}
                            className={cn(
                              'flex flex-col items-center rounded-3xl p-5 text-center ring-2 transition-colors',
                              on ? 'bg-violet-50 ring-violet-600' : 'bg-surface ring-line hover:bg-mist',
                            )}
                          >
                            <span className="h-20 w-20 overflow-hidden rounded-full bg-violet-200">
                              <Lania crop="head" expression={exp} animated={false} />
                            </span>
                            <span className="mt-3 font-bold text-ink">{t.label}</span>
                            <span className="mt-1 text-sm text-ink-soft">{t.desc}</span>
                          </button>
                        )
                      })}
                    </div>
                    <div className="rounded-3xl bg-surface p-5 ring-1 ring-line">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">Así te corregiría</p>
                      <p className="mt-3 inline-block rounded-2xl rounded-br-md bg-mist px-4 py-2 font-semibold text-ink">“Yesterday I go to university.”</p>
                      <p key={draft.teacherStyle} className="reading mt-3 animate-fade-in rounded-2xl rounded-bl-md bg-violet-100 px-4 py-3 text-ink">
                        {TEACHER_STYLES.find((t) => t.id === draft.teacherStyle)?.sample}
                      </p>
                    </div>
                  </div>
                )}

                {def.id === 'preferencias' && (
                  <div className="rounded-3xl bg-surface p-5 ring-1 ring-line sm:p-7">
                    <PreferencesFields compact />
                  </div>
                )}

                {def.id === 'plan' && (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { label: 'Objetivo', value: GOAL_BY_ID[draft.goal]?.label },
                        { label: 'Cómo te sientes', value: SELF_LEVELS.find((l) => l.id === draft.selfLevel)?.label },
                        { label: 'Sesiones', value: SESSION_OPTIONS.find((o) => o.value === draft.sessionMinutes)?.label + ' · ' + SESSION_OPTIONS.find((o) => o.value === draft.sessionMinutes)?.title },
                        { label: 'Profesora', value: TEACHER_STYLES.find((t) => t.id === draft.teacherStyle)?.label },
                      ].map((r) => (
                        <div key={r.label} className="rounded-2xl bg-surface p-4 ring-1 ring-line">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">{r.label}</p>
                          <p className="mt-1 font-bold text-ink">{r.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">Intereses</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {draft.interests.map((i) => (
                          <Badge key={i} tone="violet" size="md">
                            {INTERESTS.find((x) => x.id === i)?.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">Preferencias</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {prefSummary.map((p) => (
                          <Badge key={p} tone="mint" size="md">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-canvas/95 px-5 py-4 backdrop-blur sm:px-10 lg:static lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
            <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
              <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                Atrás
              </Button>
              {last ? (
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button variant="secondary" icon={Sparkles} onClick={() => finish('/app')}>
                    Explorar primero
                  </Button>
                  <Button size="lg" icon={ClipboardCheck} onClick={() => finish('/diagnostico')}>
                    Hacer el diagnóstico
                  </Button>
                </div>
              ) : (
                <Button size="lg" iconRight={ArrowRight} onClick={next} disabled={!def.valid(draft)}>
                  {step === 0 ? 'Empezar' : 'Continuar'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
