import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, BadgeCheck, CalendarDays, Check, ClipboardCheck, Info, Plus, RotateCcw, SlidersHorizontal, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { PersonAvatar } from '@/app/components/illustrations/PersonAvatar'
import { Lania } from '@/app/components/illustrations/Lania'
import { Badge } from '@/app/components/ui/Badge'
import { Button, ButtonLink } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { Eyebrow, Heading } from '@/app/components/ui/Typography'
import { PageContainer } from '@/app/components/layout/PageHeader'
import { useLearner, type Cefr } from '@/app/state/learner'
import { useUi } from '@/app/state/ui'
import { PEOPLE } from '@/app/data/people'
import { SKILLS, SKILL_BY_ID, TONE_CLASSES, type SkillId } from '@/app/data/skills'
import { GOAL_BY_ID, REVIEWS } from '@/app/data/content'

const LADDER: Cefr[] = ['A1', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1']
const START: Record<SkillId, Cefr> = { speaking: 'A2', listening: 'A2+', writing: 'A2', reading: 'B1', grammar: 'A2+' }

const MASTERED = [
  { title: 'Presentarte en una entrevista', date: '12 jun', evidence: '3 usos correctos en conversaciones distintas', skill: 'speaking' as SkillId },
  { title: 'Entender horarios en anuncios', date: '3 jun', evidence: '4 de 4 audios sin transcripción', skill: 'listening' as SkillId },
  { title: 'Pedir y pagar en un café', date: '28 may', evidence: 'Situación completada sin pistas', skill: 'speaking' as SkillId },
  { title: 'Describir tu rutina diaria', date: '15 may', evidence: '2 textos con presente simple correcto', skill: 'writing' as SkillId },
]

const ERRORS = [
  { title: 'Pasado de verbos irregulares', example: 'go → went · see → saw', before: 7, now: 3 },
  { title: 'Tercera persona con -s', example: 'she work → she works', before: 5, now: 2 },
  { title: 'Interested vs. interesting', example: 'I am interesting in → interested in', before: 4, now: 1 },
  { title: 'Preposiciones de tiempo', example: 'in Monday → on Monday', before: 3, now: 3 },
]

const ASSESSMENTS = [
  { date: '12 mar', name: 'Diagnóstico inicial', result: 'A2+ estimado', note: '10 preguntas · 5 habilidades' },
  { date: '2 abr', name: 'Mini evaluación · Unidad 1', result: '8 de 10 correctas', note: 'Presente simple y rutinas' },
  { date: '12 may', name: 'Diagnóstico de seguimiento', result: 'B1 estimado', note: 'Mejoraron listening y gramática' },
  { date: '10 jun', name: 'Speaking check · entrevista', result: 'Objetivo logrado', note: 'Evaluado por Lania con rúbrica de 4 criterios' },
]

const ADVANCES: { skill: SkillId; facts: { label: string; value: string }[] }[] = [
  {
    skill: 'speaking',
    facts: [
      { label: 'Conversaciones', value: '6 · 41 min hablando' },
      { label: 'Respuestas completas sin pasar al español', value: '2 → 9' },
      { label: 'Conectores que ya usas', value: 'but, because, so' },
    ],
  },
  {
    skill: 'writing',
    facts: [
      { label: 'Textos escritos', value: '4 · 3 reescrituras' },
      { label: 'Detalles por texto', value: '9 → 3' },
      { label: 'Correcciones aplicadas por ti', value: '17 de 21' },
    ],
  },
  {
    skill: 'listening',
    facts: [
      { label: 'Audios completados', value: '12' },
      { label: 'Entendidos a 1× sin transcripción', value: '3 → 8' },
      { label: 'Velocidad más usada', value: '0.75× → 1×' },
    ],
  },
]

const NEXT_WEEK = [
  { id: 'n1', title: 'Entrevista simulada con preguntas difíciles', why: 'Es la etapa 3 de tu misión y usa el pasado.', minutes: 10, to: '/app/speaking?tema=entrevista' },
  { id: 'n2', title: 'Repaso de verbos irregulares en una historia', why: 'Aún aparecen 3 veces por semana en tus errores.', minutes: 5, to: '/app/aula' },
  { id: 'n3', title: 'Correo formal: segunda versión', why: 'Tu Writing está un paso detrás de tus otras habilidades.', minutes: 15, to: '/app/writing' },
]

function Ladder({ start, now }: { start: Cefr; now: Cefr }) {
  const s = LADDER.indexOf(start)
  const n = LADDER.indexOf(now)
  return (
    <div className="flex items-center gap-1" aria-label={`De ${start} a ${now}`}>
      {LADDER.slice(0, 7).map((l, i) => (
        <div key={l} className="flex flex-1 flex-col items-center gap-1.5">
          <span
            className={cn(
              'h-2.5 w-full rounded-full',
              i < s ? 'bg-violet-200' : i <= n ? (i === n ? 'bg-primary' : 'bg-violet-400') : 'bg-mist',
              i === s && i !== n && 'ring-2 ring-violet-200 ring-offset-1',
            )}
          />
          <span className={cn('text-xs font-bold', i === n ? 'text-violet-700' : 'text-ink-faint')}>{l}</span>
        </div>
      ))}
    </div>
  )
}

/** J · Perfil y progreso académico */
export function Profile() {
  const { learner } = useLearner()
  const { openPreferences } = useUi()
  const [plan, setPlan] = useState<string[]>(['n1'])
  const goal = GOAL_BY_ID[learner.goal]

  return (
    <PageContainer wide className="space-y-6">
      <Card padding="lg" className="relative overflow-hidden">
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <span className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-mint-100 ring-4 ring-white shadow-soft">
            <PersonAvatar look={PEOPLE.valentina.look} title={learner.name} />
          </span>
          <div className="min-w-0 flex-1">
            <Eyebrow>Mi progreso</Eyebrow>
            <Heading level={1} size="lg" className="mt-1">
              {learner.name}
            </Heading>
            <p className="mt-1 text-ink-soft">
              Objetivo: <strong className="text-ink">{goal?.label}</strong> · Estudiando desde marzo 2025
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="flex items-center gap-3">
              <span className="grid h-16 min-w-16 place-items-center rounded-3xl bg-ink px-4 font-display text-2xl font-extrabold text-white">{learner.diagnostic.overall}</span>
              <p className="max-w-48 text-sm text-ink-soft">Nivel estimado con tu diagnóstico y 47 actividades corregidas.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" icon={SlidersHorizontal} onClick={openPreferences}>
                Preferencias
              </Button>
              <ButtonLink to="/diagnostico" variant="ghost" size="sm" icon={RotateCcw}>
                Repetir diagnóstico
              </ButtonLink>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card padding="lg" as="section" aria-labelledby="history-title" className="lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Heading level={2} size="sm" id="history-title">
                Historial de competencias
              </Heading>
              <p className="mt-1 text-sm text-ink-soft">Desde tu diagnóstico de marzo hasta hoy, por habilidad.</p>
            </div>
            <Badge tone="neutral" icon={Info}>
              Estimaciones MCER, no certificación
            </Badge>
          </div>
          <ul className="mt-6 space-y-5">
            {SKILLS.map((s) => {
              const est = learner.diagnostic.skills[s.id]
              const t = TONE_CLASSES[s.tone]
              return (
                <li key={s.id} className="grid items-center gap-3 sm:grid-cols-[13rem_1fr]">
                  <div className="flex items-center gap-3">
                    <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', t.soft, t.fg)}>
                      <s.icon size={18} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink">{s.label}</p>
                      <p className="text-xs text-ink-soft">
                        {START[s.id]} → {est.level} · confianza {est.confidence}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Ladder start={START[s.id]} now={est.level} />
                    <p className="mt-1 text-xs text-ink-soft">Evidencia: {est.evidence}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card padding="lg" as="section" aria-labelledby="mastered-title">
          <Heading level={2} size="sm" id="mastered-title">
            Habilidades dominadas
          </Heading>
          <p className="mt-1 text-sm text-ink-soft">Solo cuentan cuando las demuestras en contextos distintos.</p>
          <ul className="mt-5 space-y-3">
            {MASTERED.map((m) => (
              <li key={m.title} className="flex gap-3">
                <BadgeCheck size={20} className="mt-0.5 shrink-0 text-mint-600" aria-hidden />
                <span>
                  <span className="block text-sm font-bold text-ink">{m.title}</span>
                  <span className="block text-xs text-ink-soft">
                    {m.date} · {m.evidence}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card padding="lg" as="section" aria-labelledby="errors-title" className="lg:col-span-2">
          <Heading level={2} size="sm" id="errors-title">
            Errores recurrentes
          </Heading>
          <p className="mt-1 text-sm text-ink-soft">Veces que aparecieron en tus actividades: hace dos semanas → esta semana.</p>
          <ul className="mt-5 divide-y divide-line">
            {ERRORS.map((e) => {
              const better = e.now < e.before
              return (
                <li key={e.title} className="flex flex-wrap items-center gap-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">{e.title}</p>
                    <p className="text-sm text-ink-soft">{e.example}</p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                    {e.before} → {e.now}
                    <Badge tone={better ? 'mint' : 'neutral'} icon={better ? TrendingDown : Minus}>
                      {better ? 'Mejorando' : 'Estable'}
                    </Badge>
                  </span>
                  <ButtonLink to="/app/aula?paso=3" variant="soft" size="sm">
                    Practicar 5 min
                  </ButtonLink>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card padding="lg" as="section" aria-labelledby="reviews-title">
          <div className="flex items-center justify-between">
            <Heading level={2} size="sm" id="reviews-title">
              Próximos repasos
            </Heading>
            <CalendarDays size={20} className="text-violet-600" aria-hidden />
          </div>
          <ol className="mt-5 space-y-3">
            {REVIEWS.map((r) => {
              const s = SKILL_BY_ID[r.skill]
              return (
                <li key={r.id} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs font-bold uppercase text-ink-soft">{r.due}</span>
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', TONE_CLASSES[s.tone].bar)} aria-hidden />
                  <span className="min-w-0 flex-1 text-sm font-semibold text-ink">{r.title}</span>
                  <span className="text-xs text-ink-soft">{r.minutes}′</span>
                </li>
              )
            })}
          </ol>
        </Card>
      </div>

      <Card padding="lg" as="section" aria-labelledby="assess-title">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={20} className="text-violet-600" aria-hidden />
          <Heading level={2} size="sm" id="assess-title">
            Resultados de evaluaciones
          </Heading>
        </div>
        <div className="mt-5 overflow-x-auto" tabIndex={0} role="region" aria-label="Detalle del progreso por habilidad">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-[0.12em] text-ink-soft">
                <th className="py-2 pr-4 font-bold">Fecha</th>
                <th className="py-2 pr-4 font-bold">Evaluación</th>
                <th className="py-2 pr-4 font-bold">Resultado</th>
                <th className="py-2 font-bold">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ASSESSMENTS.map((a) => (
                <tr key={a.name}>
                  <td className="py-3 pr-4 text-ink-soft">{a.date}</td>
                  <td className="py-3 pr-4 font-semibold text-ink">{a.name}</td>
                  <td className="py-3 pr-4">
                    <Badge tone="violet">{a.result}</Badge>
                  </td>
                  <td className="py-3 text-ink-soft">{a.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <section aria-labelledby="advances-title">
        <Heading level={2} size="sm" id="advances-title">
          Avances en speaking, writing y listening
        </Heading>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {ADVANCES.map((a) => {
            const s = SKILL_BY_ID[a.skill]
            const t = TONE_CLASSES[s.tone]
            return (
              <Card key={a.skill} padding="md">
                <div className="flex items-center gap-3">
                  <span className={cn('grid h-10 w-10 place-items-center rounded-xl', t.soft, t.fg)}>
                    <s.icon size={18} aria-hidden />
                  </span>
                  <p className="font-bold text-ink">{s.label}</p>
                </div>
                <dl className="mt-4 space-y-3">
                  {a.facts.map((f) => (
                    <div key={f.label}>
                      <dt className="text-xs text-ink-soft">{f.label}</dt>
                      <dd className="font-display text-lg font-bold text-ink">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            )
          })}
        </div>
      </section>

      <Card variant="lavender" padding="lg" as="section" aria-labelledby="next-title">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex items-start gap-4 md:w-72">
            <span className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-violet-200 ring-4 ring-white">
              <Lania crop="head" expression="explaining" />
            </span>
            <div>
              <Eyebrow>Lania recomienda</Eyebrow>
              <Heading level={2} size="sm" id="next-title" className="mt-1">
                Tu próxima semana
              </Heading>
              <p className="mt-1 text-sm text-ink-soft">{plan.length} de 3 en tu plan · ≈ {NEXT_WEEK.filter((n) => plan.includes(n.id)).reduce((m, n) => m + n.minutes, 0)} min</p>
            </div>
          </div>
          <ul className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {NEXT_WEEK.map((n) => {
              const on = plan.includes(n.id)
              return (
                <li key={n.id} className="flex flex-col rounded-3xl bg-surface p-4 shadow-soft">
                  <p className="font-bold text-ink">{n.title}</p>
                  <p className="mt-1 flex-1 text-sm text-ink-soft">{n.why}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <Badge tone="neutral">{n.minutes} min</Badge>
                    <div className="flex flex-wrap items-center gap-1">
                      <Link to={n.to} className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-mist" aria-label={`Empezar: ${n.title}`}>
                        <ArrowRight size={16} aria-hidden />
                      </Link>
                      <Button size="sm" variant={on ? 'success' : 'soft'} icon={on ? Check : Plus} onClick={() => setPlan(on ? plan.filter((x) => x !== n.id) : [...plan, n.id])} aria-pressed={on}>
                        {on ? 'En tu plan' : 'Agregar'}
                      </Button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </Card>

      <p className="flex items-start gap-2 text-sm text-ink-soft">
        <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
        Cómo medimos: mostramos solo lo que se puede sustentar con tus actividades (respuestas, textos y conversaciones evaluadas). Los niveles son aproximados y se ajustan con nueva evidencia.
      </p>
    </PageContainer>
  )
}
