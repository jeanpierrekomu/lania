import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ExternalLink, Laptop, MonitorSmartphone, Smartphone, Tablet } from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { Logo } from '@/app/components/brand/Logo'
import { Badge } from '@/app/components/ui/Badge'
import { Button, ButtonLink } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { Select } from '@/app/components/ui/Field'
import { Segmented } from '@/app/components/ui/Segmented'
import { Eyebrow, Heading, Lead } from '@/app/components/ui/Typography'
import { SCREENS } from '@/app/data/screens'

const DEVICES = {
  desktop: { w: 1440, h: 900, label: 'Desktop · 1440' },
  tablet: { w: 768, h: 1024, label: 'Tablet · 768' },
  mobile: { w: 390, h: 844, label: 'Mobile · 390' },
} as const
type DeviceId = keyof typeof DEVICES

const STATES = [
  { path: '/onboarding?paso=6', label: 'Onboarding · elegir tipo de profesora' },
  { path: '/diagnostico?pregunta=6', label: 'Diagnóstico · reading en curso' },
  { path: '/app/aula?paso=3', label: 'Aula · “Yesterday I ___ to university”' },
  { path: '/app/speaking?tema=entrevista&iniciar=1', label: 'Speaking Lab · entrevista en curso' },
  { path: '/app/writing?fase=revision', label: 'Writing Lab · revisión con correcciones' },
  { path: '/app/salones/cafe-internacional', label: 'Sala en vivo · ronda 2' },
]

const FLOW = ['/', '/onboarding', '/diagnostico', '/app']

