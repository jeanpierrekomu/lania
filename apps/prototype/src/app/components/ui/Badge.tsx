import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/app/lib/cn'

export type BadgeTone = 'violet' | 'coral' | 'mint' | 'neutral' | 'danger' | 'amber' | 'dark' | 'outline' | 'onDark'

const TONES: Record<BadgeTone, string> = {
  violet: 'bg-violet-100 text-violet-800',
  coral: 'bg-coral-100 text-coral-800',
  mint: 'bg-mint-100 text-mint-800',
  neutral: 'bg-mist text-ink-soft',
  danger: 'bg-danger-50 text-danger-700',
  amber: 'bg-amber-100 text-amber-700',
  dark: 'bg-ink text-white',
  outline: 'bg-surface text-ink-soft ring-1 ring-line',
  onDark: 'bg-white/12 text-white ring-1 ring-white/15',
}

const DOTS: Record<BadgeTone, string> = {
  violet: 'bg-violet-600',
  coral: 'bg-coral-600',
  mint: 'bg-mint-600',
  neutral: 'bg-ink-faint',
  danger: 'bg-danger-600',
  amber: 'bg-amber-500',
  dark: 'bg-coral-300',
  outline: 'bg-ink-faint',
  onDark: 'bg-coral-300',
}

export interface BadgeProps {
  tone?: BadgeTone
  size?: 'sm' | 'md'
  icon?: LucideIcon
  dot?: boolean
  pulse?: boolean
  className?: string
  children: ReactNode
}

export function Badge({ tone = 'violet', size = 'sm', icon: Icon, dot, pulse, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-semibold',
        size === 'sm' ? 'h-6 px-2.5 text-xs' : 'h-8 px-3 text-sm',
        TONES[tone],
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && <span className={cn('absolute inset-0 animate-ring rounded-full', DOTS[tone])} />}
          <span className={cn('relative h-2 w-2 rounded-full', DOTS[tone])} />
        </span>
      )}
      {Icon && <Icon size={size === 'sm' ? 13 : 15} aria-hidden />}
      {children}
    </span>
  )
}
