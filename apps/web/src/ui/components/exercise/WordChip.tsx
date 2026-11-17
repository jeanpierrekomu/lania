import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/ui/lib/cn'

export interface WordChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'bank' | 'placed' | 'ghost'
  status?: 'correct' | 'incorrect'
}

/** Tappable word for sentence-building exercises. */
export function WordChip({ variant = 'bank', status, className, ...rest }: WordChipProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-11 items-center rounded-2xl px-4 text-base font-semibold transition-[transform,background-color,box-shadow] duration-150 active:scale-95',
        variant === 'bank' && 'bg-surface text-ink shadow-[0_3px_0_var(--color-line-strong)] ring-1 ring-line-strong hover:-translate-y-0.5',
        variant === 'placed' && 'bg-violet-100 text-violet-900 ring-1 ring-violet-200',
        variant === 'ghost' && 'pointer-events-none bg-mist text-transparent ring-1 ring-line',
        status === 'correct' && 'bg-mint-100 text-mint-800 ring-mint-300',
        status === 'incorrect' && 'bg-coral-100 text-coral-800 ring-coral-300',
        className,
      )}
      {...rest}
    />
  )
}
