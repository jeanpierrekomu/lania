import { Lightbulb, Plus } from 'lucide-react'
import { cn } from '@/app/lib/cn'

export interface HintCardProps {
  hints: string[]
  revealed: number
  onMore?: () => void
  className?: string
  tone?: 'light' | 'dark'
}

/** Progressive hints: each one narrows the search without giving the answer away. */
export function HintCard({ hints, revealed, onMore, className, tone = 'light' }: HintCardProps) {
  if (revealed <= 0) return null
  return (
    <div
      className={cn(
        'animate-fade-up rounded-2xl p-4',
        tone === 'light' ? 'bg-amber-50 ring-1 ring-amber-100' : 'bg-white/10 ring-1 ring-white/10',
        className,
      )}
      role="status"
    >
      <p className={cn('flex items-center gap-2 text-sm font-bold', tone === 'light' ? 'text-amber-700' : 'text-amber-300')}>
        <Lightbulb size={16} aria-hidden /> Pista {revealed > 1 ? `${revealed} de ${hints.length}` : ''}
      </p>
      <ol className={cn('reading mt-1.5 space-y-1 text-sm', tone === 'light' ? 'text-ink' : 'text-white/90')}>
        {hints.slice(0, revealed).map((h, i) => (
          <li key={h} className={cn(i < revealed - 1 && 'opacity-70')}>
            {h}
          </li>
        ))}
      </ol>
      {onMore && revealed < hints.length && (
        <button
          type="button"
          onClick={onMore}
          className={cn(
            'mt-2 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline',
            tone === 'light' ? 'text-amber-700' : 'text-amber-300',
          )}
        >
          <Plus size={14} aria-hidden /> Otra pista
        </button>
      )}
    </div>
  )
}
