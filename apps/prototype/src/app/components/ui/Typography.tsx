import type { ElementType, ReactNode } from 'react'
import { cn } from '@/app/lib/cn'

export type HeadingSize = 'display' | 'xl' | 'lg' | 'md' | 'sm' | 'xs'

const SIZES: Record<HeadingSize, string> = {
  display: 'text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl',
  xl: 'text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl',
  lg: 'text-2xl font-extrabold leading-tight tracking-[-0.015em] sm:text-3xl',
  md: 'text-xl font-bold leading-snug tracking-[-0.01em] sm:text-2xl',
  sm: 'text-lg font-bold leading-snug',
  xs: 'text-base font-bold leading-snug',
}

export interface HeadingProps {
  level?: 1 | 2 | 3 | 4
  size?: HeadingSize
  className?: string
  id?: string
  children: ReactNode
}

export function Heading({ level = 2, size = 'lg', className, id, children }: HeadingProps) {
  const Tag = `h${level}` as ElementType
  return (
    <Tag id={id} className={cn('font-display text-ink', SIZES[size], className)}>
      {children}
    </Tag>
  )
}

export function Eyebrow({ children, className, tone = 'violet' }: { children: ReactNode; className?: string; tone?: 'violet' | 'coral' | 'mint' | 'light' }) {
  return (
    <p
      className={cn(
        'text-xs font-bold uppercase tracking-[0.16em]',
        tone === 'violet' && 'text-violet-700',
        tone === 'coral' && 'text-coral-700',
        tone === 'mint' && 'text-mint-700',
        tone === 'light' && 'text-coral-300',
        className,
      )}
    >
      {children}
    </p>
  )
}

export function Lead({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-lg leading-relaxed text-ink-soft sm:text-xl', className)}>{children}</p>
}
