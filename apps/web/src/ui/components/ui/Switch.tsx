import { useId, type ReactNode } from 'react'
import { cn } from '@/ui/lib/cn'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  description?: ReactNode
  tone?: 'light' | 'dark'
  hideLabel?: boolean
  className?: string
}

export function Switch({ checked, onChange, label, description, tone = 'light', hideLabel, className }: SwitchProps) {
  const id = useId()
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className={cn('min-w-0', hideLabel && 'sr-only')}>
        <label htmlFor={id} className={cn('block text-sm font-semibold', tone === 'dark' ? 'text-white' : 'text-ink')}>
          {label}
        </label>
        {description && (
          <p className={cn('mt-0.5 text-sm', tone === 'dark' ? 'text-white/70' : 'text-ink-soft')}>{description}</p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200',
          checked ? 'bg-primary' : tone === 'dark' ? 'bg-white/20' : 'bg-line-strong',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-white shadow-soft transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  )
}
