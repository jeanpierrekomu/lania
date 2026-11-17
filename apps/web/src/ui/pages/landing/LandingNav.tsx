import { useState } from 'react'
import { Link } from '@/ui/router'
import { Menu } from 'lucide-react'
import { Logo } from '@/ui/components/brand/Logo'
import { ButtonLink, IconButton } from '@/ui/components/ui/Button'
import { Modal } from '@/ui/components/ui/Modal'
import { Container } from './shared'

const NAV_LINKS = [
  { href: '#metodo', label: 'Método' },
  { href: '#clases', label: 'Clases' },
  { href: '#salones', label: 'Salones' },
  { href: '#precios', label: 'Precios' },
  { href: '#faq', label: 'Preguntas' },
]

export function LandingNav() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-canvas/85 backdrop-blur-md">
      <Container className="flex h-18 items-center justify-between gap-6">
        <Link to="/" aria-label="LANIA, inicio">
          <Logo size="md" />
        </Link>
        <nav aria-label="Secciones" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-mist hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Iniciar sesión
          </ButtonLink>
          <ButtonLink to="/registro" size="sm" className="hidden sm:inline-flex">
            Crear cuenta
          </ButtonLink>
          <IconButton icon={Menu} label="Abrir menú" className="lg:hidden" onClick={() => setOpen(true)} />
        </div>
      </Container>
      <Modal open={open} onClose={() => setOpen(false)} title="Menú" placement="drawer" size="sm">
        <nav aria-label="Secciones del menú" className="flex flex-col gap-1">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-lg font-semibold text-ink hover:bg-mist">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="mt-6 flex flex-col gap-3">
          <ButtonLink to="/registro" size="lg" block>
            Crear cuenta
          </ButtonLink>
          <ButtonLink to="/login" variant="secondary" size="lg" block>
            Iniciar sesión
          </ButtonLink>
        </div>
      </Modal>
    </header>
  )
}
