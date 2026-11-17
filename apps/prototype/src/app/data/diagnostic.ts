import type { SkillId } from './skills'

export type DiagQuestion =
  | { id: string; kind: 'choice'; section: SkillId; prompt: string; sentence?: string; options: string[]; answer: number }
  | { id: string; kind: 'listen'; section: SkillId; prompt: string; audio: string; options: string[]; answer: number }
  | { id: string; kind: 'read'; section: SkillId; prompt: string; passage: string; options: string[]; answer: number }
  | { id: string; kind: 'write'; section: SkillId; prompt: string; minWords: number; placeholder: string }
  | { id: string; kind: 'speak'; section: SkillId; prompt: string; readAloud?: string; seconds: number }

const PASSAGE =
  'Ana works from home three days a week. On the other two days, she goes to a café near her apartment. “At home I get distracted by everything,” she says, “but at the café the noise helps me focus. It’s crowded, but nobody interrupts me.” She usually orders a large coffee and stays until lunch.'

export const DIAG_SECTIONS: { id: SkillId; label: string; tip: string }[] = [
  { id: 'grammar', label: 'Gramática', tip: 'Elige la opción que suene más natural. Si dudas, “No lo sé” también me ayuda.' },
  { id: 'listening', label: 'Listening', tip: 'Puedes escuchar las veces que necesites y cambiar la velocidad.' },
  { id: 'reading', label: 'Reading', tip: 'Lee con calma. El texto se queda a la vista mientras respondes.' },
  { id: 'writing', label: 'Writing', tip: 'No busco perfección: escribe como lo dirías a un amigo.' },
  { id: 'speaking', label: 'Speaking', tip: 'Habla con calma. Si no tienes micrófono, puedes omitir esta parte.' },
]

export const DIAG_QUESTIONS: DiagQuestion[] = [
  { id: 'g1', kind: 'choice', section: 'grammar', prompt: 'Completa la frase', sentence: 'She ___ to the office every day.', options: ['go', 'goes', 'going', 'is go'], answer: 1 },
  { id: 'g2', kind: 'choice', section: 'grammar', prompt: 'Completa la frase', sentence: 'I ___ my keys. I can’t find them anywhere.', options: ['lost', 'have lost', 'was losing', 'lose'], answer: 1 },
  { id: 'g3', kind: 'choice', section: 'grammar', prompt: 'Elige la palabra correcta', sentence: 'Could you ___ me a favor?', options: ['make', 'do', 'give', 'take'], answer: 1 },
  {
    id: 'l1',
    kind: 'listen',
    section: 'listening',
    prompt: '¿Cuándo puede visitar el apartamento?',
    audio: 'Hi, I’m calling about the apartment. Is it still available? I could visit on Thursday after six.',
    options: ['El jueves por la mañana', 'El jueves después de las seis', 'El martes después de las seis', 'Este fin de semana'],
    answer: 1,
  },
  {
    id: 'l2',
    kind: 'listen',
    section: 'listening',
    prompt: '¿De qué andén sale el tren?',
    audio: 'Attention, please. The train to Monterrey will now depart from platform four at nine fifteen.',
    options: ['Andén 2', 'Andén 4', 'Andén 5', 'Andén 9'],
    answer: 1,
  },
  {
    id: 'r1',
    kind: 'read',
    section: 'reading',
    prompt: '¿Por qué Ana prefiere trabajar en el café?',
    passage: PASSAGE,
    options: ['Porque el café es barato', 'Porque el ruido la ayuda a concentrarse', 'Porque vive lejos del café', 'Porque sus amigos trabajan allí'],
    answer: 1,
  },
  { id: 'r2', kind: 'read', section: 'reading', prompt: 'En el texto, “crowded” significa…', passage: PASSAGE, options: ['Lleno de gente', 'Silencioso', 'Caro', 'Lejano'], answer: 0 },
  {
    id: 'w1',
    kind: 'write',
    section: 'writing',
    prompt: 'Escribe 2 o 3 frases: What did you do last weekend?',
    minWords: 15,
    placeholder: 'Last weekend I…',
  },
  { id: 's1', kind: 'speak', section: 'speaking', prompt: 'Lee en voz alta esta frase', readAloud: 'I’d like to book a table for two at eight, please.', seconds: 10 },
  { id: 's2', kind: 'speak', section: 'speaking', prompt: 'Responde en inglés: What do you like about your city?', seconds: 30 },
]

export const LEVEL_CAN_DO: Record<string, string> = {
  A1: 'Usas palabras y frases muy básicas.',
  A2: 'Te comunicas en situaciones cotidianas con frases simples.',
  'A2+': 'Describes tu rutina y tu entorno con frases conectadas.',
  B1: 'Hablas de experiencias, planes y opiniones con algunas pausas.',
  'B1+': 'Mantienes conversaciones sobre temas conocidos con soltura.',
  B2: 'Argumentas y explicas con claridad sobre temas variados.',
}
