import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type MotionPref = 'system' | 'full' | 'reduce'
export type TextScale = 'md' | 'lg' | 'xl'
export type Spacing = 'normal' | 'relaxed'
export type HintMode = 'ask' | 'show'
export type CorrectionTiming = 'end' | 'moment'
export type AudioRate = 0.75 | 1 | 1.25

export interface Preferences {
  focusMode: boolean
  motion: MotionPref
  textScale: TextScale
  spacing: Spacing
  hints: HintMode
  subtitles: boolean
  audioRate: AudioRate
  corrections: CorrectionTiming
  laniaVoice: boolean
}

export const DEFAULT_PREFERENCES: Preferences = {
  focusMode: false,
  motion: 'system',
  textScale: 'md',
  spacing: 'normal',
  hints: 'ask',
  subtitles: true,
  audioRate: 1,
  corrections: 'end',
  laniaVoice: true,
}

const STORAGE_KEY = 'lania.prefs.v1'

interface PreferencesContextValue {
  prefs: Preferences
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void
  setPrefs: (patch: Partial<Preferences>) => void
  reset: () => void
  /** True when animations should be minimized (explicit choice or OS setting). */
  reducedMotion: boolean
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

function load(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES
  } catch {
    return DEFAULT_PREFERENCES
  }
}

function useOsReducedMotion() {
  const [reduce, setReduce] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduce(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduce
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setState] = useState<Preferences>(load)
  const osReduce = useOsReducedMotion()

  useEffect(() => {
    const root = document.documentElement
    root.dataset.motion = prefs.motion
    root.dataset.text = prefs.textScale
    root.dataset.spacing = prefs.spacing
    root.dataset.focus = prefs.focusMode ? 'on' : 'off'
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch {
      /* storage unavailable: preferences stay in memory */
    }
  }, [prefs])

  const setPref = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setState((p) => ({ ...p, [key]: value }))
  }, [])
  const setPrefs = useCallback((patch: Partial<Preferences>) => setState((p) => ({ ...p, ...patch })), [])
  const reset = useCallback(() => setState(DEFAULT_PREFERENCES), [])

  const value = useMemo(
    () => ({
      prefs,
      setPref,
      setPrefs,
      reset,
      reducedMotion: prefs.motion === 'reduce' || (prefs.motion === 'system' && osReduce),
    }),
    [prefs, setPref, setPrefs, reset, osReduce],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used inside PreferencesProvider')
  return ctx
}
