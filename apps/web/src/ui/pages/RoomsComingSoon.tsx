import { ArrowRight, MessagesSquare, Mic, Users } from 'lucide-react'
import { Lania } from '@/ui/components/illustrations/Lania'
import { ButtonLink } from '@/ui/components/ui/Button'
import { Card } from '@/ui/components/ui/Card'
import { Eyebrow, Heading } from '@/ui/components/ui/Typography'
import { PageContainer } from '@/ui/components/layout/PageHeader'

/** Salones: todavía no abiertos en el piloto. Sin salas ni personas inventadas. */
export function RoomsComingSoon() {
  return (
    <PageContainer className="max-w-4xl">
      <Card padding="lg" className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
        <span className="h-32 w-32 shrink-0 overflow-hidden rounded-full bg-violet-100">
          <Lania crop="head" expression="explaining" />
        </span>
        <div>
          <Eyebrow>Salones · Próximamente</Eyebrow>
          <Heading level={1} size="lg" className="mt-1">
            Conversar en grupo llega pronto
          </Heading>
          <p className="mt-2 text-ink-soft">
            Estamos preparando salas pequeñas (máximo 5 personas) donde practicarás con otras personas de tu nivel y Lania
            moderará los turnos. Te avisaremos cuando abran.
          </p>
        </div>
      </Card>
      <ul className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Users, title: 'Grupos pequeños', text: 'Por nivel e intereses, para que todos hablen.' },
          { icon: MessagesSquare, title: 'Lania modera', text: 'Propone el tema, reparte turnos y comparte frases útiles.' },
          { icon: Mic, title: 'Hablar o escribir', text: 'Notas de voz o texto, a tu ritmo.' },
        ].map((f) => (
          <li key={f.title}>
            <Card padding="md" className="h-full">
              <f.icon size={22} className="text-violet-600" aria-hidden />
              <p className="mt-2 font-bold text-ink">{f.title}</p>
              <p className="text-sm text-ink-soft">{f.text}</p>
            </Card>
          </li>
        ))}
      </ul>
      <Card variant="lavender" padding="lg" className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-ink">Mientras tanto, practica una conversación uno a uno con Lania.</p>
        <ButtonLink to="/app/speaking" iconRight={ArrowRight}>
          Ir al Speaking Lab
        </ButtonLink>
      </Card>
    </PageContainer>
  )
}
