import { useMemo, useState } from 'react'
import { BellRing, Check, Clock, HeartHandshake, Plus, ScrollText, Sparkles, Target, Users } from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { Lania } from '@/app/components/illustrations/Lania'
import { PersonAvatar } from '@/app/components/illustrations/PersonAvatar'
import { Badge } from '@/app/components/ui/Badge'
import { Button, ButtonLink } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { Chip } from '@/app/components/ui/Chip'
import { Modal } from '@/app/components/ui/Modal'
import { Segmented } from '@/app/components/ui/Segmented'
import { Select } from '@/app/components/ui/Field'
import { PageContainer, PageHeader } from '@/app/components/layout/PageHeader'
import { ROOMS, type Room } from '@/app/data/rooms'
import { PEOPLE } from '@/app/data/people'
import { TONE_CLASSES } from '@/app/data/skills'

export const NORMS = [
  { title: 'Escucha con atención', text: 'Deja terminar a la otra persona antes de responder.' },
  { title: 'Respeta los turnos', text: 'Levanta la mano para hablar; Lania reparte el tiempo.' },
  { title: 'Corrige con amabilidad', text: 'Si corriges, ofrece la versión correcta y una razón breve.' },
  { title: 'Celebra los intentos', text: 'Aquí todos estamos aprendiendo. Nadie se burla de un error.' },
]

type When = 'todos' | 'live' | 'hoy' | 'semana'
const LEVELS = ['A2', 'A2+', 'B1', 'B1+', 'B2']

