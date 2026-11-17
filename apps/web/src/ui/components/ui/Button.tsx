import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { Link, type LinkProps } from '@/ui/router'
import { Loader2, type LucideIcon } from 'lucide-react'
import { cn } from '@/ui/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'coral' | 'ghost' | 'dark' | 'success' | 'danger' | 'light'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white shadow-glow hover:bg-primary-hover',
  secondary: 'bg-surface text-ink shadow-inset-line hover:bg-mist',
  soft: 'bg-violet-100 text-violet-800 hover:bg-violet-200',
  coral: 'bg-coral-300 text-ink shadow-glow-coral hover:bg-coral-400',
  ghost: 'text-ink-soft hover:bg-mist hover:text-ink',
  dark: 'bg-ink text-white hover:bg-night-800',
  success: 'bg-mint-600 text-white hover:bg-mint-700',
  danger: 'bg-danger-600 text-white hover:bg-danger-700',
  light: 'bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 px-4 text-sm',
  md: 'h-11 gap-2 px-5 text-sm',
  lg: 'h-14 gap-2.5 px-7 text-base',
}

const ICON_SIZE: Record<ButtonSize, number> = { sm: 16, md: 18, lg: 20 }

const BASE =
  'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full font-semibold transition-[background-color,box-shadow,color,transform] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45'

interface CommonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  iconRight?: LucideIcon
  block?: boolean
  children?: ReactNode
  className?: string
}

export function buttonClasses({ variant = 'primary', size = 'md', block, className }: CommonProps) {
  return cn(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', className)
}

function Content({ icon: Icon, iconRight: IconRight, size = 'md', children, loading }: CommonProps & { loading?: boolean }) {
  const s = ICON_SIZE[size]
  return (
    <>
      {loading ? <Loader2 size={s} className="animate-spin" aria-hidden /> : Icon && <Icon size={s} aria-hidden />}
      {children}
      {IconRight && <IconRight size={s} aria-hidden />}
    </>
  )
}

export interface ButtonProps extends CommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  loading?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function Button({ variant, size, icon, iconRight, block, className, children, loading, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, block, className })}
      aria-busy={loading || undefined}
      {...rest}
    >
      <Content icon={icon} iconRight={iconRight} size={size} loading={loading}>
        {children}
      </Content>
    </button>
  )
}

export interface ButtonLinkProps extends CommonProps, Omit<LinkProps, 'children' | 'className'> {}

export function ButtonLink({ variant, size, icon, iconRight, block, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, block, className })} {...rest}>
      <Content icon={icon} iconRight={iconRight} size={size}>
        {children}
      </Content>
    </Link>
  )
}

export type IconButtonVariant = 'ghost' | 'soft' | 'secondary' | 'dark' | 'light' | 'primary'

const ICON_VARIANTS: Record<IconButtonVariant, string> = {
  ghost: 'text-ink-soft hover:bg-mist hover:text-ink',
  soft: 'bg-violet-100 text-violet-800 hover:bg-violet-200',
  secondary: 'bg-surface text-ink shadow-inset-line hover:bg-mist',
  dark: 'bg-ink text-white hover:bg-night-800',
  light: 'bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20',
  primary: 'bg-primary text-white hover:bg-primary-hover',
}

const ICON_SIZES = { sm: 'h-9 w-9', md: 'h-11 w-11', lg: 'h-14 w-14' }

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon
  label: string
  variant?: IconButtonVariant
  size?: 'sm' | 'md' | 'lg'
  pressed?: boolean
}

export function IconButton({ icon: Icon, label, variant = 'ghost', size = 'md', pressed, className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-200 disabled:pointer-events-none disabled:opacity-45',
        ICON_VARIANTS[variant],
        ICON_SIZES[size],
        pressed && (variant === 'light' ? 'bg-white text-ink hover:bg-white' : variant === 'dark' ? 'bg-coral-300 text-ink hover:bg-coral-300' : 'bg-violet-100 text-violet-800'),
        className,
      )}
      {...rest}
    >
      <Icon size={size === 'lg' ? 22 : size === 'sm' ? 16 : 19} aria-hidden />
    </button>
  )
}
