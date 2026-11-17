import type { ReactNode } from 'react'
import { cn } from '@/app/lib/cn'
import { Eyebrow, Heading } from '@/app/components/ui/Typography'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex flex-col gap-5 md:flex-row md:items-end md:justify-between', className)}>
      <div className="max-w-2xl">
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        <Heading level={1} size="lg">
          {title}
        </Heading>
        {description && <p className="mt-2 text-base text-ink-soft sm:text-lg">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  )
}

export function PageContainer({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return <div className={cn('mx-auto w-full px-5 py-6 sm:px-8 sm:py-8 lg:py-10', wide ? 'max-w-7xl' : 'max-w-6xl', className)}>{children}</div>
}
