import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ArrowLeft, Captions, CaptionsOff, Keyboard, Lightbulb, MessagesSquare, Mic, PanelRightClose, PanelRightOpen, RotateCcw, Send, Square } from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { useSpeech } from '@/app/lib/speech'
import { useRecorder, formatSeconds } from '@/app/lib/recorder'
import { checkText } from '@/app/lib/writingCheck'
import { Lania, type LaniaExpression } from '@/app/components/illustrations/Lania'
import { VoiceRings } from '@/app/components/illustrations/Decor'
import { Badge } from '@/app/components/ui/Badge'
import { Button, ButtonLink, IconButton } from '@/app/components/ui/Button'
import { TextInput } from '@/app/components/ui/Field'
import { Modal } from '@/app/components/ui/Modal'
import { Segmented } from '@/app/components/ui/Segmented'
import { MicButton } from '@/app/components/exercise/MicButton'
import { VoiceWave } from '@/app/components/exercise/VoiceWave'
import { CONVERSATIONS } from '@/app/data/conversations'
import { useLearner } from '@/app/state/learner'
import { usePreferences, type AudioRate } from '@/app/state/preferences'
import { HistoryList, SetupPanel, SummaryPanel, type Collected, type Msg } from './speaking/SpeakingParts'

type Phase = 'setup' | 'lania' | 'turn' | 'recording' | 'processing' | 'done'

