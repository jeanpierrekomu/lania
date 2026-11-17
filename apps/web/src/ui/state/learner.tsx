import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { SkillId } from '@/ui/data/skills'
import { api, unwrap, type Schemas } from '@/lib/api/client'
import { keys, keys2 } from '@/lib/api/queries'
import { useSession } from '@/lib/auth/session'

export type TeacherStyle = 'divertida' | 'tranquila' | 'exigente'
export type Cefr = 'Pre-A1' | 'A1' | 'A2' | 'A2+' | 'B1' | 'B1+' | 'B2' | 'B2+' | 'C1'
export type Confidence = 'baja' | 'media' | 'alta'

export interface SkillEstimate {
  level: Cefr
  confidence: Confidence
  evidence: string
}

/** Resultado del último diagnóstico completado. Solo trae las habilidades que el diagnóstico midió de verdad. */
export interface DiagnosticResult {
  completedAt: string
  overall: Cefr
  skills: Partial<Record<SkillId, SkillEstimate>>
}

export interface Learner {
  name: string
  goal: string
  selfLevel: string
  interests: string[]
  sessionMinutes: 5 | 15 | 30
  teacherStyle: TeacherStyle
  onboarded: boolean
  /** null mientras no haya un diagnóstico completado. */
  diagnostic: DiagnosticResult | null
}

const STYLE_BY_PERSONA: Record<string, TeacherStyle> = { fun: 'divertida', calm: 'tranquila', coach: 'exigente' }
const LEVEL_BY_BAND: Record<string, Cefr | undefined> = { below_a1: 'Pre-A1', a1: 'A1', a2: 'A2' }
const ORDER: Cefr[] = ['Pre-A1', 'A1', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1']
const CONFIDENCE: Record<string, Confidence> = { low: 'baja', medium: 'media', high: 'alta' }
// El diagnóstico agrupa vocabulario con gramática en el mapa de habilidades del diseño.
const SKILL_BY_DOMAIN: Record<string, SkillId | undefined> = {
  grammar: 'grammar',
  vocabulary: 'grammar',
  reading: 'reading',
  writing: 'writing',
  listening: 'listening',
  speaking: 'speaking',
}

function median(levels: Cefr[]): Cefr {
  const sorted = [...levels].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
  return sorted[Math.floor((sorted.length - 1) / 2)]
}

/** Traduce el informe del diagnóstico (bandas por sección) al resumen por habilidad del diseño. */
export function toDiagnosticResult(report: Schemas['DiagnosticReportOut']): DiagnosticResult | null {
  const bySkill = new Map<SkillId, { levels: Cefr[]; confidence: Confidence[]; evidence: number }>()
  for (const sec of report.sections) {
    const skill = SKILL_BY_DOMAIN[sec.domain]
    const level = LEVEL_BY_BAND[sec.band]
    if (!skill || !level) continue
    const acc = bySkill.get(skill) ?? { levels: [], confidence: [], evidence: 0 }
    acc.levels.push(level)
    acc.confidence.push(CONFIDENCE[sec.confidence] ?? 'baja')
    acc.evidence += sec.evidence_count
    bySkill.set(skill, acc)
  }
  if (!bySkill.size) return null
  const skills: Partial<Record<SkillId, SkillEstimate>> = {}
  for (const [skill, acc] of bySkill) {
    const lowest = (['baja', 'media', 'alta'] as const).find((c) => acc.confidence.includes(c)) ?? 'baja'
    skills[skill] = { level: median(acc.levels), confidence: lowest, evidence: `Diagnóstico · ${acc.evidence} respuestas` }
  }
  return {
    completedAt: report.completed_at,
    overall: median([...bySkill.values()].flatMap((a) => a.levels)),
    skills,
  }
}

interface LearnerContextValue {
  learner: Learner
  /** true cuando ya se leyó la cuenta del servidor (antes de eso los valores son provisionales). */
  ready: boolean
  /** Cambios solo en pantalla (prototipo). Lo que debe guardarse va por la API (p. ej. useSaveOnboarding). */
  update: (patch: Partial<Learner>) => void
  resetDemo: () => void
}

const LearnerContext = createContext<LearnerContextValue | null>(null)

/** Alumno real: cuenta, bienvenida y último diagnóstico, leídos de la API cuando hay sesión. */
export function LearnerProvider({ children }: { children: ReactNode }) {
  const session = useSession()
  const signedIn = Boolean(session)
  const me = useQuery({ queryKey: keys.me, queryFn: () => unwrap(api.GET('/api/v1/me')), enabled: signedIn })
  const current = useQuery({
    queryKey: keys2.diagnosticCurrent,
    queryFn: () => unwrap(api.GET('/api/v1/diagnostics/current')),
    enabled: signedIn,
    refetchOnWindowFocus: false,
  })
  const runId = current.data?.last_completed_run_id ?? null
  const report = useQuery({
    queryKey: keys2.report(runId ?? ''),
    queryFn: () => unwrap(api.GET('/api/v1/diagnostics/{run_id}/report', { params: { path: { run_id: runId! } } })),
    enabled: signedIn && Boolean(runId),
  })
  const [overrides, setOverrides] = useState<Partial<Learner>>({})

  const learner = useMemo<Learner>(() => {
    const m = me.data
    const o = m?.onboarding
    return {
      name: m?.display_name ?? session?.displayName ?? '',
      goal: o?.goal ?? '',
      selfLevel: o?.self_level ?? '',
      interests: o?.interests ?? [],
      sessionMinutes: (o?.session_minutes as 5 | 15 | 30 | undefined) ?? 15,
      teacherStyle: STYLE_BY_PERSONA[m?.preferences.tutor_persona ?? 'fun'] ?? 'divertida',
      onboarded: Boolean(o),
      diagnostic: report.data ? toDiagnosticResult(report.data) : null,
      ...overrides,
    }
  }, [me.data, session?.displayName, report.data, overrides])

  const update = useCallback((patch: Partial<Learner>) => setOverrides((p) => ({ ...p, ...patch })), [])
  const resetDemo = useCallback(() => {
    setOverrides({})
    try {
      localStorage.removeItem('lania.diagnostic.progress.v1')
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(() => ({ learner, ready: me.isSuccess, update, resetDemo }), [learner, me.isSuccess, update, resetDemo])
  return <LearnerContext.Provider value={value}>{children}</LearnerContext.Provider>
}

export function useLearner() {
  const ctx = useContext(LearnerContext)
  if (!ctx) throw new Error('useLearner must be used inside LearnerProvider')
  return ctx
}
