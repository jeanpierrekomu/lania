import { useMemo, useRef, useState } from 'react'
import { ArrowRight, Columns2, Eraser, FileText, History, RefreshCw, Send, Sparkles } from 'lucide-react'
import { cn } from '@/ui/lib/cn'
import { useSearchParams } from '@/ui/router'
import { applyIssue, countWords, type Issue } from '@/ui/lib/writingCheck'
import { diffWords } from '@/ui/lib/diff'
import { Lania } from '@/ui/components/illustrations/Lania'
import { Badge } from '@/ui/components/ui/Badge'
import { Button } from '@/ui/components/ui/Button'
import { Card } from '@/ui/components/ui/Card'
import { Select, TextArea } from '@/ui/components/ui/Field'
import { ProgressBar, StepProgress } from '@/ui/components/ui/Progress'
import { FeedbackBanner } from '@/ui/components/exercise/FeedbackBanner'
import { PageContainer } from '@/ui/components/layout/PageHeader'
import { ErrorState, LoadingState } from '@/components/ui/states'
import type { Schemas } from '@/lib/api/client'
import { useSubmitWriting, useWritingHistory, useWritingPrompts } from '@/lib/api/queries'
import { usePreferences } from '@/ui/state/preferences'
import { HighlightedText, IssueCard, Requirement } from './writing/WritingParts'

type Phase = 'draft' | 'review' | 'rewrite' | 'compare'
type Submission = Schemas['WritingSubmissionOut']
type Feedback = Schemas['WritingFeedbackOut']
const PHASES = ['Borrador', 'Corrección', 'Reescritura', 'Comparación']

const TOPIC_LABEL: Record<string, string> = {
  cotidiano: 'Día a día',
  entrevistas: 'Entrevistas y trabajo',
  viajes: 'Viajes',
  estudios: 'Estudios',
  negocios: 'Negocios',
  entretenimiento: 'Series y cine',
}

const CRITERIA: { key: string; label: string }[] = [
  { key: 'task_fulfillment', label: 'Cumple la tarea' },
  { key: 'accuracy', label: 'Precisión' },
  { key: 'coherence', label: 'Orden y conectores' },
  { key: 'range', label: 'Variedad' },
]

const HINT_BY_TYPE: Record<string, string> = {
  grammar: 'Revisa la forma del verbo o la estructura de la frase.',
  vocabulary: 'Hay una palabra que en inglés se dice distinto.',
  spelling: 'Revisa cómo se escribe esta palabra.',
  word_order: 'Prueba a cambiar el orden de las palabras.',
  punctuation: 'Revisa la puntuación.',
}

/** Errores de la IA (citan tu texto literal) → marcas sobre el texto, en orden y sin solaparse. */
function toIssues(text: string, feedback: Feedback): Issue[] {
  const out: Issue[] = []
  let from = 0
  const sorted = [...feedback.errors]
    .map((e) => ({ e, at: text.indexOf(e.span) }))
    .filter((x) => x.at >= 0)
    .sort((a, b) => a.at - b.at)
  sorted.forEach(({ e, at }, i) => {
    if (at < from) return
    out.push({
      id: `w${i}`,
      start: at,
      end: at + e.span.length,
      original: e.span,
      suggestion: e.minimal_correction,
      category: e.type === 'vocabulary' || e.type === 'spelling' ? 'Vocabulario' : 'Gramática',
      title: e.span,
      explanation: e.explanation_es,
      hint: HINT_BY_TYPE[e.type] ?? 'Fíjate en esta parte.',
    })
    from = at + e.span.length
  })
  return out
}

function newKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}

