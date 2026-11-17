import { cn } from '@/app/lib/cn'

export interface ProgressBarProps {
  value: number
  max?: number
  label: string
  barClassName?: string
  trackClassName?: string
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

export function ProgressBar({ value, max = 1, label, barClassName = 'bg-primary', trackClassName = 'bg-mist', size = 'sm', className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn('w-full overflow-hidden rounded-full', size === 'xs' ? 'h-1.5' : size === 'sm' ? 'h-2.5' : 'h-3.5', trackClassName, className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-700 ease-out', barClassName)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export interface StepProgressProps {
  steps: string[]
  current: number
  tone?: 'light' | 'dark'
  showLabels?: boolean
  className?: string
}

/** Segmented progress for lessons and assessments: one segment per step. */
export function StepProgress({ steps, current, tone = 'light', showLabels = true, className }: StepProgressProps) {
  return (
    <div className={cn('w-full', className)}>
      <ol className="flex gap-1.5" aria-label={`Paso ${Math.min(current + 1, steps.length)} de ${steps.length}`}>
        {steps.map((s, i) => (
          <li key={s} className="flex min-w-0 flex-1 flex-col gap-2">
            <span
              className={cn(
                'h-1.5 rounded-full transition-colors duration-500',
                i < current
                  ? tone === 'light'
                    ? 'bg-mint-600'
                    : 'bg-mint-300'
                  : i === current
                    ? tone === 'light'
                      ? 'bg-primary'
                      : 'bg-coral-300'
                    : tone === 'light'
                      ? 'bg-line'
                      : 'bg-white/15',
              )}
            />
            {showLabels && (
              <span
                className={cn(
                  'hidden truncate text-xs font-semibold sm:block',
                  i === current
                    ? tone === 'light'
                      ? 'text-ink'
                      : 'text-white'
                    : tone === 'light'
                      ? 'text-ink-soft'
                      : 'text-white/60',
                )}
                aria-current={i === current ? 'step' : undefined}
              >
                {s}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
