import { Link, useLocation, useMatches, useSearchParams } from 'react-router'
import { LayoutGrid, RotateCcw } from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { Modal } from '@/app/components/ui/Modal'
import { Button, ButtonLink } from '@/app/components/ui/Button'
import { SCREENS } from '@/app/data/screens'
import { usePreferences } from '@/app/state/preferences'
import { useLearner } from '@/app/state/learner'
import type { RouteHandle } from '@/app/state/ui'

const GROUPS = ['Marketing', 'Primeros pasos', 'Aplicación', 'Sistema'] as const

/** Floating reviewer tool to jump between prototype screens. Hidden inside device frames and focus mode. */
export function PrototypeNavigator({ open, onOpenChange: setOpen }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [params] = useSearchParams()
  const location = useLocation()
  const matches = useMatches()
  const { prefs, reset: resetPrefs } = usePreferences()
  const { resetDemo } = useLearner()
  const inFrame = params.get('frame') === '1'
  const handles = matches.map((m) => m.handle as RouteHandle | undefined)
  const immersive = handles.some((h) => h?.immersive)
  const inApp = location.pathname.startsWith('/app')
  // Inside the app shell the desktop trigger lives in the sidebar; floating only on mobile.
  const showTrigger = !inFrame && !prefs.focusMode && !handles.some((h) => h?.hideNavigator) && !(inApp && immersive)

  return (
    <>
      {showTrigger && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'fixed left-3 z-40 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-3.5 text-sm font-semibold text-white shadow-lift ring-1 ring-white/10 transition-transform hover:-translate-y-0.5 sm:left-4 sm:px-4',
            inApp ? 'bottom-24 md:hidden' : 'bottom-4',
          )}
        >
          <LayoutGrid size={17} aria-hidden />
          <span className="hidden sm:inline">Pantallas</span>
          <span className="sr-only sm:hidden">Mapa de pantallas del prototipo</span>
        </button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        placement="drawer"
        title="Mapa del prototipo"
        description="Salta a cualquiera de las pantallas principales de LANIA."
        footer={
          <>
            <Button
              variant="ghost"
              icon={RotateCcw}
              onClick={() => {
                resetDemo()
                resetPrefs()
              }}
            >
              Reiniciar demo
            </Button>
            <ButtonLink to="/prototipo" variant="soft" onClick={() => setOpen(false)}>
              Ver responsive
            </ButtonLink>
          </>
        }
      >
        <div className="space-y-6">
          {GROUPS.map((g) => (
            <section key={g}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-ink-soft">{g}</h3>
              <ul className="space-y-1">
                {SCREENS.filter((s) => s.group === g).map((s) => {
                  const active = location.pathname === s.path
                  return (
                    <li key={s.path}>
                      <Link
                        to={s.path}
                        onClick={() => setOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-2xl p-2.5 transition-colors',
                          active ? 'bg-violet-100' : 'hover:bg-mist',
                        )}
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface text-violet-700 ring-1 ring-line">
                          <s.icon size={18} aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-ink">
                            <span className="mr-1.5 text-ink-soft">{s.code}</span>
                            {s.title}
                          </span>
                          <span className="block truncate text-xs text-ink-soft">{s.desc}</span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </Modal>
    </>
  )
}
