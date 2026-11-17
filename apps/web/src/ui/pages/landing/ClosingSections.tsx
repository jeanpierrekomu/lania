import { useEffect, useState } from 'react'
import { Link } from '@/ui/router'
import { ArrowRight, CircleCheck, CreditCard } from 'lucide-react'
import { cn } from '@/ui/lib/cn'
import { Logo } from '@/ui/components/brand/Logo'
import { Lania } from '@/ui/components/illustrations/Lania'
import { Accordion } from '@/ui/components/ui/Accordion'
import { Badge } from '@/ui/components/ui/Badge'
import { ButtonLink } from '@/ui/components/ui/Button'
import { Segmented } from '@/ui/components/ui/Segmented'
import { Select } from '@/ui/components/ui/Field'
import { Heading } from '@/ui/components/ui/Typography'
import { useUi } from '@/ui/state/ui'
import { Container, SectionIntro } from './shared'

/**
 * Precios (docs/business/planes-y-precios-2026-11.md): sin plan gratis; 7 días de prueba con tarjeta.
 * Precio según el país (3 grupos por poder adquisitivo), en dólares e impuestos incluidos.
 * Los planes se diferencian por los minutos de conversación con Lania, que es lo que más cuesta.
 */
type Region = 'A' | 'B' | 'C'

const COUNTRIES: { value: string; label: string; region: Region }[] = [
  { value: 'MX', label: 'México', region: 'A' },
  { value: 'CL', label: 'Chile', region: 'A' },
  { value: 'UY', label: 'Uruguay', region: 'A' },
  { value: 'CR', label: 'Costa Rica', region: 'A' },
  { value: 'PA', label: 'Panamá', region: 'A' },
  { value: 'PE', label: 'Perú', region: 'B' },
  { value: 'CO', label: 'Colombia', region: 'B' },
  { value: 'EC', label: 'Ecuador', region: 'B' },
  { value: 'GT', label: 'Guatemala', region: 'B' },
  { value: 'SV', label: 'El Salvador', region: 'B' },
  { value: 'HN', label: 'Honduras', region: 'B' },
  { value: 'NI', label: 'Nicaragua', region: 'B' },
  { value: 'DO', label: 'República Dominicana', region: 'B' },
  { value: 'AR', label: 'Argentina', region: 'C' },
  { value: 'BO', label: 'Bolivia', region: 'C' },
  { value: 'PY', label: 'Paraguay', region: 'C' },
  { value: 'VE', label: 'Venezuela', region: 'C' },
  { value: 'OT', label: 'Otro país', region: 'A' },
]

/** Precio mensual por grupo de países (US$). El anual equivale a 10 meses: 2 meses de regalo. */
const PRICES: Record<Region, { esencial: number; intensivo: number }> = {
  A: { esencial: 12, intensivo: 29 },
  B: { esencial: 10, intensivo: 25 },
  C: { esencial: 7, intensivo: 19 },
}

const usd = (n: number) => `US$ ${Number.isInteger(n) ? n : n.toFixed(2).replace('.', ',')}`

function guessCountry() {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region
    return COUNTRIES.some((c) => c.value === region) ? (region as string) : 'PE'
  } catch {
    return 'PE'
  }
}

