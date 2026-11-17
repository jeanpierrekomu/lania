import { useMemo, useState } from 'react'
import { ArrowRight, CalendarClock, Check, Keyboard, Medal, Mic, RotateCcw, Send, Volume2 } from 'lucide-react'
import { cn } from '@/ui/lib/cn'
import { tone } from '@/ui/lib/tone'
import { useSpeech } from '@/ui/lib/speech'
import { checkText } from '@/ui/lib/writingCheck'
import { Badge } from '@/ui/components/ui/Badge'
import { Button, ButtonLink } from '@/ui/components/ui/Button'
import { TextArea } from '@/ui/components/ui/Field'
import { ProgressBar } from '@/ui/components/ui/Progress'
import { ChoiceOption, type ChoiceState } from '@/ui/components/exercise/ChoiceOption'
import { FeedbackBanner } from '@/ui/components/exercise/FeedbackBanner'
import { RecordingCard } from '@/ui/components/exercise/RecordingCard'
import { WordChip } from '@/ui/components/exercise/WordChip'
import { useLearner } from '@/ui/state/learner'
import { usePreferences } from '@/ui/state/preferences'
import { StepFrame, useHints, type StepProps } from './StepKit'

function ListenButton({ text }: { text: string }) {
  const { speak, speaking } = useSpeech()
  const { prefs } = usePreferences()
  return (
    <Button variant="ghost" size="sm" icon={Volume2} onClick={() => speak(text, { lang: 'en', rate: prefs.audioRate }, !prefs.laniaVoice)} aria-pressed={speaking}>
      Escuchar
    </Button>
  )
}

/* 1 · Recuerda — retrieval before the rule */
export function RecallStep({ say, next }: StepProps) {
  const options = ['Yesterday I study for my exam.', 'Yesterday I studied for my exam.', 'Yesterday I studying for my exam.']
  const [sel, setSel] = useState<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'wrong' | 'right'>('idle')
  const hintList = ['Fíjate en la palabra “yesterday”.', 'Los verbos regulares en pasado terminan en -ed (y → i + ed).']
  const hints = useHints(hintList.length)
  const check = () => {
    if (sel === 1) {
      setStatus('right')
      say('celebrating', '¡Exacto! Lo recordaste sin mirar. Recordar así fortalece la memoria más que releer.')
    } else {
      setStatus('wrong')
      say('correcting', 'Buen intento. “Yesterday” nos dice que ya pasó… ¿el verbo debería cambiar?')
    }
  }
  const state = (i: number): ChoiceState =>
    status === 'right' ? (i === 1 ? 'correct' : 'dimmed') : status === 'wrong' && i === sel ? 'incorrect' : sel === i ? 'selected' : 'idle'
  return (
    <StepFrame
      eyebrow="Recuerda · sin mirar apuntes"
      title="¿Cómo dirías «Ayer estudié para mi examen»?"
      hints={hintList}
      hintsRevealed={hints.revealed}
      onHint={() => {
        hints.more()
        say('thinking', hintList[Math.min(hints.revealed, hintList.length - 1)])
      }}
      explanation={<p>“Study” es regular: en pasado la y cambia a i y se agrega -ed → <strong>studied</strong>.</p>}
      feedback={
        status === 'right' ? (
          <FeedbackBanner kind="correct" title="¡Correcto!">
            Yesterday I <strong>studied</strong> for my exam.
          </FeedbackBanner>
        ) : status === 'wrong' ? (
          <FeedbackBanner kind="almost" title="Casi. Inténtalo otra vez">
            Elige otra opción: no pierdes nada por intentarlo.
          </FeedbackBanner>
        ) : null
      }
      primary={
        status === 'right' ? (
          <Button onClick={next} iconRight={ArrowRight}>
            Continuar
          </Button>
        ) : (
          <Button onClick={check} disabled={sel === null}>
            Comprobar
          </Button>
        )
      }
    >
      <div role="radiogroup" aria-label="Opciones" className="grid gap-3">
        {options.map((o, i) => (
          <ChoiceOption
            key={o}
            letter={String.fromCharCode(65 + i)}
            label={o}
            state={state(i)}
            disabled={status === 'right'}
            onSelect={() => {
              setSel(i)
              if (status === 'wrong') setStatus('idle')
            }}
          />
        ))}
      </div>
    </StepFrame>
  )
}

