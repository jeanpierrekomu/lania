import { useId, type ComponentProps, type ReactNode, type SelectHTMLAttributes } from 'react'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { cn } from '@/ui/lib/cn'

const CONTROL =
  'w-full rounded-2xl bg-surface text-ink ring-1 ring-line-strong transition-shadow duration-200 placeholder:text-ink-soft/80 hover:ring-ink-faint focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-mist disabled:text-ink-soft aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-danger-600'

export interface FieldProps {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  className?: string
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode
}

export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-sm text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger-600">
          {error}
        </p>
      )}
    </div>
  )
}

export interface TextInputProps extends ComponentProps<'input'> {
  icon?: LucideIcon
  invalid?: boolean
  inputSize?: 'md' | 'lg'
  tone?: 'light' | 'dark'
}

export function TextInput({ icon: Icon, invalid, inputSize = 'md', tone = 'light', className, ...rest }: TextInputProps) {
  return (
    <div className="relative">
      {Icon && (
        <Icon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" aria-hidden />
      )}
      <input
        aria-invalid={invalid || undefined}
        className={cn(
          CONTROL,
          inputSize === 'lg' ? 'h-14 px-5 text-lg' : 'h-12 px-4 text-base',
          Icon && 'pl-11',
          tone === 'dark' && 'bg-white/10 text-white ring-white/20 placeholder:text-white/55 hover:ring-white/35',
          className,
        )}
        {...rest}
      />
    </div>
  )
}

export interface TextAreaProps extends ComponentProps<'textarea'> {
  invalid?: boolean
}

export function TextArea({ invalid, className, ...rest }: TextAreaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, 'min-h-32 resize-y px-4 py-3 text-base leading-relaxed', className)}
      {...rest}
    />
  )
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  invalid?: boolean
  tone?: 'light' | 'dark'
}

export function Select({ options, invalid, tone = 'light', className, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn(
          'h-12 w-full appearance-none rounded-2xl pl-4 pr-11 text-base font-medium focus:outline-none focus:ring-2 focus:ring-violet-500',
          tone === 'light' ? CONTROL : 'bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15 [&>option]:text-ink',
          className,
        )}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={18}
        className={cn('pointer-events-none absolute right-4 top-1/2 -translate-y-1/2', tone === 'light' ? 'text-ink-soft' : 'text-white/80')}
        aria-hidden
      />
    </div>
  )
}
