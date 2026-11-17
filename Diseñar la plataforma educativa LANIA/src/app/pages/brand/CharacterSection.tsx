import { useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { Lania, LANIA_EXPRESSION_INFO, type LaniaExpression } from '@/app/components/illustrations/Lania'
import { LaniaTurnaround } from '@/app/components/illustrations/LaniaTurnaround'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { BrandSection, SpecLabel } from './BrandKit'

const PALETTE = [
  { name: 'Piel', v: 'var(--illo-skin)' },
  { name: 'Sombra', v: 'var(--illo-skin-shade)' },
  { name: 'Cabello', v: 'var(--illo-hair)' },
  { name: 'Brillo', v: 'var(--illo-hair-shine)' },
  { name: 'Chaqueta', v: 'var(--illo-coral)' },
  { name: 'Camiseta', v: 'var(--illo-violet)' },
  { name: 'Ear cuff IA', v: 'var(--illo-violet-light)' },
  { name: 'Moño', v: 'var(--illo-coral-deep)' },
]

const TRAITS = ['Inteligente y curiosa', 'Amable y cercana', 'Humor espontáneo', 'Paciente y empática', 'Segura al enseñar', 'Energía juvenil, nunca infantil']

const RIG = [
  { layer: 'hair-back · moño', anim: 'Rebote suave al reír' },
  { layer: 'head (tilt)', anim: 'Inclinación por expresión · 500 ms' },
  { layer: 'eyes', anim: 'Parpadeo cada 5,6 s' },
  { layer: 'brows', anim: '5 posiciones' },
  { layer: 'mouth', anim: '5 formas + habla (0,26 s)' },
  { layer: 'arm-left / arm-right', anim: 'Saludo, señalar, mentón, pecho, celebrar' },
  { layer: 'ear-cuff', anim: 'Brillo al escuchar' },
  { layer: 'torso', anim: 'Respiración 6 s' },
]

const EXPRESSIONS = Object.keys(LANIA_EXPRESSION_INFO) as Exclude<LaniaExpression, 'neutral'>[]

export function CharacterSection() {
  return (
    <BrandSection
      id="personaje"
      eyebrow="06 · Personaje principal"
      title="Lania, tu profesora de IA"
      lead="Adulta joven, latinoamericana, con un moño alto y un bob asimétrico que la hacen reconocible incluso en silueta. Su chaqueta coral y su camiseta violeta conectan con la marca; el ear cuff violeta es la única pista de que es una IA."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <Card padding="none" className="overflow-hidden">
          <div className="grid grid-cols-3 bg-violet-100">
            {(
              [
                ['front', 'Frontal'],
                ['threeQuarter', 'Tres cuartos'],
                ['profile', 'Perfil'],
              ] as const
            ).map(([v, label]) => (
              <figure key={v} className="relative border-r border-violet-200/70 last:border-0">
                <LaniaTurnaround view={v} className="w-full" />
                <figcaption className="absolute inset-x-0 bottom-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-violet-800">{label}</figcaption>
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
            <p className="mt-3 text-sm text-ink-soft">Moño + bob asimétrico: reconocible sin detalles.</p>
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
            <SpecLabel>Preparada para Rive / Lottie</SpecLabel>
            <p className="reading text-ink-soft">
              El SVG está construido por capas nombradas (<code className="rounded bg-mist px-1 text-sm">data-layer</code>) con pivotes definidos: cuello para la cabeza, codo
              para el saludo y centro de ojos para el parpadeo. Las expresiones son combinaciones de ojos, cejas, boca, brazos e inclinación.
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
