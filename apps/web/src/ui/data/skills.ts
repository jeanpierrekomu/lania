import { BookOpen, Headphones, Mic, PenLine, Puzzle, type LucideIcon } from 'lucide-react'

export type SkillId = 'speaking' | 'listening' | 'writing' | 'reading' | 'grammar'
export type SkillTone = 'coral' | 'violet' | 'mint' | 'amber' | 'indigo'

export interface Skill {
  id: SkillId
  label: string
  es: string
  icon: LucideIcon
  route: string
  tone: SkillTone
  /** Can-do objectives mastered toward the next level (countable, evidence-based). */
  goals: { done: number; total: number; next: string }
}

export const SKILLS: Skill[] = [
  {
    id: 'speaking',
    label: 'Speaking',
    es: 'Expresión oral',
    icon: Mic,
    route: '/app/speaking',
    tone: 'coral',
    goals: { done: 4, total: 10, next: 'Contar una experiencia con detalles' },
  },
  {
    id: 'listening',
    label: 'Listening',
    es: 'Comprensión auditiva',
    icon: Headphones,
    route: '/app/listening',
    tone: 'violet',
    goals: { done: 6, total: 10, next: 'Entender anuncios con ruido de fondo' },
  },
  {
    id: 'writing',
    label: 'Writing',
    es: 'Expresión escrita',
    icon: PenLine,
    route: '/app/writing',
    tone: 'mint',
    goals: { done: 3, total: 10, next: 'Escribir un correo formal breve' },
  },
  {
    id: 'reading',
    label: 'Reading',
    es: 'Comprensión lectora',
    icon: BookOpen,
    route: '/app/reading',
    tone: 'amber',
    goals: { done: 7, total: 10, next: 'Inferir opiniones en artículos cortos' },
  },
  {
    id: 'grammar',
    label: 'Grammar & Vocabulary',
    es: 'Gramática y vocabulario',
    icon: Puzzle,
    route: '/app/aula',
    tone: 'indigo',
    goals: { done: 5, total: 10, next: 'Usar el pasado simple sin dudar' },
  },
]

export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<SkillId, Skill>

/** Static class maps so Tailwind can see every token. */
export const TONE_CLASSES: Record<SkillTone, { soft: string; fg: string; bar: string; ring: string; solid: string }> = {
  coral: { soft: 'bg-coral-100', fg: 'text-coral-700', bar: 'bg-coral-500', ring: 'ring-coral-200', solid: 'bg-coral-300' },
  violet: { soft: 'bg-violet-100', fg: 'text-violet-700', bar: 'bg-violet-600', ring: 'ring-violet-200', solid: 'bg-violet-300' },
  mint: { soft: 'bg-mint-100', fg: 'text-mint-700', bar: 'bg-mint-600', ring: 'ring-mint-200', solid: 'bg-mint-300' },
  amber: { soft: 'bg-amber-100', fg: 'text-amber-700', bar: 'bg-amber-500', ring: 'ring-amber-300', solid: 'bg-amber-300' },
  indigo: { soft: 'bg-violet-200', fg: 'text-violet-900', bar: 'bg-violet-900', ring: 'ring-violet-300', solid: 'bg-violet-400' },
}
