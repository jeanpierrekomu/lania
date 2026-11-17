import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from '@/ui/router'
import { ArrowLeft, ArrowRight, Captions, CaptionsOff, Check, Keyboard, Lightbulb, MessagesSquare, Mic, PanelRightClose, PanelRightOpen, RotateCcw, Send, Square } from 'lucide-react'
import { cn } from '@/ui/lib/cn'
import { useSpeech } from '@/ui/lib/speech'
import { useRecorder, formatSeconds } from '@/ui/lib/recorder'
import { Lania, type LaniaExpression } from '@/ui/components/illustrations/Lania'
import { VoiceRings } from '@/ui/components/illustrations/Decor'
import { Badge } from '@/ui/components/ui/Badge'
import { Button, ButtonLink, IconButton } from '@/ui/components/ui/Button'
import { TextInput } from '@/ui/components/ui/Field'
import { Modal } from '@/ui/components/ui/Modal'
import { Segmented } from '@/ui/components/ui/Segmented'
import { MicButton } from '@/ui/components/exercise/MicButton'
import { VoiceWave } from '@/ui/components/exercise/VoiceWave'
import { ErrorState, LoadingState } from '@/components/ui/states'
import type { Schemas } from '@/lib/api/client'
import { useApiAudio } from '@/lib/api/audio'
import { useScenarios, useSpeakingTurn, useStartSpeaking } from '@/lib/api/queries'
import { usePreferences, type AudioRate } from '@/ui/state/preferences'
import { HistoryList, type Msg } from './speaking/SpeakingParts'

type Phase = 'setup' | 'lania' | 'turn' | 'recording' | 'processing' | 'done'
type Session = Schemas['SpeakingSessionOut']
type Turn = Schemas['SpeakingTurnOut']

/** Marca de tiempo para medir la duración de la conversación (fuera del render). */
function clockMs() {
  return Date.now()
}

function newKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}

/** Historial a partir de la sesión del servidor: pregunta del guion → tu turno → reacción y corrección de Lania. */
function toHistory(session: Session): Msg[] {
  const out: Msg[] = []
  let id = 0
  for (const t of session.turns) {
    out.push({ id: ++id, who: 'you', text: t.transcript, lang: 'en' })
    if (t.corrections.length || !t.on_task) out.push({ id: ++id, who: 'lania', text: t.feedback_es, lang: 'es', kind: 'feedback' })
    out.push({ id: ++id, who: 'lania', text: t.reply_en, lang: 'en' })
  }
  if (session.current.lania_en) out.push({ id: ++id, who: 'lania', text: session.current.lania_en, lang: 'en' })
  return out
}

