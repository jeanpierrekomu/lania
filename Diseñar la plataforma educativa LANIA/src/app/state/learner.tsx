import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { SkillId } from '@/app/data/skills'

export type TeacherStyle = 'divertida' | 'tranquila' | 'exigente'
export type Cefr = 'A1' | 'A2' | 'A2+' | 'B1' | 'B1+' | 'B2' | 'B2+' | 'C1'
export type Confidence = 'baja' | 'media' | 'alta'

export interface SkillEstimate {
  level: Cefr
  confidence: Confidence
  evidence: string
}

export interface DiagnosticResult {
  completedAt: string
  overall: Cefr
  skills: Record<SkillId, SkillEstimate>
}

export interface Learner {
  name: string
  goal: string
  selfLevel: string
  interests: string[]
  sessionMinutes: 5 | 15 | 30
  teacherStyle: TeacherStyle
  onboarded: boolean
  diagnostic: DiagnosticResult
}

export const DEMO_DIAGNOSTIC: DiagnosticResult = {
  completedAt: '2025-05-12',
  overall: 'B1',
  skills: {
    speaking: { level: 'A2+', confidence: 'media', evidence: 'Diagnóstico + 6 conversaciones' },
    listening: { level: 'B1', confidence: 'alta', evidence: 'Diagnóstico + 12 audios' },
    writing: { level: 'A2+', confidence: 'media', evidence: 'Diagnóstico + 4 textos' },
    reading: { level: 'B1+', confidence: 'alta', evidence: 'Diagnóstico + 9 lecturas' },
    grammar: { level: 'B1', confidence: 'alta', evidence: 'Diagnóstico + 31 ejercicios' },
  },
}

export const DEMO_LEARNER: Learner = {
  name: 'Valentina',
  goal: 'entrevistas',
  selfLevel: 'b1',
  interests: ['tecnologia', 'viajes', 'entretenimiento'],
  sessionMinutes: 15,
  teacherStyle: 'divertida',
  onboarded: true,
  diagnostic: DEMO_DIAGNOSTIC,
}

const STORAGE_KEY = 'lania.learner.v1'

interface LearnerContextValue {
  learner: Learner
  update: (patch: Partial<Learner>) => void
  resetDemo: () => void
}

const LearnerContext = createContext<LearnerContextValue | null>(null)

function load(): Learner {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEMO_LEARNER, ...JSON.parse(raw) } : DEMO_LEARNER
  } catch {
    return DEMO_LEARNER
  }
}

export function LearnerProvider({ children }: { children: ReactNode }) {
  const [learner, setLearner] = useState<Learner>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(learner))
    } catch {
      /* storage unavailable */
    }
  }, [learner])

  const update = useCallback((patch: Partial<Learner>) => setLearner((l) => ({ ...l, ...patch })), [])
  const resetDemo = useCallback(() => {
    setLearner(DEMO_LEARNER)
    try {
      localStorage.removeItem('lania.diagnostic.progress.v1')
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(() => ({ learner, update, resetDemo }), [learner, update, resetDemo])
  return <LearnerContext.Provider value={value}>{children}</LearnerContext.Provider>
}

export function useLearner() {
  const ctx = useContext(LearnerContext)
  if (!ctx) throw new Error('useLearner must be used inside LearnerProvider')
  return ctx
}
