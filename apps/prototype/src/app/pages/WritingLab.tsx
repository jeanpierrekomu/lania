import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ArrowRight, Columns2, Eraser, FileText, RefreshCw, Sparkles, SpellCheck } from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { applyIssue, checkText, countWords, type Issue } from '@/app/lib/writingCheck'
import { diffWords } from '@/app/lib/diff'
import { Lania } from '@/app/components/illustrations/Lania'
import { Badge } from '@/app/components/ui/Badge'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { TextArea } from '@/app/components/ui/Field'
import { ProgressBar, StepProgress } from '@/app/components/ui/Progress'
import { Select } from '@/app/components/ui/Field'
import { FeedbackBanner } from '@/app/components/exercise/FeedbackBanner'
import { PageContainer } from '@/app/components/layout/PageHeader'
import { usePreferences } from '@/app/state/preferences'
import { HighlightedText, IssueCard, Requirement } from './writing/WritingParts'

const TOPICS = [
  {
    id: 'correo',
    label: 'Correo formal a tu futura jefa',
    prompt: 'Preséntate a Ms. Rivera, tu futura jefa en la pasantía de análisis de datos. Cuenta quién eres, qué hiciste antes y pregunta por los próximos pasos.',
    min: 80,
    max: 120,
    formal: true,
    draft: `Hello Ms. Rivera,

My name is Valentina and I have 23 years. Actually I study industrial engineering in Bogotá and I am interesting in the data analysis internship. Last year I work in a small startup, where I make weekly reports for the sales team. I am agree that good communication is the key of a team. Can you explain me the next steps?

Thank you,
Valentina`,
  },
  {
    id: 'resena',
    label: 'Reseña de tu serie favorita',
    prompt: 'Recomienda una serie a un amigo sin contar el final. Explica de qué trata y por qué te gustó.',
    min: 60,
    max: 100,
    formal: false,
    draft: '',
  },
]

const PAST_VERBS = /\b(went|was|were|did|had|saw|made|worked|studied|lived|visited|played|watched|prepared|finished|organized|started|learned|met)\b/gi

type Phase = 'draft' | 'review' | 'rewrite' | 'compare'
const PHASES = ['Borrador', 'Revisión', 'Reescritura', 'Comparación']

