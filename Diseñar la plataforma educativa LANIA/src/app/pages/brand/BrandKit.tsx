import type { ReactNode } from 'react'
import { cn } from '@/app/lib/cn'
import { Eyebrow, Heading } from '@/app/components/ui/Typography'

export function BrandSection({ id, eyebrow, title, lead, children, className }: { id: string; eyebrow: string; title: string; lead?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn('scroll-mt-28 border-t border-line py-14 first:border-0 first:pt-4 lg:py-20', className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Heading level={2} size="xl" id={`${id}-title`} className="mt-2">
        {title}
      </Heading>
      {lead && <p className="mt-3 max-w-3xl text-lg leading-relaxed text-ink-soft">{lead}</p>}
      <div className="mt-10">{children}</div>
    </section>
  )
}

export function SpecLabel({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">{children}</p>
}
