import { cn } from '@/app/lib/cn'

/** Speech-bubble tittle: the dot of the "i" is a conversation. */
export function BubbleDot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12.4 2.2a9.6 9.6 0 1 1-4.5 18.1L2.6 22l1.9-5.1A9.6 9.6 0 0 1 12.4 2.2Z" />
    </svg>
  )
}

const SIZES = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-6xl sm:text-7xl',
  hero: 'text-7xl sm:text-8xl lg:text-9xl',
}

export interface LogoProps {
  size?: keyof typeof SIZES
  tone?: 'ink' | 'white' | 'violet'
  className?: string
}

/** LANIA wordmark · Plus Jakarta Sans ExtraBold, lowercase, tight tracking. */
export function Logo({ size = 'md', tone = 'ink', className }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="LANIA"
      className={cn(
        'inline-flex items-baseline font-display font-extrabold leading-none tracking-[-0.05em]',
        SIZES[size],
        tone === 'ink' && 'text-ink',
        tone === 'white' && 'text-white',
        tone === 'violet' && 'text-violet-600',
        className,
      )}
    >
      <span aria-hidden>lan</span>
      <span aria-hidden className="relative">
        ı
        <BubbleDot
          className={cn(
            'absolute left-1/2 top-[0.02em] w-[0.33em] -translate-x-[42%]',
            tone === 'white' ? 'text-coral-300' : 'text-coral-500',
          )}
        />
      </span>
      <span aria-hidden>a</span>
    </span>
  )
}

/** App icon: the "l" monogram with the speech-bubble dot from the wordmark. */
export function LogoMark({ className, tone = 'violet' }: { className?: string; tone?: 'violet' | 'ink' | 'white' }) {
  const bg = tone === 'violet' ? 'var(--color-violet-600)' : tone === 'ink' ? 'var(--color-ink)' : 'var(--color-white)'
  const fg = tone === 'white' ? 'var(--color-violet-600)' : 'var(--color-white)'
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="LANIA">
      <rect width="64" height="64" rx="19" fill={bg} />
      <rect x="18.5" y="13" width="11.5" height="38" rx="5.75" fill={fg} />
      <path
        transform="translate(31.5 11) scale(0.86)"
        d="M12.4 2.2a9.6 9.6 0 1 1-4.5 18.1L2.6 22l1.9-5.1A9.6 9.6 0 0 1 12.4 2.2Z"
        fill="var(--color-coral-400)"
      />
    </svg>
  )
}
