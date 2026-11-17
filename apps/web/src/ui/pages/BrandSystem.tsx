import { useEffect, useState } from 'react'
import { Link } from '@/ui/router'
import { ArrowRight, LayoutGrid } from 'lucide-react'
import { cn } from '@/ui/lib/cn'
import { Logo } from '@/ui/components/brand/Logo'
import { Lania } from '@/ui/components/illustrations/Lania'
import { ButtonLink } from '@/ui/components/ui/Button'
import { Badge } from '@/ui/components/ui/Badge'
import { Heading, Lead } from '@/ui/components/ui/Typography'
import { IdentitySection, LogoSection, MoodboardSection } from './brand/IdentitySections'
import { ColorTypeSection } from './brand/ColorTypeSection'
import { ComponentsSection } from './brand/ComponentsSection'
import { CharacterSection, ExpressionsSection } from './brand/CharacterSection'
import { PrinciplesSection } from './brand/PrinciplesSection'

const SECTIONS = [
  { id: 'moodboard', label: 'Moodboard' },
  { id: 'identidad', label: 'Identidad' },
  { id: 'logotipo', label: 'Logotipo' },
  { id: 'color', label: 'Color y tipografía' },
  { id: 'componentes', label: 'Componentes' },
  { id: 'personaje', label: 'Personaje' },
  { id: 'expresiones', label: 'Expresiones' },
  { id: 'principios', label: 'Principios' },
]

function useActiveSection() {
  const [active, setActive] = useState(SECTIONS[0].id)
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return active
}

/** Brand & design system deliverables: moodboard → identity → logo → color/type → components → character → expressions → principles. */
export function BrandSystem() {
  const active = useActiveSection()
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 sm:px-8">
          <Link to="/" aria-label="LANIA, inicio">
            <Logo size="sm" />
          </Link>
          <span className="hidden text-sm font-semibold text-ink-soft sm:inline">Marca y sistema de diseño</span>
          <span className="flex-1" />
          <ButtonLink to="/prototipo" variant="ghost" size="sm" icon={LayoutGrid}>
            <span className="sr-only sm:not-sr-only">Mapa del prototipo</span>
          </ButtonLink>
          <ButtonLink to="/app" size="sm" iconRight={ArrowRight}>
            Abrir la app
          </ButtonLink>
        </div>
        <nav aria-label="Secciones del sistema" className="flex max-w-full min-w-0 gap-2 overflow-x-auto px-5 pb-3 lg:hidden">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={cn('shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold', active === s.id ? 'bg-ink text-white' : 'bg-mist text-ink-soft')}
            >
              {s.label}
            </a>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <section className="grid items-end gap-8 py-12 lg:grid-cols-[1fr_22rem] lg:py-16" aria-labelledby="ds-title">
          <div>
            <Badge tone="violet" size="md">
              v1.0 · Prototipo navegable
            </Badge>
            <Heading level={1} size="display" id="ds-title" className="mt-5">
              Marca y sistema de diseño
            </Heading>
            <Lead className="mt-5 max-w-2xl">
              Moodboard, identidad, logotipo, color, tipografía, componentes y el diseño de Lania. Todo lo que ves aquí es código vivo: los mismos tokens y componentes que usa cada pantalla.
            </Lead>
          </div>
          <div className="relative hidden h-72 overflow-hidden rounded-t-full bg-violet-100 lg:block">
            <Lania expression="explaining" crop="portrait" className="absolute inset-x-0 bottom-0 mx-auto w-72" />
          </div>
        </section>

        <div className="grid gap-10 pb-24 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <nav aria-label="Índice" className="hidden lg:block">
            <ol className="sticky top-24 space-y-1">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    aria-current={active === s.id ? 'true' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition-colors',
                      active === s.id ? 'bg-violet-100 text-violet-800' : 'text-ink-soft hover:bg-mist hover:text-ink',
                    )}
                  >
                    <span className="w-5 text-xs text-ink-faint">0{i + 1}</span>
                    {s.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="min-w-0">
            <MoodboardSection />
            <IdentitySection />
            <LogoSection />
            <ColorTypeSection />
            <ComponentsSection />
            <CharacterSection />
            <ExpressionsSection />
            <PrinciplesSection />
          </div>
        </div>
      </div>
    </div>
  )
}
