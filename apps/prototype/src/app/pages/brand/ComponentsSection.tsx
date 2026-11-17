import { useState } from 'react'
import { ArrowRight, Mail, Play, Search, Sparkles } from 'lucide-react'
import { Badge } from '@/app/components/ui/Badge'
import { Button, IconButton } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { Chip } from '@/app/components/ui/Chip'
import { Field, Select, TextArea, TextInput } from '@/app/components/ui/Field'
import { Modal } from '@/app/components/ui/Modal'
import { ProgressBar, StepProgress } from '@/app/components/ui/Progress'
import { Segmented } from '@/app/components/ui/Segmented'
import { Switch } from '@/app/components/ui/Switch'
import { Tabs } from '@/app/components/ui/Tabs'
import { ChoiceOption } from '@/app/components/exercise/ChoiceOption'
import { FeedbackBanner } from '@/app/components/exercise/FeedbackBanner'
import { HintCard } from '@/app/components/exercise/HintCard'
import { MicButton } from '@/app/components/exercise/MicButton'
import { VoiceWave } from '@/app/components/exercise/VoiceWave'
import { WordChip } from '@/app/components/exercise/WordChip'
import { AudioClip } from '@/app/components/exercise/AudioClip'
import { LaniaSays } from '@/app/components/lania/LaniaSays'
import { PersonAvatar } from '@/app/components/illustrations/PersonAvatar'
import { PEOPLE } from '@/app/data/people'
import { BrandSection, SpecLabel } from './BrandKit'

function Block({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card padding="lg" className={className}>
      <SpecLabel>{title}</SpecLabel>
      {children}
    </Card>
  )
}