/** H · Writing Lab — escribe, Lania corrige con rúbrica, reescribes y comparas. */
export function WritingLab() {
  const { prefs } = usePreferences()
  const prompts = useWritingPrompts()
  const historyQ = useWritingHistory()
  const submit = useSubmitWriting()
  const [params] = useSearchParams()
  const [promptId, setPromptId] = useState<string | null>(params.get('consigna'))
  const [text, setText] = useState('')
  const [first, setFirst] = useState<Submission | null>(null)
  const [latest, setLatest] = useState<Submission | null>(null)
  const [phase, setPhase] = useState<Phase>('draft')
  const [active, setActive] = useState<string | undefined>()
  const editor = useRef<HTMLTextAreaElement>(null)

  const list = prompts.data ?? []
  const prompt = list.find((p) => p.id === promptId) ?? list[0]
  const words = countWords(text)
  const inRange = prompt ? words >= prompt.min_words && words <= prompt.max_words : false

  const feedback = latest?.feedback
  const issues = useMemo(() => (latest && feedback ? toIssues(latest.feedback.your_text, feedback) : []), [latest, feedback])

  const send = () => {
    if (!prompt) return
    submit.mutate(
      { exercise_id: prompt.id, client_submission_id: newKey(), text },
      {
        onSuccess: (res) => {
          setLatest(res)
          if (!first) setFirst(res)
          setActive(undefined)
          setPhase('review')
        },
      },
    )
  }

  const selfFix = (iss?: Issue) => {
    if (latest) setText(latest.feedback.your_text)
    setPhase('rewrite')
    requestAnimationFrame(() => {
      const el = editor.current
      if (!el) return
      el.focus()
      if (iss) el.setSelectionRange(iss.start, iss.end)
    })
  }

  const apply = (iss: Issue) => {
    if (!latest) return
    setText(applyIssue(latest.feedback.your_text, iss))
    setPhase('rewrite')
  }

  const changePrompt = (id: string) => {
    setPromptId(id)
    setText('')
    setFirst(null)
    setLatest(null)
    setPhase('draft')
    submit.reset()
  }

  const laniaLine =
    phase === 'draft'
      ? 'Escribe sin miedo y como te salga. Cuando lo envíes, lo corrijo con la misma rúbrica que usa una profesora.'
      : phase === 'review'
        ? feedback?.status === 'graded'
          ? issues.length
            ? `Encontré ${issues.length} ${issues.length === 1 ? 'detalle' : 'detalles'}. Intenta corregirlos tú primero; la pista te orienta.`
            : '¡Muy bien! No encontré errores importantes. Mira la versión más natural para ganar vocabulario.'
          : 'Guardé tu texto, pero esta vez no pude corregirlo con confianza. Lo revisará una persona.'
        : phase === 'rewrite'
          ? 'Cambia lo que quieras y vuelve a enviarlo. Comparamos las dos versiones.'
          : 'Mira tu evolución: la misma idea, más clara.'

  const diff = useMemo(
    () => (phase === 'compare' && first && latest ? diffWords(first.feedback.your_text, latest.feedback.your_text) : []),
    [phase, first, latest],
  )

  if (prompts.isPending) {
    return (
      <PageContainer className="max-w-5xl">
        <LoadingState label="Preparando tus consignas…" />
      </PageContainer>
    )
  }
  if (prompts.isError || !prompt) {
    return (
      <PageContainer className="max-w-5xl">
        <ErrorState message="No pudimos cargar las consignas de escritura." onRetry={() => void prompts.refetch()} />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="max-w-5xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-mint-700">Writing Lab</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-[-0.015em] text-ink sm:text-3xl">
            {TOPIC_LABEL[prompt.topic] ?? 'Escritura libre'}
          </h1>
        </div>
        <div className="w-full sm:w-80">
          <Select
            aria-label="Consigna de escritura"
            value={prompt.id}
            onChange={(e) => changePrompt(e.target.value)}
            options={list.map((p) => ({
              value: p.id,
              label: `${TOPIC_LABEL[p.topic] ?? p.topic} · ${p.cefr ?? ''} · ${p.task_en.slice(0, 40)}…`,
            }))}
          />
        </div>
      </header>

      <div className={cn('mt-5 rounded-3xl bg-mint-50 p-5 ring-1 ring-mint-100', prefs.focusMode && phase !== 'draft' && 'hidden')}>
        <p className="flex items-center gap-2 text-sm font-bold text-mint-800">
          <FileText size={16} aria-hidden /> Tu tarea {prompt.cefr && <Badge tone="mint">{prompt.cefr}</Badge>}
        </p>
        <p className="reading mt-1 font-semibold text-ink" lang="en">
          {prompt.task_en}
        </p>
        <p className="mt-1 text-sm text-ink-soft">{prompt.instruction_es}</p>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Requisitos">
          <Requirement ok={inRange}>
            {prompt.min_words}–{prompt.max_words} palabras
          </Requirement>
        </ul>
      </div>

      <StepProgress steps={PHASES} current={(['draft', 'review', 'rewrite', 'compare'] as Phase[]).indexOf(phase)} className="mt-6" />

      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-surface p-3 ring-1 ring-line">
        <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-violet-100">
          <Lania crop="head" expression={phase === 'compare' ? 'celebrating' : phase === 'review' ? 'explaining' : 'neutral'} animated={false} />
        </span>
        <p className="min-w-0 flex-1 text-sm text-ink" aria-live="polite">
          <span className="font-bold text-violet-700">Lania: </span>
          {laniaLine}
        </p>
      </div>

      {(phase === 'draft' || phase === 'rewrite') && (
        <Card padding="none" className="mt-5 overflow-hidden">
          <TextArea
            ref={editor}
            aria-label="Editor de texto"
            lang="en"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Empieza a escribir en inglés…"
            spellCheck={false}
            maxLength={3000}
            className="reading min-h-[22rem] resize-none rounded-none border-0 bg-transparent p-6 text-lg shadow-none ring-0 focus:ring-0 sm:p-8"
          />
          <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3.5">
            <div className="w-40">
              <ProgressBar
                value={Math.min(words, prompt.max_words)}
                max={prompt.max_words}
                label={`${words} palabras`}
                size="xs"
                barClassName={inRange ? 'bg-mint-600' : words > prompt.max_words ? 'bg-coral-500' : 'bg-violet-500'}
              />
            </div>
            <p className={cn('text-sm font-semibold', inRange ? 'text-mint-700' : 'text-ink-soft')} aria-live="polite">
              {words} palabras · objetivo {prompt.min_words}–{prompt.max_words}
            </p>
            <span className="flex-1" />
            {phase === 'draft' && text && (
              <Button variant="ghost" size="sm" icon={Eraser} onClick={() => setText('')}>
                Empezar de cero
              </Button>
            )}
            <Button icon={Send} onClick={send} disabled={words < 5 || submit.isPending}>
              {submit.isPending ? 'Lania está corrigiendo…' : phase === 'draft' ? 'Enviar a Lania' : 'Enviar nueva versión'}
            </Button>
          </div>
          {submit.isError && (
            <div className="border-t border-line p-4">
              <ErrorState message={submit.error.message} />
            </div>
          )}
        </Card>
      )}

      {phase === 'review' && latest && feedback && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card padding="lg">
            {feedback.status === 'graded' && feedback.criteria ? (
              <dl className="mb-5 grid grid-cols-2 gap-3 2xl:grid-cols-4">
                {CRITERIA.map((c) => {
                  const v = feedback.criteria?.[c.key]
                  const score = typeof v?.score === 'number' ? v.score : 0
                  return (
                    <div key={c.key} className="rounded-2xl bg-mist p-3" title={typeof v?.comment_es === 'string' ? v.comment_es : undefined}>
                      <dt className="text-xs font-bold text-ink-soft">{c.label}</dt>
                      <dd className="mt-1 font-display text-xl font-extrabold text-ink">{score} / 3</dd>
                    </div>
                  )
                })}
              </dl>
            ) : (
              <FeedbackBanner kind="info" title="Queda para revisión" className="mb-5">
                {feedback.feedback_es}
              </FeedbackBanner>
            )}
            <HighlightedText
              text={latest.feedback.your_text}
              issues={issues}
              active={active}
              onPick={(id) => {
                setActive(id)
                document.getElementById(`issue-${id}`)?.scrollIntoView({ behavior: prefs.motion === 'reduce' ? 'auto' : 'smooth', block: 'nearest' })
              }}
            />
            {feedback.status === 'graded' && (
              <p className="mt-5 rounded-2xl bg-mint-50 p-4 text-sm text-ink">
                <span className="font-bold text-mint-800">Lo que hiciste bien: </span>
                {feedback.feedback_es}
              </p>
            )}
            {feedback.natural_version_en && (
              <details className="mt-4 rounded-2xl bg-violet-50 p-4">
                <summary className="cursor-pointer text-sm font-bold text-violet-700">Ver una versión más natural</summary>
                <p className="reading mt-2 whitespace-pre-wrap text-ink" lang="en">
                  {feedback.natural_version_en}
                </p>
              </details>
            )}
            {feedback.notes_es.length > 0 && (
              <ul className="mt-4 space-y-1 text-xs text-ink-soft">
                {feedback.notes_es.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
              <Button variant="secondary" icon={RefreshCw} onClick={() => selfFix()}>
                Reescribir
              </Button>
              {first && first.attempt_id !== latest.attempt_id && (
                <Button iconRight={ArrowRight} icon={Columns2} onClick={() => setPhase('compare')}>
                  Comparar versiones
                </Button>
              )}
            </div>
            {feedback.status === 'graded' && issues.length === 0 && (
              <FeedbackBanner kind="correct" title="¡Texto pulido!" className="mt-5">
                No quedan detalles importantes. Prueba otra consigna o sube un poco el reto.
              </FeedbackBanner>
            )}
          </Card>
          <aside aria-label="Correcciones">
            {issues.length === 0 ? (
              <Card padding="md" className="text-sm text-ink-soft">
                <Sparkles size={18} className="mb-2 text-mint-600" aria-hidden />
                Sin correcciones puntuales en este texto.
              </Card>
            ) : (
              <ol className="space-y-3">
                {issues.map((iss, i) => (
                  <IssueCard
                    key={iss.id}
                    issue={iss}
                    index={i}
                    active={active === iss.id}
                    onFocus={() => setActive(iss.id)}
                    onApply={() => apply(iss)}
                    onSelf={() => selfFix(iss)}
                  />
                ))}
              </ol>
            )}
          </aside>
        </div>
      )}

      {phase === 'compare' && first && latest && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card padding="lg">
              <p className="mb-4 text-sm font-bold text-ink-soft">Primera versión · {first.feedback.errors.length} detalles</p>
              <div className="reading whitespace-pre-wrap text-ink" lang="en">
                {diff.map((p, i) =>
                  p.type === 'add' ? null : (
                    <span key={i} className={cn(p.type === 'del' && 'rounded bg-danger-50 text-danger-700 line-through decoration-danger-600')}>
                      {p.text}
                    </span>
                  ),
                )}
              </div>
            </Card>
            <Card padding="lg" className="ring-2 ring-mint-200">
              <p className="mb-4 text-sm font-bold text-mint-700">Versión nueva · {latest.feedback.errors.length} detalles</p>
              <div className="reading whitespace-pre-wrap text-ink" lang="en">
                {diff.map((p, i) =>
                  p.type === 'del' ? null : (
                    <span key={i} className={cn(p.type === 'add' && 'rounded bg-mint-100 font-semibold text-mint-800')}>
                      {p.text}
                    </span>
                  ),
                )}
              </div>
            </Card>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => selfFix()}>
              Seguir editando
            </Button>
            <Button
              variant="secondary"
              onClick={() => changePrompt(list[(list.findIndex((p) => p.id === prompt.id) + 1) % list.length].id)}
            >
              Otra consigna
            </Button>
          </div>
        </div>
      )}

      <section aria-labelledby="writing-history" className="mt-10">
        <h2 id="writing-history" className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <History size={18} aria-hidden /> Tus textos
        </h2>
        {historyQ.data && historyQ.data.length > 0 ? (
          <ul className="mt-3 divide-y divide-line rounded-3xl bg-surface ring-1 ring-line">
            {historyQ.data.map((h) => (
              <li key={h.attempt_id}>
                <button
                  type="button"
                  className="flex w-full flex-wrap items-center gap-3 px-5 py-3.5 text-left hover:bg-mist"
                  onClick={() => {
                    setPromptId(h.prompt.id)
                    setFirst(h)
                    setLatest(h)
                    setText(h.feedback.your_text)
                    setPhase('review')
                    window.scrollTo({ top: 0, behavior: prefs.motion === 'reduce' ? 'auto' : 'smooth' })
                  }}
                >
                  <span className="w-20 shrink-0 text-xs font-bold uppercase text-ink-soft">
                    {new Date(h.submitted_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink" lang="en">
                    {h.feedback.your_text}
                  </span>
                  <Badge tone={h.feedback.status === 'graded' ? 'mint' : 'amber'}>
                    {h.feedback.status === 'graded' ? `${h.feedback.errors.length} detalles` : 'En revisión'}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">Cuando envíes tu primer texto, aparecerá aquí para que veas tu evolución.</p>
        )}
      </section>
    </PageContainer>
  )
}
