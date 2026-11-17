import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, CircleCheck } from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { Logo } from '@/app/components/brand/Logo'
import { Lania } from '@/app/components/illustrations/Lania'
import { Accordion } from '@/app/components/ui/Accordion'
import { Badge } from '@/app/components/ui/Badge'
import { ButtonLink } from '@/app/components/ui/Button'
import { Segmented } from '@/app/components/ui/Segmented'
import { Heading } from '@/app/components/ui/Typography'
import { useUi } from '@/app/state/ui'
import { Container, SectionIntro } from './shared'

export function Pricing() {
  const [period, setPeriod] = useState<'mensual' | 'anual'>('anual')
  const plans = [
    {
      name: 'Explora',
      price: 'Gratis',
      note: 'Para conocer a Lania',
      cta: 'Empezar gratis',
      featured: false,
      features: ['Diagnóstico completo de 5 habilidades', '3 clases guiadas por semana', 'Speaking Lab 10 min al día', '1 salón de prueba al mes'],
    },
    {
      name: 'Plus',
      price: period === 'anual' ? 'US$ 7' : 'US$ 9',
      note: period === 'anual' ? 'al mes · US$ 84 facturados al año' : 'al mes · cancela cuando quieras',
      cta: 'Probar 7 días gratis',
      featured: true,
      features: ['Clases y laboratorios ilimitados', 'Salones semanales por nivel', 'Plan de repaso personalizado', 'Misiones, historias y proyectos', 'Informe mensual de progreso'],
    },
    {
      name: 'Campus',
      price: 'A medida',
      note: 'Universidades y empresas',
      cta: 'Hablar con el equipo',
      featured: false,
      features: ['Grupos y cohortes', 'Panel para docentes', 'Reportes por habilidad', 'Acompañamiento de implementación'],
    },
  ]
  return (
    <section id="precios" className="scroll-mt-24 bg-surface py-20 lg:py-28" aria-labelledby="pricing-title">
      <Container>
        <SectionIntro
          center
          id="pricing-title"
          eyebrow="Precios"
          title="Empieza gratis. Sigue a tu ritmo."
          lead="Precios en dólares; pagos en moneda local en México, Colombia, Perú, Chile y Argentina."
        />
        <div className="mt-8 flex justify-center">
          <Segmented
            label="Periodo de facturación"
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'mensual', label: 'Mensual' },
              { value: 'anual', label: 'Anual · ahorra 22%' },
            ]}
          />
        </div>
        <div className="mx-auto mt-12 grid max-w-6xl items-stretch gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={cn('relative flex flex-col rounded-4xl p-8', p.featured ? 'bg-ink text-white shadow-float lg:-my-4 lg:py-12' : 'bg-canvas ring-1 ring-line')}
            >
              {p.featured && (
                <Badge tone="coral" className="absolute right-6 top-6">
                  Más elegido
                </Badge>
              )}
              <h3 className={cn('text-lg font-bold', p.featured ? 'text-coral-300' : 'text-violet-700')}>{p.name}</h3>
              <p className="mt-4 font-display text-5xl font-extrabold tracking-tight">{p.price}</p>
              <p className={cn('mt-1 text-sm', p.featured ? 'text-violet-100' : 'text-ink-soft')}>{p.note}</p>
              <ul className="mt-8 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <CircleCheck size={18} className={cn('mt-0.5 shrink-0', p.featured ? 'text-mint-300' : 'text-mint-600')} aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-10">
                <ButtonLink to="/onboarding" variant={p.featured ? 'coral' : 'secondary'} size="lg" block>
                  {p.cta}
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