export function ComponentsSection() {
  const [sw, setSw] = useState(true)
  const [seg, setSeg] = useState('1')
  const [chips, setChips] = useState<string[]>(['viajes'])
  const [tab, setTab] = useState<'a' | 'b' | 'c'>('a')
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [hints, setHints] = useState(1)

  return (
    <BrandSection
      id="componentes"
      eyebrow="05 · Biblioteca de componentes"
      title="Piezas reutilizables, estados claros"
      lead="Cada pantalla del prototipo está construida con estos componentes y tokens. Esquinas redondeadas, botones sólidos, foco visible y estados que no dependen solo del color."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Block title="Botones · variantes">
          <div className="flex flex-wrap gap-3">
            <Button>Primario</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="soft">Suave</Button>
            <Button variant="coral">Durazno</Button>
            <Button variant="ghost">Fantasma</Button>
            <Button variant="dark">Oscuro</Button>
            <Button variant="success">Éxito</Button>
            <Button variant="danger">Peligro</Button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button size="sm" icon={Play}>
              Pequeño
            </Button>
            <Button iconRight={ArrowRight}>Mediano</Button>
            <Button size="lg" icon={Sparkles}>
              Grande
            </Button>
            <Button loading>Cargando</Button>
            <Button disabled>Deshabilitado</Button>
            <IconButton icon={Search} label="Buscar" variant="secondary" />
            <IconButton icon={Mail} label="Mensajes" variant="soft" />
          </div>
        </Block>

        <Block title="Campos de formulario">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" hint="Como quieres que te llame Lania.">
              {({ id, describedBy }) => <TextInput id={id} aria-describedby={describedBy} defaultValue="Valentina" />}
            </Field>
            <Field label="Correo" error="Revisa el formato: falta la @.">
              {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} icon={Mail} defaultValue="vale.gmail.com" />}
            </Field>
            <Field label="Nivel">
              {({ id }) => (
                <Select
                  id={id}
                  defaultValue="b1"
                  options={[
                    { value: 'a2', label: 'A2 · Básico' },
                    { value: 'b1', label: 'B1 · Intermedio' },
                  ]}
                />
              )}
            </Field>
            <Field label="Mensaje">
              {({ id }) => <TextArea id={id} className="min-h-12" placeholder="Escribe en inglés…" />}
            </Field>
          </div>
        </Block>

        <Block title="Selección y navegación">
          <div className="space-y-5">
            <Switch checked={sw} onChange={setSw} label="Subtítulos" description="Interruptor accesible con role=switch." />
            <Segmented
              label="Velocidad"
              value={seg}
              onChange={setSeg}
              options={[
                { value: '0.75', label: '0.75×' },
                { value: '1', label: '1×' },
                { value: '1.25', label: '1.25×' },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              {['viajes', 'negocios', 'series'].map((c) => (
                <Chip key={c} selected={chips.includes(c)} onClick={() => setChips(chips.includes(c) ? chips.filter((x) => x !== c) : [...chips, c])}>
                  {c[0].toUpperCase() + c.slice(1)}
                </Chip>
              ))}
            </div>
            <Tabs
              label="Ejemplo de pestañas"
              idPrefix="demo"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'a', label: 'Actividad' },
                { id: 'b', label: 'Frases', count: 5 },
                { id: 'c', label: 'Normas' },
              ]}
            />
            <p id={`demo-panel-${tab}`} role="tabpanel" aria-labelledby={`demo-tab-${tab}`} className="text-sm text-ink-soft">
              {{ a: 'Actividad reciente del salón.', b: 'Frases útiles para la conversación.', c: 'Normas de respeto del salón.' }[tab]}
            </p>
          </div>
        </Block>

        <Block title="Badges y progreso">
          <div className="flex flex-wrap gap-2">
            <Badge tone="violet">Turquesa</Badge>
            <Badge tone="coral">Durazno</Badge>
            <Badge tone="mint">Verde</Badge>
            <Badge tone="amber">Pista</Badge>
            <Badge tone="danger">Error</Badge>
            <Badge tone="neutral">Neutro</Badge>
            <Badge tone="dark">B1</Badge>
            <Badge tone="mint" dot pulse>
              En vivo
            </Badge>
          </div>
          <div className="mt-6 space-y-4">
            <ProgressBar value={4} max={10} label="Speaking: 4 de 10" barClassName="bg-coral-500" />
            <ProgressBar value={6} max={10} label="Listening: 6 de 10" size="md" />
            <StepProgress steps={['Recuerda', 'Regla', 'Practica', 'Habla']} current={2} />
          </div>
        </Block>

        <Block title="Tarjetas">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card padding="sm">
              <p className="text-sm font-bold">Default</p>
            </Card>
            <Card padding="sm" variant="lavender">
              <p className="text-sm font-bold">Lavanda</p>
            </Card>
            <Card padding="sm" variant="coral">
              <p className="text-sm font-bold">Coral</p>
            </Card>
            <Card padding="sm" variant="mint">
              <p className="text-sm font-bold">Menta</p>
            </Card>
            <Card padding="sm" variant="outline">
              <p className="text-sm font-bold">Contorno</p>
            </Card>
            <Card padding="sm" variant="dark">
              <p className="text-sm font-bold">Oscura</p>
            </Card>
          </div>
        </Block>

        <Block title="Modales y paneles">
          <p className="text-sm text-ink-soft">Construidos sobre &lt;dialog&gt;: foco atrapado, Esc para cerrar y fondo desenfocado.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setModal(true)}>
              Abrir modal
            </Button>
            <Button variant="secondary" onClick={() => setDrawer(true)}>
              Abrir panel lateral
            </Button>
          </div>
          <div className="mt-5 flex items-center gap-3">
            {(['valentina', 'diego', 'camila', 'mateo', 'ana'] as const).map((p) => (
              <span key={p} className="h-12 w-12 overflow-hidden rounded-full bg-violet-100">
                <PersonAvatar look={PEOPLE[p].look} />
              </span>
            ))}
          </div>
        </Block>
      </div>

      <SpecLabel>
        <span className="mt-10 block">Componentes de ejercicio</span>
      </SpecLabel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Block title="Opciones de respuesta · estados">
          <div role="radiogroup" aria-label="Estados de opciones" className="grid gap-2">
            <ChoiceOption letter="A" label="Reposo" state="idle" />
            <ChoiceOption letter="B" label="Seleccionada" state="selected" />
            <ChoiceOption letter="C" label="Correcta" state="correct" />
            <ChoiceOption letter="D" label="Para revisar" state="incorrect" />
            <ChoiceOption letter="E" label="Atenuada" state="dimmed" />
          </div>
        </Block>
        <Block title="Construcción de frases y pistas">
          <div className="flex flex-wrap gap-2">
            <WordChip>Last</WordChip>
            <WordChip>week</WordChip>
            <WordChip variant="placed">I</WordChip>
            <WordChip variant="placed" status="correct">
              saw
            </WordChip>
            <WordChip variant="placed" status="incorrect">
              see
            </WordChip>
            <WordChip variant="ghost" aria-hidden tabIndex={-1}>
              movie
            </WordChip>
          </div>
          <HintCard className="mt-5" hints={['Empieza por cuándo: “Last week…”.', 'see → saw (irregular).']} revealed={hints} onMore={() => setHints(2)} />
        </Block>
        <Block title="Retroalimentación contextual">
          <div className="space-y-3">
            <FeedbackBanner kind="correct" title="¡Eso! Went, como una profesional." />
            <FeedbackBanner kind="almost" title="¡Casi! Yesterday pide pasado">
              ¿Recuerdas cómo cambia go?
            </FeedbackBanner>
            <FeedbackBanner kind="info" title="Dato útil">
              “Gone” se usa con have: I have gone.
            </FeedbackBanner>
          </div>
        </Block>
        <Block title="Voz: micrófono, audio y Lania">
          <div className="flex flex-wrap items-center gap-5">
            <MicButton state="idle" onClick={() => undefined} label="Micrófono en reposo" />
            <MicButton state="listening" onClick={() => undefined} label="Micrófono escuchando" />
            <MicButton state="processing" onClick={() => undefined} label="Procesando" />
            <span className="text-coral-600">
              <VoiceWave active bars={9} />
            </span>
          </div>
          <AudioClip className="mt-5" text="Yesterday I went to university." title="Audio de ejemplo" />
          <LaniaSays className="mt-5" expression="correcting" size="sm" tone="lavender">
            ¡Casi! Ya entendí lo que quieres decir. ¿Recuerdas cómo cambia go?
          </LaniaSays>
        </Block>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="¿Terminamos por hoy?"
        description="Tu progreso está guardado. Puedes volver cuando quieras, sin perder nada."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>
              Seguir practicando
            </Button>
            <Button onClick={() => setModal(false)}>Terminar</Button>
          </>
        }
      />
      <Modal open={drawer} onClose={() => setDrawer(false)} title="Panel lateral" description="Para historial, preferencias o detalles secundarios." placement="drawer">
        <p className="text-ink-soft">En móvil se convierte en una hoja inferior.</p>
      </Modal>
    </BrandSection>
  )
}
