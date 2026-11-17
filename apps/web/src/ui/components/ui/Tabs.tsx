import { useRef, type KeyboardEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/ui/lib/cn'

export interface TabItem<T extends string> {
  id: T
  label: string
  icon?: LucideIcon
  count?: number
}

export interface TabsProps<T extends string> {
  tabs: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  label: string
  idPrefix: string
  tone?: 'light' | 'dark'
  className?: string
}

export function Tabs<T extends string>({ tabs, value, onChange, label, idPrefix, tone = 'light', className }: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }
  return (
    <div role="tablist" aria-label={label} className={cn('flex gap-1 overflow-x-auto', className)}>
      {tabs.map((t, i) => {
        const active = t.id === value
        const Icon = t.icon
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            id={`${idPrefix}-tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`${idPrefix}-panel-${t.id}`}
            tabIndex={active ? 0 : -1}
            onKeyDown={(e) => onKey(e, i)}
            onClick={() => onChange(t.id)}
            className={cn(
              'inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors duration-200',
              tone === 'light'
                ? active
                  ? 'bg-violet-100 text-violet-800'
                  : 'text-ink-soft hover:bg-mist hover:text-ink'
                : active
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:text-white',
            )}
          >
            {Icon && <Icon size={16} aria-hidden />}
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs',
                  tone === 'light' ? 'bg-white text-ink-soft' : 'bg-white/15 text-white',
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
