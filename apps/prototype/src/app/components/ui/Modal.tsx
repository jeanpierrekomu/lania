import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { IconButton } from './Button'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** `drawer` slides from the right on desktop and from the bottom on mobile. */
  placement?: 'center' | 'drawer'
  icon?: ReactNode
}

const WIDTHS = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' }

/** Accessible dialog built on the native <dialog> element (focus trap + Esc). */
export function Modal({ open, onClose, title, description, children, footer, size = 'md', placement = 'center', icon }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={cn(
        'm-0 max-h-none max-w-none bg-transparent p-0 text-ink backdrop:bg-ink/45 backdrop:backdrop-blur-sm',
        placement === 'center'
          ? 'fixed inset-0 h-full w-full overflow-y-auto'
          : 'fixed inset-y-0 right-0 left-auto h-full w-full sm:w-auto',
      )}
    >
      {open && (
        <div
          className={cn(
            placement === 'center'
              ? 'flex min-h-full items-end justify-center p-0 sm:items-center sm:p-6'
              : 'flex h-full items-end sm:items-stretch sm:justify-end',
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <div
            className={cn(
              'relative flex w-full flex-col bg-surface shadow-float',
              placement === 'center'
                ? cn('max-h-[92vh] animate-pop rounded-t-4xl sm:rounded-4xl', WIDTHS[size])
                : 'max-h-[92vh] animate-fade-up rounded-t-4xl sm:h-full sm:max-h-none sm:w-[26rem] sm:rounded-none sm:rounded-l-4xl',
            )}
          >
            <div className="flex items-start gap-4 px-6 pb-2 pt-6 sm:px-8 sm:pt-8">
              {icon}
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-1.5 text-sm text-ink-soft sm:text-base">
                    {description}
                  </p>
                )}
              </div>
              <IconButton icon={X} label="Cerrar" onClick={onClose} size="sm" variant="secondary" />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-3 sm:px-8">{children}</div>
            {footer && (
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-6 py-4 sm:px-8">{footer}</div>
            )}
          </div>
        </div>
      )}
    </dialog>
  )
}
