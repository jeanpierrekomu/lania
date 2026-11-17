import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeft,
  Captions,
  Check,
  CircleDot,
  Clock,
  Flag,
  Hand,
  Lightbulb,
  LogOut,
  Mic,
  MicOff,
  Repeat,
  ThumbsUp,
  Users,
  Volume2,
} from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { useSpeech } from '@/app/lib/speech'
import { Lania } from '@/app/components/illustrations/Lania'
import { PersonAvatar } from '@/app/components/illustrations/PersonAvatar'
import { Badge } from '@/app/components/ui/Badge'
import { Button, ButtonLink, IconButton } from '@/app/components/ui/Button'
import { Modal } from '@/app/components/ui/Modal'
import { Switch } from '@/app/components/ui/Switch'
import { Tabs } from '@/app/components/ui/Tabs'
import { VoiceWave } from '@/app/components/exercise/VoiceWave'
import { ROOMS, ROOM_BY_ID } from '@/app/data/rooms'
import { PEOPLE, type PersonId } from '@/app/data/people'
import { usePreferences } from '@/app/state/preferences'
import { NORMS } from './Rooms'

type Who = PersonId | 'lania'
interface Line {
  who: Who
  text: string
}

const SCRIPT: Line[] = [
  { who: 'lania', text: "Welcome back, everyone! Round 2: we chose Villa de Leyva. Now let's pick activities. Diego, would you like to start?" },
  { who: 'diego', text: "Sure! I think we could rent bikes in the morning. It's cheap and fun." },
  { who: 'lania', text: 'Great idea, Diego. Camila, what do you think about the bikes?' },
  { who: 'camila', text: "I like it, but I'm not very good on a bike. Maybe we can also visit the fossil museum?" },
  { who: 'mateo', text: 'Good point, Camila. The museum is near the main square, so we can walk there.' },
  { who: 'lania', text: "I love how you're building on each other's ideas. Valentina, what would you add for the evening?" },
]
const YOUR_LINE = 'How about having dinner in the main square? There are nice restaurants and it is not expensive.'
const AFTER: Line[] = [
  { who: 'lania', text: 'Perfect, Valentina! That completes our activities. Last step: the budget. Mateo, can you check the bus prices?' },
  { who: 'mateo', text: 'Yes! The bus is about twenty dollars each way, so we are still under three hundred.' },
]

const PHRASES = [
  { en: 'How about…?', es: '¿Qué tal si…?' },
  { en: "I'd rather…", es: 'Preferiría…' },
  { en: 'That sounds great, but…', es: 'Suena genial, pero…' },
  { en: 'What do you think, Camila?', es: '¿Qué opinas, Camila?' },
  { en: 'Could you say that again, please?', es: '¿Puedes repetirlo, por favor?' },
]

const SEATS: PersonId[] = ['diego', 'camila', 'mateo', 'valentina']

function Tile({ who, speaking, hand, muted, you }: { who: PersonId; speaking: boolean; hand?: boolean; muted?: boolean; you?: boolean }) {
  const p = PEOPLE[who]
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-violet-50 p-3 pt-6 ring-2 transition-[box-shadow] duration-300 sm:p-4 sm:pt-8',
        speaking ? 'ring-mint-300 shadow-[0_0_0_6px_rgb(120_200_187/0.18)]' : 'ring-line',
      )}
    >
      {hand && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-300 px-2 py-1 text-xs font-bold text-ink">
          <Hand size={13} aria-hidden /> Mano
        </span>
      )}
      <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-surface/90 text-ink shadow-soft" role="img" aria-label={muted ? 'Micrófono apagado' : 'Micrófono encendido'}>
        {muted ? <MicOff size={15} aria-hidden /> : speaking ? <VoiceWave active bars={3} className="h-3.5 text-mint-700" /> : <Mic size={15} aria-hidden />}
      </span>
      <div className="h-24 w-24 overflow-hidden rounded-full bg-violet-200 sm:h-28 sm:w-28">
        <PersonAvatar look={p.look} speaking={speaking} />
      </div>
      <p className="mt-2 text-sm font-bold text-ink">
        {p.name}
        {you && <span className="font-medium text-violet-700"> (tú)</span>}
      </p>
      <p className="text-xs text-violet-700">
        {p.city} · {p.country}
      </p>
    </div>
  )
}

