import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { cn } from '@/ui/lib/cn'
import { Lania, type LaniaExpression } from '@/ui/components/illustrations/Lania'
import { Button } from '@/ui/components/ui/Button'

/**
 * Recorrido guiado de la primera visita: Lania señala cada parte de la app y explica para qué sirve.
 * - Se abre solo una vez (se recuerda en este navegador); se puede repetir con `startTour()`.
 * - Cada paso busca el primer elemento VISIBLE con `data-tour="…"` (menú lateral en escritorio,
 *   barra inferior en celular). Si no hay ninguno, el globo aparece centrado.
 * - Accesible: diálogo con foco, Esc para salir, flechas ← → para moverse; respeta «reducir movimiento».
 */

const STORAGE_KEY = 'lania.tour.v1'
const START_EVENT = 'lania:start-tour'

interface Step {
  /** Valores de `data-tour` en orden de preferencia; vacío = centrado. */
  targets: string[]
  title: string
  text: string
  expression: LaniaExpression
}

const STEPS: Step[] = [
  {
    targets: [],
    title: '¡Hola! Soy Lania',
    text: 'Te muestro en un minuto dónde está cada cosa. Puedes saltarlo cuando quieras y volver a verlo después.',
    expression: 'welcome',
  },
  { targets: ['/app'], title: 'Tu inicio', text: 'Aquí está tu misión del día, tus repasos y cómo vas avanzando.', expression: 'explaining' },
  { targets: ['/app/aula'], title: 'Aula con Lania', text: 'Aquí tomas tus clases cortas: una idea a la vez, con ejemplos y pistas.', expression: 'explaining' },
  { targets: ['/review'], title: 'Repaso', text: 'Aquí vuelven tus errores días después, en ejercicios nuevos, para que no se te olviden.', expression: 'thinking' },
  { targets: ['/tutor'], title: 'Conversar con Lania', text: 'Aquí me escribes en inglés o en español: dudas, frases que quieras decir mejor o práctica libre.', expression: 'welcome' },
  { targets: ['/app/speaking', 'practicar'], title: 'Speaking Lab', text: 'Aquí practicas hablando en voz alta conmigo, sin miedo a equivocarte.', expression: 'listening' },
  { targets: ['/app/listening', 'practicar'], title: 'Listening Lab', text: 'Aquí entrenas el oído con audios reales, a la velocidad que necesites.', expression: 'listening' },
  { targets: ['/app/writing', 'practicar'], title: 'Writing Lab', text: 'Aquí escribes textos y te ayudo a mejorarlos paso a paso.', expression: 'correcting' },
  { targets: ['/app/salones'], title: 'Salones', text: 'Aquí conversas en inglés con otros estudiantes de tu nivel.', expression: 'welcome' },
  { targets: ['/app/misiones', 'practicar'], title: 'Misiones', text: 'Situaciones de la vida real que vas desbloqueando: entrevistas, viajes, trabajo.', expression: 'thinking' },
  { targets: ['/app/progreso'], title: 'Mi progreso', text: 'Aquí ves cuánto has avanzado en cada habilidad, siempre con evidencia.', expression: 'celebrating' },
  { targets: ['/preferences'], title: 'Ajustes de Lania', text: 'Aquí eliges mi estilo (divertida, tranquila o directa), cuánto humor uso y cuántas correcciones te doy.', expression: 'explaining' },
  { targets: ['preferencias'], title: 'Lectura y accesibilidad', text: 'Aquí ajustas el tamaño del texto, el espaciado y el movimiento de la pantalla.', expression: 'explaining' },
  {
    targets: ['recorrido'],
    title: '¡Listo para empezar!',
    text: 'Si quieres volver a ver este recorrido, está aquí. ¡Vamos con tu primera misión!',
    expression: 'celebrating',
  },
]

/** Abre el recorrido desde cualquier botón. */
export function startTour() {
  window.dispatchEvent(new Event(START_EVENT))
}

function readDone() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'done'
  } catch {
    return false
  }
}
function saveDone() {
  try {
    localStorage.setItem(STORAGE_KEY, 'done')
  } catch {
    /* sin almacenamiento: el recorrido simplemente volverá a ofrecerse */
  }
}

function findTarget(targets: string[]): HTMLElement | null {
  for (const t of targets) {
    for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${CSS.escape(t)}"]`)) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden') return el
    }
  }
  return null
}

