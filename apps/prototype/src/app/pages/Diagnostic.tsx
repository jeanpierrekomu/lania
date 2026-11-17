import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ArrowRight, BookOpen, Clock, Headphones, Mic, Pause, PenLine, Play, Puzzle, RotateCcw, ShieldCheck } from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { Logo } from '@/app/components/brand/Logo'
import { Lania } from '@/app/components/illustrations/Lania'
import { Badge } from '@/app/components/ui/Badge'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { TextArea } from '@/app/components/ui/Field'
import { Modal } from '@/app/components/ui/Modal'
import { StepProgress } from '@/app/components/ui/Progress'
import { Eyebrow, Heading } from '@/app/components/ui/Typography'
import { AudioClip } from '@/app/components/exercise/AudioClip'
import { ChoiceOption } from '@/app/components/exercise/ChoiceOption'
import { RecordingCard } from '@/app/components/exercise/RecordingCard'
import { DIAG_QUESTIONS, DIAG_SECTIONS, LEVEL_CAN_DO, type DiagQuestion } from '@/app/data/diagnostic'
import { SKILL_BY_ID, TONE_CLASSES, type SkillId } from '@/app/data/skills'
import { useLearner, type Cefr, type Confidence, type DiagnosticResult } from '@/app/state/learner'

interface Answer {
  choice?: number
  text?: string
  seconds?: number | null
  skipped?: boolean
}

interface Progress {
  index: number
  answers: Record<string, Answer>
}

const KEY = 'lania.diagnostic.progress.v1'
const ORDER: Cefr[] = ['A1', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1']
const SECTION_ICON = { grammar: Puzzle, listening: Headphones, reading: BookOpen, writing: PenLine, speaking: Mic }

function loadProgress(): Progress | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Progress) : null
  } catch {
    return null
  }
}

const words = (t = '') => t.trim().split(/\s+/).filter(Boolean).length

function correctIn(section: SkillId, answers: Record<string, Answer>) {
  const qs = DIAG_QUESTIONS.filter((q) => q.section === section && 'answer' in q)
  const ok = qs.filter((q) => 'answer' in q && answers[q.id]?.choice === q.answer).length
  return { ok, total: qs.length }
}

/** Rough, transparent estimate from a 10-question sample. */
function computeResult(answers: Record<string, Answer>): DiagnosticResult {
  const g = correctIn('grammar', answers)
  const l = correctIn('listening', answers)
  const r = correctIn('reading', answers)
  const text = answers.w1?.text ?? ''
  const past = /\b(went|was|were|did|had|saw|watched|played|visited|ate|studied|worked|stayed|met|made)\b/i.test(text)
  const recs = ['s1', 's2'].filter((id) => (answers[id]?.seconds ?? 0) > 0).length
  const conf = (n: number): Confidence => (n >= 3 ? 'media' : 'baja')
  const skills: DiagnosticResult['skills'] = {
    grammar: { level: (['A2', 'A2+', 'B1', 'B1+'] as Cefr[])[g.ok], confidence: conf(g.total), evidence: `${g.ok} de ${g.total} respuestas correctas` },
    listening: { level: (['A2', 'A2+', 'B1'] as Cefr[])[l.ok], confidence: 'baja', evidence: `${l.ok} de ${l.total} audios comprendidos` },
    reading: { level: (['A2', 'B1', 'B1+'] as Cefr[])[r.ok], confidence: 'baja', evidence: `${r.ok} de ${r.total} preguntas de lectura` },
    writing: {
      level: words(text) >= 25 && past ? 'B1' : words(text) >= 12 ? 'A2+' : 'A2',
      confidence: words(text) ? 'media' : 'baja',
      evidence: words(text) ? `Texto de ${words(text)} palabras${past ? ' con pasado' : ''}` : 'Sin texto: estimación provisional',
    },
    speaking: {
      level: recs === 2 ? 'B1' : recs === 1 ? 'A2+' : 'A2',
      confidence: recs ? 'media' : 'baja',
      evidence: recs ? `${recs} ${recs === 1 ? 'grabación' : 'grabaciones'} · se confirmará al conversar` : 'Sin grabaciones: lo veremos al conversar',
    },
  }
  const idx = Object.values(skills)
    .map((s) => ORDER.indexOf(s.level))
    .sort((a, b) => a - b)
  return { completedAt: new Date().toISOString().slice(0, 10), overall: ORDER[idx[2]], skills }
}

