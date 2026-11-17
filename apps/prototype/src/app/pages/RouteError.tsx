import { isRouteErrorResponse, useRouteError } from 'react-router'
import { Lania } from '@/app/components/illustrations/Lania'
import { ButtonLink } from '@/app/components/ui/Button'
import { Heading } from '@/app/components/ui/Typography'

export function RouteError() {
  const error = useRouteError()
  const detail = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : ''
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas p-6">
      <div className="max-w-md text-center">
        <Lania expression="thinking" crop="portrait" className="mx-auto w-56" />
        <Heading level={1} size="md" className="mt-4">
          Algo no salió como esperaba
        </Heading>
        <p className="mt-2 text-ink-soft">Tu progreso está a salvo. Volvamos a un lugar conocido.</p>
        {detail && <p className="mt-3 rounded-2xl bg-mist p-3 font-mono text-xs text-ink-soft">{detail}</p>}
        <ButtonLink to="/app" className="mt-6">
          Ir al inicio
        </ButtonLink>
      </div>
    </div>
  )
}
