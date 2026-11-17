import { useState, type ReactNode } from 'react'
import { BookOpen, Lightbulb } from 'lucide-react'
import { Button } from '@/ui/components/ui/Button'
import { Eyebrow, Heading } from '@/ui/components/ui/Typography'
import { HintCard } from '@/ui/components/exercise/HintCard'
import { usePreferences } from '@/ui/state/preferences'
import type { LaniaExpression } from '@/ui/components/illustrations/Lania'

export interface StepProps {
  /** Update Lania's expression and line. */
  say: (expression: LaniaExpression, message: string) => void
  next: () => void
}

/** Hints are progressive and never penalise; mode follows learner preferences. */
export function useHints(count: number) {
  const { prefs } = usePreferences()
  const [revealed, setRevealed] = useState(prefs.hints === 'show' ? 1 : 0)
  return { revealed, more: () => setRevealed((r) => Math.min(count, r + 1)), exhausted: revealed >= count }
}

export interface StepFrameProps {
  eyebrow: string
  title: ReactNode
  instruction?: ReactNode
  children: ReactNode
  hints?: string[]
  hintsRevealed?: number
  onHint?: () => void
  explanation?: ReactNode
  feedback?: ReactNode
  primary: ReactNode
}

/** Consistent exercise layout: one main instruction, then hint / explanation / answer actions. */
export function StepFrame({ eyebrow, title, instruction, children, hints, hintsRevealed = 0, onHint, explanation, feedback, primary }: StepFrameProps) {
  const [explain, setExplain] = useState(false)
  return (
    <div className="flex flex-1 flex-col">
      <Eyebrow>{eyebrow}</Eyebrow>
      <Heading level={2} size="md" className="mt-2">
        {title}
      </Heading>
      {instruction && <p className="reading mt-2 text-ink-soft">{instruction}</p>}
      <div className="mt-6">{children}</div>
      <div className="mt-5 space-y-3">
        {hints && <HintCard hints={hints} revealed={hintsRevealed} />}
        {explain && explanation && (
          <div className="reading animate-fade-up rounded-2xl bg-violet-50 p-4 text-sm text-ink ring-1 ring-violet-100 sm:text-base" role="region" aria-label="Explicación">
            <p className="mb-1 flex items-center gap-2 font-bold text-violet-800">
              <BookOpen size={16} aria-hidden /> Explicación
            </p>
            {explanation}
          </div>
        )}
        {feedback}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-5 sm:mt-8">
        {hints && onHint && (
          <Button variant="soft" icon={Lightbulb} onClick={onHint} disabled={hintsRevealed >= hints.length}>
            {hintsRevealed === 0 ? 'Pedir una pista' : hintsRevealed >= hints.length ? 'Sin más pistas' : 'Otra pista'}
          </Button>
        )}
        {explanation && (
          <Button variant="ghost" icon={BookOpen} onClick={() => setExplain((v) => !v)} aria-expanded={explain}>
            {explain ? 'Ocultar explicación' : 'Ver explicación'}
          </Button>
        )}
        <span className="flex-1" />
        {primary}
      </div>
    </div>
  )
}
