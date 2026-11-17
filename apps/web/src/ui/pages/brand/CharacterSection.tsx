import { useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { cn } from '@/ui/lib/cn'
import { Lania, LANIA_EXPRESSION_INFO, type LaniaExpression } from '@/ui/components/illustrations/Lania'
import { LaniaTurnaround } from '@/ui/components/illustrations/LaniaTurnaround'
import { Button } from '@/ui/components/ui/Button'
import { Card } from '@/ui/components/ui/Card'
import { BrandSection, SpecLabel } from './BrandKit'

const PALETTE = [
  { name: 'Piel', v: 'var(--illo-turtle-skin)' },
  { name: 'Sombra', v: 'var(--illo-turtle-shade)' },
  { name: 'Caparazón', v: 'var(--illo-turtle-shell)' },
  { name: 'Barriga', v: 'var(--illo-turtle-belly)' },
  { name: 'Audífonos', v: 'var(--illo-turtle-headphones)' },
  { name: 'Gafas', v: 'var(--illo-turtle-goggles)' },
  { name: 'Pañuelo', v: 'var(--illo-turtle-scarf)' },
  { name: 'Contorno', v: 'var(--illo-turtle-outline)' },
]

const TRAITS = ['Curiosa', 'Paciente y empática', 'Amable y cercana', 'Humor espontáneo', 'Creativa', 'Tierna, nunca infantil']

const RIG = [
  { layer: 'welcome', anim: 'Saluda con guiño: landing, login, onboarding' },
  { layer: 'explaining', anim: 'Brazo arriba: teoría y ejemplos' },
  { layer: 'thinking', anim: 'Mano en la barbilla: pistas y diagnóstico' },
  { layer: 'correcting', anim: 'Con laptop: revisión de respuestas' },
  { layer: 'celebrating', anim: 'Brazos arriba: solo dominio real' },
  { layer: 'neutral / listening', anim: 'De frente, tranquila: escucha y reposo' },
  { layer: 'respiración', anim: 'Balanceo de 6 s en reposo' },
  { layer: 'habla', anim: 'Vaivén suave mientras habla' },
]

const EXPRESSIONS = Object.keys(LANIA_EXPRESSION_INFO) as Exclude<LaniaExpression, 'neutral'>[]

export function CharacterSection() {
  return (
    <BrandSection
      id="personaje"
      eyebrow="06 · Personaje principal"
      title="Lania, la tortuguita"
      lead="Una tortuguita curiosa y paciente: piel turquesa, caparazón morado, audífonos rosa con estrella, gafas sobre la cabeza y pañuelo amarillo. Te acompaña a tu ritmo y es una profe de IA, no una persona."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <Card padding="none" className="overflow-hidden">
          <div className="grid grid-cols-2 bg-violet-100 sm:grid-cols-4">
            {(
              [
                ['front', 'Frontal'],
                ['threeQuarter', 'Tres cuartos'],
                ['profile', 'Perfil'],
                ['back', 'Espalda'],
              ] as const
            ).map(([v, label]) => (
              <figure key={v} className="relative border-r border-violet-200/70 last:border-0">
                <LaniaTurnaround view={v} className="w-full p-3" />
                <figcaption className="pb-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-violet-800">{label}</figcaption>
              </figure>
            ))}
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <div>
              <SpecLabel>Personalidad</SpecLabel>
              <ul className="flex flex-wrap gap-2">
                {TRAITS.map((t) => (
                  <li key={t} className="rounded-full bg-mist px-3 py-1.5 text-sm font-semibold text-ink">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SpecLabel>Paleta del personaje</SpecLabel>
              <ul className="grid grid-cols-4 gap-2">
                {PALETTE.map((p) => (
                  <li key={p.name} className="text-center">
                    <span className="mx-auto block h-10 w-10 rounded-full ring-1 ring-line" style={{ background: p.v }} />
                    <span className="mt-1 block text-xs font-semibold text-ink-soft">{p.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
        <div className="grid gap-4">
          <Card padding="lg" className="text-center">
            <SpecLabel>Prueba de silueta</SpecLabel>
            <div className="mx-auto w-40">
              <Lania animated={false} className="w-full brightness-0" />
            </div>
            <p className="mt-3 text-sm text-ink-soft">Caparazón + audífonos + gafas: reconocible sin detalles.</p>
          </Card>
          <Card padding="lg">
            <SpecLabel>Escala de uso</SpecLabel>
            <div className="flex items-end justify-between gap-2">
              {[
                ['h-20 w-20', 'Aula'],
                ['h-14 w-14', 'Feedback'],
                ['h-10 w-10', 'Writing'],
                ['h-7 w-7', 'Examen'],
              ].map(([s, l]) => (
                <div key={l} className="flex flex-col items-center gap-1.5">
                  <span className={cn('overflow-hidden rounded-full bg-violet-200', s)}>
                    <Lania crop="head" animated={false} className="h-full w-full" />
                  </span>
                  <span className="text-xs font-semibold text-ink-soft">{l}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-ink-soft">Grande en bienvenida, clases y speaking. Mínima en writing y evaluaciones.</p>
          </Card>
        </div>
      </div>

      <Card padding="lg" className="mt-4">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SpecLabel>Una ilustración por momento</SpecLabel>
            <p className="reading text-ink-soft">
              Cada expresión es una ilustración propia con fondo transparente (<code className="rounded bg-mist px-1 text-sm">public/lania/</code>), en cuerpo
              completo y en versión cabeza para avatares. Para animarla con Rive o Lottie hará falta separarla por capas.
            </p>
            <p className="mt-4 text-sm font-semibold text-ink">Máquina de estados sugerida</p>
            <p className="mt-1 font-mono text-xs leading-relaxed text-ink-soft">idle → listening → thinking → explaining → correcting → celebrating</p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {RIG.map((r) => (
              <li key={r.layer} className="rounded-2xl bg-mist p-3">
                <p className="font-mono text-xs font-bold text-violet-800">{r.layer}</p>
                <p className="text-sm text-ink-soft">{r.anim}</p>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </BrandSection>
  )
}

export function ExpressionsSection() {
  const [animate, setAnimate] = useState(true)
  return (
    <BrandSection
      id="expresiones"
      eyebrow="07 · Hoja de expresiones"
      title="Seis momentos de una buena clase"
      lead="Cada expresión acompaña un momento pedagógico concreto. La interfaz cambia la expresión de Lania con transiciones breves, que se reducen si la persona lo prefiere."
    >
      <div className="mb-6 flex justify-end">
        <Button variant="secondary" size="sm" icon={animate ? Pause : Play} onClick={() => setAnimate((a) => !a)}>
          {animate ? 'Pausar animaciones' : 'Animar'}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXPRESSIONS.map((e, i) => {
          const info = LANIA_EXPRESSION_INFO[e]
          return (
            <Card key={e} padding="none" className="overflow-hidden">
              <div className={cn('relative', i % 3 === 0 ? 'bg-violet-100' : i % 3 === 1 ? 'bg-coral-100' : 'bg-mint-50')}>
                <span className="absolute left-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-surface text-sm font-bold text-ink shadow-soft">{i + 1}</span>
                <Lania expression={e} animated={animate} talking={animate && e === 'explaining'} crop="portrait" className="mx-auto w-full max-w-72" title={info.label} />
              </div>
              <div className="p-5">
                <p className="font-display text-lg font-bold text-ink">{info.label}</p>
                <p className="mt-1 text-sm text-ink-soft">{info.when}</p>
                <p className="mt-3 rounded-2xl rounded-tl-md bg-mist px-3 py-2 text-sm text-ink">“{info.line}”</p>
              </div>
            </Card>
          )
        })}
      </div>
    </BrandSection>
  )
}
