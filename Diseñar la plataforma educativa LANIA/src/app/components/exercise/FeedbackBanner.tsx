import type { ReactNode } from 'react'
import { CircleCheck, Info, RefreshCw } from 'lucide-react'
import { cn } from '@/app/lib/cn'

export type FeedbackKind = 'correct' | 'almost' | 'info'

const STYLES: Record<FeedbackKind, { box: string; title: string; icon: typeof Info }> = {
  correct: { box: 'bg-mint-50 ring-mint-200', title: 'text-mint-800', icon: CircleCheck },
  almost: { box: 'bg-coral-50 ring-coral-200', title: 'text-coral-800', icon: RefreshCw },
  info: { box: 'bg-violet-50 ring-violet-200', title: 'text-violet-800', icon: Info },
}

/** Contextual, kind feedback. "almost" replaces punitive red error states. */
export function FeedbackBanner({ kind, title, children, actions, className }: { kind: FeedbackKind; title: ReactNode; children?: ReactNode; actions?: ReactNode; className?: string }) {
  const s = STYLES[kind]
  return (
    <div className={cn('animate-pop rounded-2xl p-4 ring-1 sm:p-5', s.box, className)} role="status" aria-live="polite">
      <p className={cn('flex items-center gap-2 font-bold', s.title)}>
        <s.icon size={18} aria-hidden /> {title}
      </p>
      {children && <div className="reading mt-1.5 text-sm text-ink sm:text-base">{children}</div>}
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
