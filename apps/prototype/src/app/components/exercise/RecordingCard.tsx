import { useEffect, useRef } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { formatSeconds, useRecorder } from '@/app/lib/recorder'
import { Button } from '@/app/components/ui/Button'
import { MicButton } from './MicButton'

const BARS = 18

export interface RecordingCardProps {
  maxSeconds: number
  onChange?: (recordedSeconds: number | null) => void
  className?: string
}

/** Record an answer with live input level, playback and re-record. */
export function RecordingCard({ maxSeconds, onChange, className }: RecordingCardProps) {
  const rec = useRecorder({ maxSeconds })
  const history = useRef<number[]>(Array(BARS).fill(0))
  history.current = [...history.current.slice(1), rec.level]

  useEffect(() => {
    if (rec.state === 'done') onChange?.(Math.max(1, rec.seconds))
    if (rec.state === 'idle') onChange?.(null)
  }, [rec.state])

  const status =
    rec.state === 'recording'
      ? 'Te escucho… toca para terminar'
      : rec.state === 'done'
        ? `Respuesta grabada · ${formatSeconds(rec.seconds)}`
        : 'Toca el micrófono cuando estés lista o listo'

  return (
    <div className={cn('rounded-3xl bg-violet-50 p-5 ring-1 ring-violet-100 sm:p-6', className)}>
      <div className="flex items-center gap-5">
        <MicButton state={rec.state === 'recording' ? 'listening' : 'idle'} onClick={rec.state === 'recording' ? rec.stop : rec.start} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink" aria-live="polite">
            {status}
          </p>
          <div className="mt-2 flex h-8 items-center gap-1" aria-hidden>
            {history.current.map((l, i) => (
              <span
                key={i}
                className={cn('w-1.5 rounded-full transition-[height] duration-100', rec.state === 'recording' ? 'bg-coral-500' : 'bg-violet-300')}
                style={{ height: `${Math.max(12, (rec.state === 'recording' ? l : 0.15) * 100)}%` }}
              />
            ))}
          </div>
          <p className="mt-1 text-xs font-semibold text-ink-soft">
            {formatSeconds(rec.seconds)} / {formatSeconds(maxSeconds)}
          </p>
        </div>
      </div>
      {rec.state === 'done' && (
        <div className="mt-4 flex flex-wrap gap-2">
          {rec.audioUrl && (
            <Button variant="secondary" size="sm" icon={Play} onClick={() => void new Audio(rec.audioUrl!).play()}>
              Escucharme
            </Button>
          )}
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={rec.reset}>
            Grabar de nuevo
          </Button>
        </div>
      )}
      {rec.simulated && rec.state !== 'idle' && (
        <p className="mt-3 text-xs text-ink-soft">El micrófono no está disponible aquí; simulamos la grabación para que puedas seguir el flujo.</p>
      )}
    </div>
  )
}
