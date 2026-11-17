import type { ReactNode } from 'react'
import { ArrowRight, Check, Lightbulb, Mic, Play, Sparkles } from 'lucide-react'
import { cn } from '@/ui/lib/cn'
import { Lania } from '@/ui/components/illustrations/Lania'
import { PersonAvatar } from '@/ui/components/illustrations/PersonAvatar'
import { Spark, Squiggle } from '@/ui/components/illustrations/Decor'
import { Badge } from '@/ui/components/ui/Badge'
import { ButtonLink } from '@/ui/components/ui/Button'
import { ProgressBar } from '@/ui/components/ui/Progress'
import { Heading, Lead } from '@/ui/components/ui/Typography'
import { VoiceWave } from '@/ui/components/exercise/VoiceWave'
import { PEOPLE } from '@/ui/data/people'
import { Container } from './shared'

function FloatCard({ className, children, delay = 0 }: { className?: string; children: ReactNode; delay?: number }) {
  return (
    <div className={cn('absolute animate-float', className)} style={{ animationDelay: `${delay}s` }}>
      <div className="rounded-3xl bg-surface p-3.5 shadow-float ring-1 ring-line/60">{children}</div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-title">
      <Container className="relative grid items-center gap-14 pb-16 pt-10 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:pb-24 lg:pt-16">
        <div className="min-w-0 animate-fade-up">
          <Badge tone="violet" size="md" icon={Sparkles}>
            Academia de inglés con IA<span className="hidden sm:inline">· hecha en Latinoamérica</span>
          </Badge>
          <Heading level={1} size="display" id="hero-title" className="mt-6">
            Habla inglés{' '}
            <span className="relative inline-block whitespace-nowrap">
              sin miedo.
              <Squiggle className="absolute -bottom-2 left-0 h-4 w-full text-coral-400 sm:-bottom-3" />
            </span>{' '}
            <span className="text-violet-600">Aprende a tu manera.</span>
          </Heading>
          <Lead className="mt-7 max-w-xl">
            Lania, tu profesora de IA, descubre tu nivel, adapta cada clase a tus metas y practica contigo conversaciones reales. Con
            paciencia, humor y correcciones que sí entiendes.
          </Lead>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink to="/registro" size="lg" iconRight={ArrowRight}>
              Descubre tu nivel
            </ButtonLink>
            <ButtonLink to="/app/aula" size="lg" variant="secondary" icon={Play}>
              Ver una clase
            </ButtonLink>
          </div>
          <p className="mt-4 text-sm text-ink-soft">Prueba 7 días gratis · Te avisamos antes de cobrar · Cancela con un clic</p>
          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-3">
              {(['camila', 'diego', 'ana', 'mateo'] as const).map((p) => (
                <span key={p} className="h-11 w-11 overflow-hidden rounded-full bg-violet-100 ring-4 ring-canvas">
                  <PersonAvatar look={PEOPLE[p].look} />
                </span>
              ))}
            </div>
            <p className="max-w-xs text-sm text-ink-soft">
              Para universitarios y profesionales de <strong className="text-ink">18 a 35 años</strong> que quieren hablar con confianza.
            </p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[34rem]">
          <div className="relative aspect-[5/6] w-full">
            <div className="absolute inset-x-[7%] bottom-0 top-[5%] rounded-t-full rounded-b-[3rem] bg-violet-200" aria-hidden />
            <div className="absolute inset-x-[17%] bottom-0 top-[16%] rounded-t-full rounded-b-[2.5rem] bg-violet-100/70" aria-hidden />
            <div className="absolute right-[9%] top-[4%] h-16 w-16 rounded-full bg-coral-300 sm:h-20 sm:w-20" aria-hidden />
            <Spark className="absolute left-[13%] top-[9%] h-7 w-7 text-violet-500" />
            <Lania expression="welcome" className="absolute inset-x-0 bottom-0 mx-auto w-[90%]" title="Lania saluda con la mano" />

            <FloatCard className="-left-1 top-[14%] max-w-[14rem] sm:-left-8" delay={0}>
              <div className="flex items-start gap-2.5">
                <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-mint-100">
                  <PersonAvatar look={PEOPLE.valentina.look} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-ink-soft">Tú</p>
                  <p className="text-sm font-semibold text-ink">“Yesterday I go to university.”</p>
                </div>
              </div>
            </FloatCard>

            <FloatCard className="right-0 top-[34%] hidden max-w-[15rem] sm:-right-10 sm:block" delay={1.2}>
              <p className="flex items-center gap-1.5 text-xs font-bold text-coral-700">
                <Lightbulb size={13} aria-hidden /> Lania
              </p>
              <p className="mt-1 text-sm text-ink">¡Casi! Dijiste yesterday: necesitamos pasado. ¿Cómo cambia go?</p>
              <div className="mt-2.5 flex gap-1.5">
                <span className="rounded-xl bg-mist px-2.5 py-1 text-sm font-semibold text-ink-soft line-through">goed</span>
                <span className="inline-flex items-center gap-1 rounded-xl bg-mint-100 px-2.5 py-1 text-sm font-bold text-mint-800">
                  <Check size={14} aria-hidden /> went
                </span>
              </div>
            </FloatCard>

            <FloatCard className="bottom-[24%] left-0 hidden w-48 sm:-left-8 md:block" delay={0.6}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-ink">Speaking</p>
                <Badge tone="coral">A2+ → B1</Badge>
              </div>
              <ProgressBar value={4} max={10} label="Speaking: 4 de 10 objetivos" barClassName="bg-coral-500" className="mt-2.5" />
              <p className="mt-1.5 text-xs text-ink-soft">4 de 10 objetivos</p>
            </FloatCard>

            <FloatCard className="bottom-[6%] right-0 sm:-right-6" delay={1.8}>
              <div className="flex items-center gap-3 text-coral-600">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-coral-100">
                  <Mic size={17} aria-hidden />
                </span>
                <VoiceWave active bars={8} />
                <span className="pr-1 text-xs font-semibold text-ink-soft">Lania te escucha</span>
              </div>
            </FloatCard>
          </div>
        </div>
      </Container>
    </section>
  )
}
