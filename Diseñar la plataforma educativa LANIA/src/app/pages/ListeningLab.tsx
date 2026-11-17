import { useEffect, useRef, useState } from 'react'
import { Captions, Eye, EyeOff, Pause, Play, Repeat, Repeat1, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { useSpeech } from '@/app/lib/speech'
import { Badge } from '@/app/components/ui/Badge'
import { Button, IconButton } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { TextInput } from '@/app/components/ui/Field'
import { Segmented } from '@/app/components/ui/Segmented'
import { Tabs } from '@/app/components/ui/Tabs'
import { Heading } from '@/app/components/ui/Typography'
import { ChoiceOption, type ChoiceState } from '@/app/components/exercise/ChoiceOption'
import { FeedbackBanner } from '@/app/components/exercise/FeedbackBanner'
import { VoiceWave } from '@/app/components/exercise/VoiceWave'
import { LaniaSays } from '@/app/components/lania/LaniaSays'
import { PageContainer, PageHeader } from '@/app/components/layout/PageHeader'
import { EPISODES, type Episode } from '@/app/data/episodes'
import { usePreferences, type AudioRate } from '@/app/state/preferences'

const WORD_WIDTHS = ['w-4', 'w-6', 'w-8', 'w-10', 'w-12', 'w-14']

function Question({ q, index, onPlaySegment, onReveal }: { q: Episode['questions'][number]; index: number; onPlaySegment: (i: number) => void; onReveal: (i: number) => void }) {
  const [sel, setSel] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const right = checked && sel === q.answer
  const state = (i: number): ChoiceState =>
    !checked ? (sel === i ? 'selected' : 'idle') : i === q.answer && right ? 'correct' : i === sel ? 'incorrect' : 'dimmed'
  return (
    <div className="space-y-3">
      <p className="font-bold text-ink">
        <span className="mr-2 text-ink-soft">{index + 1}.</span>
        {q.prompt}
      </p>
      <div role="radiogroup" aria-label={q.prompt} className="grid gap-2">
        {q.options.map((o, i) => (
          <ChoiceOption
            key={o}
            letter={String.fromCharCode(65 + i)}
            label={o}
            state={state(i)}
            disabled={right}
            onSelect={() => {
              setSel(i)
              setChecked(false)
            }}
          />
        ))}
      </div>
      {!right && (
        <Button size="sm" variant="soft" disabled={sel === null} onClick={() => setChecked(true)}>
          Comprobar
        </Button>
      )}
      {checked && (
        <FeedbackBanner
          kind={right ? 'correct' : 'almost'}
          title={right ? '¡Bien escuchado!' : 'Escuchemos ese fragmento otra vez'}
          actions={
            <>
              <Button size="sm" variant="secondary" icon={Volume2} onClick={() => onPlaySegment(q.segment)}>
                Escuchar el fragmento
              </Button>
              {right && (
                <Button size="sm" variant="ghost" icon={Eye} onClick={() => onReveal(q.segment)}>
                  Ver en la transcripción
                </Button>
              )}
            </>
          }
        >
          {right ? q.explanation : 'Pista: presta atención a la frase marcada en el reproductor. Puedes bajar la velocidad.'}
        </FeedbackBanner>
      )}
    </div>
  )
}

/** G · Listening Lab */
export function ListeningLab() {
  const { prefs } = usePreferences()
  const { speak, stop } = useSpeech()
  const [epId, setEpId] = useState(EPISODES[0].id)
  const ep = EPISODES.find((e) => e.id === epId) ?? EPISODES[0]
  const [seg, setSeg] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [loop, setLoop] = useState(false)
  const [rate, setRate] = useState<AudioRate>(prefs.audioRate)
  const [captions, setCaptions] = useState(false)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [plays, setPlays] = useState(0)
  const [tab, setTab] = useState<'comprension' | 'dictado'>('comprension')
  const [dict, setDict] = useState('')
  const [dictChecked, setDictChecked] = useState(false)
  const loopRef = useRef(loop)
  loopRef.current = loop

  useEffect(() => {
    stop()
    setPlaying(false)
    setSeg(0)
    setRevealed(new Set())
    setPlays(0)
    setDict('')
    setDictChecked(false)
  }, [epId, stop])

  const playSeg = (i: number, chain = true) => {
    setSeg(i)
    setPlaying(true)
    const s = ep.segments[i]
    speak(s.text, {
      lang: 'en',
      rate,
      pitch: s.pitch,
      onEnd: () => {
        if (loopRef.current) return playSeg(i, chain)
        if (chain && i + 1 < ep.segments.length) playSeg(i + 1, chain)
        else setPlaying(false)
      },
    })
  }

  const toggle = () => {
    if (playing) {
      stop()
      setPlaying(false)
      return
    }
    if (seg === 0 || seg === ep.segments.length - 1) setPlays((p) => p + 1)
    playSeg(seg === ep.segments.length - 1 && !playing ? 0 : seg)
  }
  const reveal = (i: number) => setRevealed((r) => new Set(r).add(i))
  const dictRight = dict.trim().toLowerCase().replace(/[.!?]/g, '') === ep.dictation.answer
  const seconds = Math.max(10, Math.round(ep.segments.reduce((n, s) => n + s.text.split(' ').length, 0) / 2.5 / rate / 5) * 5)

  return (
    <PageContainer wide>
      <PageHeader
        eyebrow="Listening Lab"
        title="Entrena el oído a tu ritmo"
        description="Escucha primero sin leer. Luego revela solo los fragmentos que necesites."
        actions={
          <Segmented
            label="Episodio"
            value={epId}
            onChange={setEpId}
            options={EPISODES.map((e) => ({ value: e.id, label: e.title }))}
          />
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-7">
          {/* Player */}
          <Card padding="none" className="overflow-hidden">
            <div className={cn('flex items-center gap-4 p-5 sm:p-6', ep.tone === 'coral' ? 'bg-coral-100' : 'bg-violet-100')}>
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-surface text-ink shadow-soft">
                <ep.icon size={28} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Heading level={2} size="sm">
                    {ep.title}
                  </Heading>
                  <Badge tone="dark">{ep.level}</Badge>
                </div>
                <p className="text-sm text-ink-soft">
                  {ep.context} · {ep.speakers} · ≈ {seconds} s
                </p>
              </div>
            </div>
            <div className="p-5 sm:p-7">
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={playing ? 'Pausar audio' : 'Reproducir audio'}
                  className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-primary text-white shadow-glow transition-colors hover:bg-primary-hover"
                >
                  {playing ? <Pause size={32} fill="currentColor" aria-hidden /> : <Play size={32} fill="currentColor" className="ml-1" aria-hidden />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink" aria-live="polite">
                    Frase {seg + 1} de {ep.segments.length}
                    {loop && ' · repitiendo'}
                  </p>
                  <div className="mt-2 flex gap-1.5" role="group" aria-label="Fragmentos del audio">
                    {ep.segments.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => playSeg(i, false)}
                        aria-label={`Escuchar frase ${i + 1}`}
                        aria-current={i === seg ? 'true' : undefined}
                        className={cn(
                          'h-3 flex-1 rounded-full transition-colors',
                          i < seg ? 'bg-violet-400' : i === seg ? 'bg-primary' : 'bg-mist hover:bg-line-strong',
                        )}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-violet-600">
                    <VoiceWave active={playing} bars={12} />
                    <span className="text-xs font-semibold text-ink-soft">{plays === 0 ? 'Aún no lo escuchas' : `Escuchado ${plays} ${plays === 1 ? 'vez' : 'veces'}`}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <IconButton icon={SkipBack} label="Frase anterior" variant="secondary" disabled={seg === 0} onClick={() => playSeg(Math.max(0, seg - 1), false)} />
                <Button variant="soft" icon={Repeat1} onClick={() => playSeg(seg, false)}>
                  Repetir frase
                </Button>
                <IconButton icon={SkipForward} label="Frase siguiente" variant="secondary" disabled={seg === ep.segments.length - 1} onClick={() => playSeg(Math.min(ep.segments.length - 1, seg + 1), false)} />
                <IconButton icon={Repeat} label={loop ? 'Desactivar bucle' : 'Repetir en bucle'} variant="secondary" pressed={loop} onClick={() => setLoop((l) => !l)} />
                <IconButton icon={Captions} label={captions ? 'Ocultar subtítulos en vivo' : 'Mostrar subtítulos en vivo'} variant="secondary" pressed={captions} onClick={() => setCaptions((c) => !c)} />
                <span className="flex-1" />
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
              {captions && (
                <p className="reading mt-5 animate-fade-in rounded-2xl bg-ink px-4 py-3 text-white">
                  <span className="font-bold text-coral-300">{ep.segments[seg].speaker}: </span>
                  {ep.segments[seg].text}
                </p>
              )}
            </div>
          </Card>

          {/* Transcript */}
          <Card padding="lg" as="section" aria-labelledby="transcript-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Heading level={2} size="sm" id="transcript-title">
                  Transcripción
                </Heading>
                <p className="text-sm text-ink-soft">Oculta al inicio. Revela solo lo que necesites.</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={revealed.size === ep.segments.length ? EyeOff : Eye}
                onClick={() => setRevealed(revealed.size === ep.segments.length ? new Set() : new Set(ep.segments.map((_, i) => i)))}
              >
                {revealed.size === ep.segments.length ? 'Ocultar todo' : 'Revelar todo'}
              </Button>
            </div>
            <ol className="mt-5 space-y-2">
              {ep.segments.map((s, i) => {
                const open = revealed.has(i)
                return (
                  <li key={i} className={cn('flex items-center gap-3 rounded-2xl p-3 ring-1 transition-colors', i === seg && playing ? 'bg-violet-50 ring-violet-200' : 'ring-line')}>
                    <span className="w-14 shrink-0 text-xs font-bold text-ink-soft">{s.speaker}</span>
                    {open ? (
                      <p className="reading min-w-0 flex-1 text-ink">{s.text}</p>
                    ) : (
                      <span className="flex min-w-0 flex-1 gap-1.5 overflow-hidden" aria-label="Fragmento oculto">
                        {s.text.split(' ').slice(0, 9).map((w, j) => (
                          <span key={j} className={cn('h-3 rounded-full bg-mist', WORD_WIDTHS[Math.min(WORD_WIDTHS.length - 1, Math.floor(w.length / 2))])} />
                        ))}
                      </span>
                    )}
                    <IconButton icon={Volume2} label={`Escuchar frase ${i + 1}`} size="sm" onClick={() => playSeg(i, false)} />
                    {!open && (
                      <Button size="sm" variant="soft" onClick={() => reveal(i)}>
                        Revelar
                      </Button>
                    )}
                  </li>
                )
              })}
            </ol>
          </Card>
        </div>

        {/* Activities */}
        <div className="min-w-0 space-y-6 lg:col-span-5">
          <LaniaSays expression="listening" tone="lavender" size="sm">
            {plays === 0
              ? 'Primero escucha una vez completa, sin leer. Después respondemos juntos.'
              : 'Si una respuesta se te escapa, escucha solo ese fragmento a 0.75×. Funciona.'}
          </LaniaSays>
          <Card padding="lg" as="section" aria-label="Actividades de comprensión">
            <Tabs
              label="Actividades"
              idPrefix="listen"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'comprension', label: 'Comprensión', count: ep.questions.length },
                { id: 'dictado', label: 'Dictado', count: 1 },
              ]}
            />
            <div id={`listen-panel-${tab}`} role="tabpanel" aria-labelledby={`listen-tab-${tab}`} className="mt-6">
              {tab === 'comprension' ? (
                <div key={ep.id} className="space-y-8">
                  {ep.questions.map((q, i) => (
                    <Question key={q.id} q={q} index={i} onPlaySegment={(s) => playSeg(s, false)} onReveal={reveal} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-ink-soft">Escucha la frase {ep.dictation.segment + 1} y escribe la palabra que falta.</p>
                  <Button variant="secondary" icon={Volume2} onClick={() => playSeg(ep.dictation.segment, false)}>
                    Escuchar la frase
                  </Button>
                  <p className="reading flex flex-wrap items-center gap-2 text-lg text-ink">
                    “{ep.dictation.before}
                    <span className="inline-block w-36">
                      <TextInput
                        aria-label="Palabra que falta"
                        value={dict}
                        onChange={(e) => {
                          setDict(e.target.value)
                          setDictChecked(false)
                        }}
                        className="h-10 text-center"
                        autoCapitalize="off"
                        spellCheck={false}
                      />
                    </span>
                    {ep.dictation.after}”
                  </p>
                  <Button variant="soft" disabled={!dict.trim()} onClick={() => setDictChecked(true)}>
                    Comprobar
                  </Button>
                  {dictChecked && (
                    <FeedbackBanner kind={dictRight ? 'correct' : 'almost'} title={dictRight ? '¡Exacto!' : 'Casi, escúchalo otra vez a 0.75×'}>
                      {dictRight ? `La palabra es “${ep.dictation.answer}”.` : 'Fíjate en el sonido final. Puedes revelar ese fragmento en la transcripción.'}
                    </FeedbackBanner>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