/** I · Sala en vivo: cuatro estudiantes y Lania como moderadora. */
export function RoomLive() {
  const { roomId } = useParams()
  const room = (roomId && ROOM_BY_ID[roomId]) || ROOMS[0]
  const { prefs, setPref } = usePreferences()
  const { speak, stop } = useSpeech()
  const [lines, setLines] = useState<Line[]>([])
  const [idx, setIdx] = useState(0)
  const [speaker, setSpeaker] = useState<Who | null>(null)
  const [myTurn, setMyTurn] = useState(false)
  const [done, setDone] = useState(false)
  const [muted, setMuted] = useState(true)
  const [hand, setHand] = useState(false)
  const [audio, setAudio] = useState(false)
  const [tab, setTab] = useState<'actividad' | 'frases' | 'turnos' | 'normas'>('actividad')
  const [reaction, setReaction] = useState(0)
  const [report, setReport] = useState(false)
  const [reported, setReported] = useState(false)
  const [elapsed, setElapsed] = useState(6 * 60 + 12)
  const timer = useRef<number | null>(null)
  const queue = useMemo(() => SCRIPT.slice(idx), [idx])

  const say = (line: Line, after: () => void) => {
    setSpeaker(line.who)
    setLines((l) => [...l, line])
    if (audio) speak(line.text, { lang: 'en', rate: prefs.audioRate, pitch: line.who === 'lania' ? 1.05 : line.who === 'camila' ? 1.2 : 0.85, onEnd: after })
    else timer.current = window.setTimeout(after, Math.max(2600, line.text.split(' ').length * 330))
  }

  useEffect(() => {
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    if (room.status !== 'live' || myTurn || done) return
    if (idx >= SCRIPT.length) {
      setSpeaker(null)
      setMyTurn(true)
      return
    }
    const id = window.setTimeout(() => say(SCRIPT[idx], () => setIdx((i) => i + 1)), idx === 0 ? 700 : 500)
    return () => {
      window.clearTimeout(id)
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [idx, myTurn, done, room.status])

  useEffect(() => () => stop(), [stop])

  const speakNow = () => {
    setMuted(false)
    setHand(false)
    setMyTurn(false)
    say({ who: 'valentina', text: YOUR_LINE }, () => {
      say(AFTER[0], () =>
        say(AFTER[1], () => {
          setSpeaker(null)
          setDone(true)
          setMuted(true)
        }),
      )
    })
  }

  const repeatLast = () => {
    const last = [...lines].reverse().find((l) => l.who !== 'lania' && l.who !== 'valentina')
    if (!last) return
    const line = { who: 'lania' as const, text: `Of course! ${PEOPLE[last.who as PersonId].name} said: “${last.text}”` }
    setLines((l) => [...l, line])
    if (audio) speak(line.text, { lang: 'en', rate: 0.85 })
  }

  if (room.status !== 'live') {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas p-6 text-ink">
        <div className="max-w-md text-center">
          <div className="mx-auto h-28 w-28 overflow-hidden rounded-full bg-mist">
            <Lania crop="head" expression="welcome" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-extrabold">{room.name}</h1>
          <p className="mt-2 text-violet-700">
            La sala abre {room.when.toLowerCase()}. {room.people.length} personas ya reservaron su lugar.
          </p>
          <ButtonLink to="/app/salones" variant="coral" className="mt-6">
            Volver a los salones
          </ButtonLink>
        </div>
      </div>
    )
  }

  const spoke = new Set(lines.map((l) => l.who))
  const activities = (spoke.has('diego') ? 1 : 0) + (spoke.has('camila') ? 1 : 0) + (spoke.has('valentina') ? 1 : 0)
  const current = lines[lines.length - 1]
  const mm = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink lg:h-dvh lg:flex-row">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col" aria-label="Sala en vivo">
        <header className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
          <ButtonLink to="/app/salones" variant="secondary" size="sm" icon={ArrowLeft}>
            <span className="sr-only sm:not-sr-only">Salones</span>
          </ButtonLink>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">
              {room.name} <span className="font-normal text-violet-700">· {room.topic}</span>
            </p>
            <p className="flex items-center gap-2 text-xs text-violet-700">
              <span className="inline-flex items-center gap-1 font-bold text-mint-700">
                <CircleDot size={12} aria-hidden /> En vivo {mm}
              </span>
              · <Users size={12} aria-hidden /> 4 estudiantes + Lania · {room.level}
            </p>
          </div>
          <div className="hidden sm:block">
            <Switch tone="light" checked={audio} onChange={setAudio} label="Audio de la sala" hideLabel />
          </div>
          <span className="hidden text-xs text-violet-700 sm:inline">Audio</span>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
          <div className="grid flex-1 grid-cols-2 grid-rows-[auto_1fr_1fr] gap-3 sm:gap-4 xl:grid-cols-4 xl:grid-rows-[auto_1fr]">
            <div
              className={cn(
                'relative col-span-2 flex items-center gap-4 overflow-hidden rounded-3xl bg-mist p-4 ring-2 transition-[box-shadow] duration-300 xl:col-span-4',
                speaker === 'lania' ? 'ring-coral-300' : 'ring-line',
              )}
            >
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-violet-200 sm:h-28 sm:w-28">
                <Lania crop="head" expression={speaker === 'lania' ? 'explaining' : myTurn ? 'listening' : 'neutral'} talking={speaker === 'lania'} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-lg font-bold">Lania</p>
                  <Badge tone="coral">Moderadora IA</Badge>
                  {speaker === 'lania' && <VoiceWave active bars={5} className="text-coral-700" />}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-violet-700">Reparte turnos, propone preguntas y comparte frases útiles. Corrige solo si se lo pides.</p>
              </div>
            </div>
            {SEATS.map((p) => (
              <Tile key={p} who={p} speaking={speaker === p} you={p === 'valentina'} hand={p === 'valentina' ? hand : false} muted={p === 'valentina' ? muted : false} />
            ))}
          </div>

          <div className="relative min-h-20">
            {prefs.subtitles && current && (
              <p key={lines.length} className="reading animate-fade-in rounded-3xl bg-ink/5 px-5 py-3.5 text-base sm:text-lg" aria-live="polite">
                <span className={cn('font-bold', current.who === 'lania' ? 'text-coral-700' : 'text-mint-700')}>
                  {current.who === 'lania' ? 'Lania' : PEOPLE[current.who].name}:{' '}
                </span>
                {current.text}
              </p>
            )}
            {myTurn && (
              <div className="mt-3 animate-pop rounded-3xl bg-coral-300 p-4 text-ink">
                <p className="font-bold">Tu turno, Valentina</p>
                <p className="mt-0.5 text-sm">
                  Idea: “How about having dinner in the main square?” · Tómate tu tiempo, el grupo te espera.
                </p>
              </div>
            )}
            {done && (
              <div className="mt-3 animate-pop rounded-3xl bg-mint-300 p-4 text-ink">
                <p className="font-bold">¡Ronda 2 completada en equipo!</p>
                <p className="mt-0.5 text-sm">Participaron las 4 personas. Siguiente ronda en 1 minuto: presupuesto final.</p>
              </div>
            )}
            {reaction > 0 && (
              <span key={reaction} className="pointer-events-none absolute -top-10 right-6 inline-flex animate-fade-up items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-ink shadow-lift">
                <ThumbsUp size={15} className="text-violet-600" aria-hidden /> ¡Buena idea!
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3" role="toolbar" aria-label="Controles de la sala">
            {myTurn ? (
              <Button variant="coral" size="lg" icon={Mic} onClick={speakNow}>
                Hablar ahora
              </Button>
            ) : (
              <IconButton icon={muted ? MicOff : Mic} label={muted ? 'Activar micrófono' : 'Silenciar micrófono'} variant="light" size="lg" pressed={!muted} onClick={() => setMuted((m) => !m)} />
            )}
            <IconButton
              icon={Hand}
              label={hand ? 'Bajar la mano' : 'Levantar la mano'}
              variant="light"
              size="lg"
              pressed={hand}
              className={cn(hand && 'bg-amber-300 text-ink hover:bg-amber-300')}
              onClick={() => setHand((h) => !h)}
            />
            <IconButton icon={Repeat} label="Pedir que repitan" variant="light" size="lg" onClick={repeatLast} />
            <IconButton icon={ThumbsUp} label="Apoyar la idea" variant="light" size="lg" onClick={() => setReaction((r) => r + 1)} />
            <IconButton
              icon={Captions}
              label={prefs.subtitles ? 'Ocultar subtítulos' : 'Mostrar subtítulos'}
              variant="light"
              size="lg"
              pressed={prefs.subtitles}
              onClick={() => setPref('subtitles', !prefs.subtitles)}
            />
            <ButtonLink to="/app/salones" variant="danger" icon={LogOut} className="h-14">
              Salir
            </ButtonLink>
          </div>
        </div>
      </section>

      <aside className="w-full shrink-0 bg-surface text-ink lg:h-dvh lg:w-[24rem] lg:overflow-y-auto" aria-label="Panel de la sala">
        <div className="p-5">
          <Tabs
            label="Panel de la sala"
            idPrefix="room"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'actividad', label: 'Actividad' },
              { id: 'frases', label: 'Frases' },
              { id: 'turnos', label: 'Turnos' },
              { id: 'normas', label: 'Normas' },
            ]}
          />
          <div id={`room-panel-${tab}`} role="tabpanel" aria-labelledby={`room-tab-${tab}`} className="mt-5 space-y-4">
            {tab === 'actividad' && (
              <>
                <div className="rounded-3xl bg-violet-50 p-4 ring-1 ring-violet-100">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">Ronda 2 de 3 · Actividades</p>
                  <p className="reading mt-1.5 font-semibold text-ink">Planear un fin de semana en Villa de Leyva con US$300 por persona.</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">Meta del grupo</p>
                  <ul className="mt-2 space-y-2">
                    {[
                      { label: 'Destino: Villa de Leyva', ok: true },
                      { label: `Actividades (${Math.min(3, activities)}/3)`, ok: activities >= 3 },
                      { label: 'Presupuesto por persona', ok: done },
                    ].map((g) => (
                      <li key={g.label} className="flex items-center gap-2.5 text-sm">
                        <span className={cn('grid h-6 w-6 place-items-center rounded-full', g.ok ? 'bg-mint-600 text-white' : 'ring-2 ring-line-strong')}>
                          {g.ok && <Check size={14} aria-hidden />}
                        </span>
                        <span className={g.ok ? 'font-semibold text-ink' : 'text-ink-soft'}>{g.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-coral-50 p-4 ring-1 ring-coral-100">
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-coral-200">
                    <Lania crop="head" expression="thinking" animated={false} />
                  </span>
                  <p className="reading text-sm text-ink">
                    {spoke.has('camila') && spoke.has('valentina')
                      ? 'Todas las personas han participado en esta ronda. ¡Así se construye en equipo!'
                      : !spoke.has('camila')
                        ? 'Camila aún no ha hablado en esta ronda. La invitaré con una pregunta abierta.'
                        : 'Valentina, te toca pronto. Si quieres, prepara tu idea con las frases útiles.'}
                  </p>
                </div>
                <p className="flex items-center gap-2 text-sm text-ink-soft">
                  <Clock size={15} aria-hidden /> Participación: {[...spoke].filter((w) => w !== 'lania').length} de 4 estudiantes han hablado
                </p>
              </>
            )}
            {tab === 'frases' && (
              <ul className="space-y-2">
                {PHRASES.map((p) => (
                  <li key={p.en} className="flex items-center gap-3 rounded-2xl bg-mist p-3">
                    <Lightbulb size={17} className="shrink-0 text-amber-700" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink">{p.en}</span>
                      <span className="block text-sm text-ink-soft">{p.es}</span>
                    </span>
                    <IconButton icon={Volume2} label={`Escuchar: ${p.en}`} size="sm" onClick={() => speak(p.en, { lang: 'en', rate: prefs.audioRate })} />
                  </li>
                ))}
              </ul>
            )}
            {tab === 'turnos' && (
              <ol className="space-y-2">
                {(myTurn ? [{ who: 'valentina' as Who, text: '' }] : queue.filter((l) => l.who !== 'lania').slice(0, 3)).map((l, i) => (
                  <li key={`${l.who}-${i}`} className={cn('flex items-center gap-3 rounded-2xl p-3 ring-1', i === 0 ? 'bg-mint-50 ring-mint-200' : 'ring-line')}>
                    <span className="h-9 w-9 overflow-hidden rounded-full bg-violet-100">
                      <PersonAvatar look={PEOPLE[l.who as PersonId].look} />
                    </span>
                    <span className="flex-1 font-semibold text-ink">
                      {PEOPLE[l.who as PersonId].name}
                      {l.who === 'valentina' && ' (tú)'}
                    </span>
                    <Badge tone={i === 0 ? 'mint' : 'neutral'}>{i === 0 ? 'Ahora / siguiente' : `En ${i} ${i === 1 ? 'turno' : 'turnos'}`}</Badge>
                  </li>
                ))}
                {!myTurn && !done && (
                  <li className="flex items-center gap-3 rounded-2xl p-3 ring-1 ring-line">
                    <span className="h-9 w-9 overflow-hidden rounded-full bg-mint-100">
                      <PersonAvatar look={PEOPLE.valentina.look} />
                    </span>
                    <span className="flex-1 font-semibold text-ink">Valentina (tú)</span>
                    <Badge tone={hand ? 'amber' : 'neutral'}>{hand ? 'Mano levantada' : 'Pronto'}</Badge>
                  </li>
                )}
                {done && <li className="rounded-2xl bg-mint-50 p-3 text-sm font-semibold text-mint-800">Ronda completada. Lania abrirá la siguiente.</li>}
              </ol>
            )}
            {tab === 'normas' && (
              <>
                <ul className="space-y-2">
                  {NORMS.map((n) => (
                    <li key={n.title} className="rounded-2xl bg-mist p-3">
                      <p className="font-semibold text-ink">{n.title}</p>
                      <p className="text-sm text-ink-soft">{n.text}</p>
                    </li>
                  ))}
                </ul>
                {reported ? (
                  <p className="rounded-2xl bg-mint-50 p-3 text-sm font-semibold text-mint-800">Gracias por avisar. Lo revisaremos con cuidado.</p>
                ) : (
                  <Button variant="ghost" icon={Flag} onClick={() => setReport(true)}>
                    Reportar un problema
                  </Button>
                )}
              </>
            )}
          </div>
          <p className="mt-6 text-xs text-ink-soft">
            Simulación de prototipo: las voces y transcripciones de la sala son de ejemplo. <Link className="font-semibold text-violet-700 underline-offset-2 hover:underline" to="/app/salones">Ver otros salones</Link>
          </p>
        </div>
      </aside>

      <Modal
        open={report}
        onClose={() => setReport(false)}
        title="Reportar un problema"
        description="Tu reporte es confidencial. Las personas involucradas no sabrán que fuiste tú."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReport(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setReported(true)
                setReport(false)
              }}
            >
              Enviar reporte
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">Lania pausará la ronda si es necesario y el equipo de comunidad revisará la grabación de texto de la sala.</p>
      </Modal>
    </div>
  )
}
