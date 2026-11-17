import { useState, type ReactNode } from 'react'
import { Link, NavLink, useMatches, useNavigate } from '@/ui/router'
import {
  BookOpen,
  ChartLine,
  Focus,
  GraduationCap,
  Headphones,
  House,
  LayoutGrid,
  Map,
  Mic,
  PenLine,
  Shapes,
  SlidersHorizontal,
  Users,
  ChevronRight,
  Compass,
  LogOut,
  MessageCircleHeart,
  Repeat2,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/ui/lib/cn'
import { Logo, LogoMark } from '@/ui/components/brand/Logo'
import { PersonAvatar } from '@/ui/components/illustrations/PersonAvatar'
import { IconButton } from '@/ui/components/ui/Button'
import { Switch } from '@/ui/components/ui/Switch'
import { Tooltip } from '@/ui/components/ui/Tooltip'
import { Modal } from '@/ui/components/ui/Modal'
import { usePreferences } from '@/ui/state/preferences'
import { useLearner } from '@/ui/state/learner'
import { useShellUser, useUi, type RouteHandle } from '@/ui/state/ui'
import { PEOPLE } from '@/ui/data/people'
import { GuidedTour, startTour } from '@/ui/components/layout/GuidedTour'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Aprender',
    items: [
      { to: '/app', label: 'Inicio', icon: House, end: true },
      { to: '/app/aula', label: 'Aula con Lania', icon: GraduationCap },
      { to: '/review', label: 'Repaso', icon: Repeat2 },
      { to: '/tutor', label: 'Conversar con Lania', icon: MessageCircleHeart },
    ],
  },
  {
    group: 'Practicar',
    items: [
      { to: '/app/speaking', label: 'Speaking Lab', icon: Mic },
      { to: '/app/listening', label: 'Listening Lab', icon: Headphones },
      { to: '/app/reading', label: 'Reading Lab', icon: BookOpen },
      { to: '/app/writing', label: 'Writing Lab', icon: PenLine },
    ],
  },
  {
    group: 'Comunidad',
    items: [
      { to: '/app/salones', label: 'Salones', icon: Users },
      { to: '/app/misiones', label: 'Misiones', icon: Map },
    ],
  },
  {
    group: 'Tú',
    items: [
      { to: '/app/progreso', label: 'Mi progreso', icon: ChartLine },
      { to: '/preferences', label: 'Ajustes de Lania', icon: Settings },
    ],
  },
]

const STAFF_NAV: NavItem = { to: '/admin/qa', label: 'Revisión docente', icon: ShieldCheck }

/** Iniciales para el avatar de la cuenta real. */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

function UserAvatar({ size = 'h-10 w-10' }: { size?: string }) {
  const user = useShellUser()
  if (!user) {
    return (
      <span className={cn(size, 'shrink-0 overflow-hidden rounded-full bg-mint-100')}>
        <PersonAvatar look={PEOPLE.valentina.look} />
      </span>
    )
  }
  return (
    <span className={cn(size, 'grid shrink-0 place-items-center rounded-full bg-violet-100 font-display text-sm font-bold text-violet-800')} aria-hidden>
      {initials(user.name) || '·'}
    </span>
  )
}

const PRACTICE = [
  { to: '/app/speaking', label: 'Speaking Lab', desc: 'Conversa con Lania en voz alta.', icon: Mic, tone: 'bg-coral-100 text-coral-700' },
  { to: '/app/listening', label: 'Listening Lab', desc: 'Entrena el oído a tu velocidad.', icon: Headphones, tone: 'bg-violet-100 text-violet-700' },
  { to: '/app/reading', label: 'Reading Lab', desc: 'Lee textos reales con ayuda.', icon: BookOpen, tone: 'bg-amber-100 text-amber-700' },
  { to: '/app/writing', label: 'Writing Lab', desc: 'Escribe, revisa y reescribe.', icon: PenLine, tone: 'bg-mint-100 text-mint-700' },
  { to: '/app/misiones', label: 'Misiones', desc: 'Situaciones reales por desbloquear.', icon: Map, tone: 'bg-amber-100 text-amber-700' },
]

