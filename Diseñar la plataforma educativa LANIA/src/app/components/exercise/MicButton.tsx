import { Loader2, Mic, Square } from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { VoiceRings } from '@/app/components/illustrations/Decor'

export type MicState = 'idle' | 'listening' | 'processing' | 'disabled'

export interface MicButtonProps {
  state: MicState
  onClick: () => void
  size?: 'md' | 'lg'
  label?: string
  className?: string
}

export function MicButton({ state, onClick, size = 'lg', label, className }: MicButtonProps) {
  const dims = size === 'lg' ? 'h-20 w-20' : 'h-14 w-14'
  const aria =
    label ?? (state === 'listening' ? 'Terminar de hablar' : state === 'processing' ? 'Procesando tu respuesta' : 'Hablar')
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === 'processing' || state === 'disabled'}
      aria-label={aria}
      aria-pressed={state === 'listening'}
      className={cn(
        'relative grid shrink-0 place-items-center rounded-full text-white transition-[background-color,transform,box-shadow] duration-200 active:scale-95 disabled:cursor-not-allowed',
        dims,
        state === 'listening' ? 'bg-coral-500 text-coral-300 shadow-glow-coral' : 'bg-primary shadow-glow hover:bg-primary-hover',
        state === 'disabled' && 'bg-night-600 opacity-60 shadow-none hover:bg-night-600',
        className,
      )}
    >
      {state === 'listening' && <VoiceRings className="text-coral-400" />}
      <span className="relative text-white">
        {state === 'processing' ? (
          <Loader2 size={size === 'lg' ? 30 : 22} className="animate-spin" aria-hidden />
        ) : state === 'listening' ? (
          <Square size={size === 'lg' ? 24 : 18} fill="currentColor" aria-hidden />
        ) : (
          <Mic size={size === 'lg' ? 32 : 24} aria-hidden />
        )}
      </span>
    </button>
  )
}
