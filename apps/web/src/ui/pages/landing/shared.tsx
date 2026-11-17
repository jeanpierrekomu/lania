import type { ReactNode } from 'react'
import { cn } from '@/ui/lib/cn'
import { Eyebrow, Heading } from '@/ui/components/ui/Typography'

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-5 sm:px-8', className)}>{children}</div>
}

export function SectionIntro({
  eyebrow,
  title,
  lead,
  center,
  tone = 'light',
  id,
}: {
  eyebrow: string
  title: ReactNode
  lead?: ReactNode
  center?: boolean
  tone?: 'light' | 'dark'
  id?: string
}) {
  return (
    <div className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      <Eyebrow tone={tone === 'dark' ? 'light' : 'violet'}>{eyebrow}</Eyebrow>
      <Heading level={2} size="xl" id={id} className={cn('mt-3', tone === 'dark' && 'text-white')}>
        {title}
      </Heading>
      {lead && <p className={cn('mt-4 text-lg leading-relaxed', tone === 'dark' ? 'text-violet-100' : 'text-ink-soft')}>{lead}</p>}
    </div>
  )
}
