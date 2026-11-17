import type { ReactNode } from 'react'
import { Volume2 } from 'lucide-react'
import { cn } from '@/ui/lib/cn'
import { Lania, type LaniaExpression } from '@/ui/components/illustrations/Lania'

export interface LaniaSaysProps {
  expression?: LaniaExpression
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  tone?: 'light' | 'lavender' | 'dark'
  name?: boolean
  onListen?: () => void
  actions?: ReactNode
  className?: string
  live?: boolean
}

const AVATAR = { sm: 'h-10 w-10', md: 'h-14 w-14', lg: 'h-20 w-20' }

/** Lania's compact presence: portrait + speech bubble. Used where she should take little space. */
export function LaniaSays({ expression = 'neutral', children, size = 'md', tone = 'light', name = true, onListen, actions, className, live }: LaniaSaysProps) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className={cn('shrink-0 overflow-hidden rounded-full ring-4', AVATAR[size], tone === 'dark' ? 'bg-night-700 ring-white/10' : 'bg-violet-200 ring-white')}>
        <Lania crop="head" expression={expression} className="h-full w-full" />
      </div>
      <div
        className={cn(
          'relative min-w-0 flex-1 rounded-3xl rounded-tl-lg px-4 py-3',
          tone === 'light' && 'bg-surface shadow-soft ring-1 ring-line/70',
          tone === 'lavender' && 'bg-violet-100',
          tone === 'dark' && 'bg-white/10 text-white ring-1 ring-white/10',
        )}
        aria-live={live ? 'polite' : undefined}
      >
        {name && (
          <p className={cn('mb-0.5 flex items-center gap-2 text-xs font-bold', tone === 'dark' ? 'text-coral-300' : 'text-violet-700')}>
            Lania
            {onListen && (
              <button
                type="button"
                onClick={onListen}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold transition-colors',
                  tone === 'dark' ? 'text-white/80 hover:bg-white/10' : 'text-ink-soft hover:bg-mist',
                )}
                aria-label="Escuchar a Lania"
              >
                <Volume2 size={13} aria-hidden /> Escuchar
              </button>
            )}
          </p>
        )}
        <div className={cn('reading text-sm sm:text-base', tone === 'dark' ? 'text-white/90' : 'text-ink')}>{children}</div>
        {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}