/* 2 · Regla — one idea, two ways to explain it */
export function RuleStep({ say, next }: StepProps) {
  const [alt, setAlt] = useState(false)
  return (
    <StepFrame
      eyebrow="Regla · una idea"
      title="El pasado simple: acciones que ya terminaron"
      instruction="Si la acción ocurrió y terminó en un momento del pasado, el verbo cambia."
      primary={
        <Button onClick={next} iconRight={ArrowRight}>
          Entendido, practiquemos
        </Button>
      }
    >
      {!alt ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-mint-50 p-5 ring-1 ring-mint-100">
              <p className="text-sm font-bold text-mint-800">Regulares: + ed</p>
              <ul className="reading mt-2 space-y-1 text-ink">
                <li>work → <strong>worked</strong></li>
                <li>study → <strong>studied</strong></li>
                <li>visit → <strong>visited</strong></li>
              </ul>
            </div>
            <div className="rounded-3xl bg-coral-50 p-5 ring-1 ring-coral-100">
              <p className="text-sm font-bold text-coral-800">Irregulares: cambian</p>
              <ul className="reading mt-2 space-y-1 text-ink">
                <li>go → <strong>went</strong></li>
                <li>see → <strong>saw</strong></li>
                <li>have → <strong>had</strong></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-violet-50 p-4 ring-1 ring-violet-100">
            <span className="text-sm font-bold text-violet-800">Palabras pista:</span>
            {['yesterday', 'last week', 'two days ago', 'in 2019'].map((w) => (
              <Badge key={w} tone="outline">
                {w}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-surface p-5 ring-1 ring-line">
          <p className="text-sm font-bold text-ink">Piénsalo como una línea de tiempo</p>
          <div className="relative mt-8 h-2 rounded-full bg-mist" aria-hidden>
            <span className="absolute left-[22%] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-coral-500 ring-4 ring-coral-100" />
            <span className="absolute left-[60%] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-violet-600 ring-4 ring-violet-100" />
          </div>
          <div className="mt-3 grid grid-cols-[22%_38%_1fr] text-xs font-semibold text-ink-soft">
            <span />
            <span className="-ml-6">Ayer (terminó)</span>
            <span className="-ml-4">Ahora</span>
          </div>
          <p className="reading mt-4 text-ink">
            Todo lo que está a la izquierda de “ahora” y ya terminó usa pasado: <strong>Yesterday I went</strong>, <strong>last week I saw</strong>.
          </p>
        </div>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="mt-4"
        onClick={() => {
          setAlt((v) => !v)
          say('explaining', alt ? 'Volvamos a la tabla: regulares con -ed, irregulares cambian.' : 'Otra forma de verlo: si está antes de “ahora” y terminó, va en pasado.')
        }}
      >
        {alt ? 'Ver la tabla' : 'Ver otra explicación'}
      </Button>
    </StepFrame>
  )
}

/* 3 · Practica — the brief's signature moment */
export function PracticeStep({ say, next }: StepProps) {
  const { learner } = useLearner()
  const options = ['go', 'went', 'goed', 'gone']
  const [sel, setSel] = useState<string | null>(null)
  const [result, setResult] = useState<'idle' | 'wrong' | 'right'>('idle')
  const [tries, setTries] = useState(0)
  const hintList = [tone('hint', learner.teacherStyle), 'Empieza con “w” y tiene 4 letras.']
  const hints = useHints(hintList.length)
  const wrongLine: Record<string, string> = {
    go: tone('almost', learner.teacherStyle),
    goed: 'Buena lógica: muchos verbos usan -ed. Pero go es rebelde y cambia por completo. ¿Lo intentas otra vez?',
    gone: '“Gone” existe, pero es para “I have gone”. Con yesterday usamos otra forma. ¿Cuál será?',
  }
  const check = () => {
    if (!sel) return
    if (sel === 'went') {
      setResult('right')
      say('celebrating', tone('correct', learner.teacherStyle))
    } else {
      setResult('wrong')
      setTries((t) => t + 1)
      say('correcting', wrongLine[sel])
    }
  }
  return (
    <StepFrame
      eyebrow="Practica · completa la frase"
      title={
        <span>
          Yesterday I{' '}
          <span
            className={cn(
              'inline-block min-w-24 rounded-xl border-b-4 px-2 text-center',
              result === 'right' ? 'border-mint-600 bg-mint-100 text-mint-800' : sel ? 'border-violet-600 bg-violet-50 text-violet-800' : 'border-line-strong text-ink-faint',
            )}
          >
            {sel ?? '____'}
          </span>{' '}
          to university.
        </span>
      }
      instruction="Elige la forma correcta del verbo go."
      hints={hintList}
      hintsRevealed={hints.revealed}
      onHint={() => {
        hints.more()
        say('thinking', hintList[Math.min(hints.revealed, hintList.length - 1)])
      }}
      explanation={
        <p>
          <strong>go → went</strong> es irregular: no lleva -ed. “Gone” se usa con have (I have gone). Con yesterday, last week o ago: <strong>went</strong>.
        </p>
      }
      feedback={
        result === 'right' ? (
          <FeedbackBanner kind="correct" title="¡Eso es! Yesterday I went to university." actions={<ListenButton text="Yesterday I went to university." />}>
            Lo repasaremos mañana en un contexto nuevo para que se quede contigo.
          </FeedbackBanner>
        ) : result === 'wrong' ? (
          <FeedbackBanner kind="almost" title="¡Casi! Prueba otra opción">
            {tries >= 2 ? 'Si quieres, abre la explicación: está bien apoyarse.' : 'Lania te dejó una pista arriba. Tómate tu tiempo.'}
          </FeedbackBanner>
        ) : null
      }
      primary={
        result === 'right' ? (
          <Button onClick={next} iconRight={ArrowRight}>
            Continuar
          </Button>
        ) : (
          <Button onClick={check} disabled={!sel}>
            Responder
          </Button>
        )
      }
    >
      <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Formas del verbo">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={sel === o}
            disabled={result === 'right'}
            onClick={() => {
              setSel(o)
              if (result === 'wrong') setResult('idle')
            }}
            className={cn(
              'h-14 min-w-24 rounded-2xl px-5 text-lg font-bold ring-2 transition-colors',
              result === 'right' && o === 'went'
                ? 'bg-mint-50 text-mint-800 ring-mint-600'
                : result === 'wrong' && sel === o
                  ? 'animate-nudge bg-coral-50 text-coral-800 ring-coral-600'
                  : sel === o
                    ? 'bg-violet-50 text-violet-800 ring-violet-600'
                    : 'bg-surface text-ink ring-line hover:ring-violet-300',
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </StepFrame>
  )
}

const BANK = ['movie', 'I', 'saw', 'see', 'Last', 'an', 'a', 'week', 'amazing']
const TARGETS = ['Last week I saw an amazing movie', 'I saw an amazing movie last week']

/* 4 · Construye — sentence building */
export function BuildStep({ say, next }: StepProps) {
  const [placed, setPlaced] = useState<number[]>([])
  const [result, setResult] = useState<'idle' | 'wrong' | 'right'>('idle')
  const hintList = ['Empieza por cuándo: “Last week…”.', 'see → saw. Y antes de “amazing” va “an”.']
  const hints = useHints(hintList.length)
  const sentence = placed.map((i) => BANK[i]).join(' ')
  const check = () => {
    const norm = sentence.toLowerCase()
    if (TARGETS.some((t) => t.toLowerCase() === norm)) {
      setResult('right')
      say('celebrating', '¡Perfecta! Usaste saw sin dudar. Eso es dominar, no memorizar.')
    } else {
      setResult('wrong')
      say(
        'correcting',
        norm.includes('see')
          ? 'Te entiendo, pero “last week” pide pasado: see → saw.'
          : norm.includes(' a amazing')
            ? 'Casi: antes de sonido vocal usamos “an”, an amazing.'
            : 'Revisa el orden: cuándo + quién + verbo + qué.',
      )
    }
  }
  return (
    <StepFrame
      eyebrow="Construye · toca las palabras"
      title="«La semana pasada vi una película increíble»"
      instruction="Arma la frase en inglés. Toca una palabra colocada para devolverla."
      hints={hintList}
      hintsRevealed={hints.revealed}
      onHint={() => {
        hints.more()
        say('thinking', hintList[Math.min(hints.revealed, hintList.length - 1)])
      }}
      explanation={<p>Estructura: [cuándo] + sujeto + verbo en pasado + complemento. Sobran dos palabras: “see” y “a”.</p>}
      feedback={
        result === 'right' ? (
          <FeedbackBanner kind="correct" title="¡Muy bien construida!" actions={<ListenButton text="Last week I saw an amazing movie." />}>
            {sentence}.
          </FeedbackBanner>
        ) : result === 'wrong' ? (
          <FeedbackBanner kind="almost" title="Casi lo tienes">
            Ajusta una o dos palabras y vuelve a comprobar.
          </FeedbackBanner>
        ) : null
      }
      primary={
        result === 'right' ? (
          <Button onClick={next} iconRight={ArrowRight}>
            Continuar
          </Button>
        ) : (
          <Button onClick={check} disabled={placed.length < 4}>
            Comprobar
          </Button>
        )
      }
    >
      <div className="min-h-20 rounded-3xl border-2 border-dashed border-line-strong bg-surface p-3" aria-label="Tu frase" aria-live="polite">
        {placed.length === 0 ? (
          <p className="p-2 text-ink-soft">Tu frase aparecerá aquí…</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {placed.map((i, pos) => (
              <WordChip
                key={`${i}-${pos}`}
                variant="placed"
                status={result === 'right' ? 'correct' : undefined}
                disabled={result === 'right'}
                aria-label={`Quitar ${BANK[i]}`}
                onClick={() => {
                  setPlaced(placed.filter((_, p) => p !== pos))
                  setResult('idle')
                }}
              >
                {BANK[i]}
              </WordChip>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {BANK.map((w, i) =>
          placed.includes(i) ? (
            <WordChip key={w} variant="ghost" aria-hidden tabIndex={-1}>
              {w}
            </WordChip>
          ) : (
            <WordChip
              key={w}
              disabled={result === 'right'}
              onClick={() => {
                setPlaced([...placed, i])
                setResult('idle')
              }}
            >
              {w}
            </WordChip>
          ),
        )}
      </div>
      {placed.length > 0 && result !== 'right' && (
        <Button variant="ghost" size="sm" icon={RotateCcw} className="mt-3" onClick={() => setPlaced([])}>
          Vaciar
        </Button>
      )}
    </StepFrame>
  )
}

const SIM_TRANSCRIPT = 'Last weekend I go to the cinema with my sister. We watched a comedy and it was really funny.'

/* 5 · Habla — produce, then get kind, specific feedback */
export function SpeakStep({ say, next }: StepProps) {
  const [mode, setMode] = useState<'voice' | 'text'>('voice')
  const [seconds, setSeconds] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [sent, setSent] = useState<string | null>(null)
  const issues = useMemo(() => (sent ? checkText(sent) : []), [sent])
  const submit = () => {
    const t = mode === 'voice' ? SIM_TRANSCRIPT : text.trim()
    setSent(t)
    const found = checkText(t)
    if (found.length) say('correcting', `¡Te entendí perfecto! Un detalle: “${found[0].original}” → “${found[0].suggestion}”. ${found[0].explanation}`)
    else say('celebrating', '¡Te entendí perfecto y sin errores de pasado! Así se cuenta una experiencia.')
  }
  return (
    <StepFrame
      eyebrow="Habla · 1 o 2 frases"
      title="What did you do last weekend?"
      instruction="Cuéntaselo a Lania en voz alta. Si prefieres, puedes escribir."
      feedback={
        sent ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
                {mode === 'voice' ? 'Lania escuchó (transcripción simulada en el prototipo)' : 'Tu respuesta'}
              </p>
              <p className="reading mt-1 text-ink">“{sent}”</p>
            </div>
            {issues.length ? (
              <FeedbackBanner kind="almost" title={`${issues.length === 1 ? 'Un detalle' : `${issues.length} detalles`} para sonar aún mejor`}>
                <ul className="space-y-1">
                  {issues.map((i) => (
                    <li key={i.id}>
                      <span className="text-ink-soft line-through">{i.original}</span> → <strong>{i.suggestion}</strong>
                    </li>
                  ))}
                </ul>
              </FeedbackBanner>
            ) : (
              <FeedbackBanner kind="correct" title="Pasado impecable">
                Usaste el pasado en todas tus acciones.
              </FeedbackBanner>
            )}
          </div>
        ) : null
      }
      primary={
        sent ? (
          <Button onClick={next} iconRight={ArrowRight}>
            Ver resumen
          </Button>
        ) : (
          <Button onClick={submit} icon={Send} disabled={mode === 'voice' ? !seconds : text.trim().split(/\s+/).length < 3}>
            Enviar a Lania
          </Button>
        )
      }
    >
      {!sent && (
        <>
          {mode === 'voice' ? (
            <RecordingCard
              maxSeconds={45}
              onChange={(s) => {
                setSeconds(s)
                if (s === null) return
                say('listening', 'Te escuché. Cuando quieras, envíamelo.')
              }}
            />
          ) : (
            <TextArea aria-label="Escribe tu respuesta" placeholder="Last weekend I…" value={text} onChange={(e) => setText(e.target.value)} />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            icon={mode === 'voice' ? Keyboard : Mic}
            onClick={() => setMode(mode === 'voice' ? 'text' : 'voice')}
          >
            {mode === 'voice' ? 'Prefiero escribir' : 'Prefiero hablar'}
          </Button>
        </>
      )}
    </StepFrame>
  )
}

/* 6 · Resumen — mastery is earned with evidence */
export function SummaryStep() {
  const done = ['Recordaste el pasado de study sin ayuda', 'Elegiste went en contexto', 'Construiste una frase con saw', 'Contaste tu fin de semana en pasado']
  return (
    <div className="flex flex-1 flex-col">
      <Badge tone="mint" size="md" icon={Check}>
        Lección completada
      </Badge>
      <h2 className="mt-4 font-display text-2xl font-extrabold tracking-[-0.015em] text-ink sm:text-3xl">Lo que lograste hoy</h2>
      <ul className="mt-5 space-y-2.5">
        {done.map((d) => (
          <li key={d} className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 ring-1 ring-line">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mint-600 text-white">
              <Check size={15} aria-hidden />
            </span>
            <span className="font-semibold text-ink">{d}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-coral-50 p-5 ring-1 ring-coral-100">
          <p className="flex items-center gap-2 text-sm font-bold text-coral-800">
            <Medal size={16} aria-hidden /> Reconocimiento por dominio
          </p>
          <p className="mt-2 font-bold text-ink">Pasado simple</p>
          <ProgressBar value={2} max={3} label="Pasado simple: 2 de 3 evidencias" barClassName="bg-coral-500" className="mt-3" />
          <p className="mt-2 text-sm text-ink-soft">2 de 3 evidencias. Úsalo bien en una conversación real y queda dominado.</p>
        </div>
        <div className="rounded-3xl bg-violet-50 p-5 ring-1 ring-violet-100">
          <p className="flex items-center gap-2 text-sm font-bold text-violet-800">
            <CalendarClock size={16} aria-hidden /> Próximo repaso
          </p>
          <p className="mt-2 font-bold text-ink">Mañana · 5 minutos</p>
          <p className="mt-2 text-sm text-ink-soft">Verbos irregulares en una historia corta, justo antes de que se te olviden.</p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap justify-end gap-2 border-t border-line pt-5 sm:mt-8">
        <ButtonLink to="/app" variant="ghost">
          Volver al inicio
        </ButtonLink>
        <ButtonLink to="/app/speaking" iconRight={ArrowRight}>
          Usarlo en una conversación
        </ButtonLink>
      </div>
    </div>
  )
}
