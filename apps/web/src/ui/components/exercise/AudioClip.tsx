import { useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { cn } from '@/ui/lib/cn'
import { useSpeech } from '@/ui/lib/speech'
import { usePreferences, type AudioRate } from '@/ui/state/preferences'
import { Segmented } from '@/ui/components/ui/Segmented'
import { VoiceWave } from './VoiceWave'

/** Compact listening clip (text-to-speech) with replay and speed control. */
export function AudioClip({ text, title = 'Audio', className }: { text: string; title?: string; className?: string }) {
  const { prefs } = usePreferences()
  const [rate, setRate] = useState<AudioRate>(prefs.audioRate)
  const [plays, setPlays] = useState(0)
  const { speak, stop, speaking } = useSpeech()
  const play = () => {
    if (speaking) return stop()
    setPlays((p) => p + 1)
    speak(text, { lang: 'en', rate }, !prefs.laniaVoice)
  }
  return (
    <div className={cn('flex flex-wrap items-center gap-4 rounded-3xl bg-violet-50 p-4 ring-1 ring-violet-100', className)}>
      <button
        type="button"
        onClick={play}
        aria-label={speaking ? `Pausar ${title}` : `Reproducir ${title}`}
        className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary text-white shadow-glow transition-colors hover:bg-primary-hover"
      >
        {speaking ? <Pause size={24} fill="currentColor" aria-hidden /> : <Play size={24} fill="currentColor" className="ml-0.5" aria-hidden />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{title}</p>
        <div className="mt-1 flex items-center gap-3 text-violet-600">
          <VoiceWave active={speaking} bars={9} />
          <span className="text-xs font-semibold text-ink-soft">{plays === 0 ? 'Sin reproducir' : `Escuchado ${plays} ${plays === 1 ? 'vez' : 'veces'}`}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            stop()
            setPlays((p) => p + 1)
            speak(text, { lang: 'en', rate }, !prefs.laniaVoice)
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-violet-800 hover:bg-violet-100"
        >
          <RotateCcw size={15} aria-hidden /> Repetir
        </button>
        <Segmented<AudioRate>
          label="Velocidad del audio"
          size="sm"
          value={rate}
          onChange={setRate}
          options={[
            { value: 0.75, label: '0.75×' },
            { value: 1, label: '1×' },
            { value: 1.25, label: '1.25×' },
          ]}
        />
      </div>
    </div>
  )
}