function RoomCard({ room, reserved, onReserve }: { room: Room; reserved: boolean; onReserve: () => void }) {
  const t = TONE_CLASSES[room.tone]
  const free = room.capacity - room.people.length
  return (
    <Card padding="none" as="article" className="flex flex-col overflow-hidden" interactive aria-labelledby={`room-${room.id}`}>
      <div className={cn('flex items-start justify-between p-5', t.soft)}>
        <span className={cn('grid h-12 w-12 place-items-center rounded-2xl bg-surface shadow-soft', t.fg)}>
          <room.icon size={22} aria-hidden />
        </span>
        {room.status === 'live' ? (
          <Badge tone="mint" dot pulse size="md">
            En vivo
          </Badge>
        ) : (
          <Badge tone="outline" size="md" icon={Clock}>
            {room.when}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id={`room-${room.id}`} className="font-display text-lg font-bold text-ink">
            {room.name}
          </h2>
          <Badge tone="dark">{room.level}</Badge>
          <Badge tone="neutral">{room.interest}</Badge>
        </div>
        <p className="mt-1 text-sm text-ink-soft">{room.topic}</p>
        <p className="mt-4 flex items-start gap-2 text-sm text-ink">
          <Target size={16} className="mt-0.5 shrink-0 text-violet-600" aria-hidden />
          <span>
            <span className="font-semibold">Objetivo: </span>
            {room.goal}
          </span>
        </p>
        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {room.people.map((p) => (
                  <span key={p} className="h-8 w-8 overflow-hidden rounded-full bg-violet-100 ring-2 ring-white" title={PEOPLE[p].name}>
                    <PersonAvatar look={PEOPLE[p].look} />
                  </span>
                ))}
                <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-violet-200 ring-2 ring-white" title="Lania (moderadora)">
                  <Lania crop="head" animated={false} className="h-full w-full" />
                </span>
              </div>
              <span className="text-xs font-semibold text-ink-soft">
                {room.people.length}/{room.capacity} · {free > 0 ? `${free} ${free === 1 ? 'lugar' : 'lugares'}` : 'Llena'}
              </span>
            </div>
            <span className="text-xs font-semibold text-ink-soft">{room.minutes} min</span>
          </div>
          <div className="mt-4">
            {room.status === 'live' ? (
              <ButtonLink to={`/app/salones/${room.id}`} block>
                Entrar a la sala
              </ButtonLink>
            ) : reserved ? (
              <Button variant="success" block icon={Check} onClick={onReserve} aria-pressed>
                Lugar reservado
              </Button>
            ) : (
              <Button variant="secondary" block onClick={onReserve} disabled={free <= 0}>
                Reservar lugar
              </Button>
            )}
            {reserved && room.status !== 'live' && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-ink-soft">
                <BellRing size={13} aria-hidden /> Un solo aviso, 10 minutos antes.
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

/** I · Salones comunitarios */
export function Rooms() {
  const [when, setWhen] = useState<When>('todos')
  const [levels, setLevels] = useState<string[]>([])
  const [interest, setInterest] = useState('todos')
  const [reserved, setReserved] = useState<string[]>(['tech-talk'])
  const [normsOpen, setNormsOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const interests = useMemo(() => Array.from(new Set(ROOMS.map((r) => r.interest))), [])
  const list = ROOMS.filter(
    (r) =>
      (when === 'todos' || (when === 'live' && r.status === 'live') || (when === 'hoy' && r.day === 'hoy') || (when === 'semana' && r.day === 'semana')) &&
      (levels.length === 0 || levels.includes(r.level)) &&
      (interest === 'todos' || r.interest === interest),
  )

  return (
    <PageContainer wide>
      <PageHeader
        eyebrow="Comunidad"
        title="Salones de conversación"
        description="Grupos pequeños para practicar con otras personas de tu nivel. Lania modera, reparte turnos y comparte frases útiles."
        actions={
          <>
            <Button variant="ghost" icon={ScrollText} onClick={() => setNormsOpen(true)}>
              Normas
            </Button>
            <Button variant="secondary" icon={Plus} onClick={() => setCreateOpen(true)}>
              Sala con amigos
            </Button>
          </>
        }
      />

      <div className="mt-8 flex flex-col gap-4 rounded-3xl bg-surface p-4 ring-1 ring-line lg:flex-row lg:items-center">
        <Segmented<When>
          label="Cuándo"
          value={when}
          onChange={setWhen}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'live', label: 'En vivo' },
            { value: 'hoy', label: 'Hoy' },
            { value: 'semana', label: 'Esta semana' },
          ]}
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Nivel">
          {LEVELS.map((l) => (
            <Chip
              key={l}
              selected={levels.includes(l)}
              className="h-9 px-3"
              onClick={() => setLevels(levels.includes(l) ? levels.filter((x) => x !== l) : [...levels, l])}
            >
              {l}
            </Chip>
          ))}
        </div>
        <div className="lg:ml-auto lg:w-56">
          <Select
            aria-label="Tema"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            options={[{ value: 'todos', label: 'Todos los temas' }, ...interests.map((i) => ({ value: i, label: i }))]}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-violet-50 px-4 py-3 text-sm text-ink">
        <Users size={18} className="shrink-0 text-violet-700" aria-hidden />
        <p>
          <strong>Máximo 5 personas</strong> por sala, agrupadas por nivel. Puedes hablar o escribir, y salir cuando quieras.
        </p>
      </div>

      {list.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((r) => (
            <RoomCard
              key={r.id}
              room={r}
              reserved={reserved.includes(r.id)}
              onReserve={() => setReserved(reserved.includes(r.id) ? reserved.filter((x) => x !== r.id) : [...reserved, r.id])}
            />
          ))}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-line-strong p-6 text-center transition-colors hover:border-violet-400 hover:bg-violet-50"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700">
              <HeartHandshake size={22} aria-hidden />
            </span>
            <span className="font-display text-lg font-bold text-ink">Proyecto en equipo</span>
            <span className="max-w-xs text-sm text-ink-soft">Invita a 2–4 amigos y creen juntos una guía de su ciudad en inglés. Lania los acompaña.</span>
          </button>
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center text-center">
          <div className="h-28 w-28 overflow-hidden rounded-full bg-violet-100">
            <Lania crop="head" expression="thinking" />
          </div>
          <p className="mt-4 font-display text-lg font-bold text-ink">No hay salas con esos filtros</p>
          <p className="mt-1 text-ink-soft">Prueba con otro nivel o con “Esta semana”.</p>
          <Button
            variant="soft"
            className="mt-4"
            onClick={() => {
              setWhen('todos')
              setLevels([])
              setInterest('todos')
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      )}

      <Modal open={normsOpen} onClose={() => setNormsOpen(false)} title="Normas de la comunidad" description="Para que todas las personas se sientan seguras de hablar." size="sm">
        <ul className="space-y-3">
          {NORMS.map((n) => (
            <li key={n.title} className="flex gap-3 rounded-2xl bg-mist p-4">
              <Sparkles size={18} className="mt-0.5 shrink-0 text-violet-600" aria-hidden />
              <span>
                <span className="block font-bold text-ink">{n.title}</span>
                <span className="text-sm text-ink-soft">{n.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-soft">Si algo te incomoda, usa “Reportar” dentro de la sala. Lo revisamos en menos de 24 horas.</p>
      </Modal>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Proyecto en equipo"
        description="Crea una sala privada con tus amigos para un proyecto colaborativo."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Ahora no
            </Button>
            <ButtonLink to="/app/misiones" onClick={() => setCreateOpen(false)}>
              Ver el proyecto
            </ButtonLink>
          </>
        }
      >
        <div className="rounded-3xl bg-coral-50 p-5 ring-1 ring-coral-100">
          <p className="font-bold text-ink">Guía de tu ciudad en inglés</p>
          <p className="reading mt-1 text-sm text-ink-soft">4 sesiones de 30 minutos. Cada persona investiga un lugar, lo presenta y el grupo arma una guía final. Ideal para practicar descripciones y recomendaciones.</p>
        </div>
      </Modal>
    </PageContainer>
  )
}
