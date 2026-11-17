import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { Modal } from '@/app/components/ui/Modal'
import { Button } from '@/app/components/ui/Button'
import { Switch } from '@/app/components/ui/Switch'
import { Segmented } from '@/app/components/ui/Segmented'
import { usePreferences, type AudioRate, type CorrectionTiming, type HintMode, type MotionPref, type Spacing, type TextScale } from '@/app/state/preferences'

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        {hint && <p className="text-sm text-ink-soft">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-5 border-t border-line pt-5 first:border-0 first:pt-0">
      <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">{title}</h3>
      {children}
    </section>
  )
}

export function PreferencesFields({ compact }: { compact?: boolean }) {
  const { prefs, setPref } = usePreferences()
  return (
    <div className="space-y-6">
      <Group title="Atención">
        <Switch
          checked={prefs.focusMode}
          onChange={(v) => setPref('focusMode', v)}
          label="Modo concentración"
          description="Oculta lo secundario y reduce a Lania durante los ejercicios."
        />
        <Row label="Pistas" hint="Las pistas nunca restan progreso.">
          <Segmented<HintMode>
            label="Pistas"
            value={prefs.hints}
            onChange={(v) => setPref('hints', v)}
            block
            options={[
              { value: 'ask', label: 'Cuando las pida' },
              { value: 'show', label: 'Siempre visibles' },
            ]}
          />
        </Row>
        {!compact && (
          <Row label="Correcciones al hablar">
            <Segmented<CorrectionTiming>
              label="Correcciones al hablar"
              value={prefs.corrections}
              onChange={(v) => setPref('corrections', v)}
              block
              options={[
                { value: 'end', label: 'Al final' },
                { value: 'moment', label: 'En el momento' },
              ]}
            />
          </Row>
        )}
      </Group>
      <Group title="Lectura">
        <Row label="Tamaño del texto">
          <Segmented<TextScale>
            label="Tamaño del texto"
            value={prefs.textScale}
            onChange={(v) => setPref('textScale', v)}
            block
            options={[
              { value: 'md', label: 'Normal' },
              { value: 'lg', label: 'Grande' },
              { value: 'xl', label: 'Muy grande' },
            ]}
          />
        </Row>
        <Row label="Espaciado de lectura">
          <Segmented<Spacing>
            label="Espaciado de lectura"
            value={prefs.spacing}
            onChange={(v) => setPref('spacing', v)}
            block
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'relaxed', label: 'Amplio' },
            ]}
          />
        </Row>
        <p className="reading rounded-2xl bg-violet-50 p-4 text-sm text-ink">
          <span className="font-semibold">Vista previa:</span> Yesterday I <strong className="text-violet-700">went</strong> to
          university. Usamos el pasado porque la acción ya terminó.
        </p>
      </Group>
      <Group title="Audio y movimiento">
        <Switch checked={prefs.subtitles} onChange={(v) => setPref('subtitles', v)} label="Subtítulos" description="Muestra el texto de Lania y de los audios." />
        <Switch
          checked={prefs.laniaVoice}
          onChange={(v) => setPref('laniaVoice', v)}
          label="Voz de Lania"
          description="Lee sus mensajes en voz alta en los laboratorios."
        />
        <Row label="Velocidad de audio predeterminada">
          <Segmented<AudioRate>
            label="Velocidad de audio"
            value={prefs.audioRate}
            onChange={(v) => setPref('audioRate', v)}
            block
            options={[
              { value: 0.75, label: '0.75×' },
              { value: 1, label: '1×' },
              { value: 1.25, label: '1.25×' },
            ]}
          />
        </Row>
        <Row label="Animaciones" hint="Controla gestos de Lania, transiciones y efectos.">
          <Segmented<MotionPref>
            label="Animaciones"
            value={prefs.motion}
            onChange={(v) => setPref('motion', v)}
            block
            options={[
              { value: 'system', label: 'Sistema' },
              { value: 'full', label: 'Completas' },
              { value: 'reduce', label: 'Reducidas' },
            ]}
          />
        </Row>
      </Group>
    </div>
  )
}

export function PreferencesPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { reset } = usePreferences()
  return (
    <Modal
      open={open}
      onClose={onClose}
      placement="drawer"
      title="Preferencias de aprendizaje"
      description="Ajusta LANIA a tu forma de concentrarte, leer y escuchar. Se guarda en este dispositivo."
      footer={
        <>
          <Button variant="ghost" icon={RotateCcw} onClick={reset}>
            Restablecer
          </Button>
          <Button onClick={onClose}>Listo</Button>
        </>
      }
    >
      <PreferencesFields />
      <p className="mt-6 rounded-2xl bg-mist p-4 text-sm text-ink-soft">
        Estas opciones son para todas las personas. No pedimos ni guardamos información médica: tú decides qué te funciona.
      </p>
    </Modal>
  )
}
