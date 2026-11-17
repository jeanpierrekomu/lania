import { useEffect, useState } from 'react'
import { cn } from '@/app/lib/cn'
import { contrastRatio, tokenValue } from '@/app/lib/contrast'
import { Badge } from '@/app/components/ui/Badge'
import { BrandSection, SpecLabel } from './BrandKit'

const CORE = [
  { token: '--color-ink', name: 'Índigo profundo', role: 'Texto principal y secciones especiales', cls: 'bg-ink', dark: true },
  { token: '--color-violet-600', name: 'Violeta principal', role: 'Acciones, tecnología y foco', cls: 'bg-violet-600', dark: true },
  { token: '--color-violet-100', name: 'Lavanda suave', role: 'Superficies de Lania y estados suaves', cls: 'bg-violet-100' },
  { token: '--color-coral-300', name: 'Coral cálido', role: 'Cercanía, humor y llamados cálidos', cls: 'bg-coral-300' },
  { token: '--color-mint-600', name: 'Menta oscuro', role: 'Avances, logros y estados correctos', cls: 'bg-mint-600', dark: true },
  { token: '--color-canvas', name: 'Fondo general', role: 'Lienzo de la aplicación', cls: 'bg-canvas ring-1 ring-line' },
  { token: '--color-ink-soft', name: 'Texto secundario', role: 'Descripciones y metadatos', cls: 'bg-ink-soft', dark: true },
  { token: '--color-line', name: 'Bordes suaves', role: 'Divisores y contornos', cls: 'bg-line' },
]

const SCALES: { name: string; steps: { k: string; cls: string }[] }[] = [
  {
    name: 'Violet',
    steps: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'].map((k) => ({ k, cls: `bg-violet-${k}` })),
  },
  { name: 'Coral', steps: ['50', '100', '200', '300', '400', '500', '600', '700', '800'].map((k) => ({ k, cls: `bg-coral-${k}` })) },
  { name: 'Mint', steps: ['50', '100', '200', '300', '400', '500', '600', '700', '800'].map((k) => ({ k, cls: `bg-mint-${k}` })) },
  { name: 'Night', steps: ['600', '700', '800', '900', '950'].map((k) => ({ k, cls: `bg-night-${k}` })) },
]

/* Static class list so Tailwind generates every swatch. */
export const SWATCH_SAFELIST =
  'bg-violet-50 bg-violet-100 bg-violet-200 bg-violet-300 bg-violet-400 bg-violet-500 bg-violet-600 bg-violet-700 bg-violet-800 bg-violet-900 bg-coral-50 bg-coral-100 bg-coral-200 bg-coral-300 bg-coral-400 bg-coral-500 bg-coral-600 bg-coral-700 bg-coral-800 bg-mint-50 bg-mint-100 bg-mint-200 bg-mint-300 bg-mint-400 bg-mint-500 bg-mint-600 bg-mint-700 bg-mint-800 bg-night-600 bg-night-700 bg-night-800 bg-night-900 bg-night-950'

const PAIRS = [
  { fg: '--color-white', bg: '--color-violet-600', label: 'Botón primario', fgCls: 'text-white', bgCls: 'bg-violet-600' },
  { fg: '--color-ink', bg: '--color-coral-300', label: 'Botón coral', fgCls: 'text-ink', bgCls: 'bg-coral-300' },
  { fg: '--color-ink', bg: '--color-canvas', label: 'Texto principal', fgCls: 'text-ink', bgCls: 'bg-canvas' },
  { fg: '--color-ink-soft', bg: '--color-white', label: 'Texto secundario', fgCls: 'text-ink-soft', bgCls: 'bg-white' },
  { fg: '--color-white', bg: '--color-mint-600', label: 'Botón de éxito', fgCls: 'text-white', bgCls: 'bg-mint-600' },
  { fg: '--color-mint-700', bg: '--color-mint-50', label: 'Estado correcto', fgCls: 'text-mint-700', bgCls: 'bg-mint-50' },
  { fg: '--color-danger-600', bg: '--color-white', label: 'Mensaje de error', fgCls: 'text-danger-600', bgCls: 'bg-white' },
  { fg: '--color-coral-800', bg: '--color-coral-50', label: 'Corrección amable', fgCls: 'text-coral-800', bgCls: 'bg-coral-50' },
  { fg: '--color-violet-800', bg: '--color-violet-100', label: 'Botón suave / badge', fgCls: 'text-violet-800', bgCls: 'bg-violet-100' },
  { fg: '--color-amber-700', bg: '--color-amber-50', label: 'Pista', fgCls: 'text-amber-700', bgCls: 'bg-amber-50' },
  { fg: '--color-white', bg: '--color-ink', label: 'Sección especial', fgCls: 'text-white', bgCls: 'bg-ink' },
  { fg: '--color-violet-100', bg: '--color-night-900', label: 'Texto en Speaking Lab', fgCls: 'text-violet-100', bgCls: 'bg-night-900' },
]

function useTokens(names: string[]) {
  const [values, setValues] = useState<Record<string, string>>({})
  useEffect(() => {
    setValues(Object.fromEntries(names.map((n) => [n, tokenValue(n)])))
  }, [])
  return values
}