/** H · Writing Lab — distraction-free editor with kind, explainable review. */
export function WritingLab() {
  const { prefs } = usePreferences()
  const [topicId, setTopicId] = useState(TOPICS[0].id)
  const topic = TOPICS.find((t) => t.id === topicId) ?? TOPICS[0]
  const [text, setText] = useState(topic.draft)
  const [v1, setV1] = useState<string | null>(null)
  const [initialCount, setInitialCount] = useState(0)
  const [phase, setPhase] = useState<Phase>('draft')
  const [issues, setIssues] = useState<Issue[]>([])
  const [active, setActive] = useState<string | undefined>()
  const editor = useRef<HTMLTextAreaElement>(null)
  const [params] = useSearchParams()

  const words = countWords(text)
  const live = useMemo(() => (phase === 'rewrite' ? checkText(text) : []), [phase, text])
  const pastCount = (text.match(PAST_VERBS) ?? []).length
  const inRange = words >= topic.min && words <= topic.max

  const review = () => {
    const found = checkText(text)
    if (v1 === null) {
      setV1(text)
      setInitialCount(found.length)
    }
    setIssues(found)
    setActive(found[0]?.id)
    setPhase('review')
  }

  const apply = (iss: Issue) => {
    const next = applyIssue(text, iss)
    setText(next)
    const found = checkText(next)
    setIssues(found)
    setActive(found[0]?.id)
  }

  const selfFix = (iss?: Issue) => {
    setPhase('rewrite')
    requestAnimationFrame(() => {
      const el = editor.current
      if (!el) return
      el.focus()
      if (iss) el.setSelectionRange(iss.start, iss.end)
    })
  }

  const changeTopic = (id: string) => {
    const t = TOPICS.find((x) => x.id === id) ?? TOPICS[0]
    setTopicId(id)
    setText(t.draft)
    setV1(null)
    setIssues([])
    setPhase('draft')
  }

  // Deep link for reviewers: /app/writing?fase=revision
  useEffect(() => {
    if (params.get('fase') === 'revision') review()
  }, [])

  const fixed = Math.max(0, initialCount - (phase === 'rewrite' ? live.length : issues.length))
  const laniaLine =
    phase === 'draft'
      ? 'Escribe sin miedo: nada de esto se califica. Cuando quieras, lo revisamos juntas.'
      : phase === 'review'
        ? issues.length
          ? `Encontré ${issues.length} ${issues.length === 1 ? 'detalle' : 'detalles'}. Intenta primero con la pista; si no, te muestro la corrección.`
          : '¡Sin detalles pendientes! Tu texto se entiende y suena natural.'
        : phase === 'rewrite'
          ? live.length
            ? `Te ${live.length === 1 ? 'queda 1 detalle' : `quedan ${live.length} detalles`}. Vas muy bien.`
            : 'Listo. Revisa de nuevo para confirmar.'
          : 'Mira tu evolución: la misma idea, mucho más clara y profesional.'

  const diff = useMemo(() => (phase === 'compare' && v1 !== null ? diffWords(v1, text) : []), [phase, v1, text])
  const counts = issues.reduce<Record<string, number>>((acc, i) => ({ ...acc, [i.category]: (acc[i.category] ?? 0) + 1 }), {})

  return (
    <PageContainer className="max-w-5xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-mint-700">Writing Lab</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-[-0.015em] text-ink sm:text-3xl">{topic.label}</h1>
        </div>
        <div className="w-full sm:w-72">
          <Select aria-label="Tema de escritura" value={topicId} onChange={(e) => changeTopic(e.target.value)} options={TOPICS.map((t) => ({ value: t.id, label: t.label }))} />
        </div>
      </header>

      <div className={cn('mt-5 rounded-3xl bg-mint-50 p-5 ring-1 ring-mint-100', prefs.focusMode && phase !== 'draft' && 'hidden')}>
        <p className="flex items-center gap-2 text-sm font-bold text-mint-800">
          <FileText size={16} aria-hidden /> Tu tarea
        </p>
        <p className="reading mt-1 text-ink">{topic.prompt}</p>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Requisitos">
          <Requirement ok={inRange}>
            {topic.min}–{topic.max} palabras
          </Requirement>
          {topic.formal && <Requirement ok={/^\s*Dear\b/i.test(text)}>Saludo formal</Requirement>}
          <Requirement ok={pastCount >= 2}>Al menos 2 verbos en pasado</Requirement>
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
        <div className={cn('mt-5 grid gap-5', phase === 'rewrite' && 'lg:grid-cols-[minmax(0,1fr)_18rem]')}>
          <Card padding="none" className="overflow-hidden">
            <TextArea
              ref={editor}
              aria-label="Editor de texto"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Empieza a escribir en inglés…"
              spellCheck={false}
              className="reading min-h-[24rem] resize-none rounded-none border-0 bg-transparent p-6 text-lg shadow-none ring-0 focus:ring-0 sm:p-8"
            />
            <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3.5">
              <div className="w-40">
                <ProgressBar value={Math.min(words, topic.max)} max={topic.max} label={`${words} palabras`} size="xs" barClassName={inRange ? 'bg-mint-600' : words > topic.max ? 'bg-coral-500' : 'bg-violet-500'} />
              </div>
              <p className={cn('text-sm font-semibold', inRange ? 'text-mint-700' : 'text-ink-soft')} aria-live="polite">
                {words} palabras · objetivo {topic.min}–{topic.max}
              </p>
              <span className="flex-1" />
              {phase === 'draft' && text && (
                <Button variant="ghost" size="sm" icon={Eraser} onClick={() => setText('')}>
                  Empezar de cero
                </Button>
              )}
              <Button icon={SpellCheck} onClick={review} disabled={words < 5}>
                {phase === 'draft' ? 'Revisar con Lania' : 'Revisar de nuevo'}
              </Button>
            </div>
          </Card>
          {phase === 'rewrite' && (
            <Card padding="md" as="aside" aria-label="Detalles pendientes" className="h-fit">
              <p className="text-sm font-bold text-ink">Pendientes: {live.length}</p>
              <ProgressBar value={initialCount - live.length} max={Math.max(1, initialCount)} label="Detalles corregidos" barClassName="bg-mint-600" className="mt-2" />
              <ul className="mt-4 space-y-2">
                {live.map((i) => (
                  <li key={i.id} className="rounded-2xl bg-mist p-3 text-sm">
                    <p className="font-semibold text-ink">“{i.original}”</p>
                    <p className="text-ink-soft">{i.hint}</p>
                  </li>
                ))}
                {live.length === 0 && <li className="rounded-2xl bg-mint-50 p-3 text-sm font-semibold text-mint-800">¡Todo corregido por ti!</li>}
              </ul>
            </Card>
          )}
        </div>
      )}

      {phase === 'review' && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card padding="lg">
            <div className="mb-5 flex flex-wrap gap-2">
              {Object.entries(counts).map(([cat, n]) => (
                <Badge key={cat} tone="neutral" size="md">
                  {n} {cat.toLowerCase()}
                </Badge>
              ))}
              {issues.length === 0 && (
                <Badge tone="mint" size="md" icon={Sparkles}>
                  Sin detalles pendientes
                </Badge>
              )}
            </div>
            <HighlightedText
              text={text}
              issues={issues}
              active={active}
              onPick={(id) => {
                setActive(id)
                document.getElementById(`issue-${id}`)?.scrollIntoView({ behavior: prefs.motion === 'reduce' ? 'auto' : 'smooth', block: 'nearest' })
              }}
            />
            <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
              <Button variant="secondary" icon={RefreshCw} onClick={() => selfFix()}>
                Reescribir
              </Button>
              {v1 !== null && v1 !== text && (
                <Button iconRight={ArrowRight} icon={Columns2} onClick={() => setPhase('compare')}>
                  Comparar versiones
                </Button>
              )}
            </div>
            {issues.length === 0 && v1 !== null && v1 !== text && (
              <FeedbackBanner kind="correct" title="¡Texto pulido!" className="mt-5">
                Corregiste {fixed} de {initialCount} detalles. Compara tu primera versión con la nueva.
              </FeedbackBanner>
            )}
          </Card>
          <aside aria-label="Correcciones">
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
          </aside>
        </div>
      )}

      {phase === 'compare' && v1 !== null && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Detalles corregidos', value: `${fixed} de ${initialCount}` },
              { label: 'Palabras', value: `${countWords(v1)} → ${words}` },
              { label: 'Verbos en pasado', value: `${(v1.match(PAST_VERBS) ?? []).length} → ${pastCount}` },
            ].map((s) => (
              <Card key={s.label} padding="sm" variant="outline">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">{s.label}</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-ink">{s.value}</p>
              </Card>
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card padding="lg">
              <p className="mb-4 text-sm font-bold text-ink-soft">Versión inicial</p>
              <div className="reading whitespace-pre-wrap text-ink">
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
              <p className="mb-4 text-sm font-bold text-mint-700">Versión mejorada</p>
              <div className="reading whitespace-pre-wrap text-ink">
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
            <Button variant="ghost" onClick={() => setPhase('rewrite')}>
              Seguir editando
            </Button>
            <Button variant="secondary" onClick={() => changeTopic(topicId === 'correo' ? 'resena' : 'correo')}>
              Nuevo tema
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
