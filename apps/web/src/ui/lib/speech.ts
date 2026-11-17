import { useCallback, useEffect, useRef, useState } from 'react'

export type SpeechLang = 'en' | 'es'

interface SpeakOptions {
  lang?: SpeechLang
  rate?: number
  pitch?: number
  /** Called with the character index of the word being spoken (when the browser supports it). */
  onBoundary?: (charIndex: number) => void
  onEnd?: () => void
}

const hasSynth = () => typeof window !== 'undefined' && 'speechSynthesis' in window

function pickVoice(lang: SpeechLang) {
  if (!hasSynth()) return undefined
  const voices = window.speechSynthesis.getVoices()
  const prefs = lang === 'en' ? ['en-US', 'en-GB', 'en'] : ['es-MX', 'es-US', 'es-419', 'es-ES', 'es']
  for (const code of prefs) {
    const v = voices.find((voice) => voice.lang.toLowerCase().startsWith(code.toLowerCase()))
    if (v) return v
  }
  return undefined
}

/** Rough speaking duration used to simulate playback when no voice is available. */
export function estimateDuration(text: string, rate = 1) {
  const words = text.trim().split(/\s+/).length
  return Math.max(1200, (words / 2.6) * 1000) / rate
}

/**
 * Text-to-speech wrapper with a timed fallback, so the prototype behaves the
 * same when the browser has no voices (or speech is muted by the learner).
 */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const timer = useRef<number | null>(null)
  const token = useRef(0)

  const clear = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
  }, [])

  const stop = useCallback(() => {
    token.current += 1
    clear()
    if (hasSynth()) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [clear])

  const speak = useCallback(
    (text: string, { lang = 'en', rate = 1, pitch = 1.05, onBoundary, onEnd }: SpeakOptions = {}, muted = false) => {
      stop()
      const my = ++token.current
      setSpeaking(true)
      const finish = () => {
        if (my !== token.current) return
        clear()
        setSpeaking(false)
        onEnd?.()
      }
      // Safety net: some engines never fire `end`.
      timer.current = window.setTimeout(finish, estimateDuration(text, rate) + (muted || !hasSynth() ? 0 : 2500))
      if (muted || !hasSynth()) return
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang === 'en' ? 'en-US' : 'es-MX'
      const voice = pickVoice(lang)
      if (voice) u.voice = voice
      u.rate = rate
      u.pitch = pitch
      u.onboundary = (e) => onBoundary?.(e.charIndex)
      u.onend = finish
      u.onerror = finish
      window.speechSynthesis.speak(u)
    },
    [stop, clear],
  )

  useEffect(() => stop, [stop])

  return { speak, stop, speaking }
}
