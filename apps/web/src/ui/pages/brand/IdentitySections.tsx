import { Ban, Check, Compass, Heart, Lightbulb, X } from 'lucide-react'
import { cn } from '@/ui/lib/cn'
import { Logo, LogoMark } from '@/ui/components/brand/Logo'
import { Lania } from '@/ui/components/illustrations/Lania'
import { Card } from '@/ui/components/ui/Card'
import { MOOD_PHOTOS, type MoodPhoto } from '@/ui/data/moodboard'
import { BrandSection, SpecLabel } from './BrandKit'

function Photo({ p, className }: { p: MoodPhoto; className?: string }) {
  return (
    <figure className={cn('group relative overflow-hidden rounded-3xl bg-mist', className)}>
      <img src={p.src} alt={p.alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <figcaption>
        <span className="absolute bottom-3 left-3 max-w-[85%] rounded-full bg-surface/90 px-3 py-1 text-xs font-bold text-ink backdrop-blur">{p.caption}</span>
        <span className="absolute right-3 top-3 rounded-full bg-ink/60 px-2 py-0.5 text-xs text-white backdrop-blur">Foto: {p.credit} / Unsplash</span>
      </figcaption>
    </figure>
  )
}

export function MoodboardSection() {
  const P = MOOD_PHOTOS
  return (
    <BrandSection
      id="moodboard"
      eyebrow="01 · Moodboard"
      title="Cálida, curiosa y viva"
      lead="Luz de atardecer, cafés con conversación, ciudades latinoamericanas y momentos de calma. La fotografía inspira la atmósfera; la ilustración y la interfaz cuentan la historia."
    >
      <div className="grid auto-rows-[9rem] grid-cols-2 gap-3 sm:auto-rows-[11rem] md:grid-cols-4 lg:gap-4">
        <Photo p={P.cafe} className="col-span-2 row-span-2" />
        <Photo p={P.city} className="row-span-2" />
        <div className="flex flex-col justify-between rounded-3xl bg-ink p-5 text-white">
          <p className="font-display text-4xl font-extrabold tracking-tight">Aa</p>
          <p className="text-xs text-violet-100">Plus Jakarta Sans · Inter</p>
        </div>
        <div className="grid grid-cols-3 overflow-hidden rounded-3xl" role="img" aria-label="Colores principales">
          <span className="bg-violet-600" />
          <span className="bg-coral-300" />
          <span className="bg-mint-600" />
        </div>
        <Photo p={P.home} className="col-span-2" />
        <div className="relative overflow-hidden rounded-3xl bg-violet-100">
          <Lania crop="head" expression="welcome" className="absolute inset-0 h-full w-full" />
        </div>
        <Photo p={P.focus} />
        <div className="flex flex-col justify-center gap-2 rounded-3xl bg-coral-100 p-4">
          <span className="w-fit rounded-2xl rounded-bl-md bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-soft">¡Casi! ¿Cómo cambia go?</span>
          <span className="inline-flex w-fit items-center gap-1 rounded-xl bg-mint-100 px-2.5 py-1 text-sm font-bold text-mint-800">
            <Check size={14} aria-hidden /> went
          </span>
        </div>
        <Photo p={P.travel} />
        <Photo p={P.group} className="col-span-2" />
        <div className="col-span-2 flex flex-wrap content-center items-center justify-center gap-2 rounded-3xl bg-surface p-5 ring-1 ring-line md:col-span-4">
          {['Cálida', 'Curiosa', 'Clara', 'Viva', 'Valiente', 'Cercana', 'Con propósito'].map((w, i) => (
            <span
              key={w}
              className={cn(
                'rounded-full px-3.5 py-1.5 font-display text-sm font-bold',
                i % 3 === 0 ? 'bg-violet-100 text-violet-800' : i % 3 === 1 ? 'bg-coral-100 text-coral-800' : 'bg-mint-100 text-mint-800',
              )}
            >
              {w}
            </span>
          ))}
        </div>
      </div>
    </BrandSection>
  )
}

const MIX = [
  { pct: 45, label: 'Tecnología educativa', color: 'bg-violet-600', items: ['Interfaz limpia y legible', 'Datos honestos y verificables', 'IA que se siente, no que se presume'] },
  { pct: 35, label: 'Ilustración editorial', color: 'bg-coral-400', items: ['Lania y su elenco expresivo', 'Formas redondeadas y siluetas claras', 'Sombras suaves, sin 3D innecesario'] },
  { pct: 20, label: 'Aventura y juego', color: 'bg-mint-600', items: ['Misiones y mapa de situaciones', 'Historias interactivas', 'Reconocimientos por dominio'] },
]

const VOICE = [
  { yes: '¡Casi! Ya entendí lo que quieres decir. Yesterday pide pasado: ¿cómo cambia go?', no: 'Respuesta incorrecta. Inténtalo de nuevo.' },
  { yes: 'Sin rachas: si un día no puedes, seguimos donde lo dejaste.', no: '¡Perderás tu racha de 12 días!' },
  { yes: 'Pasado simple · 2 de 3 evidencias para dominarlo.', no: 'Fluidez: 73,4 %' },
]

export function IdentitySection() {
  return (
    <BrandSection
      id="identidad"
      eyebrow="02 · Concepto de identidad"
      title="Una academia que conversa"
      lead="LANIA es la mezcla entre una academia moderna, una profesora particular carismática y una experiencia interactiva. Todo parte de una conversación: por eso la burbuja de diálogo vive en el logotipo."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Heart, title: 'Cercanía con criterio', text: 'Cálida y humana, pero exigente con lo que importa: que aprendas de verdad.' },
          { icon: Lightbulb, title: 'Claridad primero', text: 'Una instrucción por pantalla, jerarquía evidente y explicaciones breves.' },
          { icon: Compass, title: 'Juego con propósito', text: 'La aventura premia la autonomía y el dominio, nunca el clic vacío.' },
        ].map((p) => (
          <Card key={p.title} padding="lg">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700">
              <p.icon size={20} aria-hidden />
            </span>
            <p className="mt-4 font-display text-lg font-bold text-ink">{p.title}</p>
            <p className="reading mt-1 text-ink-soft">{p.text}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <SpecLabel>Equilibrio de la dirección artística</SpecLabel>
        <div className="flex h-5 overflow-hidden rounded-full" role="img" aria-label="45% tecnología, 35% ilustración, 20% aventura">
          {MIX.map((m) => (
            <span key={m.label} className={m.color} style={{ width: `${m.pct}%` }} />
          ))}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {MIX.map((m) => (
            <div key={m.label}>
              <p className="flex items-center gap-2 font-bold text-ink">
                <span className={cn('h-3 w-3 rounded-full', m.color)} aria-hidden />
                {m.pct}% · {m.label}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                {m.items.map((i) => (
                  <li key={i}>· {i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <SpecLabel>Voz y tono de Lania</SpecLabel>
        <div className="grid gap-3 md:grid-cols-3">
          {VOICE.map((v) => (
            <div key={v.yes} className="overflow-hidden rounded-3xl ring-1 ring-line">
              <p className="flex gap-2 bg-mint-50 p-4 text-sm text-ink">
                <Check size={17} className="mt-0.5 shrink-0 text-mint-700" aria-label="Sí" />
                {v.yes}
              </p>
              <p className="flex gap-2 bg-surface p-4 text-sm text-ink-soft">
                <X size={17} className="mt-0.5 shrink-0 text-danger-600" aria-label="No" />
                <span className="line-through decoration-danger-300">{v.no}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </BrandSection>
  )
}

export function LogoSection() {
  return (
    <BrandSection
      id="logotipo"
      eyebrow="03 · Logotipo"
      title="Lania, con su cara dentro del nombre"
      lead="Letras redondeadas en verde menta; la primera «a» es la cara de Lania con sus gafas y audífonos: aprender escuchando y hablando es el centro de la experiencia."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid min-h-56 place-items-center rounded-4xl bg-surface p-8 ring-1 ring-line lg:col-span-2">
          <Logo size="hero" />
        </div>
        <div className="grid gap-4">
          <div className="grid place-items-center rounded-4xl bg-ink p-8">
            <Logo size="xl" tone="white" />
          </div>
          <div className="grid place-items-center rounded-4xl bg-violet-600 p-8">
            <Logo size="xl" tone="white" />
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card padding="lg">
          <SpecLabel>Ícono de app</SpecLabel>
          <div className="flex items-end gap-4">
            <LogoMark className="h-24 w-24" />
            <LogoMark className="h-14 w-14" />
            <LogoMark className="h-8 w-8" />
            <LogoMark className="h-4 w-4" />
          </div>
          <p className="mt-4 text-sm text-ink-soft">La cara de Lania. Es el ícono de la pestaña del navegador y de la app.</p>
        </Card>
        <Card padding="lg">
          <SpecLabel>Área de respeto</SpecLabel>
          <div className="grid place-items-center rounded-2xl border-2 border-dashed border-violet-300 p-6">
            <Logo size="lg" />
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
            Margen mínimo: el alto de la cara de Lania en cada lado.
          </p>
        </Card>
        <Card padding="lg">
          <SpecLabel>Evitar</SpecLabel>
          <ul className="space-y-3">
            {[
              { el: <Logo size="md" className="scale-x-150" />, t: 'Deformar o estirar' },
              { el: <Logo size="md" className="hue-rotate-90" />, t: 'Cambiar los colores del logo' },
              { el: <Logo size="md" className="-rotate-12" />, t: 'Inclinar o rotar' },
            ].map((d) => (
              <li key={d.t} className="flex items-center gap-4">
                <span className="flex h-12 w-28 items-center justify-center overflow-hidden rounded-xl bg-mist">{d.el}</span>
                <span className="flex items-center gap-1.5 text-sm text-ink-soft">
                  <Ban size={15} className="text-danger-600" aria-hidden /> {d.t}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </BrandSection>
  )
}
