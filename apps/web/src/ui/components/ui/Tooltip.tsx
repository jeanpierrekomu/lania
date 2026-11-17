import type { ReactNode } from 'react'
import { cn } from '@/ui/lib/cn'

/** Lightweight hover/focus label for icon-only controls that already have an aria-label. */
export function Tooltip({ label, side = 'right', children, className }: { label: string; side?: 'right' | 'top'; children: ReactNode; className?: string }) {
  return (
    <span className={cn('group/tip relative inline-flex', className)}>
      {children}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-xl bg-ink px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lift transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100',
          side === 'right' ? 'left-full top-1/2 ml-3 -translate-y-1/2' : 'bottom-full left-1/2 mb-2 -translate-x-1/2',
        )}
      >
        {label}
      </span>
    </span>
  )
}