export function Pricing() {
  const [period, setPeriod] = useState<'mensual' | 'anual'>('mensual')
  const [country, setCountry] = useState('PE')
  useEffect(() => setCountry(guessCountry()), [])
  const region = COUNTRIES.find((c) => c.value === country)?.region ?? 'A'
  const price = PRICES[region]
  const show = (monthly: number) =>
    period === 'anual'
      ? { big: usd(Math.round((monthly * 10 * 100) / 12) / 100), note: `al mes · ${usd(monthly * 10)} al año (2 meses de regalo)` }
      : { big: usd(monthly), note: 'al mes · impuestos incluidos' }
  const esencial = show(price.esencial)
  const intensivo = show(price.intensivo)

  const plans = [
    {
      name: 'Esencial',
      price: esencial.big,
      note: esencial.note,
      cta: 'Probar 7 días gratis',
      featured: false,
      features: [
        'Unos 30 minutos al día para avanzar ~1 nivel al año',
        'Clases cortas y repasos sin límite',
        'Listening: toda la biblioteca de audios',
        'Conversación con Lania: 5 min al día',
        '20 textos corregidos al mes',
        'Chat con Lania e informe mensual de progreso',
      ],
    },
    {
      name: 'Intensivo',
      price: intensivo.big,
      note: intensivo.note,
      cta: 'Probar 7 días gratis',
      featured: true,
      features: [
        'Como un profe particular: ~1 hora al día, ~1 nivel cada 6 meses',
        'Todo lo de Esencial',
        'Conversación con Lania: 20 min al día',
        '60 textos corregidos al mes',
        'Dictados y listening avanzado',
        'Salones semanales con alumnos de tu nivel',
        'Nuevo diagnóstico cada 3 meses',
      ],
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
          title="7 días gratis. Después, a tu ritmo."
          lead="Elige tu plan y pruébalo una semana completa. Precio según tu país, en dólares e impuestos incluidos."
        />
        <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center justify-center gap-4 sm:flex-row sm:items-end">
          <div className="flex w-full flex-col gap-1.5 sm:w-64">
            <label htmlFor="pricing-country" className="text-sm font-semibold text-ink">
              ¿Dónde vives?
            </label>
            <Select
              id="pricing-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              options={COUNTRIES.map(({ value, label }) => ({ value, label }))}
            />
          </div>
          <Segmented
            label="Periodo de facturación"
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'mensual', label: 'Mensual' },
              { value: 'anual', label: 'Anual · 2 meses gratis' },
            ]}
          />
        </div>
        <div className="mx-auto mt-12 grid max-w-6xl items-stretch gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={cn('relative flex flex-col rounded-4xl p-8', p.featured ? 'bg-violet-50 text-ink shadow-float ring-2 ring-violet-600 lg:-my-4 lg:py-12' : 'bg-canvas ring-1 ring-line')}
            >
              {p.featured && (
                <Badge tone="coral" className="absolute right-6 top-6">
                  Más completo
                </Badge>
              )}
              <h3 className={cn('text-lg font-bold', p.featured ? 'text-coral-700' : 'text-violet-700')}>{p.name}</h3>
              <p className="mt-4 font-display text-5xl font-extrabold tracking-tight">{p.price}</p>
              <p className="mt-1 text-sm text-ink-soft">{p.note}</p>
              <ul className="mt-8 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <CircleCheck size={18} className="mt-0.5 shrink-0 text-mint-600" aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-10">
                <ButtonLink to="/login" variant={p.featured ? 'primary' : 'secondary'} size="lg" block>
                  {p.cta}
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 max-w-3xl rounded-3xl bg-violet-50 p-6 ring-1 ring-violet-100">
          <p className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <CreditCard size={20} className="text-violet-600" aria-hidden /> Cómo funciona la prueba
          </p>
          <ul className="mt-3 grid gap-2 text-sm text-ink sm:grid-cols-2">
            <li className="flex gap-2"><CircleCheck size={18} className="mt-0.5 shrink-0 text-mint-600" aria-hidden />Registras tu tarjeta; no se cobra nada durante 7 días.</li>
            <li className="flex gap-2"><CircleCheck size={18} className="mt-0.5 shrink-0 text-mint-600" aria-hidden />Te avisamos 2 días antes del primer cobro.</li>
            <li className="flex gap-2"><CircleCheck size={18} className="mt-0.5 shrink-0 text-mint-600" aria-hidden />Cancelas con un clic; si es antes del día 8, no pagas nada.</li>
            <li className="flex gap-2"><CircleCheck size={18} className="mt-0.5 shrink-0 text-mint-600" aria-hidden />Durante la prueba: todo el plan y 30 min de conversación con Lania.</li>
          </ul>
          <p className="mt-3 text-xs text-ink-soft">Una prueba por persona. Pago seguro: los datos de tu tarjeta los procesa la pasarela de pagos, nunca pasan por nuestros servidores.</p>
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
  {
    q: '¿Por qué piden tarjeta para la prueba?',
    a: 'Para evitar cuentas falsas y cuidar la calidad para quienes de verdad estudian. Durante los 7 días no se cobra nada, te avisamos 2 días antes del primer cobro y puedes cancelar con un clic.',
  },
  {
    q: '¿Qué pasa si se me acaban los minutos de conversación del día?',
    a: 'Sigues practicando con clases, listening, repasos, escritura y el chat con Lania. Los minutos de conversación se renuevan cada día.',
  },
  { q: '¿Puedo cancelar cuando quiera?', a: 'Sí. Cancelas con un clic desde Ajustes, también durante la prueba, y conservas tu historial de progreso.' },
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
          <div className="relative lg:py-14">
            <Heading level={2} size="xl" id="final-title" className="text-white">
              Tu primera conversación en inglés empieza hoy.
            </Heading>
            <p className="mt-4 max-w-lg text-lg text-violet-50">Haz el diagnóstico, conoce a Lania y recibe tu plan personalizado en 12 minutos.</p>
            <ButtonLink to="/login" variant="coral" size="lg" className="mt-8" iconRight={ArrowRight}>
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
