import { useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Eye, Languages, Volume2 } from 'lucide-react'
import { cn } from '@/ui/lib/cn'
import { useSearchParams } from '@/ui/router'
import { useSpeech } from '@/ui/lib/speech'
import { Badge } from '@/ui/components/ui/Badge'
import { Button, IconButton } from '@/ui/components/ui/Button'
import { Card } from '@/ui/components/ui/Card'
import { Segmented } from '@/ui/components/ui/Segmented'
import { Heading } from '@/ui/components/ui/Typography'
import { ChoiceOption, type ChoiceState } from '@/ui/components/exercise/ChoiceOption'
import { FeedbackBanner } from '@/ui/components/exercise/FeedbackBanner'
import { LaniaSays } from '@/ui/components/lania/LaniaSays'
import { PageContainer, PageHeader } from '@/ui/components/layout/PageHeader'
import { ErrorState, LoadingState } from '@/components/ui/states'
import type { Schemas } from '@/lib/api/client'
import { useApiAudio } from '@/lib/api/audio'
import { useReading, useReadings, useSubmitAttempt } from '@/lib/api/queries'
import { usePreferences } from '@/ui/state/preferences'

type ReadingData = Schemas['ReadingOut']
type QuestionData = Schemas['ReadingQuestionOut']
type Level = 'todos' | 'A1' | 'A2' | 'B1'

function newKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Lee en voz alta un audio del catálogo; si no hay voz del servidor, usa la del navegador. */
function useReadAloud(slug: string, serverAudio: boolean) {
  const { prefs } = usePreferences()
  const server = useApiAudio()
  const browser = useSpeech()
  const [serverOk, setServerOk] = useState(serverAudio)
  const play = (what: string, text: string) => {
    browser.stop()
    const fallback = () => browser.speak(text, { lang: 'en', rate: prefs.audioRate })
    if (!serverOk) return fallback()
    void server.play(`/api/v1/reading/texts/${slug}/audio?what=${what}`, {
      rate: prefs.audioRate,
      onError: () => {
        setServerOk(false)
        fallback()
      },
    })
  }
  return { play, serverOk }
}

/** Párrafo con las palabras del glosario resaltadas y tocables. */
function Paragraph({
  text,
  glossary,
  active,
  onWord,
}: {
  text: string
  glossary: Schemas['GlossaryOut'][]
  active: string | null
  onWord: (index: number) => void
}) {
  const parts = useMemo(() => {
    if (!glossary.length) return [text]
    const re = new RegExp(`(${glossary.map((g) => escapeRe(g.en)).join('|')})`, 'gi')
    return text.split(re)
  }, [text, glossary])
  const out: ReactNode[] = parts.map((part, i) => {
    const gi = glossary.findIndex((g) => g.en.toLowerCase() === part.toLowerCase())
    if (gi < 0) return <span key={i}>{part}</span>
    return (
      <button
        key={i}
        type="button"
        onClick={() => onWord(gi)}
        aria-label={`${part}: ver significado`}
        className={cn(
          'rounded-md px-0.5 font-semibold underline decoration-amber-500 decoration-dotted decoration-2 underline-offset-4 hover:bg-amber-100',
          active === glossary[gi].en && 'bg-amber-100 ring-2 ring-amber-400',
        )}
      >
        {part}
      </button>
    )
  })
  return <>{out}</>
}

