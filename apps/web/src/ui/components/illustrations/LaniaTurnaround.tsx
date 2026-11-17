import { cn } from '@/ui/lib/cn'

/** Vistas de referencia del personaje (hoja de modelo): frente, tres cuartos, perfil y espalda. */
export type LaniaView = 'front' | 'threeQuarter' | 'profile' | 'back'

const FILES: Record<LaniaView, string> = {
  front: 'front',
  threeQuarter: 'three-quarter',
  profile: 'profile',
  back: 'back',
}

const BASE = `${''}/lania`

export function LaniaTurnaround({ view, className }: { view: LaniaView; className?: string }) {
  return (
    <img
      src={`${BASE}/lania-view-${FILES[view]}.webp`}
      alt=""
      aria-hidden
      draggable={false}
      decoding="async"
      className={cn('block aspect-square object-contain select-none', className)}
    />
  )
}
