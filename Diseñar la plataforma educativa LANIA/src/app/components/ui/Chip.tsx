import type { ButtonHTMLAttributes } from 'react'
import { Check, type LucideIcon } from 'lucide-react'
import { cn } from '@/app/lib/cn'

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  selected?: boolean
  icon?: LucideIcon
  tone?: 'light' | 'dark'
}

/** Toggle chip for multi-select filters and interests. */
export function Chip({ selected, icon: Icon, tone = 'light', className, children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-200',
        tone === 'light'
          ? selected
            ? 'bg-ink text-white'
            : 'bg-surface text-ink ring-1 ring-line-strong hover:ring-ink-faint'
          : selected
            ? 'bg-white text-ink'
            : 'bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15',
        className,
      )}
      {...rest}
    >
      {selected ? <Check size={16} aria-hidden /> : Icon && <Icon size={16} aria-hidden />}
      {children}
    </button>
  )
}