const TYPE_SCALE = [
  { name: 'Display', spec: 'Plus Jakarta Sans 800 · 72/76', cls: 'font-display text-5xl font-extrabold tracking-tight sm:text-7xl', sample: 'Habla sin miedo' },
  { name: 'H1', spec: 'Plus Jakarta Sans 800 · 48/56', cls: 'font-display text-4xl font-extrabold tracking-tight sm:text-5xl', sample: 'Hola, Valentina.' },
  { name: 'H2', spec: 'Plus Jakarta Sans 800 · 30/38', cls: 'font-display text-3xl font-extrabold tracking-[-0.015em]', sample: 'Tus cinco habilidades' },
  { name: 'H3', spec: 'Plus Jakarta Sans 700 · 20/28', cls: 'font-display text-xl font-bold', sample: 'Próximos repasos' },
  { name: 'Body', spec: 'Inter 400 · 16/27', cls: 'reading text-base', sample: 'Usamos el pasado simple para acciones terminadas en un momento del pasado.' },
  { name: 'UI', spec: 'Inter 600 · 14/20', cls: 'text-sm font-semibold', sample: 'Continuar aprendiendo' },
  { name: 'Caption', spec: 'Inter 700 · 12/16 · +16% tracking', cls: 'text-xs font-bold uppercase tracking-[0.16em] text-violet-700', sample: 'Lección 4 de 8' },
]

export function ColorTypeSection() {
  const tokens = useTokens([...CORE.map((c) => c.token), ...PAIRS.flatMap((p) => [p.fg, p.bg])])
  return (
    <BrandSection
      id="color"
      eyebrow="04 · Color y tipografía"
      title="Un sistema cromático con significado"
      lead="Fondos mayoritariamente claros para leer cómodo; el oscuro se reserva para momentos especiales como el Speaking Lab. El violeta guía la acción, el coral acerca y el menta confirma avances."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CORE.map((c) => (
          <div key={c.token} className="overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
            <div className={cn('flex h-28 items-end p-4', c.cls)}>
              <span className={cn('font-mono text-sm font-semibold uppercase', c.dark ? 'text-white' : 'text-ink')}>{tokens[c.token]}</span>
            </div>
            <div className="p-4">
              <p className="font-bold text-ink">{c.name}</p>
              <p className="text-sm text-ink-soft">{c.role}</p>
              <p className="mt-1 font-mono text-xs text-ink-soft">{c.token}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 space-y-3">
        <SpecLabel>Escalas</SpecLabel>
        {SCALES.map((s) => (
          <div key={s.name} className="flex items-center gap-3">
            <span className="w-14 shrink-0 text-sm font-bold text-ink">{s.name}</span>
            <div className="flex flex-1 overflow-hidden rounded-2xl ring-1 ring-line">
              {s.steps.map((st) => (
                <span key={st.k} className={cn('flex h-12 flex-1 items-end justify-center pb-1.5 text-xs font-semibold', st.cls, Number(st.k) >= 500 || s.name === 'Night' ? 'text-white' : 'text-ink')}>
                  {st.k}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <SpecLabel>Contraste verificado (WCAG 2.2)</SpecLabel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PAIRS.map((p) => {
            const fg = tokens[p.fg]
            const bg = tokens[p.bg]
            const ratio = fg && bg ? contrastRatio(fg, bg) : 0
            const level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA grande' : 'No cumple'
            return (
              <div key={p.label} className="flex items-center gap-4 rounded-3xl bg-surface p-3 ring-1 ring-line">
                <span className={cn('grid h-14 w-20 shrink-0 place-items-center rounded-2xl text-lg font-bold ring-1 ring-line', p.bgCls, p.fgCls)}>Aa</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{p.label}</p>
                  <p className="font-mono text-xs text-ink-soft">
                    {fg} / {bg}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-extrabold text-ink">{ratio ? ratio.toFixed(1) : '–'}:1</p>
                  <Badge tone={ratio >= 4.5 ? 'mint' : 'danger'}>{level}</Badge>
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-sm text-ink-soft">Los estados de error y corrección nunca dependen solo del color: siempre incluyen ícono y texto.</p>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        <div className="rounded-4xl bg-ink p-8 text-white">
          <SpecLabel>Títulos</SpecLabel>
          <p className="font-display text-6xl font-extrabold tracking-tight">Plus Jakarta Sans</p>
          <p className="mt-4 font-display text-2xl font-bold text-violet-100">Geométrica, cálida y con carácter. 600 · 700 · 800</p>
          <p className="mt-6 font-display text-xl font-semibold tracking-wide text-coral-300">ABCDEFGHIJKLMNÑOPQRSTUVWXYZ 0123456789</p>
        </div>
        <div className="rounded-4xl bg-surface p-8 ring-1 ring-line">
          <SpecLabel>Interfaz y lectura</SpecLabel>
          <p className="text-6xl font-bold tracking-tight text-ink">Inter</p>
          <p className="mt-4 text-2xl text-ink-soft">Neutra, muy legible en pantallas pequeñas. 400 · 500 · 600 · 700</p>
          <p className="mt-6 text-xl font-medium tracking-wide text-violet-700">abcdefghijklmnñopqrstuvwxyz ¿?¡! áéíóú</p>
        </div>
      </div>

      <div className="mt-6 divide-y divide-line rounded-4xl bg-surface ring-1 ring-line">
        {TYPE_SCALE.map((t) => (
          <div key={t.name} className="grid items-baseline gap-2 p-5 sm:grid-cols-[9rem_1fr] sm:p-6">
            <div>
              <p className="text-sm font-bold text-ink">{t.name}</p>
              <p className="text-xs text-ink-soft">{t.spec}</p>
            </div>
            <p className={cn('min-w-0 truncate text-ink', t.cls)}>{t.sample}</p>
          </div>
        ))}
      </div>
    </BrandSection>
  )
}