function QuestionBody({ q, answer, set }: { q: DiagQuestion; answer: Answer; set: (a: Answer) => void }) {
  const options = 'options' in q ? q.options : []
  const choiceList = (
    <div role="radiogroup" aria-label="Opciones de respuesta" className="grid gap-3">
      {options.map((o, i) => (
        <ChoiceOption key={o} letter={String.fromCharCode(65 + i)} label={o} state={answer.choice === i ? 'selected' : 'idle'} onSelect={() => set({ choice: i })} />
      ))}
    </div>
  )
  switch (q.kind) {
    case 'choice':
      return (
        <div className="space-y-6">
          <p className="rounded-3xl bg-mist px-6 py-5 text-center font-display text-2xl font-bold text-ink sm:text-3xl">{q.sentence}</p>
          {choiceList}
        </div>
      )
    case 'listen':
      return (
        <div className="space-y-6">
          <AudioClip text={q.audio} title="Audio del ejercicio" />
          {choiceList}
        </div>
      )
    case 'read':
      return (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card variant="soft" padding="md" className="reading text-base text-ink lg:text-lg">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-violet-700">Lectura</p>
            {q.passage}
          </Card>
          {choiceList}
        </div>
      )
    case 'write': {
      const n = words(answer.text)
      return (
        <div className="space-y-3">
          <TextArea
            aria-label={q.prompt}
            placeholder={q.placeholder}
            value={answer.text ?? ''}
            onChange={(e) => set({ text: e.target.value })}
            className="min-h-44 text-lg"
            spellCheck={false}
          />
          <p className={cn('text-sm font-semibold', n >= q.minWords ? 'text-mint-700' : 'text-ink-soft')} aria-live="polite">
            {n} palabras · sugerimos al menos {q.minWords}
          </p>
        </div>
      )
    }
    case 'speak':
      return (
        <div className="space-y-5">
          {q.readAloud && <p className="rounded-3xl bg-mist px-6 py-5 text-center font-display text-2xl font-bold text-ink">“{q.readAloud}”</p>}
          <RecordingCard key={q.id} maxSeconds={q.seconds} onChange={(s) => set({ seconds: s })} />
        </div>
      )
  }
}