const FAQ = [
  {
    q: '¿Lania es una persona real?',
    a: 'No. Lania es una profesora de inteligencia artificial con una personalidad diseñada para enseñar con paciencia y humor. En los salones comunitarios sí conversas con estudiantes reales.',
  },
  {
    q: '¿Cómo se calcula mi nivel?',
    a: 'Con un diagnóstico de 12 minutos que evalúa gramática, listening, reading, writing y speaking según descriptores del MCER (A1–C1). Es una estimación que se ajusta con tus actividades; no es una certificación oficial.',
  },
  { q: '¿Necesito micrófono?', a: 'Para Speaking Lab y los salones es recomendable. Si prefieres, puedes escribir tus respuestas y practicar la pronunciación después.' },
  { q: '¿Qué pasa si un día no practico?', a: 'Nada. No hay rachas, corazones ni castigos. Cuando vuelvas, Lania te propone un repaso corto para retomar donde lo dejaste.' },
  {
    q: '¿Puedo adaptar la experiencia a mi forma de aprender?',
    a: 'Sí: modo concentración, actividades cortas, pistas opcionales, control de animaciones, velocidad del audio, subtítulos y tamaño o espaciado del texto.',
  },
  {
    q: '¿Los salones son seguros?',
    a: 'Son grupos de máximo 5 personas por nivel, con normas de convivencia claras, moderación de Lania y opción de reportar. Puedes participar con micrófono o por texto.',
  },
  { q: '¿Puedo cancelar cuando quiera?', a: 'Sí. Cancelas en dos clics desde tu perfil y conservas tu historial de progreso.' },
]

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 py-20 lg:py-28" aria-labelledby="faq-title">
      <Container className="grid gap-10 lg:grid-cols-[22rem_1fr] lg:gap-16">
        <div>
          <SectionIntro id="faq-title" eyebrow="Preguntas frecuentes" title="Lo que suelen preguntarnos" />
          <div className="mt-8 hidden w-56 overflow-hidden rounded-t-full bg-violet-100 lg:block">
            <Lania expression="thinking" crop="portrait" className="w-full" />
          </div>
        </div>
        <Accordion items={FAQ} />
      </Container>
    </section>
  )
}

export function FinalCta() {
  return (
    <section className="pb-20 lg:pb-28" aria-labelledby="final-title">
      <Container>
        <div className="relative grid items-center gap-6 overflow-hidden rounded-4xl bg-violet-600 px-6 pt-10 text-white sm:px-12 lg:grid-cols-[1fr_auto] lg:pt-0">
          <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-violet-500" aria-hidden />
          <div className="relative lg:py-14">
            <Heading level={2} size="xl" id="final-title" className="text-white">
              Tu primera conversación en inglés empieza hoy.
            </Heading>
            <p className="mt-4 max-w-lg text-lg text-violet-50">Haz el diagnóstico, conoce a Lania y recibe tu plan personalizado en 12 minutos.</p>
            <ButtonLink to="/onboarding" variant="coral" size="lg" className="mt-8" iconRight={ArrowRight}>
              Descubre tu nivel
            </ButtonLink>
          </div>
          <Lania expression="celebrating" crop="portrait" className="relative mx-auto w-72 lg:w-80" title="Lania celebra" />
        </div>
      </Container>
    </section>
  )
}

export function Footer() {
  const { openPreferences } = useUi()
  const link = 'transition-colors hover:text-ink'
  return (
    <footer className="border-t border-line bg-surface">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo size="lg" />
          <p className="mt-4 max-w-xs text-ink-soft">Academia de inglés con IA para jóvenes y profesionales de Latinoamérica.</p>
        </div>
        <nav aria-label="Producto">
          <p className="text-sm font-bold text-ink">Producto</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
            <li>
              <Link className={link} to="/app/aula">
                Aula con Lania
              </Link>
            </li>
            <li>
              <Link className={link} to="/app/speaking">
                Speaking Lab
              </Link>
            </li>
            <li>
              <Link className={link} to="/app/salones">
                Salones
              </Link>
            </li>
            <li>
              <a className={link} href="#precios">
                Precios
              </a>
            </li>
          </ul>
        </nav>
        <nav aria-label="Recursos">
          <p className="text-sm font-bold text-ink">Recursos</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
            <li>
              <Link className={link} to="/sistema">
                Marca y sistema de diseño
              </Link>
            </li>
            <li>
              <Link className={link} to="/prototipo">
                Mapa del prototipo
              </Link>
            </li>
            <li>
              <a className={link} href="#faq">
                Preguntas frecuentes
              </a>
            </li>
            <li>
              <button type="button" className={link} onClick={openPreferences}>
                Preferencias de accesibilidad
              </button>
            </li>
          </ul>
        </nav>
      </Container>
      <Container className="flex flex-col justify-between gap-2 border-t border-line py-6 text-sm text-ink-soft sm:flex-row">
        <p>© 2025 LANIA. Hecho con cariño en Latinoamérica.</p>
        <p>Prototipo de diseño · datos de ejemplo</p>
      </Container>
    </footer>
  )
}
