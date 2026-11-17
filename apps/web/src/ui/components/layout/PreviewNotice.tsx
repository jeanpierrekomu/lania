import { Sparkles } from 'lucide-react'

/** Aviso para secciones que todavía muestran datos de ejemplo (aún no conectadas a tu progreso real). */
export function PreviewNotice() {
  return (
    <div role="note" className="border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-700 sm:px-8">
      <p className="mx-auto flex max-w-6xl items-center gap-2">
        <Sparkles size={16} className="shrink-0" aria-hidden />
        <span>
          <strong className="font-semibold">Vista previa.</strong> Esta sección todavía usa datos de ejemplo; pronto se conectará con tu progreso real.
        </span>
      </p>
    </div>
  )
}
