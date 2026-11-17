import { ArrowRight, Check, Clock, MessagesSquare, RotateCcw, Volume2 } from 'lucide-react'
import { cn } from '@/ui/lib/cn'
import { useSpeech } from '@/ui/lib/speech'
import { Lania } from '@/ui/components/illustrations/Lania'
import { Badge } from '@/ui/components/ui/Badge'
import { Button, ButtonLink } from '@/ui/components/ui/Button'
import { Segmented } from '@/ui/components/ui/Segmented'
import { Switch } from '@/ui/components/ui/Switch'
import { CONVERSATIONS, type Conversation, type Correction } from '@/ui/data/conversations'
import { usePreferences, type AudioRate, type CorrectionTiming } from '@/ui/state/preferences'

export interface Msg {
  id: number
  who: 'lania' | 'you'
  text: string
  lang: 'en' | 'es'
  kind?: 'feedback'
  simulated?: boolean
}

export interface Collected {
  correction: Correction
  fixed: boolean
  turn: number
}

export function SetupPanel({
  convId,
  onPick,
  rate,
  onRate,
  onStart,
}: {
  convId: string
  onPick: (id: string) => void
  rate: AudioRate
  onRate: (r: AudioRate) => void
  onStart: () => void
}) {
  const { prefs, setPref } = usePreferences()
  return (
    <div className="mx-auto grid w-full max-w-5xl items-center gap-10 py-6 lg:grid-cols-[1fr_20rem]">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-ink sm:text-4xl">¿De qué quieres hablar hoy?</h1>
        <p className="mt-3 max-w-xl text-lg text-ink-soft">Como una clase particular: Lania pregunta, te escucha y te ayuda a decirlo mejor.</p>
        <div role="radiogroup" aria-label="Tema de conversación" className="mt-8 grid gap-3 sm:grid-cols-2">
          {CONVERSATIONS.map((c) => {
            const on = c.id === convId
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onPick(c.id)}
                className={cn(
                  'flex items-center gap-4 rounded-3xl p-4 text-left ring-2 transition-colors',
                  on ? 'bg-mist ring-coral-300' : 'bg-surface ring-line hover:bg-mist',
                )}
              >
                <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', on ? 'bg-coral-300 text-ink' : 'bg-mist text-ink')}>
                  <c.icon size={22} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-ink">{c.title}</span>
                    <Badge tone="violet">{c.level}</Badge>
                  </span>
                  <span className="mt-0.5 block text-sm text-violet-700">{c.desc}</span>
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-8 grid gap-5 rounded-3xl bg-surface p-5 ring-1 ring-line sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">Correcciones</p>
            <Segmented<CorrectionTiming>
              label="Momento de las correcciones"
              tone="light"
              block
              value={prefs.corrections}
              onChange={(v) => setPref('corrections', v)}
              options={[
                { value: 'end', label: 'Al final' },
                { value: 'moment', label: 'En el momento' },
              ]}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">Velocidad de Lania</p>
            <Segmented<AudioRate>
              label="Velocidad de voz"
              tone="light"
              block
              value={rate}
              onChange={onRate}
              options={[
                { value: 0.75, label: '0.75×' },
                { value: 1, label: '1×' },
                { value: 1.25, label: '1.25×' },
              ]}
            />
          </div>
          <Switch tone="light" checked={prefs.subtitles} onChange={(v) => setPref('subtitles', v)} label="Subtítulos" description="Muestra lo que dice Lania." />
          <Switch tone="light" checked={prefs.laniaVoice} onChange={(v) => setPref('laniaVoice', v)} label="Voz de Lania" description="Escucha su voz en inglés." />
        </div>
        <Button variant="coral" size="lg" className="mt-8" iconRight={ArrowRight} onClick={onStart}>
          Empezar conversación
        </Button>
      </div>
      <div className="relative mx-auto hidden w-full max-w-80 lg:block">
        <div className="absolute inset-x-4 bottom-0 top-10 rounded-t-full bg-mist" aria-hidden />
        <Lania expression="welcome" crop="portrait" className="relative w-full" title="Lania te da la bienvenida" />
      </div>
    </div>
  )
}

export function HistoryList({ history }: { history: Msg[] }) {
  if (!history.length) return <p className="p-2 text-sm text-violet-700">Aquí aparecerá la conversación.</p>
  return (
    <ol className="space-y-3">
      {history.map((m) => (
        <li key={m.id} className={cn('flex', m.who === 'you' ? 'justify-end' : 'justify-start')}>
          <div
            className={cn(
              'max-w-[85%] rounded-3xl px-4 py-2.5 text-sm',
              m.who === 'you' && 'rounded-br-md bg-violet-600 text-white',
              m.who === 'lania' && !m.kind && 'rounded-bl-md bg-mist text-ink',
              m.kind === 'feedback' && 'rounded-bl-md bg-coral-300 text-ink',
            )}
          >
            <p className={cn('mb-0.5 text-xs font-bold', m.kind === 'feedback' ? 'text-coral-800' : m.who === 'you' ? 'text-violet-700' : 'text-coral-700')}>
              {m.who === 'you' ? 'Tú' : m.kind === 'feedback' ? 'Lania · corrección' : 'Lania'}
              {m.simulated && <span className="font-medium"> · voz (transcripción simulada)</span>}
            </p>
            <p className="reading">{m.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function SummaryPanel({
  conv,
  collected,
  turns,
  seconds,
  onRestart,
}: {
  conv: Conversation
  collected: Collected[]
  turns: number
  seconds: number
  onRestart: () => void
}) {
  const { speak } = useSpeech()
  const { prefs } = usePreferences()
  return (
    <div className="mx-auto w-full max-w-4xl animate-fade-up py-6">
      <div className="flex flex-col items-center text-center">
        <div className="h-28 w-28 overflow-hidden rounded-full bg-mist">
          <Lania crop="head" expression="celebrating" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-[-0.02em] text-ink">Resumen de tu conversación</h1>
        <p className="mt-2 text-violet-700">{conv.title} · Lo importante: hablaste y te hiciste entender.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Badge tone="violet" size="md" icon={Clock}>
            {Math.max(1, Math.round(seconds / 60))} min
          </Badge>
          <Badge tone="violet" size="md" icon={MessagesSquare}>
            {turns} intervenciones tuyas
          </Badge>
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <section className="rounded-3xl bg-surface p-5 ring-1 ring-line" aria-labelledby="wins">
          <h2 id="wins" className="font-bold text-mint-700">
            Lo hiciste muy bien
          </h2>
          <ul className="mt-3 space-y-2">
            {conv.wins.map((w) => (
              <li key={w} className="flex items-start gap-2 text-sm text-ink">
                <Check size={17} className="mt-0.5 shrink-0 text-mint-700" aria-hidden /> {w}
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-2xl bg-surface p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral-700">Frase nueva para tu repertorio</p>
            <p className="mt-1 text-lg font-bold text-ink">“{conv.phrase.en}”</p>
            <p className="text-sm text-violet-700">{conv.phrase.es}</p>
            <Button variant="light" size="sm" className="mt-3" icon={Volume2} onClick={() => speak(conv.phrase.en, { lang: 'en', rate: prefs.audioRate }, !prefs.laniaVoice)}>
              Escuchar
            </Button>
          </div>
        </section>
        <section className="rounded-3xl bg-surface p-5 ring-1 ring-line" aria-labelledby="fixes">
          <h2 id="fixes" className="font-bold text-coral-700">
            Corrijamos juntas
          </h2>
          {collected.length === 0 ? (
            <p className="mt-3 text-sm text-violet-700">Sin correcciones esta vez. ¡Conversación impecable!</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {collected.map((c, i) => (
                <li key={i} className="rounded-2xl bg-surface p-3.5">
                  <p className="text-sm text-ink-soft line-through">{c.correction.original}</p>
                  <p className="font-semibold text-mint-700">{c.correction.better}</p>
                  <p className="mt-1 text-sm text-violet-700">{c.correction.why}</p>
                  {c.fixed && (
                    <Badge tone="mint" className="mt-2" icon={Check}>
                      Lo corregiste en el momento
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink to="/app/aula?paso=3" variant="coral" size="lg" iconRight={ArrowRight}>
          Practicar estas correcciones
        </ButtonLink>
        <Button variant="light" size="lg" icon={RotateCcw} onClick={onRestart}>
          Nueva conversación
        </Button>
      </div>
    </div>
  )
}
