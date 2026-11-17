import { Ban, Check, Laptop, Smartphone, Tablet } from 'lucide-react'
import { Button, ButtonLink } from '@/ui/components/ui/Button'
import { Card } from '@/ui/components/ui/Card'
import { usePreferences } from '@/ui/state/preferences'
import { useUi } from '@/ui/state/ui'
import { BrandSection, SpecLabel } from './BrandKit'

const USE = ['Misiones de aprendizaje', 'Historias interactivas', 'Reconocimientos por dominio', 'Proyectos colaborativos', 'Retos semanales opcionales', 'Desbloqueo de situaciones comunicativas']
const AVOID = ['Rachas punitivas', 'Corazones que se agotan', 'Castigos por faltar', 'Notificaciones insistentes', 'Rankings que avergüenzan', 'Premios por tocar botones']

const INCLUSIVE = [
  { t: 'Modo concentración', d: 'Oculta lo secundario y reduce a Lania durante los ejercicios.' },
  { t: 'Una instrucción por pantalla', d: 'Cada paso tiene una sola pregunta principal.' },
  { t: 'Actividades cortas', d: 'Sesiones de 5, 15 o 30 minutos, a elección.' },
  { t: 'Pistas opcionales', d: 'Cuando las pides o siempre visibles; nunca restan.' },
  { t: 'Control de movimiento', d: 'Sistema, completo o reducido para todas las animaciones.' },
  { t: 'Lectura cómoda', d: 'Tamaño de texto y espaciado ajustables.' },
  { t: 'Velocidad del audio', d: '0.75×, 1× o 1.25× en listening y speaking.' },
  { t: 'Pausar y continuar', d: 'El diagnóstico y las lecciones guardan el progreso.' },
]

export function PrinciplesSection() {
  const { prefs, setPref } = usePreferences()
  const { openPreferences } = useUi()
  return (
    <BrandSection
      id="principios"
      eyebrow="08 · Principios de experiencia"
      title="Gamificación con propósito, diseño para todas las personas"
      lead="La recompensa representa aprendizaje real y autonomía. Y la experiencia se adapta a distintas formas de atención y procesamiento, sin asumir que todas las personas necesitan lo mismo."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card padding="lg">
          <SpecLabel>Usamos</SpecLabel>
          <ul className="space-y-2.5">
            {USE.map((u) => (
              <li key={u} className="flex items-center gap-2.5 font-semibold text-ink">
                <Check size={18} className="text-mint-600" aria-hidden /> {u}
              </li>
            ))}
          </ul>
        </Card>
        <Card padding="lg">
          <SpecLabel>Evitamos</SpecLabel>
          <ul className="space-y-2.5">
            {AVOID.map((u) => (
              <li key={u} className="flex items-center gap-2.5 font-semibold text-ink-soft">
                <Ban size={18} className="text-danger-600" aria-hidden /> {u}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 rounded-4xl bg-violet-50 p-6 ring-1 ring-violet-100 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SpecLabel>Diseño inclusivo implementado</SpecLabel>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={prefs.focusMode ? 'success' : 'secondary'} onClick={() => setPref('focusMode', !prefs.focusMode)}>
              {prefs.focusMode ? 'Modo concentración activo' : 'Probar modo concentración'}
            </Button>
            <Button size="sm" onClick={openPreferences}>
              Abrir preferencias
            </Button>
          </div>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INCLUSIVE.map((i) => (
            <li key={i.t} className="rounded-2xl bg-surface p-4 shadow-soft">
              <p className="font-bold text-ink">{i.t}</p>
              <p className="mt-1 text-sm text-ink-soft">{i.d}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { icon: Laptop, w: '1440 px', t: 'Desktop', d: 'Navegación lateral completa, Lania en panel y laboratorios con paneles secundarios.' },
          { icon: Tablet, w: '768 px', t: 'Tablet', d: 'Barra lateral de íconos, rejillas de 2 columnas y Lania compacta.' },
          { icon: Smartphone, w: '390 px', t: 'Mobile', d: 'Navegación inferior, “Practicar” como hoja, micrófono y reproductor al alcance del pulgar.' },
        ].map((b) => (
          <Card key={b.t} padding="lg">
            <b.icon size={24} className="text-violet-600" aria-hidden />
            <p className="mt-3 font-display text-lg font-bold text-ink">
              {b.t} <span className="font-sans text-sm font-semibold text-ink-soft">· {b.w}</span>
            </p>
            <p className="mt-1 text-sm text-ink-soft">{b.d}</p>
          </Card>
        ))}
      </div>
      <ButtonLink to="/prototipo" variant="dark" className="mt-6">
        Ver las variantes responsive en vivo
      </ButtonLink>
    </BrandSection>
  )
}
