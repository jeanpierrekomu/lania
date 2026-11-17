import {
  Award,
  Briefcase,
  Clapperboard,
  Cpu,
  FlaskConical,
  Gamepad2,
  GraduationCap,
  MessageCircle,
  Palette,
  Plane,
  Rocket,
  Trophy,
  UtensilsCrossed,
  Guitar,
  type LucideIcon,
} from 'lucide-react'
import type { SkillId } from './skills'

export interface Option {
  id: string
  label: string
  desc?: string
  icon?: LucideIcon
}

export const GOALS: Option[] = [
  { id: 'confianza', label: 'Hablar con seguridad', desc: 'Perder el miedo a conversar en inglés.', icon: MessageCircle },
  { id: 'entrevistas', label: 'Entrevistas y trabajo', desc: 'Prepararte para entrevistas, reuniones y correos.', icon: Briefcase },
  { id: 'viajes', label: 'Viajar sin estrés', desc: 'Resolver aeropuertos, hoteles y conversaciones reales.', icon: Plane },
  { id: 'universidad', label: 'Estudiar o investigar', desc: 'Clases, papers y exposiciones en inglés.', icon: GraduationCap },
  { id: 'series', label: 'Entender series y música', desc: 'Disfrutar sin depender de los subtítulos.', icon: Clapperboard },
  { id: 'certificacion', label: 'Preparar una certificación', desc: 'Practicar para un examen internacional.', icon: Award },
]

export const GOAL_BY_ID = Object.fromEntries(GOALS.map((g) => [g.id, g])) as Record<string, Option>

export const SELF_LEVELS: (Option & { cefr: string })[] = [
  { id: 'a1', cefr: 'A1', label: 'Estoy empezando', desc: 'Conozco palabras sueltas y algunas frases.' },
  { id: 'a2', cefr: 'A2', label: 'Entiendo lo básico', desc: 'Me presento y hablo de mi rutina con pausas.' },
  { id: 'b1', cefr: 'B1', label: 'Me defiendo', desc: 'Converso de temas conocidos, aunque dudo al hablar.' },
  { id: 'b2', cefr: 'B2+', label: 'Tengo fluidez', desc: 'Quiero sonar más natural y precisa(o).' },
]

export const INTERESTS: Option[] = [
  { id: 'negocios', label: 'Negocios', icon: Briefcase },
  { id: 'viajes', label: 'Viajes', icon: Plane },
  { id: 'entretenimiento', label: 'Series y cine', icon: Clapperboard },
  { id: 'universidad', label: 'Universidad', icon: GraduationCap },
  { id: 'tecnologia', label: 'Tecnología', icon: Cpu },
  { id: 'musica', label: 'Música', icon: Guitar },
  { id: 'deportes', label: 'Deportes', icon: Trophy },
  { id: 'gastronomia', label: 'Gastronomía', icon: UtensilsCrossed },
  { id: 'videojuegos', label: 'Videojuegos', icon: Gamepad2 },
  { id: 'ciencia', label: 'Ciencia', icon: FlaskConical },
  { id: 'emprendimiento', label: 'Emprendimiento', icon: Rocket },
  { id: 'diseno', label: 'Diseño y moda', icon: Palette },
]

export const SESSION_OPTIONS: { value: 5 | 15 | 30; label: string; title: string; desc: string }[] = [
  { value: 5, label: '5 min', title: 'Microdosis', desc: 'Un ejercicio corto entre clases o en el transporte.' },
  { value: 15, label: '10–15 min', title: 'Ritmo constante', desc: 'Una mini lección y una práctica breve.' },
  { value: 30, label: '20–30 min', title: 'Sesión profunda', desc: 'Clase guiada más conversación con Lania.' },
]

export interface Review {
  id: string
  title: string
  skill: SkillId
  due: string
  minutes: number
  reason: string
}

export const REVIEWS: Review[] = [
  { id: 'r1', title: 'Verbos irregulares: go, see, have', skill: 'grammar', due: 'Hoy', minutes: 5, reason: 'Apareció 3 veces en tus errores esta semana' },
  { id: 'r2', title: 'Frases para entrevistas', skill: 'speaking', due: 'Mañana', minutes: 4, reason: 'Las aprendiste hace 3 días' },
  { id: 'r3', title: 'Números y horas en audios', skill: 'listening', due: 'Jueves', minutes: 6, reason: 'Repaso espaciado de 7 días' },
  { id: 'r4', title: 'Conectores: however, although', skill: 'writing', due: 'Sábado', minutes: 5, reason: 'Usados en tu último correo' },
]

export interface HistoryItem {
  id: string
  date: string
  title: string
  detail: string
  skill: SkillId
  kind: 'mastery' | 'unlock' | 'practice'
}

export const HISTORY: HistoryItem[] = [
  {
    id: 'h1',
    date: 'Ayer',
    title: 'Dominaste: presentarte en una entrevista',
    detail: '3 usos correctos en conversaciones distintas',
    skill: 'speaking',
    kind: 'mastery',
  },
  {
    id: 'h2',
    date: 'Lun',
    title: 'Desbloqueaste: Check-in en el hotel',
    detail: 'Nueva situación comunicativa disponible',
    skill: 'listening',
    kind: 'unlock',
  },
  {
    id: 'h3',
    date: 'Sáb',
    title: 'Reescribiste tu correo formal',
    detail: '5 de 6 correcciones aplicadas por ti',
    skill: 'writing',
    kind: 'practice',
  },
]
