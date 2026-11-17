import { cn } from '@/app/lib/cn'

/**
 * Lania · la tortuguita de LANIA, tu profe de inglés con IA.
 * Usa las ilustraciones reales del personaje (public/lania/), una por expresión.
 * - crop `head`: cabeza (avatares redondos).
 * - crop `portrait` / `bust`: cuerpo completo con fondo transparente.
 * Mantiene la misma API que el personaje vectorial anterior, así que ninguna pantalla cambia.
 */
export type LaniaExpression =
  | 'neutral'
  | 'welcome'
  | 'listening'
  | 'explaining'
  | 'thinking'
  | 'correcting'
  | 'celebrating'

export type LaniaCrop = 'bust' | 'portrait' | 'head'

export interface LaniaProps {
  expression?: LaniaExpression
  /** Lania habla: un balanceo suave (respeta «reducir movimiento»). */
  talking?: boolean
  crop?: LaniaCrop
  /** Movimiento en reposo (respiración). Las preferencias de movimiento siguen aplicando. */
  animated?: boolean
  className?: string
  /** Texto accesible; omitir si es decorativa. */
  title?: string
}

/** Expresión → archivo de ilustración (algunas comparten imagen hasta tener la propia). */
const FILES: Record<LaniaExpression, string> = {
  neutral: 'resting',
  welcome: 'welcome',
  listening: 'listening',
  explaining: 'explaining',
  thinking: 'thinking',
  correcting: 'correcting',
  celebrating: 'celebrating',
}

const BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/lania`

export const laniaSrc = (expression: LaniaExpression, crop: LaniaCrop = 'bust') =>
  `${BASE}/lania-${FILES[expression]}${crop === 'head' ? '-avatar' : ''}.webp`

export function Lania({
  expression = 'neutral',
  talking = false,
  crop = 'bust',
  animated = true,
  className,
  title,
}: LaniaProps) {
  return (
    <img
      src={laniaSrc(expression, crop)}
      alt={title ?? ''}
      aria-hidden={title ? undefined : true}
      draggable={false}
      decoding="async"
      className={cn(
        'block aspect-square select-none',
        crop === 'head' ? 'object-cover' : 'object-contain',
        talking ? 'animate-chatter' : animated && 'animate-breathe',
        className,
      )}
    />
  )
}

export const LANIA_EXPRESSION_INFO: Record<
  Exclude<LaniaExpression, 'neutral'>,
  { label: string; when: string; line: string }
> = {
  welcome: {
    label: 'Bienvenida alegre',
    when: 'Inicio de sesión, onboarding y primeras clases.',
    line: '¡Hola! Qué bueno verte. ¿Practicamos un poco?',
  },
  listening: {
    label: 'Escuchando atentamente',
    when: 'Mientras el estudiante habla en Speaking Lab o en el aula.',
    line: 'Te escucho. Tómate tu tiempo.',
  },
  explaining: {
    label: 'Explicando una regla',
    when: 'Momentos de teoría breve y ejemplos.',
    line: 'Una sola idea: yesterday activa el pasado.',
  },
  thinking: {
    label: 'Pensando una pista',
    when: 'Cuando el estudiante pide ayuda o duda.',
    line: 'Mmm… te doy una pista sin darte la respuesta.',
  },
  correcting: {
    label: 'Corrigiendo con amabilidad',
    when: 'Retroalimentación de errores, siempre con una salida.',
    line: '¡Casi! Ya entendí lo que quieres decir.',
  },
  celebrating: {
    label: 'Celebrando un progreso real',
    when: 'Dominio demostrado, no clics: metas y misiones logradas.',
    line: '¡Eso! Ya lo usas sin pensar.',
  },
}