function Question({ q, index, onShow }: { q: QuestionData; index: number; onShow: (p: number) => void }) {
  const [sel, setSel] = useState<string | null>(null)
  const submit = useSubmitAttempt()
  const result = submit.data?.evaluation
  const right = q.solved && !submit.data ? true : result?.verdict === 'correct'
  const checked = Boolean(result)
  const state = (id: string): ChoiceState => (!checked ? (sel === id ? 'selected' : 'idle') : sel === id ? (right ? 'correct' : 'incorrect') : 'dimmed')
  return (
    <div className="space-y-3">
      <p className="font-bold text-ink" lang="en">
        <span className="mr-2 text-ink-soft">{index + 1}.</span>
        {q.question_en}
        {q.solved && !submit.data && (
          <Badge tone="mint" className="ml-2">
            Ya la acertaste
          </Badge>
        )}
      </p>
      <div role="radiogroup" aria-label={q.question_en} className="grid gap-2">
        {q.options.map((o, i) => (
          <ChoiceOption
            key={o.id}
            letter={String.fromCharCode(65 + i)}
            label={o.text}
            state={state(o.id)}
            disabled={checked && right}
            onSelect={() => {
              setSel(o.id)
              submit.reset()
            }}
          />
        ))}
      </div>
      {!(checked && right) && (
        <Button
          size="sm"
          variant="soft"
          disabled={sel === null || submit.isPending}
          onClick={() => sel && submit.mutate({ exercise_id: q.exercise_id, client_submission_id: newKey(), mode: 'practice', option_id: sel })}
        >
          {submit.isPending ? 'Comprobando…' : 'Comprobar'}
        </Button>
      )}
      {submit.isError && <ErrorState message={submit.error.message} />}
      {result && (
        <FeedbackBanner
          kind={right ? 'correct' : 'almost'}
          title={right ? '¡Bien leído!' : 'Vuelve al texto'}
          actions={
            <Button size="sm" variant="secondary" icon={Eye} onClick={() => onShow(q.paragraph)}>
              Ver en el texto
            </Button>
          }
        >
          {right ? result.explanation_es || result.feedback_es : result.feedback_es}
        </FeedbackBanner>
      )}
    </div>
  )
}

