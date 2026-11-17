import { useId, useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/app/lib/cn'

export interface AccordionItem {
  q: string
  a: ReactNode
}

export function Accordion({ items, className }: { items: AccordionItem[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(0)
  const base = useId()
  return (
    <div className={cn('divide-y divide-line rounded-3xl bg-surface ring-1 ring-line', className)}>
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={item.q}>
            <h3 className="font-sans">
              <button
                type="button"
                id={`${base}-h-${i}`}
                aria-expanded={isOpen}
                aria-controls={`${base}-p-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center gap-4 px-6 py-5 text-left text-base font-semibold text-ink transition-colors hover:text-violet-700 sm:px-8"
              >
                <span className="flex-1">{item.q}</span>
                <span
                  className={cn(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-full transition-[transform,background-color] duration-300',
                    isOpen ? 'rotate-45 bg-ink text-white' : 'bg-mist text-ink',
                  )}
                >
                  <Plus size={16} aria-hidden />
                </span>
              </button>
            </h3>
            <div
              id={`${base}-p-${i}`}
              role="region"
              aria-labelledby={`${base}-h-${i}`}
              hidden={!isOpen}
              className="reading px-6 pb-6 text-ink-soft sm:px-8"
            >
              {item.a}
            </div>
          </div>
        )
      })}
    </div>
  )
}
