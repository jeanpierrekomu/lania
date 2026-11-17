import type { HTMLAttributes, ElementType, ReactNode } from 'react'
import { cn } from '@/ui/lib/cn'

export type CardVariant = 'default' | 'soft' | 'outline' | 'lavender' | 'coral' | 'mint' | 'dark' | 'glass'

const VARIANTS: Record<CardVariant, string> = {
  default: 'bg-surface shadow-soft ring-1 ring-line/70',
  soft: 'bg-violet-50 ring-1 ring-violet-100',
  outline: 'bg-surface ring-1 ring-line',
  lavender: 'bg-violet-100',
  coral: 'bg-coral-100',
  mint: 'bg-mint-50 ring-1 ring-mint-100',
  dark: 'bg-ink text-white',
  glass: 'bg-white/8 text-white ring-1 ring-white/12 backdrop-blur',
}

const PADDING = { none: '', sm: 'p-4', md: 'p-5 sm:p-6', lg: 'p-6 sm:p-8' }

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: CardVariant
  padding?: keyof typeof PADDING
  interactive?: boolean
  as?: ElementType
  children?: ReactNode
}

export function Card({ variant = 'default', padding = 'md', interactive, as: Tag = 'div', className, ...rest }: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-3xl',
        VARIANTS[variant],
        PADDING[padding],
        interactive && 'transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
      {...rest}
    />
  )
}
