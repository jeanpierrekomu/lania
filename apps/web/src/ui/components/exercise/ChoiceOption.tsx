import type { ReactNode } from 'react'
import { CircleCheck, CircleX } from 'lucide-react'
import { cn } from '@/ui/lib/cn'

export type ChoiceState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'dimmed'

export interface ChoiceOptionProps {
  state?: ChoiceState
  label: ReactNode
  letter?: string
  detail?: ReactNode
  onSelect?: () => void
  disabled?: boolean
  tone?: 'light' | 'dark'
}

/** Answer option. State is always conveyed by icon + text, never by color alone. */
export function ChoiceOption({ state = 'idle', label, letter, detail, onSelect, disabled, tone = 'light' }: ChoiceOptionProps) {
  const checked = state === 'selected' || state === 'correct' || state === 'incorrect'
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left text-base font-semibold ring-2 transition-[background-color,box-shadow,opacity] duration-200 disabled:cursor-default',
        tone === 'light' && state === 'idle' && 'bg-surface text-ink ring-line hover:bg-violet-50 hover:ring-violet-300',
        tone === 'dark' && state === 'idle' && 'bg-white/5 text-white ring-white/15 hover:bg-white/10',
        state === 'selected' && (tone === 'light' ? 'bg-violet-50 text-ink ring-violet-600' : 'bg-white/15 text-white ring-coral-300'),
        state === 'correct' && 'bg-mint-50 text-ink ring-mint-600',
        state === 'incorrect' && 'animate-nudge bg-coral-50 text-ink ring-coral-600',
        state === 'dimmed' && (tone === 'light' ? 'bg-surface text-ink-soft ring-line opacity-60' : 'bg-white/5 text-white/60 ring-white/10'),
      )}
    >
      {letter && (
        <span
          className={cn(
            'grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-bold',
            state === 'correct'
              ? 'bg-mint-600 text-white'
              : state === 'incorrect'
                ? 'bg-coral-600 text-white'
                : state === 'selected'
                  ? 'bg-violet-600 text-white'
                  : tone === 'light'
                    ? 'bg-mist text-ink-soft group-hover:bg-violet-100 group-hover:text-violet-700'
                    : 'bg-white/10 text-white/80',
          )}
          aria-hidden
        >
          {letter}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block">{label}</span>
        {detail && <span className="mt-0.5 block text-sm font-normal text-ink-soft">{detail}</span>}
      </span>
      {state === 'correct' && (
        <span className="flex items-center gap-1 text-sm font-bold text-mint-700">
          <CircleCheck size={20} aria-hidden /> <span className="sr-only sm:not-sr-only">Correcta</span>
        </span>
      )}
      {state === 'incorrect' && (
        <span className="flex items-center gap-1 text-sm font-bold text-coral-700">
          <CircleX size={20} aria-hidden /> <span className="sr-only sm:not-sr-only">Revisemos</span>
        </span>
      )}
    </button>
  )
}
