import { useCallback, useEffect, useRef, useState } from 'react'

export type RecorderState = 'idle' | 'recording' | 'done'

/**
 * Microphone recorder with live input level. Falls back to a simulated
 * recording when the browser (or the embedding iframe) denies microphone access.
 */
export function useRecorder({ maxSeconds = 30 }: { maxSeconds?: number } = {}) {
  const [state, setState] = useState<RecorderState>('idle')
  const [seconds, setSeconds] = useState(0)
  const [level, setLevel] = useState(0)
  const [simulated, setSimulated] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const tickRef = useRef<number | null>(null)
  const startedAt = useRef(0)
  const running = useRef(false)

  const cleanup = useCallback(() => {
    running.current = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (tickRef.current) window.clearInterval(tickRef.current)
    rafRef.current = null
    tickRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    void ctxRef.current?.close().catch(() => undefined)
    ctxRef.current = null
    setLevel(0)
  }, [])

  const stop = useCallback(() => {
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop()
    recRef.current = null
    cleanup()
    setState((s) => (s === 'recording' ? 'done' : s))
  }, [cleanup])

  const start = useCallback(async () => {
    setAudioUrl(null)
    setSeconds(0)
    startedAt.current = Date.now()
    tickRef.current = window.setInterval(() => {
      const s = Math.floor((Date.now() - startedAt.current) / 1000)
      setSeconds(s)
      if (s >= maxSeconds) stop()
    }, 250)
    setState('recording')
    running.current = true
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('unsupported')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setSimulated(false)
      const chunks: Blob[] = []
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = (e) => chunks.push(e.data)
      rec.onstop = () => setAudioUrl(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })))
      rec.start()
      recRef.current = rec
      const ctx = new AudioContext()
      ctxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      ctx.createMediaStreamSource(stream).connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      const loop = () => {
        if (!running.current) return
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (const v of data) sum += ((v - 128) / 128) ** 2
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4))
        rafRef.current = requestAnimationFrame(loop)
      }
      loop()
    } catch {
      setSimulated(true)
      let last = 0
      const loop = (t: number) => {
        if (!running.current) return
        if (t - last > 120) {
          last = t
          setLevel(0.35 + Math.random() * 0.5)
        }
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
  }, [maxSeconds, stop])

  const reset = useCallback(() => {
    stop()
    setState('idle')
    setSeconds(0)
    setAudioUrl(null)
  }, [stop])

  useEffect(() => () => cleanup(), [cleanup])

  return { state, seconds, level, simulated, audioUrl, start, stop, reset }
}

export function formatSeconds(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
