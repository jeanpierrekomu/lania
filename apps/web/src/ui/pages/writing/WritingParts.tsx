import { useState } from 'react'
import { Check, Lightbulb, PenLine, Wand2 } from 'lucide-react'
import { cn } from '@/ui/lib/cn'
import type { Issue } from '@/ui/lib/writingCheck'
import { Badge, type BadgeTone } from '@/ui/components/ui/Badge'
import { Button } from '@/ui/components/ui/Button'

export const CATEGORY_TONE: Record<Issue['category'], { badge: BadgeTone; mark: string }> = {
  Gramática: { badge: 'coral', mark: 'bg-coral-100 decoration-coral-500' },
  Vocabulario: { badge: 'violet', mark: 'bg-violet-100 decoration-violet-500' },
  Tono: { badge: 'mint', mark: 'bg-mint-100 decoration-mint-600' },
}

/** Read-only rendering of the draft with each issue highlighted. */
export function HighlightedText({ text, issues, active, onPick }: { text: string; issues: Issue[]; active?: string; onPick: (id: string) => void }) {
  const parts: React.ReactNode[] = []
  let pos = 0
  issues.forEach((iss, n) => {
    if (iss.start > pos) parts.push(text.slice(pos, iss.start))
    parts.push(
      <button
        key={iss.id}
        type="button"
        onClick={() => onPick(iss.id)}
        aria-label={`Detalle ${n + 1}: ${iss.title}`}
        className={cn(
          'rounded-md px-0.5 underline decoration-2 underline-offset-4 transition-shadow',
          CATEGORY_TONE[iss.category].mark,
          active === iss.id && 'ring-2 ring-ink',
        )}
      >
        {text.slice(iss.start, iss.end)}
      </button>,
    )
    pos = iss.end
  })
  parts.push(text.slice(pos))
  return <div className="reading whitespace-pre-wrap text-lg text-ink">{parts}</div>
}

export function IssueCard({
  issue,
  index,
  active,
  onApply,
  onSelf,
  onFocus,
}: {
  issue: Issue
  index: number
  active: boolean
  onApply: () => void
  onSelf: () => void
  onFocus: () => void
}) {
  const [shown, setShown] = useState(false)
  return (
    <li
      id={`issue-${issue.id}`}
      className={cn('rounded-3xl bg-surface p-4 ring-1 transition-shadow', active ? 'shadow-lift ring-2 ring-violet-500' : 'ring-line')}
      onFocus={onFocus}
      onMouseEnter={onFocus}
    >
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-mist text-xs font-bold text-ink-soft">{index + 1}</span>
        <Badge tone={CATEGORY_TONE[issue.category].badge}>{issue.category}</Badge>
        <p className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{issue.title}</p>
      </div>
      {!shown ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-ink">
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
          <span>
            <span className="font-semibold">Pista: </span>
            {issue.hint}
          </span>
        </p>
      ) : (
        <div className="mt-3 animate-fade-in space-y-1.5 text-sm">
          <p>
            <span className="text-ink-soft line-through">{issue.original}</span>
            <span className="mx-1.5 text-ink-soft" aria-hidden>
              →
            </span>
            <strong className="text-mint-700">{issue.suggestion}</strong>
          </p>
          <p className="reading text-ink-soft">{issue.explanation}</p>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" icon={PenLine} onClick={onSelf}>
          Lo corrijo yo
        </Button>
        {!shown ? (
          <Button size="sm" variant="ghost" onClick={() => setShown(true)}>
            Ver corrección
          </Button>
        ) : (
          <Button size="sm" variant="soft" icon={Wand2} onClick={onApply}>
            Aplicar
          </Button>
        )}
      </div>
    </li>
  )
}

export function Requirement({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={cn('inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1', ok ? 'bg-mint-50 text-mint-800 ring-mint-200' : 'bg-surface text-ink-soft ring-line')}>
      <span className={cn('grid h-4 w-4 place-items-center rounded-full', ok ? 'bg-mint-600 text-white' : 'ring-1 ring-line-strong')} aria-hidden>
        {ok && <Check size={11} />}
      </span>
      {children}
      <span className="sr-only">{ok ? '(cumplido)' : '(pendiente)'}</span>
    </li>
  )
}
