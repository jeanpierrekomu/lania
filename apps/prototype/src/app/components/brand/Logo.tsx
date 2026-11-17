import { cn } from '@/app/lib/cn'

/** Speech-bubble tittle: the dot of the "i" is a conversation. */
export function BubbleDot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12.4 2.2a9.6 9.6 0 1 1-4.5 18.1L2.6 22l1.9-5.1A9.6 9.6 0 0 1 12.4 2.2Z" />
    </svg>
  )
}

/** Alto del logo por tamaño (el ancho se ajusta solo; proporción ~3,7:1). */
const SIZES = {
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-12',
  xl: 'h-16 sm:h-20',
  hero: 'h-24 sm:h-28 lg:h-36',
}

export interface LogoProps {
  size?: keyof typeof SIZES
  /** Se conserva por compatibilidad: el logo oficial es el mismo sobre fondo claro u oscuro. */
  tone?: 'ink' | 'white' | 'violet'
  className?: string
}

/** Logo oficial de LANIA: «L» + la cara de Lania + «nia» (public/brand/lania-logo.png). */
export function Logo({ size = 'md', className }: LogoProps) {
  return (
    <img
      src="/brand/lania-logo.png"
      alt="LANIA"
      width={1200}
      height={324}
      draggable={false}
      className={cn('block w-auto select-none', SIZES[size], className)}
    />
  )
}

/** Ícono de la app: la cara de Lania con gafas y audífonos (public/brand/lania-icon.png). */
export function LogoMark({ className }: { className?: string; tone?: 'violet' | 'ink' | 'white' }) {
  return (
    <img
      src="/brand/lania-icon.png"
      alt="LANIA"
      width={512}
      height={512}
      draggable={false}
      className={cn('block select-none object-contain', className)}
    />
  )
}
