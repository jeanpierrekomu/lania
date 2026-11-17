import { Lania } from '@/ui/components/illustrations/Lania'
import { ButtonLink } from '@/ui/components/ui/Button'
import { Heading } from '@/ui/components/ui/Typography'

export function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas p-6">
      <div className="max-w-md text-center">
        <Lania expression="thinking" crop="portrait" className="mx-auto w-56" />
        <Heading level={1} size="md" className="mt-4">
          Esta página no existe… todavía
        </Heading>
        <p className="mt-2 text-ink-soft">“I’m lost” se dice así. Pero tranquila, te llevo de vuelta.</p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink to="/">Ir a la portada</ButtonLink>
          <ButtonLink to="/app" variant="secondary">
            Ir a mi inicio
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