function Sidebar({ full }: { full: boolean }) {
  const { prefs, setPref } = usePreferences()
  const { learner } = useLearner()
  const { openPreferences, openScreens } = useUi()
  const user = useShellUser()
  const label = full ? 'sr-only lg:not-sr-only' : 'sr-only'
  const onlyFull = full ? 'hidden lg:block' : 'hidden'
  const onlyFullFlex = full ? 'hidden lg:flex' : 'hidden'
  const onlyRail = full ? 'lg:hidden' : ''

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 hidden w-20 flex-col border-r border-line bg-surface md:flex',
        full && 'lg:w-72',
      )}
      aria-label="Navegación principal"
    >
      <div className={cn('flex h-20 items-center px-5', full && 'lg:px-7')}>
        <Link to="/app" className="flex items-center gap-3" aria-label="LANIA, ir al inicio">
          <LogoMark className={cn('h-10 w-10', full && 'lg:hidden')} />
          <Logo size="md" className={onlyFull} />
        </Link>
      </div>

      <nav className={cn('flex-1 overflow-y-auto px-3 pb-4', full && 'lg:px-4')}>
        {(user?.isStaff ? [...NAV, { group: 'Equipo', items: [STAFF_NAV] }] : NAV).map((g) => (
          <div key={g.group} className="mt-4 first:mt-1">
            <p className={cn('mb-1.5 px-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-soft', onlyFull)}>{g.group}</p>
            <ul className="space-y-1">
              {g.items.map((item) => (
                <li key={item.to}>
                  <Tooltip label={item.label} className={cn('w-full', full && 'lg:[&>span:last-child]:hidden')}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      data-tour={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition-colors duration-200',
                          full ? 'justify-center lg:justify-start' : 'justify-center',
                          isActive ? 'bg-violet-100 text-violet-800' : 'text-ink-soft hover:bg-mist hover:text-ink',
                        )
                      }
                    >
                      <item.icon size={20} aria-hidden className="shrink-0" />
                      <span className={label}>{item.label}</span>
                    </NavLink>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn('space-y-3 border-t border-line p-3', full && 'lg:p-4')}>
        <div className={cn('rounded-2xl bg-violet-50 p-3', onlyFull)}>
          <Switch
            checked={prefs.focusMode}
            onChange={(v) => setPref('focusMode', v)}
            label="Modo concentración"
            description="Menos elementos, una tarea a la vez."
          />
        </div>
        <div className={cn('flex flex-col items-center gap-2', onlyRail)}>
          <Tooltip label={prefs.focusMode ? 'Salir del modo concentración' : 'Modo concentración'}>
            <IconButton
              icon={Focus}
              label={prefs.focusMode ? 'Salir del modo concentración' : 'Activar modo concentración'}
              pressed={prefs.focusMode}
              onClick={() => setPref('focusMode', !prefs.focusMode)}
            />
          </Tooltip>
          <Tooltip label="Preferencias">
            <IconButton icon={SlidersHorizontal} label="Preferencias de aprendizaje" onClick={openPreferences} data-tour="preferencias" />
          </Tooltip>
          <Tooltip label="Ver recorrido">
            <IconButton icon={Compass} label="Ver el recorrido guiado" onClick={startTour} data-tour="recorrido" />
          </Tooltip>
          {!user && (
            <Tooltip label="Pantallas del prototipo">
              <IconButton icon={LayoutGrid} label="Pantallas del prototipo" onClick={openScreens} />
            </Tooltip>
          )}
          {user?.onLogout && (
            <Tooltip label="Salir">
              <IconButton icon={LogOut} label="Salir" onClick={user.onLogout} />
            </Tooltip>
          )}
        </div>
        <button
          type="button"
          onClick={openPreferences}
          data-tour="preferencias"
          className={cn(
            'h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-mist hover:text-ink',
            onlyFullFlex,
          )}
        >
          <SlidersHorizontal size={20} aria-hidden />
          Preferencias y accesibilidad
        </button>
        <button
          type="button"
          onClick={startTour}
          data-tour="recorrido"
          className={cn(
            'h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-mist hover:text-ink',
            onlyFullFlex,
          )}
        >
          <Compass size={20} aria-hidden />
          Ver recorrido
        </button>
        {!user && (
          <button
            type="button"
            onClick={openScreens}
            className={cn(
              'h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-mist hover:text-ink',
              onlyFullFlex,
            )}
          >
            <LayoutGrid size={20} aria-hidden />
            Pantallas del prototipo
          </button>
        )}
        {user?.onLogout && (
          <button
            type="button"
            onClick={user.onLogout}
            className={cn(
              'h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-mist hover:text-ink',
              onlyFullFlex,
            )}
          >
            <LogOut size={20} aria-hidden />
            Salir
          </button>
        )}
        <Link
          to="/app/progreso"
          aria-label={`Mi progreso · ${user?.name ?? learner.name}`}
          className={cn('flex items-center gap-3 rounded-2xl p-1.5 transition-colors hover:bg-mist', full ? 'justify-center lg:justify-start' : 'justify-center')}
        >
          <UserAvatar />
          <span className={cn('min-w-0 flex-1', onlyFull)}>
            <span className="block truncate text-sm font-bold text-ink">{user?.name ?? learner.name}</span>
            <span className="block text-xs text-ink-soft">{user?.subtitle ?? (learner.diagnostic ? `Nivel estimado ${learner.diagnostic.overall}` : 'Haz tu diagnóstico')}</span>
          </span>
          <ChevronRight size={16} className={cn('text-ink-soft', onlyFull)} aria-hidden />
        </Link>
      </div>
    </aside>
  )
}

function MobileTopBar() {
  const { openPreferences } = useUi()
  const user = useShellUser()
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line/70 bg-canvas/90 px-4 backdrop-blur md:hidden">
      <Link to="/app" aria-label="LANIA, ir al inicio">
        <Logo size="sm" />
      </Link>
      <div className="flex items-center gap-1">
        <IconButton icon={Compass} label="Ver el recorrido guiado" onClick={startTour} data-tour="recorrido" />
        <IconButton icon={SlidersHorizontal} label="Preferencias de aprendizaje" onClick={openPreferences} data-tour="preferencias" />
        {user?.onLogout && <IconButton icon={LogOut} label="Salir" onClick={user.onLogout} />}
        <Link to="/app/progreso" aria-label="Mi progreso" className="rounded-full">
          <UserAvatar />
        </Link>
      </div>
    </header>
  )
}

function MobileTabBar({ onPractice }: { onPractice: () => void }) {
  const tab = (isActive: boolean) =>
    cn('flex flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold', isActive ? 'text-violet-700' : 'text-ink-soft')
  return (
    <nav
      aria-label="Navegación"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch">
        <NavLink to="/app" end data-tour="/app" className={({ isActive }) => tab(isActive)}>
          <House size={22} aria-hidden />
          Inicio
        </NavLink>
        <NavLink to="/app/aula" data-tour="/app/aula" className={({ isActive }) => tab(isActive)}>
          <GraduationCap size={22} aria-hidden />
          Aula
        </NavLink>
        <button type="button" onClick={onPractice} className={tab(false)} data-tour="practicar">
          <span className="-mt-6 grid h-12 w-12 place-items-center rounded-full bg-primary text-white shadow-glow">
            <Shapes size={22} aria-hidden />
          </span>
          Practicar
        </button>
        <NavLink to="/app/salones" data-tour="/app/salones" className={({ isActive }) => tab(isActive)}>
          <Users size={22} aria-hidden />
          Salones
        </NavLink>
        <NavLink to="/app/progreso" data-tour="/app/progreso" className={({ isActive }) => tab(isActive)}>
          <ChartLine size={22} aria-hidden />
          Progreso
        </NavLink>
      </div>
    </nav>
  )
}

export function AppShell({ children }: { children?: ReactNode }) {
  const { prefs } = usePreferences()
  const matches = useMatches()
  const navigate = useNavigate()
  const immersive = matches.some((m) => (m.handle as RouteHandle | undefined)?.immersive)
  const [practiceOpen, setPracticeOpen] = useState(false)
  const full = !prefs.focusMode

  return (
    <div className="min-h-dvh bg-canvas">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Saltar al contenido
      </a>
      <Sidebar full={full} />
      {!immersive && <MobileTopBar />}
      <main id="main" className={cn('min-h-dvh md:pl-20', full && 'lg:pl-72', !immersive && 'pb-24 md:pb-0')}>
        {children}
      </main>
      {!immersive && <MobileTabBar onPractice={() => setPracticeOpen(true)} />}
      {!immersive && <GuidedTour />}
      <Modal open={practiceOpen} onClose={() => setPracticeOpen(false)} title="¿Qué quieres practicar?" description="Elige un laboratorio. Puedes cambiar cuando quieras." size="sm">
        <ul className="space-y-2">
          {PRACTICE.map((p) => (
            <li key={p.to}>
              <button
                type="button"
                onClick={() => {
                  setPracticeOpen(false)
                  navigate(p.to)
                }}
                className="flex w-full items-center gap-4 rounded-2xl p-3 text-left ring-1 ring-line transition-colors hover:bg-mist"
              >
                <span className={cn('grid h-12 w-12 place-items-center rounded-2xl', p.tone)}>
                  <p.icon size={22} aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block font-bold text-ink">{p.label}</span>
                  <span className="block text-sm text-ink-soft">{p.desc}</span>
                </span>
                <ChevronRight size={18} className="text-ink-soft" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  )
}