/** F · Speaking Lab — immersive one-to-one conversation with Lania. */
export function SpeakingLab() {
  const { learner } = useLearner()
  const { prefs, setPref } = usePreferences()
  const { speak, stop, speaking } = useSpeech()
  const rec = useRecorder({ maxSeconds: 40 })
  const [params] = useSearchParams()
  const [convId, setConvId] = useState(() => CONVERSATIONS.find((c) => c.id === params.get('tema'))?.id ?? CONVERSATIONS[0].id)
  const [closing, setClosing] = useState(false)
  const conv = CONVERSATIONS.find((c) => c.id === convId) ?? CONVERSATIONS[0]
  const [phase, setPhase] = useState<Phase>('setup')
  const [turn, setTurn] = useState(0)
  const [retry, setRetry] = useState(false)
  const [history, setHistory] = useState<Msg[]>([])
  const [current, setCurrent] = useState<Msg | null>(null)
  const [charIdx, setCharIdx] = useState<number | null>(null)
  const [rate, setRate] = useState<AudioRate>(prefs.audioRate)
  const [collected, setCollected] = useState<Collected[]>([])
  const [help, setHelp] = useState(false)
  const [typing, setTyping] = useState(false)
  const [typed, setTyped] = useState('')
  const [panel, setPanel] = useState(true)
  const [sheet, setSheet] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef(0)
  const ids = useRef(0)
  const thinkTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (thinkTimer.current) window.clearTimeout(thinkTimer.current)
  }, [])

  // Deep link for reviewers: /app/speaking?tema=entrevista&iniciar=1
  useEffect(() => {
    if (params.get('iniciar') !== '1') return
    const id = window.setTimeout(start, 300)
    return () => window.clearTimeout(id)
  }, [])

  const push = (m: Omit<Msg, 'id'>) => {
    const msg = { ...m, id: ++ids.current }
    setHistory((h) => [...h, msg])
    return msg
  }

  const laniaSay = (text: string, lang: 'en' | 'es', after: () => void, kind?: 'feedback') => {
    setCurrent(push({ who: 'lania', text, lang, kind }))
    setCharIdx(null)
    setPhase('lania')
    speak(text, { lang, rate, onBoundary: setCharIdx, onEnd: after }, !prefs.laniaVoice)
  }

  const afterReply = (t: number) => {
    if (t + 1 < conv.turns.length) {
      setTurn(t + 1)
      setPhase('turn')
    } else {
      setElapsed(Math.round((Date.now() - startedAt.current) / 1000))
      setPhase('done')
    }
  }

  const start = () => {
    setHistory([])
    setCollected([])
    setTurn(0)
    setRetry(false)
    setClosing(false)
    startedAt.current = Date.now()
    laniaSay(conv.opener(learner.name), 'en', () => setPhase('turn'))
  }

  const handleStudent = (text: string, typedInput: boolean) => {
    const t = conv.turns[turn]
    const isLast = turn === conv.turns.length - 1
    setHelp(false)
    push({ who: 'you', text, lang: 'en', simulated: !typedInput })
    if (retry) {
      setRetry(false)
      if (isLast) setClosing(true)
      setCollected((c) => c.map((x) => (x.turn === turn ? { ...x, fixed: true } : x)))
      laniaSay(`Perfect! ${t.reply}`, 'en', () => afterReply(turn))
      return
    }
    const corrections = typedInput
      ? checkText(text).map((i) => ({ original: i.original, better: i.suggestion, why: i.explanation }))
      : t.corrections
    if (corrections.length) setCollected((c) => [...c, ...corrections.map((correction) => ({ correction, fixed: false, turn }))])
    if (prefs.corrections === 'moment' && corrections.length) {
      const fb =
        !typedInput && t.moment
          ? t.moment
          : `Te entendí. Un detalle: “${corrections[0].original}” → “${corrections[0].better}”. ${corrections[0].why} ¿Lo intentas otra vez?`
      setRetry(true)
      laniaSay(fb, 'es', () => setPhase('turn'), 'feedback')
    } else {
      if (isLast) setClosing(true)
      laniaSay(t.reply, 'en', () => afterReply(turn))
    }
  }

  const onMic = () => {
    if (phase === 'turn') {
      setTyping(false)
      void rec.start()
      setPhase('recording')
    } else if (phase === 'recording') {
      rec.stop()
      setPhase('processing')
      const t = conv.turns[turn]
      thinkTimer.current = window.setTimeout(() => handleStudent(retry ? (t.retry ?? t.student) : t.student, false), 900)
    }
  }

  const sendTyped = () => {
    if (!typed.trim() || phase !== 'turn') return
    handleStudent(typed.trim(), true)
    setTyped('')
    setTyping(false)
  }

  const finish = () => {
    stop()
    rec.reset()
    if (thinkTimer.current) window.clearTimeout(thinkTimer.current)
    setElapsed(Math.round((Date.now() - startedAt.current) / 1000))
    setPhase('done')
  }

  const backToSetup = () => {
    stop()
    rec.reset()
    setPhase('setup')
  }

  const replay = () => {
    const last = [...history].reverse().find((m) => m.who === 'lania')
    if (last) speak(last.text, { lang: last.lang, rate }, !prefs.laniaVoice)
  }

  const expression: LaniaExpression =
    phase === 'recording'
      ? 'listening'
      : phase === 'processing'
        ? 'thinking'
        : phase === 'lania'
          ? current?.kind === 'feedback'
            ? 'correcting'
            : closing
              ? 'celebrating'
              : 'explaining'
          : help
            ? 'thinking'
            : 'neutral'
  const talking = phase === 'lania' && speaking
  const youCount = history.filter((m) => m.who === 'you').length

  const status =
    phase === 'lania'
      ? 'Lania está hablando…'
      : phase === 'recording'
        ? `Te escucho · ${formatSeconds(rec.seconds)} · toca para terminar`
        : phase === 'processing'
          ? 'Lania está pensando…'
          : retry
            ? 'Inténtalo de nuevo con la corrección'
            : 'Tu turno: toca el micrófono y responde'

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas text-ink">

      <header className="relative z-10 flex items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
        <ButtonLink to="/app" variant="secondary" size="sm" icon={ArrowLeft}>
          <span className="sr-only sm:not-sr-only">Salir</span>
        </ButtonLink>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral-700">Speaking Lab</p>
          <p className="truncate font-semibold">{phase === 'setup' ? 'Elige un tema' : conv.title}</p>
        </div>
        {phase !== 'setup' && phase !== 'done' && (
          <>
            <div className="hidden md:block">
              <Segmented<AudioRate>
                label="Velocidad de voz"
                tone="light"
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
            <IconButton
              variant="light"
              icon={prefs.subtitles ? Captions : CaptionsOff}
              label={prefs.subtitles ? 'Ocultar subtítulos' : 'Mostrar subtítulos'}
              pressed={prefs.subtitles}
              onClick={() => setPref('subtitles', !prefs.subtitles)}
            />
            <IconButton variant="light" icon={MessagesSquare} label="Historial de la conversación" className="lg:hidden" onClick={() => setSheet(true)} />
            <IconButton
              variant="light"
              icon={panel ? PanelRightClose : PanelRightOpen}
              label={panel ? 'Ocultar historial' : 'Mostrar historial'}
              className="hidden lg:inline-flex"
              onClick={() => setPanel((p) => !p)}
            />
            <Button variant="coral" size="sm" onClick={finish}>
              Terminar
            </Button>
          </>
        )}
      </header>

      <div className="relative flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col px-5 pb-8 sm:px-8">
          {phase === 'setup' && <SetupPanel convId={convId} onPick={setConvId} rate={rate} onRate={setRate} onStart={start} />}

          {phase === 'done' && (
            <SummaryPanel conv={conv} collected={collected} turns={youCount} seconds={elapsed} onRestart={backToSetup} />
          )}

          {phase !== 'setup' && phase !== 'done' && (
            <div className="flex flex-1 flex-col items-center justify-between gap-6 pt-6 sm:pt-10">
              <div className="flex w-full flex-col items-center">
                <div className={cn('relative grid h-64 w-64 place-items-center sm:h-80 sm:w-80', talking ? 'text-coral-700' : 'text-mint-700')}>
                  <VoiceRings active={talking || phase === 'recording'} />
                  <div className="relative h-full w-full overflow-hidden rounded-full bg-violet-50 ring-1 ring-line">
                    <Lania expression={expression} talking={talking} crop="portrait" className="absolute inset-x-0 -bottom-1 mx-auto w-[86%]" title="Lania" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-violet-700" aria-live="polite">
                  {phase === 'processing' ? (
                    <span className="flex gap-1" aria-hidden>
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="h-2 w-2 animate-dot rounded-full bg-coral-300" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </span>
                  ) : (
                    <VoiceWave active={talking || phase === 'recording'} bars={5} className={talking ? 'text-coral-700' : 'text-mint-700'} />
                  )}
                  {status}
                </div>
              </div>

              <div className="w-full max-w-2xl text-center">
                {prefs.subtitles ? (
                  current && (
                    <p
                      key={current.id}
                      className={cn(
                        'reading animate-fade-in rounded-3xl px-5 py-4 text-lg sm:text-xl',
                        current.kind === 'feedback' ? 'bg-coral-300 text-ink' : 'bg-surface/90 text-ink shadow-soft',
                      )}
                    >
                      {charIdx !== null && current.lang === 'en' && phase === 'lania' ? (
                        <>
                          <span>{current.text.slice(0, charIdx)}</span>
                          <span className="opacity-60">{current.text.slice(charIdx)}</span>
                        </>
                      ) : (
                        current.text
                      )}
                    </p>
                  )
                ) : (
                  <p className="rounded-3xl bg-ink/5 px-5 py-4 text-sm text-violet-700">Subtítulos ocultos. Puedes activarlos con el botón CC.</p>
                )}
                {help && phase === 'turn' && (
                  <p className="mt-3 animate-fade-up rounded-2xl bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-700">
                    <Lightbulb size={15} className="mr-1.5 inline" aria-hidden />
                    {retry ? (conv.turns[turn].retry ? `Prueba: “${conv.turns[turn].retry}”` : conv.turns[turn].help) : conv.turns[turn].help}
                  </p>
                )}
              </div>

              <div className="w-full max-w-xl">
                {typing && phase === 'turn' ? (
                  <form
                    className="flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      sendTyped()
                    }}
                  >
                    <div className="flex-1">
                      <TextInput tone="light" aria-label="Escribe tu respuesta en inglés" placeholder="Escribe en inglés…" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
                    </div>
                    <IconButton icon={Send} label="Enviar" variant="primary" size="lg" type="submit" onClick={sendTyped} />
                    <IconButton icon={Mic} label="Volver al micrófono" variant="light" size="lg" onClick={() => setTyping(false)} />
                  </form>
                ) : (
                  <div className="flex items-center justify-center gap-6 sm:gap-10">
                    <div className="flex flex-col items-center gap-1.5">
                      <IconButton icon={Lightbulb} label="Pedir ayuda" variant="light" size="lg" disabled={phase !== 'turn'} pressed={help} onClick={() => setHelp((h) => !h)} />
                      <span className="text-xs text-violet-700">Ayuda</span>
                    </div>
                    <MicButton
                      state={phase === 'recording' ? 'listening' : phase === 'processing' ? 'processing' : phase === 'turn' ? 'idle' : 'disabled'}
                      onClick={onMic}
                    />
                    <div className="flex flex-col items-center gap-1.5">
                      {phase === 'lania' ? (
                        <IconButton icon={Square} label="Detener la voz de Lania" variant="light" size="lg" onClick={() => stop()} />
                      ) : (
                        <IconButton icon={Keyboard} label="Escribir en lugar de hablar" variant="light" size="lg" disabled={phase !== 'turn'} onClick={() => setTyping(true)} />
                      )}
                      <span className="text-xs text-violet-700">{phase === 'lania' ? 'Detener' : 'Escribir'}</span>
                    </div>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-center gap-3 text-xs text-violet-700">
                  <button type="button" onClick={replay} className="inline-flex items-center gap-1 font-semibold hover:text-ink">
                    <RotateCcw size={13} aria-hidden /> Repetir lo último
                  </button>
                  <span aria-hidden>·</span>
                  <span>Correcciones: {prefs.corrections === 'end' ? 'al final' : 'en el momento'}</span>
                  {rec.simulated && phase === 'recording' && (
                    <>
                      <span aria-hidden>·</span>
                      <Badge tone="violet">micrófono simulado</Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {phase !== 'setup' && phase !== 'done' && panel && (
          <aside className="relative hidden w-96 shrink-0 flex-col border-l border-line bg-surface/80 lg:flex" aria-label="Historial de la conversación">
            <p className="border-b border-line px-5 py-4 text-sm font-bold">Historial</p>
            <div className="flex-1 overflow-y-auto p-5">
              <HistoryList history={history} />
            </div>
          </aside>
        )}
      </div>

      <Modal open={sheet} onClose={() => setSheet(false)} title="Historial de la conversación" placement="drawer">
        <div className="rounded-3xl bg-canvas p-4">
          <HistoryList history={history} />
        </div>
      </Modal>
    </div>
  )
}