export function Diagnostic() {
  const navigate = useNavigate()
  const { update } = useLearner()
  const [params] = useSearchParams()
  const jump = Number(params.get('pregunta')) || 0
  const saved = useMemo(loadProgress, [])
  const [phase, setPhase] = useState<'intro' | 'resume' | 'question' | 'results'>(
    jump ? 'question' : saved && saved.index > 0 ? 'resume' : 'intro',
  )
  const [progress, setProgress] = useState<Progress>(
    jump ? { index: Math.min(jump, DIAG_QUESTIONS.length) - 1, answers: saved?.answers ?? {} } : (saved ?? { index: 0, answers: {} }),
  )
  const [paused, setPaused] = useState(false)
  const [result, setResult] = useState<DiagnosticResult | null>(null)

  const q = DIAG_QUESTIONS[progress.index]
  const answer = progress.answers[q?.id] ?? {}
  const sectionIndex = DIAG_SECTIONS.findIndex((s) => s.id === q?.section)
  const firstOfSection = DIAG_QUESTIONS.findIndex((x) => x.section === q?.section) === progress.index

  useEffect(() => {
    if (phase !== 'question') return
    try {
      localStorage.setItem(KEY, JSON.stringify(progress))
    } catch {
      /* ignore */
    }
  }, [progress, phase])

  const answered =
    q &&
    ((q.kind === 'write' && words(answer.text) > 0) ||
      (q.kind === 'speak' && (answer.seconds ?? 0) > 0) ||
      ('options' in q && answer.choice !== undefined))

  const goNext = (patch?: Answer) => {
    const answers = patch ? { ...progress.answers, [q.id]: patch } : progress.answers
    if (progress.index === DIAG_QUESTIONS.length - 1) {
      const r = computeResult(answers)
      setResult(r)
      update({ diagnostic: r })
      localStorage.removeItem(KEY)
      setPhase('results')
      return
    }
    setProgress({ index: progress.index + 1, answers })
  }

  const restart = () => {
    localStorage.removeItem(KEY)
    setProgress({ index: 0, answers: {} })
    setPhase('question')
  }

  const minutesLeft = Math.max(1, Math.round((DIAG_QUESTIONS.length - progress.index) * 1.2))

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3 sm:gap-6 sm:px-8 sm:py-4">
          <Logo size="sm" />
          {phase === 'question' ? (
            <>
              <div className="min-w-0 flex-1">
                <StepProgress steps={DIAG_SECTIONS.map((s) => s.label)} current={sectionIndex} />
              </div>
              <Button variant="secondary" size="sm" icon={Pause} onClick={() => setPaused(true)}>
                Pausar
              </Button>
            </>
          ) : (
            <span className="flex-1" />
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-8 sm:px-8 sm:py-12">
        {phase === 'intro' && (
          <div className="animate-fade-up text-center">
            <div className="mx-auto h-36 w-36 overflow-hidden rounded-full bg-violet-100">
              <Lania crop="head" expression="welcome" />
            </div>
            <Eyebrow className="mt-6">Diagnóstico de inglés</Eyebrow>
            <Heading level={1} size="lg" className="mt-2">
              Descubramos tu punto de partida
            </Heading>
            <p className="mx-auto mt-3 max-w-lg text-lg text-ink-soft">10 preguntas, una a la vez, sobre las 5 habilidades. No cuenta como examen: me ayuda a preparar tus clases.</p>
            <ul className="mx-auto mt-8 grid max-w-lg gap-3 text-left sm:grid-cols-2">
              {[
                { icon: Clock, t: 'Unos 12 minutos' },
                { icon: Pause, t: 'Puedes pausar y seguir después' },
                { icon: ShieldCheck, t: '“No lo sé” es una respuesta válida' },
                { icon: Mic, t: 'Micrófono para 2 preguntas (opcional)' },
              ].map((x) => (
                <li key={x.t} className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 text-sm font-semibold text-ink ring-1 ring-line">
                  <x.icon size={18} className="shrink-0 text-violet-600" aria-hidden />
                  {x.t}
                </li>
              ))}
            </ul>
            <Button size="lg" className="mt-10" iconRight={ArrowRight} onClick={() => setPhase('question')}>
              Empezar diagnóstico
            </Button>
          </div>
        )}

        {phase === 'resume' && (
          <Card padding="lg" className="animate-fade-up text-center">
            <div className="mx-auto h-24 w-24 overflow-hidden rounded-full bg-violet-100">
              <Lania crop="head" expression="listening" />
            </div>
            <Heading level={1} size="md" className="mt-4">
              ¿Continuamos donde lo dejaste?
            </Heading>
            <p className="mt-2 text-ink-soft">
              Ibas en la pregunta {progress.index + 1} de {DIAG_QUESTIONS.length}. Tus respuestas están guardadas en este dispositivo.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" icon={Play} onClick={() => setPhase('question')}>
                Continuar
              </Button>
              <Button size="lg" variant="ghost" icon={RotateCcw} onClick={restart}>
                Empezar de nuevo
              </Button>
            </div>
          </Card>
        )}

        {phase === 'question' && q && (
          <div key={q.id} className="flex flex-1 animate-fade-up flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge tone="violet" size="md" icon={SECTION_ICON[q.section]}>
                {DIAG_SECTIONS[sectionIndex].label}
              </Badge>
              <p className="text-sm font-semibold text-ink-soft">
                Pregunta {progress.index + 1} de {DIAG_QUESTIONS.length} · ≈ {minutesLeft} min
              </p>
            </div>
            {firstOfSection && (
              <div className="mt-5 flex items-center gap-3 text-sm text-ink-soft">
                <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-violet-100">
                  <Lania crop="head" expression="explaining" animated={false} />
                </span>
                <p>{DIAG_SECTIONS[sectionIndex].tip}</p>
              </div>
            )}
            <Heading level={1} size="md" className="mt-6">
              {q.prompt}
            </Heading>
            <div className="mt-6">
              <QuestionBody q={q} answer={answer} set={(a) => setProgress((p) => ({ ...p, answers: { ...p.answers, [q.id]: a } }))} />
            </div>
            <div className="mt-auto flex items-center justify-between gap-3 pt-10">
              <Button variant="ghost" onClick={() => goNext({ skipped: true })}>
                {q.kind === 'speak' ? 'Omitir (sin micrófono)' : 'No lo sé'}
              </Button>
              <Button size="lg" iconRight={ArrowRight} disabled={!answered} onClick={() => goNext()}>
                {progress.index === DIAG_QUESTIONS.length - 1 ? 'Ver resultados' : 'Siguiente'}
              </Button>
            </div>
          </div>
        )}

        {phase === 'results' && result && (
          <div className="animate-fade-up">
            <div className="flex flex-col items-center text-center">
              <div className="h-32 w-32 overflow-hidden rounded-full bg-violet-100">
                <Lania crop="head" expression="celebrating" />
              </div>
              <Eyebrow className="mt-5">Tu punto de partida</Eyebrow>
              <Heading level={1} size="xl" className="mt-2">
                Nivel estimado {result.overall}
              </Heading>
              <p className="mt-3 max-w-xl text-ink-soft">
                {LEVEL_CAN_DO[result.overall]} Es una estimación con 10 preguntas, no una certificación: la afinaremos con tus primeras clases.
              </p>
            </div>
            <ul className="mt-10 space-y-3">
              {DIAG_SECTIONS.map((sec) => {
                const s = SKILL_BY_ID[sec.id]
                const est = result.skills[sec.id]
                const t = TONE_CLASSES[s.tone]
                return (
                  <li key={sec.id} className="flex flex-wrap items-center gap-4 rounded-3xl bg-surface p-4 ring-1 ring-line sm:flex-nowrap sm:p-5">
                    <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', t.soft, t.fg)}>
                      <s.icon size={22} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-ink">{s.label}</p>
                      <p className="text-sm text-ink-soft">{LEVEL_CAN_DO[est.level]}</p>
                      <p className="mt-1 text-xs text-ink-soft">Evidencia: {est.evidence}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={est.confidence === 'baja' ? 'amber' : 'mint'}>Confianza {est.confidence}</Badge>
                      <span className="grid h-12 min-w-14 place-items-center rounded-2xl bg-ink px-3 font-display text-lg font-extrabold text-white">{est.level}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" iconRight={ArrowRight} onClick={() => navigate('/app')}>
                Ver mi plan
              </Button>
              <Button size="lg" variant="ghost" icon={RotateCcw} onClick={restart}>
                Repetir diagnóstico
              </Button>
            </div>
          </div>
        )}
      </main>

      <Modal
        open={paused}
        onClose={() => setPaused(false)}
        title="Diagnóstico en pausa"
        description="Tu progreso está guardado en este dispositivo. Puedes continuar ahora o cuando quieras."
        size="sm"
        icon={
          <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-violet-100">
            <Lania crop="head" expression="listening" animated={false} />
          </span>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => navigate('/app')}>
              Guardar y salir
            </Button>
            <Button icon={Play} onClick={() => setPaused(false)}>
              Continuar ahora
            </Button>
          </>
        }
      >
        <p className="rounded-2xl bg-mist p-4 text-sm text-ink-soft">
          Llevas {progress.index} de {DIAG_QUESTIONS.length} preguntas. Al volver, retomarás en la pregunta {progress.index + 1}.
        </p>
      </Modal>
    </div>
  )
}
