import { LogoMark } from '@/app/components/brand/Logo'

/** Shown briefly while the first screen's code loads. */
export function RouteLoading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas" role="status" aria-label="Cargando LANIA">
      <LogoMark className="h-14 w-14 animate-pulse" />
    </div>
  )
}
