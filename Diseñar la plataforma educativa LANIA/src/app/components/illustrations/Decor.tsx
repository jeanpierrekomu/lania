import { cn } from '@/app/lib/cn'

/** Four-point sparkle used sparingly to mark real achievements. */
export function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="-10 -10 20 20" className={className} aria-hidden fill="currentColor">
      <path d="M 0 -10 C 1.6 -2.2 2.2 -1.6 10 0 C 2.2 1.6 1.6 2.2 0 10 C -1.6 2.2 -2.2 1.6 -10 0 C -2.2 -1.6 -1.6 -2.2 0 -10 Z" />
    </svg>
  )
}

/** Hand-drawn underline for emphasised words. */
export function Squiggle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 18" preserveAspectRatio="none" className={className} aria-hidden fill="none">
      <path
        d="M3 12.5C40 4.5 78 3.6 112 7.2c29 3 63 4.6 105-2.8"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Soft organic backdrop shape behind characters. */
export function Blob({ className, variant = 1 }: { className?: string; variant?: 1 | 2 }) {
  const d =
    variant === 1
      ? 'M421 92c58 52 79 141 51 214-28 72-104 128-189 134-86 6-181-38-219-112C26 254 46 150 107 88 169 25 271 5 336 23c36 10 60 41 85 69Z'
      : 'M398 64c62 38 98 120 78 196-20 77-97 147-182 160-86 13-180-31-220-102-41-72-28-172 30-232C162 25 250 0 316 20c31 9 55 27 82 44Z'
  return (
    <svg viewBox="0 0 500 450" className={className} aria-hidden preserveAspectRatio="none">
      <path d={d} fill="currentColor" />
    </svg>
  )
}

/** Small concentric "voice" rings, decorative. */
export function VoiceRings({ className, active = true }: { className?: string; active?: boolean }) {
  return (
    <span className={cn('pointer-events-none absolute inset-0', className)} aria-hidden>
      {[0, 0.8, 1.6].map((d) => (
        <span
          key={d}
          className={cn('absolute inset-0 rounded-full border-2 border-current', active ? 'animate-ring' : 'opacity-0')}
          style={{ animationDelay: `${d}s` }}
        />
      ))}
    </span>
  )
}
