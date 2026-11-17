import { Coffee, PlaneTakeoff, type LucideIcon } from 'lucide-react'

export interface Segment {
  speaker: string
  text: string
  pitch: number
}

export interface ListeningQuestion {
  id: string
  prompt: string
  options: string[]
  answer: number
  explanation: string
  segment: number
}

export interface Episode {
  id: string
  title: string
  context: string
  level: string
  icon: LucideIcon
  tone: 'coral' | 'violet'
  speakers: string
  segments: Segment[]
  questions: ListeningQuestion[]
  dictation: { before: string; after: string; answer: string; segment: number }
}

export const EPISODES: Episode[] = [
  {
    id: 'cafe-toronto',
    title: 'Un café en Toronto',
    context: 'Dos amigos se encuentran en una cafetería.',
    level: 'B1',
    icon: Coffee,
    tone: 'coral',
    speakers: 'Mia y Sam',
    segments: [
      { speaker: 'Mia', text: "Hey Sam! Sorry I'm late. The bus was delayed again.", pitch: 1.15 },
      { speaker: 'Sam', text: 'No worries, I just got here too. Do you want a coffee?', pitch: 0.85 },
      { speaker: 'Mia', text: 'Yes, please. A large latte with oat milk, if they have it.', pitch: 1.15 },
      { speaker: 'Sam', text: 'Sure. By the way, are you still coming to the concert on Friday?', pitch: 0.85 },
      { speaker: 'Mia', text: "I'd love to, but I have a presentation on Saturday morning.", pitch: 1.15 },
      { speaker: 'Sam', text: "Come on, it finishes at ten. You'll be home early.", pitch: 0.85 },
      { speaker: 'Mia', text: "Okay, okay. You convinced me. But I'm buying the tickets!", pitch: 1.15 },
    ],
    questions: [
      {
        id: 'q1',
        prompt: '¿Por qué llegó tarde Mia?',
        options: ['Se quedó dormida', 'El autobús se retrasó', 'Se perdió en el camino', 'Tenía una presentación'],
        answer: 1,
        explanation: 'Mia dice “The bus was delayed again”. Delayed = retrasado.',
        segment: 0,
      },
      {
        id: 'q2',
        prompt: '¿Qué pide Mia?',
        options: ['Un café pequeño', 'Un latte grande con leche de avena', 'Un té con leche', 'Un latte con leche entera'],
        answer: 1,
        explanation: '“A large latte with oat milk”. Oat = avena.',
        segment: 2,
      },
      {
        id: 'q3',
        prompt: '¿Por qué duda en ir al concierto?',
        options: ['No le gusta la banda', 'Tiene una presentación el sábado', 'Las entradas son caras', 'Termina muy tarde'],
        answer: 1,
        explanation: '“I’d love to, but I have a presentation on Saturday morning.” I’d love to, but… = me encantaría, pero…',
        segment: 4,
      },
    ],
    dictation: { before: 'Come on, it finishes at', after: ". You'll be home early.", answer: 'ten', segment: 5 },
  },
  {
    id: 'aeropuerto',
    title: 'Anuncio en el aeropuerto',
    context: 'Un aviso por altavoz sobre un vuelo a Lima.',
    level: 'A2+',
    icon: PlaneTakeoff,
    tone: 'violet',
    speakers: 'Anuncio oficial',
    segments: [
      { speaker: 'Anuncio', text: 'Good afternoon, passengers. This is an announcement for flight LA 2047 to Lima.', pitch: 0.95 },
      { speaker: 'Anuncio', text: 'Due to bad weather, the flight is delayed by forty-five minutes.', pitch: 0.95 },
      { speaker: 'Anuncio', text: 'The new departure time is six fifteen pm, from gate twelve.', pitch: 0.95 },
      { speaker: 'Anuncio', text: 'Passengers with small children may board first. Thank you for your patience.', pitch: 0.95 },
    ],
    questions: [
      {
        id: 'q1',
        prompt: '¿Cuánto se retrasa el vuelo?',
        options: ['15 minutos', '45 minutos', '1 hora', '2 horas'],
        answer: 1,
        explanation: '“Delayed by forty-five minutes”: forty-five = 45.',
        segment: 1,
      },
      {
        id: 'q2',
        prompt: '¿De qué puerta sale ahora?',
        options: ['Puerta 2', 'Puerta 6', 'Puerta 12', 'Puerta 20'],
        answer: 2,
        explanation: '“From gate twelve”: twelve = 12. No lo confundas con twenty (20).',
        segment: 2,
      },
    ],
    dictation: { before: 'Thank you for your', after: '.', answer: 'patience', segment: 3 },
  },
]
