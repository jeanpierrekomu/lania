import { Clapperboard, Coffee, Cpu, GraduationCap, Rocket, Sun, type LucideIcon } from 'lucide-react'
import type { Cefr } from '@/app/state/learner'
import type { SkillTone } from './skills'
import type { PersonId } from './people'

export type RoomStatus = 'live' | 'soon' | 'scheduled'

export interface Room {
  id: string
  name: string
  topic: string
  interest: string
  level: Cefr
  people: PersonId[]
  capacity: number
  status: RoomStatus
  when: string
  day: 'hoy' | 'semana'
  goal: string
  minutes: number
  icon: LucideIcon
  tone: SkillTone
}

export const ROOMS: Room[] = [
  {
    id: 'cafe-internacional',
    name: 'Café Internacional',
    topic: 'Planear un viaje de fin de semana',
    interest: 'Viajes',
    level: 'B1',
    people: ['diego', 'camila', 'mateo'],
    capacity: 5,
    status: 'live',
    when: 'En vivo · empezó hace 6 min',
    day: 'hoy',
    goal: 'Proponer, negociar y acordar un plan en grupo',
    minutes: 30,
    icon: Coffee,
    tone: 'coral',
  },
  {
    id: 'pitch-night',
    name: 'Pitch Night',
    topic: 'Presenta una idea en 60 segundos',
    interest: 'Negocios',
    level: 'B1+',
    people: ['ana', 'luis'],
    capacity: 5,
    status: 'soon',
    when: 'Hoy · 19:00',
    day: 'hoy',
    goal: 'Explicar un producto y responder preguntas',
    minutes: 40,
    icon: Rocket,
    tone: 'violet',
  },
  {
    id: 'series-sin-spoilers',
    name: 'Series sin spoilers',
    topic: 'Recomienda una serie sin contar el final',
    interest: 'Entretenimiento',
    level: 'B1',
    people: ['sofia', 'andres', 'camila', 'luis'],
    capacity: 5,
    status: 'soon',
    when: 'Hoy · 21:00',
    day: 'hoy',
    goal: 'Describir personajes y dar opiniones',
    minutes: 30,
    icon: Clapperboard,
    tone: 'amber',
  },
  {
    id: 'campus-life',
    name: 'Campus Life',
    topic: 'Tu primer día de intercambio',
    interest: 'Universidad',
    level: 'A2+',
    people: ['mateo'],
    capacity: 5,
    status: 'scheduled',
    when: 'Mañana · 08:00',
    day: 'semana',
    goal: 'Presentarte y hacer preguntas básicas',
    minutes: 25,
    icon: GraduationCap,
    tone: 'mint',
  },
  {
    id: 'tech-talk',
    name: 'Tech Talk',
    topic: '¿La IA cambiará tu profesión?',
    interest: 'Tecnología',
    level: 'B2',
    people: ['diego', 'ana', 'andres'],
    capacity: 5,
    status: 'scheduled',
    when: 'Jue · 18:30',
    day: 'semana',
    goal: 'Argumentar a favor y en contra con ejemplos',
    minutes: 45,
    icon: Cpu,
    tone: 'indigo',
  },
  {
    id: 'slow-sunday',
    name: 'Slow English Sunday',
    topic: 'Conversación pausada sobre tu semana',
    interest: 'Calma',
    level: 'A2',
    people: ['sofia', 'ana'],
    capacity: 5,
    status: 'scheduled',
    when: 'Dom · 10:00',
    day: 'semana',
    goal: 'Practicar sin prisa, con frases útiles a la vista',
    minutes: 30,
    icon: Sun,
    tone: 'violet',
  },
]

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r])) as Record<string, Room>
