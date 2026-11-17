import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ArrowLeft, EyeOff, Focus, UserRound, Volume2 } from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { useSpeech } from '@/app/lib/speech'
import { Lania, type LaniaExpression } from '@/app/components/illustrations/Lania'
import { Button, ButtonLink, IconButton } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { StepProgress } from '@/app/components/ui/Progress'
import { LaniaSays } from '@/app/components/lania/LaniaSays'
import { PageContainer } from '@/app/components/layout/PageHeader'
import { usePreferences } from '@/app/state/preferences'
import { BuildStep, PracticeStep, RecallStep, RuleStep, SpeakStep, SummaryStep } from './classroom/Steps'
import type { StepProps } from './classroom/StepKit'

const STEPS: { label: string; Component: (p: StepProps) => React.ReactNode; intro: { expression: LaniaExpression; message: string } }[] = [
  {
    label: 'Recuerda',
    Component: RecallStep,
    intro: { expression: 'welcome', message: '¡Hola de nuevo! Antes de la regla, un calentamiento: intenta recordar sin mirar. Tu cerebro aprende más así.' },
  },
  { label: 'Regla', Component: RuleStep, intro: { expression: 'explaining', message: 'Una sola idea para hoy: si la acción ya terminó, el verbo viaja al pasado.' } },
  { label: 'Practica', Component: PracticeStep, intro: { expression: 'neutral', message: 'Tu turno. Elige con calma; si dudas, pídeme una pista.' } },
  { label: 'Construye', Component: BuildStep, intro: { expression: 'explaining', message: 'Ahora arma tú la frase. Ojo: hay dos palabras que sobran.' } },
  { label: 'Habla', Component: SpeakStep, intro: { expression: 'listening', message: 'Me encantaría escucharte. Cuéntame tu fin de semana en una o dos frases.' } },
  { label: 'Resumen', Component: SummaryStep as (p: StepProps) => React.ReactNode, intro: { expression: 'celebrating', message: '¡Gran clase! Mira todo lo que conseguiste hoy.' } },
]

/** E · Aula con Lania */
export function Classroom() {
  const { prefs, setPref } = usePreferences()
  const [params] = useSearchParams()
  const [step, setStep] = useState(() => Math.min(Math.max(Number(params.get('paso') ?? 1) - 1, 0), STEPS.length - 1) || 0)
  const [lania, setLania] = useState(STEPS[step].intro)
  const [hideLania, setHideLania] = useState(false)
  const { speak, stop, speaking } = useSpeech()
  const compact = prefs.focusMode || hideLania

  useEffect(() => {
    setLania(STEPS[step].intro)
    stop()
  }, [step, stop])

  const say = useCallback((expression: LaniaExpression, message: string) => setLania({ expression, message }), [])
  const next = useCallback(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), [])
  const listen = () => (speaking ? stop() : speak(lania.message, { lang: 'es', rate: prefs.audioRate }, !prefs.laniaVoice))
  const Current = STEPS[step].Component

  return (
    <PageContainer wide className="lg:py-8">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <ButtonLink to="/app" variant="ghost" size="sm" icon={ArrowLeft} className="-ml-3">
          Salir
        </ButtonLink>
        <div className="min-w-0 flex-1">
          <p className={cn('text-xs font-bold uppercase tracking-[0.14em] text-violet-700', prefs.focusMode && 'sr-only')}>Unidad 2 · Contar experiencias</p>
          <h1 className="truncate font-display text-lg font-extrabold text-ink sm:text-xl">El pasado simple: lo que hiciste ayer</h1>
        </div>
        <IconButton
          icon={Focus}
          variant="secondary"
          label={prefs.focusMode ? 'Salir del modo concentración' : 'Activar modo concentración'}
          pressed={prefs.focusMode}
          onClick={() => setPref('focusMode', !prefs.focusMode)}
        />
      </header>
      <StepProgress steps={STEPS.map((s) => s.label)} current={step} className="mt-5" />

      <div className={cn('mt-6 grid gap-6', !compact && 'lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[21rem_minmax(0,1fr)]')}>
        {compact ? (
          <LaniaSays expression={lania.expression} size="md" tone="lavender" onListen={listen} live className="lg:max-w-3xl">
            {lania.message}
          </LaniaSays>
        ) : (
          <aside aria-label="Lania" className="hidden lg:block">
            <div className="sticky top-6 overflow-hidden rounded-4xl bg-violet-100">
              <div className="relative px-4 pt-4">
                <Lania expression={lania.expression} talking={speaking} crop="portrait" className="mx-auto w-full max-w-72" title={`Lania: ${lania.message}`} />
              </div>
              <div className="relative -mt-6 p-4">
                <div key={lania.message} className="animate-pop rounded-3xl rounded-tl-lg bg-surface p-4 shadow-lift" aria-live="polite">
                  <p className="text-xs font-bold text-violet-700">Lania</p>
                  <p className="reading mt-1 text-ink">{lania.message}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Button variant="ghost" size="sm" icon={Volume2} onClick={listen} aria-pressed={speaking}>
                    {speaking ? 'Detener' : 'Escuchar'}
                  </Button>
                  <Button variant="ghost" size="sm" icon={EyeOff} onClick={() => setHideLania(true)}>
                    Ocultar
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        )}

        {!compact && (
          <LaniaSays expression={lania.expression} size="sm" tone="lavender" onListen={listen} live className="lg:hidden">
            {lania.message}
          </LaniaSays>
        )}

        <Card padding="lg" className="flex min-h-[32rem] flex-col">
          <div key={step} className="flex flex-1 animate-fade-up flex-col">
            <Current say={say} next={next} />
          </div>
        </Card>
      </div>

      {hideLania && !prefs.focusMode && (
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" icon={UserRound} onClick={() => setHideLania(false)}>
            Mostrar a Lania grande
          </Button>
        </div>
      )}
    </PageContainer>
  )
}