/** F · Speaking Lab — conversación por turnos con Lania: hablas (o escribes), te corrige y te responde. */
export function SpeakingLab() {
  const { prefs, setPref } = usePreferences()
  const browser = useSpeech()
  const server = useApiAudio()
  const rec = useRecorder({ maxSeconds: 60 })
  const [params] = useSearchParams()
  const scenarios = useScenarios()
  const startMut = useStartSpeaking()
  const turnMut = useSpeakingTurn()
  const [pick, setPick] = useState<string | null>(params.get('tema'))
  const [session, setSession] = useState<Session | null>(null)
  const [phase, setPhase] = useState<Phase>('setup')
  const [lastTurn, setLastTurn] = useState<Turn | null>(null)
  const [rate, setRate] = useState<AudioRate>(prefs.audioRate)
  const [help, setHelp] = useState(false)
  const [typing, setTyping] = useState(false)
  const [typed, setTyped] = useState('')
  const [panel, setPanel] = useState(true)
  const [sheet, setSheet] = useState(false)
  const [voiceOut, setVoiceOut] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [minutes, setMinutes] = useState(1)
  const startedAt = useRef(0)

  const list = scenarios.data ?? []
  const chosen = list.find((s) => s.slug === pick) ?? list[0]
  const speaking = server.playing || browser.speaking

  const stopVoice = () => {
    server.stop()
    browser.stop()
  }
  useEffect(() => () => stopVoice(), [])

  /** Lania habla: voz del servidor si existe; si no, la del navegador. Siempre se puede leer en pantalla. */
  const say = (text: string, path: string | null, after: () => void) => {
    setPhase('lania')
    if (!prefs.laniaVoice) {
      after()
      return
    }
    const withBrowser = () => browser.speak(text, { lang: 'en', rate, onEnd: after })
    if (path && voiceOut && session?.voice_output !== false) {
      void server.play(path, {
        rate,
        onEnd: after,
        onError: () => {
          setVoiceOut(false)
          withBrowser()
        },
      })
    } else withBrowser()
  }

  const sayPrompt = (s: Session) => {
    const path = `/api/v1/speaking/sessions/${s.id}/audio?what=prompt:${s.current.step}`
    say(s.current.lania_en, path, () => (s.current.finished ? finish() : setPhase('turn')))
  }

  const start = () => {
    if (!chosen) return
    setError(null)
    setLastTurn(null)
    startedAt.current = clockMs()
    startMut.mutate(chosen.slug, {
      onSuccess: (s) => {
        setSession(s)
        setVoiceOut(s.voice_output)
        sayPrompt(s)
      },
      onError: (e) => setError(e.message),
    })
  }

  const send = (input: { text?: string; audio?: Blob; seconds?: number }) => {
    if (!session) return
    setPhase('processing')
    setHelp(false)
    setError(null)
    turnMut.mutate(
      { sessionId: session.id, clientTurnId: newKey(), ...input },
      {
        onSuccess: (s) => {
          const t = s.turns[s.turns.length - 1]
          setSession(s)
          setLastTurn(t)
          const reply = `/api/v1/speaking/sessions/${s.id}/audio?what=turn:${t.id}`
          // Primero la reacción de Lania; después, si avanzaste, la siguiente pregunta del guion.
          say(t.reply_en, reply, () => (t.on_task ? sayPrompt(s) : setPhase('turn')))
        },
        onError: (e) => {
          setError(e.message)
          setPhase('turn')
        },
      },
    )
  }

  const onMic = async () => {
    if (phase === 'turn') {
      setTyping(false)
      stopVoice()
      void rec.start()
      setPhase('recording')
    } else if (phase === 'recording') {
      const seconds = rec.seconds
      const blob = await rec.finish()
      if (!blob || rec.simulated) {
        setPhase('turn')
        setTyping(true)
        setError('No pudimos usar tu micrófono. Revisa el permiso del navegador o escribe tu respuesta.')
        return
      }
      send({ audio: blob, seconds: Math.max(1, seconds) })
    }
  }

  const sendTyped = () => {
    if (!typed.trim() || phase !== 'turn') return
    send({ text: typed.trim() })
    setTyped('')
    setTyping(false)
  }

  const finish = () => {
    stopVoice()
    rec.reset()
    setMinutes(Math.max(1, Math.round((clockMs() - startedAt.current) / 60000)))
    setPhase('done')
  }

  const backToSetup = () => {
    stopVoice()
    rec.reset()
    setSession(null)
    setPhase('setup')
  }

  const replay = () => {
    if (!session) return
    if (lastTurn && phase === 'turn' && !lastTurn.on_task) {
      say(lastTurn.reply_en, `/api/v1/speaking/sessions/${session.id}/audio?what=turn:${lastTurn.id}`, () => setPhase('turn'))
    } else sayPrompt(session)
  }

  if (scenarios.isPending) return <LoadingState label="Preparando las conversaciones…" />
  if (scenarios.isError || !chosen) return <ErrorState message="No pudimos cargar las conversaciones." onRetry={() => void scenarios.refetch()} />

  const history = session ? toHistory(session) : []
  const current = session?.current
  const talking = phase === 'lania' && speaking
  const expression: LaniaExpression =
    phase === 'recording' ? 'listening' : phase === 'processing' ? 'thinking' : phase === 'lania' ? (current?.finished ? 'celebrating' : 'explaining') : help ? 'thinking' : 'neutral'
  const status =
    phase === 'lania'
      ? 'Lania está hablando…'
      : phase === 'recording'
        ? `Te escucho · ${formatSeconds(rec.seconds)} · toca para terminar`
        : phase === 'processing'
          ? 'Lania está escuchando tu respuesta…'
          : lastTurn && !lastTurn.on_task
            ? 'Inténtalo de nuevo, en inglés'
            : 'Tu turno: toca el micrófono y responde'
  const subtitle = phase === 'lania' && lastTurn && session?.turns.at(-1)?.id === lastTurn.id && speaking ? lastTurn.reply_en : current?.lania_en
  const corrections = session?.turns.flatMap((t) => t.corrections.map((c) => ({ ...c, step: t.step }))) ?? []

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas text-ink">
      <header className="relative z-10 flex items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
        <ButtonLink to="/app" variant="secondary" size="sm" icon={ArrowLeft}>
          <span className="sr-only sm:not-sr-only">Salir</span>
        </ButtonLink>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral-700">Speaking Lab</p>
          <p className="truncate font-semibold">{phase === 'setup' ? 'Elige una conversación' : chosen.title_es}</p>
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
            <IconButton variant="light" icon={prefs.subtitles ? Captions : CaptionsOff} label={prefs.subtitles ? 'Ocultar subtítulos' : 'Mostrar subtítulos'} pressed={prefs.subtitles} onClick={() => setPref('subtitles', !prefs.subtitles)} />
            <IconButton variant="light" icon={MessagesSquare} label="Historial de la conversación" className="lg:hidden" onClick={() => setSheet(true)} />
            <IconButton variant="light" icon={panel ? PanelRightClose : PanelRightOpen} label={panel ? 'Ocultar historial' : 'Mostrar historial'} className="hidden lg:inline-flex" onClick={() => setPanel((p) => !p)} />
            <Button variant="coral" size="sm" onClick={finish}>
              Terminar
            </Button>
          </>
        )}
      </header>

      <div className="relative flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col px-5 pb-8 sm:px-8">
          {phase === 'setup' && (
            <div className="mx-auto grid w-full max-w-5xl items-center gap-10 py-6 lg:grid-cols-[1fr_20rem]">
              <div>
                <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-ink sm:text-4xl">¿Qué conversación practicamos?</h1>
                <p className="mt-3 max-w-xl text-lg text-ink-soft">Lania hace un papel, te escucha y te ayuda a decirlo mejor. Puedes hablar o escribir.</p>
                <div role="radiogroup" aria-label="Conversación" className="mt-8 grid gap-3 sm:grid-cols-2">
                  {list.map((c) => {
                    const on = c.slug === chosen.slug
                    return (
                      <button
                        key={c.slug}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setPick(c.slug)}
                        className={cn('flex flex-col items-start gap-1 rounded-3xl p-4 text-left ring-2 transition-colors', on ? 'bg-mist ring-coral-300' : 'bg-surface ring-line hover:bg-mist')}
                      >
                        <span className="flex items-center gap-2 font-bold text-ink">
                          {c.title_es} <Badge tone="dark">{c.level}</Badge>
                        </span>
                        <span className="text-sm text-ink-soft">{c.context_es}</span>
                        <span className="text-xs font-semibold text-violet-700">{c.steps} preguntas</span>
                      </button>
                    )
                  })}
                </div>
                {error && <ErrorState message={error} />}
                <Button size="lg" className="mt-8" iconRight={ArrowRight} onClick={start} disabled={startMut.isPending}>
                  {startMut.isPending ? 'Preparando…' : 'Empezar conversación'}
                </Button>
                <p className="mt-3 text-sm text-ink-soft">Tu voz se convierte en texto para corregirte y no se guarda la grabación.</p>
              </div>
              <div className="relative mx-auto hidden w-full max-w-80 lg:block">
                <div className="absolute inset-x-4 bottom-0 top-10 rounded-t-full bg-mist" aria-hidden />
                <Lania expression="welcome" crop="portrait" className="relative w-full" title="Lania te da la bienvenida" />
              </div>
            </div>
          )}

          {phase === 'done' && session && (
            <div className="mx-auto w-full max-w-4xl animate-fade-up py-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-28 w-28 overflow-hidden rounded-full bg-mist">
                  <Lania crop="head" expression="celebrating" />
                </div>
                <h1 className="mt-5 font-display text-3xl font-extrabold tracking-[-0.02em] text-ink">Resumen de tu conversación</h1>
                <p className="mt-2 text-violet-700">
                  {chosen.title_es} · {session.turns.length} respuestas tuyas · ≈ {minutes} min
                </p>
              </div>
              <section className="mt-8 rounded-3xl bg-surface p-5 ring-1 ring-line" aria-labelledby="fixes">
                <h2 id="fixes" className="font-bold text-coral-700">
                  Para decirlo mejor la próxima vez
                </h2>
                {corrections.length === 0 ? (
                  <p className="mt-3 flex items-center gap-2 text-sm text-ink">
                    <Check size={17} className="text-mint-700" aria-hidden /> Sin correcciones importantes. ¡Bien hecho!
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {corrections.map((c, i) => (
                      <li key={i} className="rounded-2xl bg-mist p-3 text-sm">
                        <p>
                          <span className="text-ink-soft line-through">{c.original}</span> → <strong className="text-mint-700">{c.corrected}</strong>
                        </p>
                        <p className="text-ink-soft">{c.explanation_es}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button variant="secondary" icon={RotateCcw} onClick={backToSetup}>
                  Otra conversación
                </Button>
                <ButtonLink to="/app/progreso" iconRight={ArrowRight}>
                  Ver mi progreso
                </ButtonLink>
              </div>
            </div>
          )}

          {phase !== 'setup' && phase !== 'done' && session && current && (
            <div className="flex flex-1 flex-col items-center justify-between gap-6 pt-6 sm:pt-10">
              <div className="flex w-full flex-col items-center">
                <div className={cn('relative grid h-56 w-56 place-items-center sm:h-72 sm:w-72', talking ? 'text-coral-700' : 'text-mint-700')}>
                  <VoiceRings active={talking || phase === 'recording'} />
                  <div className="relative h-full w-full overflow-hidden rounded-full bg-violet-50 ring-1 ring-line">
                    <Lania expression={expression} talking={talking} crop="portrait" className="absolute inset-x-0 -bottom-1 mx-auto w-[86%]" title="Lania" />
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold text-ink-soft">
                  Pregunta {Math.min(current.step + 1, current.total)} de {current.total}
                </p>
                <div className="mt-2 flex items-center gap-2 text-sm text-violet-700" aria-live="polite">
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

              <div className="w-full max-w-2xl space-y-3 text-center">
                {prefs.subtitles ? (
                  subtitle && (
                    <p key={subtitle} className="reading animate-fade-in rounded-3xl bg-surface/90 px-5 py-4 text-lg text-ink shadow-soft sm:text-xl" lang="en">
                      {subtitle}
                    </p>
                  )
                ) : (
                  <p className="rounded-3xl bg-ink/5 px-5 py-4 text-sm text-violet-700">Subtítulos ocultos. Puedes activarlos con el botón CC.</p>
                )}
                {lastTurn && (lastTurn.corrections.length > 0 || !lastTurn.on_task) && phase !== 'processing' && (
                  <div className="animate-fade-up rounded-2xl bg-coral-100 px-4 py-3 text-left text-sm text-ink">
                    <p className="font-bold text-coral-800">Lania · corrección</p>
                    <p>{lastTurn.feedback_es}</p>
                    {lastTurn.corrections.map((c, i) => (
                      <p key={i} className="mt-1">
                        <span className="line-through opacity-70">{c.original}</span> → <strong>{c.corrected}</strong>
                      </p>
                    ))}
                    {lastTurn.natural_version_en && (
                      <p className="mt-1 text-ink-soft" lang="en">
                        Más natural: “{lastTurn.natural_version_en}”
                      </p>
                    )}
                  </div>
                )}
                {help && phase === 'turn' && current.goal_es && (
                  <div className="animate-fade-up rounded-2xl bg-amber-100 px-4 py-2.5 text-left text-sm text-amber-800">
                    <p className="font-semibold">
                      <Lightbulb size={15} className="mr-1.5 inline" aria-hidden />
                      {current.goal_es}
                    </p>
                    <p className="mt-1" lang="en">
                      {current.useful_phrases_en.join(' · ')}
                    </p>
                  </div>
                )}
                {error && <ErrorState message={error} />}
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
                      <TextInput tone="light" aria-label="Escribe tu respuesta en inglés" placeholder="Escribe en inglés…" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus maxLength={2000} />
                    </div>
                    <IconButton icon={Send} label="Enviar" variant="primary" size="lg" type="submit" onClick={sendTyped} />
                    {session.voice_input && <IconButton icon={Mic} label="Volver al micrófono" variant="light" size="lg" onClick={() => setTyping(false)} />}
                  </form>
                ) : (
                  <div className="flex items-center justify-center gap-6 sm:gap-10">
                    <div className="flex flex-col items-center gap-1.5">
                      <IconButton icon={Lightbulb} label="Pedir ayuda" variant="light" size="lg" disabled={phase !== 'turn'} pressed={help} onClick={() => setHelp((h) => !h)} />
                      <span className="text-xs text-violet-700">Ayuda</span>
                    </div>
                    <MicButton
                      state={!session.voice_input ? 'disabled' : phase === 'recording' ? 'listening' : phase === 'processing' ? 'processing' : phase === 'turn' ? 'idle' : 'disabled'}
                      onClick={() => void onMic()}
                    />
                    <div className="flex flex-col items-center gap-1.5">
                      {phase === 'lania' ? (
                        <IconButton
                          icon={Square}
                          label="Detener la voz de Lania"
                          variant="light"
                          size="lg"
                          onClick={() => {
                            stopVoice()
                            if (current.finished) finish()
                            else setPhase('turn')
                          }}
                        />
                      ) : (
                        <IconButton icon={Keyboard} label="Escribir en lugar de hablar" variant="light" size="lg" disabled={phase !== 'turn'} onClick={() => setTyping(true)} />
                      )}
                      <span className="text-xs text-violet-700">{phase === 'lania' ? 'Saltar' : 'Escribir'}</span>
                    </div>
                  </div>
                )}
                {!session.voice_input && phase === 'turn' && !typing && (
                  <p className="mt-3 text-center text-sm text-ink-soft">La voz no está disponible ahora: responde por escrito con el teclado.</p>
                )}
                <div className="mt-4 flex items-center justify-center gap-3 text-xs text-violet-700">
                  <button type="button" onClick={replay} className="inline-flex items-center gap-1 font-semibold hover:text-ink" disabled={phase !== 'turn'}>
                    <RotateCcw size={13} aria-hidden /> Repetir lo último
                  </button>
                  {!voiceOut && (
                    <>
                      <span aria-hidden>·</span>
                      <span>Voz del navegador</span>
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