function Reader({ rd, onBack }: { rd: ReadingData; onBack: () => void }) {
  const { prefs } = usePreferences()
  const { play, serverOk } = useReadAloud(rd.slug, rd.server_audio)
  const [word, setWord] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)
  const [showTitle, setShowTitle] = useState(false)
  const solved = rd.questions.filter((q) => q.solved).length
  const show = (p: number) => {
    setFocus(p)
    document.getElementById(`par-${p}`)?.scrollIntoView({ behavior: prefs.motion === 'reduce' ? 'auto' : 'smooth', block: 'center' })
  }
  const w = word !== null ? rd.glossary[word] : null

  return (
    <PageContainer wide>
      <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack}>
        Biblioteca
      </Button>
      <div className="mt-4 grid gap-6 lg:grid-cols-12">
        <article className="min-w-0 lg:col-span-7" aria-labelledby="reading-title">
          <Card padding="lg">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="dark">{rd.level}</Badge>
              <Badge tone="neutral">{rd.kind_es}</Badge>
              <span className="text-sm text-ink-soft">{rd.words} palabras</span>
            </div>
            <Heading level={1} size="lg" id="reading-title" className="mt-3">
              <span lang="en">{rd.title_en}</span>
            </Heading>
            <button type="button" onClick={() => setShowTitle((v) => !v)} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-violet-700 hover:underline">
              <Languages size={14} aria-hidden /> {showTitle ? rd.title_es : 'Ver título en español'}
            </button>
            <div className="mt-6 space-y-5">
              {rd.paragraphs.map((p, i) => (
                <div key={i} id={`par-${i}`} className={cn('group flex gap-3 rounded-2xl p-2 transition-colors', focus === i && 'bg-amber-50 ring-2 ring-amber-300')}>
                  <p className="reading min-w-0 flex-1 text-lg leading-relaxed text-ink" lang="en">
                    <Paragraph text={p} glossary={rd.glossary} active={w?.en ?? null} onWord={setWord} />
                  </p>
                  <IconButton icon={Volume2} label={`Escuchar el párrafo ${i + 1}`} size="sm" variant="secondary" onClick={() => play(`p:${i}`, p)} />
                </div>
              ))}
            </div>
            {!serverOk && <p className="mt-4 text-xs text-ink-soft">Se usa la voz de tu navegador; la calidad puede variar.</p>}
          </Card>
        </article>

        <div className="min-w-0 space-y-6 lg:col-span-5">
          <Card padding="md" as="section" aria-labelledby="glossary-title">
            <h2 id="glossary-title" className="flex items-center gap-2 font-bold text-ink">
              <BookOpen size={18} className="text-amber-600" aria-hidden /> Palabras clave
            </h2>
            {w ? (
              <div className="mt-3 animate-fade-in rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
                <p className="font-display text-xl font-bold text-ink" lang="en">
                  {w.en}
                </p>
                <p className="text-ink-soft">{w.es}</p>
                <Button size="sm" variant="secondary" icon={Volume2} className="mt-3" onClick={() => play(`w:${word}`, w.en)}>
                  Escuchar
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">Toca una palabra subrayada en el texto para ver qué significa y cómo suena.</p>
            )}
            <ul className="mt-4 flex flex-wrap gap-2">
              {rd.glossary.map((g, i) => (
                <li key={g.en}>
                  <button
                    type="button"
                    onClick={() => setWord(i)}
                    className={cn('rounded-full px-3 py-1 text-sm font-semibold ring-1', word === i ? 'bg-amber-100 text-ink ring-amber-400' : 'bg-surface text-ink-soft ring-line hover:bg-mist')}
                    lang="en"
                  >
                    {g.en}
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <LaniaSays expression="explaining" tone="lavender" size="sm">
            {solved === rd.questions.length
              ? '¡Lo entendiste todo! Prueba otra lectura o una de nivel más alto.'
              : 'Lee primero sin traducir. Si una palabra te frena, tócala y sigue: no hace falta entenderlo todo.'}
          </LaniaSays>

          <Card padding="lg" as="section" aria-labelledby="questions-title">
            <h2 id="questions-title" className="font-display text-lg font-bold text-ink">
              Comprensión · {solved} de {rd.questions.length}
            </h2>
            <div className="mt-5 space-y-8">
              {rd.questions.map((q, i) => (
                <Question key={q.exercise_id} q={q} index={i} onShow={show} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}

/** Reading Lab — biblioteca de lecturas originales por nivel, con glosario, audio y preguntas corregidas. */
export function ReadingLab() {
  const [params] = useSearchParams()
  const [slug, setSlug] = useState<string | null>(params.get('texto'))
  const [level, setLevel] = useState<Level>('todos')
  const list = useReadings()
  const detail = useReading(slug ?? undefined)

  if (slug) {
    if (detail.isPending) return <LoadingState label="Abriendo la lectura…" />
    if (detail.isError || !detail.data) return <ErrorState message="No pudimos abrir esa lectura." onRetry={() => void detail.refetch()} />
    return <Reader key={detail.data.slug} rd={detail.data} onBack={() => setSlug(null)} />
  }

  return (
    <PageContainer wide>
      <PageHeader
        eyebrow="Reading Lab"
        title="Lee en inglés a tu ritmo"
        description="Textos reales y cortos: correos, anuncios, reseñas y artículos. Toca las palabras clave y escucha cómo suenan."
        actions={
          <Segmented<Level>
            label="Nivel"
            value={level}
            onChange={setLevel}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'A1', label: 'A1' },
              { value: 'A2', label: 'A2' },
              { value: 'B1', label: 'B1' },
            ]}
          />
        }
      />
      {list.isPending ? (
        <LoadingState label="Cargando la biblioteca…" />
      ) : list.isError ? (
        <ErrorState message="No pudimos cargar las lecturas." onRetry={() => void list.refetch()} />
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.data
            .filter((t) => level === 'todos' || t.level === level)
            .map((t) => (
              <li key={t.slug}>
                <button
                  type="button"
                  onClick={() => setSlug(t.slug)}
                  className="flex h-full w-full flex-col gap-3 rounded-3xl bg-surface p-5 text-left ring-1 ring-line transition-colors hover:bg-mist"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge tone="dark">{t.level}</Badge>
                    <Badge tone="neutral">{t.kind_es}</Badge>
                    {t.solved === t.questions && (
                      <Badge tone="mint" icon={CheckCircle2}>
                        Leída
                      </Badge>
                    )}
                  </span>
                  <span className="font-display text-lg font-bold text-ink" lang="en">
                    {t.title_en}
                  </span>
                  <span className="text-sm text-ink-soft">{t.title_es}</span>
                  <span className="mt-auto flex items-center gap-3 text-xs font-semibold text-ink-soft">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={13} aria-hidden /> {t.minutes} min
                    </span>
                    <span>
                      {t.solved} de {t.questions} preguntas
                    </span>
                  </span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </PageContainer>
  )
}
