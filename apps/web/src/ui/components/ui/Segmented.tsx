import type { LucideIcon } from 'lucide-react'
import { cn } from '@/ui/lib/cn'

export interface SegmentedOption<T extends string | number> {
  value: T
  label: string
  icon?: LucideIcon
}

export interface SegmentedProps<T extends string | number> {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  label: string
  size?: 'sm' | 'md'
  tone?: 'light' | 'dark'
  block?: boolean
  className?: string
}

/** Single-choice control (radio group semantics). */
export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  label,
  size = 'md',
  tone = 'light',
  block,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1',
        tone === 'light' ? 'bg-mist ring-1 ring-line' : 'bg-white/10 ring-1 ring-white/15',
        block && 'flex w-full',
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value
        const Icon = o.icon
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-colors duration-200',
              size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm',
              block && 'flex-1',
              tone === 'light'
                ? active
                  ? 'bg-surface text-ink shadow-soft'
                  : 'text-ink-soft hover:text-ink'
                : active
                  ? 'bg-white text-ink'
                  : 'text-white/75 hover:text-white',
            )}
          >
            {Icon && <Icon size={size === 'sm' ? 14 : 16} aria-hidden />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