function frameSrc(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}${path}${path.includes('?') ? '&' : '?'}frame=1`
}

function DeviceFrame({ path, device, height, title }: { path: string; device: DeviceId; height: number; title: string }) {
  const d = DEVICES[device]
  const scale = height / d.h
  return (
    <figure className="shrink-0">
      <div
        className={cn('relative overflow-hidden bg-surface shadow-float ring-1 ring-line', device === 'mobile' ? 'rounded-[1.75rem] ring-4 ring-ink' : device === 'tablet' ? 'rounded-3xl ring-4 ring-ink' : 'rounded-2xl')}
        style={{ width: d.w * scale, height }}
      >
        <iframe
          title={`${title} · ${d.label}`}
          src={frameSrc(path)}
          loading="lazy"
          className="absolute left-0 top-0 origin-top-left border-0"
          style={{ width: d.w, height: d.h, transform: `scale(${scale})` }}
        />
      </div>
      <figcaption className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-soft">
        {device === 'desktop' ? <Laptop size={14} aria-hidden /> : device === 'tablet' ? <Tablet size={14} aria-hidden /> : <Smartphone size={14} aria-hidden />}
        {d.label}
      </figcaption>
    </figure>
  )
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(1100)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

/** P · Prototype map: navigable flow and responsive variants at 1440 / 768 / 390. */
export function PrototypeMap() {
  const [path, setPath] = useState('/app')
  const [mode, setMode] = useState<'todos' | DeviceId>('todos')
  const [ref, width] = useWidth<HTMLDivElement>()
  const viewer = useRef<HTMLElement>(null)
  const screen = SCREENS.find((s) => s.path === path)
  const title = screen?.title ?? path
  const gap = 24
  const ratioSum = DEVICES.desktop.w / DEVICES.desktop.h + DEVICES.tablet.w / DEVICES.tablet.h + DEVICES.mobile.w / DEVICES.mobile.h
  const sideBySide = width >= 900
  const allHeight = Math.min(560, (width - gap * 2) / ratioSum)

  const show = (p: string) => {
    setPath(p)
    viewer.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 sm:px-8">
          <Link to="/" aria-label="LANIA, inicio">
            <Logo size="sm" />
          </Link>
          <span className="hidden text-sm font-semibold text-ink-soft sm:inline">Mapa del prototipo</span>
          <span className="flex-1" />
          <ButtonLink to="/sistema" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Sistema de diseño
          </ButtonLink>
          <ButtonLink to="/" size="sm" iconRight={ArrowRight}>
            Empezar recorrido
          </ButtonLink>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <section className="py-12 lg:py-16" aria-labelledby="map-title">
          <Eyebrow>Prototipo navegable</Eyebrow>
          <Heading level={1} size="xl" id="map-title" className="mt-2">
            Todas las pantallas de LANIA, conectadas
          </Heading>
          <Lead className="mt-4 max-w-3xl">
            Recorre el flujo completo desde la portada hasta el aula, o revisa cada pantalla en sus tres tamaños. Todo es interactivo: los datos son de ejemplo y se guardan solo en este navegador.
          </Lead>
          <ol className="mt-10 flex flex-wrap items-center gap-3" aria-label="Recorrido principal">
            {FLOW.map((p, i) => {
              const s = SCREENS.find((x) => x.path === p)!
              return (
                <li key={p} className="flex items-center gap-3">
                  <Link to={p} className="flex items-center gap-3 rounded-2xl bg-surface p-3 pr-4 shadow-soft ring-1 ring-line transition-transform hover:-translate-y-0.5">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700">
                      <s.icon size={18} aria-hidden />
                    </span>
                    <span>
                      <span className="block text-xs font-bold text-ink-soft">{s.code}</span>
                      <span className="block text-sm font-bold text-ink">{s.title}</span>
                    </span>
                  </Link>
                  {i < FLOW.length - 1 && <ArrowRight size={18} className="text-ink-faint" aria-hidden />}
                </li>
              )
            })}
            <li className="flex items-center gap-3">
              <ArrowRight size={18} className="text-ink-faint" aria-hidden />
              <span className="rounded-2xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800">Aula · Labs · Salones · Misiones · Progreso</span>
            </li>
          </ol>
        </section>

        <section aria-labelledby="screens-title">
          <Heading level={2} size="md" id="screens-title">
            Pantallas
          </Heading>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {SCREENS.filter((s) => s.path !== '/prototipo').map((s) => (
              <li key={s.path}>
                <Card padding="md" className="flex h-full flex-col">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700">
                      <s.icon size={20} aria-hidden />
                    </span>
                    <Badge tone="neutral">{s.code}</Badge>
                  </div>
                  <p className="mt-4 font-display text-lg font-bold text-ink">{s.title}</p>
                  <p className="mt-1 flex-1 text-sm text-ink-soft">{s.desc}</p>
                  <div className="mt-4 flex gap-2">
                    <ButtonLink to={s.path} size="sm" variant="soft" icon={ExternalLink}>
                      Abrir
                    </ButtonLink>
                    <Button size="sm" variant="ghost" icon={MonitorSmartphone} onClick={() => show(s.path)}>
                      Responsive
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-3xl bg-surface p-5 ring-1 ring-line">
            <p className="text-sm font-bold text-ink">Estados destacados (enlaces directos)</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {STATES.map((st) => (
                <li key={st.path}>
                  <Link to={st.path} className="inline-flex items-center gap-1.5 rounded-full bg-mist px-3.5 py-2 text-sm font-semibold text-ink hover:bg-violet-100">
                    {st.label} <ArrowRight size={14} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section ref={viewer} className="mt-16 scroll-mt-24" aria-labelledby="viewer-title">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Heading level={2} size="md" id="viewer-title">
                Variantes responsive
              </Heading>
              <p className="mt-1 text-ink-soft">Cada marco carga la pantalla real a su ancho exacto. Puedes interactuar dentro de cada uno.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="sm:w-72">
                <Select
                  aria-label="Pantalla"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  options={SCREENS.filter((s) => s.path !== '/prototipo').map((s) => ({ value: s.path, label: `${s.code} · ${s.title}` }))}
                />
              </div>
              <Segmented
                label="Dispositivo"
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'todos', label: 'Todos' },
                  { value: 'desktop', label: '1440' },
                  { value: 'tablet', label: '768' },
                  { value: 'mobile', label: '390' },
                ]}
              />
            </div>
          </div>

          <div ref={ref} className="mt-8 rounded-4xl bg-mist p-4 sm:p-8">
            {mode === 'todos' ? (
              sideBySide ? (
                <div className="flex items-start justify-center" style={{ gap }}>
                  <DeviceFrame key={`d-${path}`} path={path} device="desktop" height={allHeight} title={title} />
                  <DeviceFrame key={`t-${path}`} path={path} device="tablet" height={allHeight} title={title} />
                  <DeviceFrame key={`m-${path}`} path={path} device="mobile" height={allHeight} title={title} />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-8">
                  {(['mobile', 'tablet', 'desktop'] as const).map((d) => (
                    <DeviceFrame key={`${d}-${path}`} path={path} device={d} height={Math.min(DEVICES[d].h, ((width - 32) / DEVICES[d].w) * DEVICES[d].h)} title={title} />
                  ))}
                </div>
              )
            ) : (
              <div className="flex justify-center">
                <DeviceFrame
                  key={`${mode}-${path}`}
                  path={path}
                  device={mode}
                  height={Math.min(DEVICES[mode].h, ((width - 64) / DEVICES[mode].w) * DEVICES[mode].h)}
                  title={title}
                />
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
