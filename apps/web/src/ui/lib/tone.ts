import type { TeacherStyle } from '@/ui/state/learner'

/** Lania's voice adapts to the teacher style chosen in onboarding. */
const GREETING: Record<TeacherStyle, (name: string) => string> = {
  divertida: (n) => `¡Hola, ${n}! Ayer contaste tu rutina en inglés. Hoy subimos de nivel: vamos a contar lo que pasó.`,
  tranquila: (n) => `Hola, ${n}. Qué bueno verte. Hoy vamos paso a paso con el pasado simple, sin prisa.`,
  exigente: (n) => `${n}, hoy toca el pasado simple. Meta: usarlo bien 3 veces en una conversación real.`,
}

const MESSAGES = {
  almost: {
    divertida:
      '¡Casi! Ya entendí lo que quieres decir. Pero dijiste yesterday, así que necesitamos pasado. ¿Recuerdas cómo cambia go?',
    tranquila: 'Vas muy bien. Fíjate en una palabra: yesterday. Nos pide pasado. ¿Cómo cambia go?',
    exigente: 'Revisa el tiempo verbal: yesterday exige pasado simple. ¿Cuál es el pasado de go?',
  },
  correct: {
    divertida: '¡Eso! Went, como una profesional. Ya suena natural.',
    tranquila: 'Muy bien. Went es la forma correcta. Lo estás logrando.',
    exigente: 'Correcto: went. Ahora úsalo sin ayuda en el siguiente ejercicio.',
  },
  hint: {
    divertida: 'Pista sin spoiler: go es rebelde, no acepta -ed.',
    tranquila: 'Una pista: go es un verbo irregular, no lleva -ed.',
    exigente: 'Pista: verbo irregular. Descarta las opciones con -ed.',
  },
} satisfies Record<string, Record<TeacherStyle, string>>

export function greeting(style: TeacherStyle, name: string) {
  return GREETING[style](name)
}

export function tone(key: keyof typeof MESSAGES, style: TeacherStyle): string {
  return MESSAGES[key][style]
}

export const TEACHER_STYLES: { id: TeacherStyle; label: string; desc: string; sample: string }[] = [
  { id: 'divertida', label: 'Divertida', desc: 'Humor, ejemplos de tu vida y mucha energía.', sample: MESSAGES.almost.divertida },
  { id: 'tranquila', label: 'Tranquila', desc: 'Paciencia, ritmo pausado y explicaciones suaves.', sample: MESSAGES.almost.tranquila },
  { id: 'exigente', label: 'Exigente', desc: 'Directa, con metas claras y retos frecuentes.', sample: MESSAGES.almost.exigente },
]