const PAD = 6
const CARD_W = 340
const GAP = 16

export function GuidedTour({ autoStart = true }: { autoStart?: boolean }) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const textId = useId()
  const step = STEPS[index]
  const last = index === STEPS.length - 1

  const close = useCallback(() => {
    setOpen(false)
    saveDone()
  }, [])

  useEffect(() => {
    const onStart = () => {
      setIndex(0)
      setOpen(true)
    }
    window.addEventListener(START_EVENT, onStart)
    let timer: number | undefined
    if (autoStart && !readDone()) timer = window.setTimeout(onStart, 600)
    return () => {
      window.removeEventListener(START_EVENT, onStart)
      window.clearTimeout(timer)
    }
  }, [autoStart])

  // Posición del foco de luz: se recalcula al cambiar de paso, al hacer scroll o al cambiar el tamaño.
  useLayoutEffect(() => {
    if (!open) return
    const update = () => {
      const el = findTarget(step.targets)
      if (el) el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      setRect(el ? el.getBoundingClientRect() : null)
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, step])

  useEffect(() => {
    if (open) nextRef.current?.focus()
  }, [open, index])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, STEPS.length - 1))
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
      else if (e.key === 'Tab' && cardRef.current) {
        // El foco se queda dentro del globo mientras el recorrido está abierto.
        const items = [...cardRef.current.querySelectorAll<HTMLElement>('button')]
        const first = items[0]
        const lastItem = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          lastItem.focus()
        } else if (!e.shiftKey && document.activeElement === lastItem) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  if (!open) return null

  // Globo: a la derecha del objetivo si cabe (menú lateral), si no arriba (barra inferior) o abajo.
  const vw = window.innerWidth
  const vh = window.innerHeight
  const width = Math.min(CARD_W, vw - 32)
  let style: React.CSSProperties
  if (!rect) {
    style = { left: (vw - width) / 2, top: Math.max(16, vh / 2 - 170), width }
  } else if (rect.right + GAP + width <= vw - 16) {
    style = { left: rect.right + GAP, top: Math.min(Math.max(16, rect.top - 24), vh - 300), width }
  } else if (rect.top > vh / 2) {
    style = { left: Math.min(Math.max(16, rect.left + rect.width / 2 - width / 2), vw - width - 16), bottom: vh - rect.top + GAP, width }
  } else {
    style = { left: Math.min(Math.max(16, rect.left + rect.width / 2 - width / 2), vw - width - 16), top: rect.bottom + GAP, width }
  }

  return (
    <div className="fixed inset-0 z-[60]" aria-hidden={false}>
      {/* Fondo atenuado con un «agujero» de luz sobre el elemento señalado */}
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-2xl ring-4 ring-violet-300 transition-all duration-300"
          style={{
            left: rect.left - PAD,
            top: rect.top - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgb(11 61 91 / 0.55)',
          }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-ink/55" />
      )}
      {/* Clic fuera: no cierra por accidente, solo bloquea la página detrás */}
      <div className="fixed inset-0" onClick={(e) => e.stopPropagation()} />

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={textId}
        className="fixed animate-pop rounded-3xl bg-surface p-5 shadow-float ring-1 ring-line"
        style={style}
      >
        <div className="flex items-start gap-3">
          <span className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-violet-100 ring-2 ring-white">
            <Lania crop="head" expression={step.expression} animated={false} className="h-full w-full" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">
              Paso {index + 1} de {STEPS.length}
            </p>
            <h2 id={titleId} className="mt-0.5 font-display text-lg font-bold text-ink">
              {step.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-mist hover:text-ink"
            aria-label="Saltar el recorrido"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <p id={textId} className="reading mt-3 text-ink">
          {step.text}
        </p>

        <div className="mt-4 flex items-center gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s.title} className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-5 bg-violet-600' : 'w-1.5 bg-line-strong')} />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          {index === 0 ? (
            <Button variant="ghost" size="sm" onClick={close}>
              Saltar
            </Button>
          ) : (
            <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setIndex(index - 1)}>
              Atrás
            </Button>
          )}
          <Button
            ref={nextRef}
            size="sm"
            iconRight={last ? undefined : ArrowRight}
            onClick={() => (last ? close() : setIndex(index + 1))}
          >
            {last ? '¡Empezar!' : index === 0 ? 'Empezar recorrido' : 'Siguiente'}
          </Button>
        </div>
      </div>
    </div>
  )
}
