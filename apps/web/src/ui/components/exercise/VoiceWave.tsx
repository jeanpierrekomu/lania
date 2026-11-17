import { cn } from '@/ui/lib/cn'

const HEIGHTS = [0.45, 0.8, 0.6, 1, 0.7, 0.9, 0.5, 0.75, 0.55]

/** Discreet voice activity indicator (equalizer bars). */
export function VoiceWave({ active, bars = 7, className, barClassName = 'bg-current' }: { active: boolean; bars?: number; className?: string; barClassName?: string }) {
  return (
    <span className={cn('inline-flex h-6 items-center gap-1', className)} aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className={cn('w-1 origin-center rounded-full transition-transform duration-300', barClassName, active ? 'animate-eq' : 'scale-y-[0.3]')}
          style={{ height: `${HEIGHTS[i % HEIGHTS.length] * 100}%`, animationDelay: `${i * 0.11}s` }}
        />
      ))}
    </span>
  )
}
