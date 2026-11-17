import { Briefcase, Clapperboard, Plane, Sun, type LucideIcon } from 'lucide-react'

export interface Correction {
  original: string
  better: string
  why: string
}

export interface Turn {
  /** Simulated transcript of the learner's first attempt. */
  student: string
  corrections: Correction[]
  /** Spanish feedback used when corrections happen "in the moment". */
  moment?: string
  /** Simulated transcript of the retry after in-the-moment feedback. */
  retry?: string
  /** Suggested way to start, shown when the learner asks for help. */
  help: string
  /** Lania's English reply after this turn (closing line on the last turn). */
  reply: string
}

export interface Conversation {
  id: string
  title: string
  level: string
  desc: string
  icon: LucideIcon
  opener: (name: string) => string
  turns: Turn[]
  wins: string[]
  phrase: { en: string; es: string }
}

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'fin-de-semana',
    title: 'Tu fin de semana',
    level: 'A2+ · B1',
    desc: 'Cuenta qué hiciste usando el pasado.',
    icon: Sun,
    opener: (n) => `Hi ${n}! It's so good to see you. So, tell me: what did you do last weekend?`,
    turns: [
      {
        student: 'Yesterday I go to the university with my friends.',
        corrections: [{ original: 'Yesterday I go', better: 'Yesterday I went', why: '“Yesterday” pide pasado: go → went.' }],
        moment: '¡Casi! Ya entendí lo que quieres decir. Pero dijiste yesterday, así que necesitamos pasado. ¿Recuerdas cómo cambia go?',
        retry: 'Yesterday I went to the university with my friends.',
        help: 'Puedes empezar con: “Last weekend I went to…”',
        reply: 'Oh, nice! On a weekend? What did you do there?',
      },
      {
        student: 'We study for a exam of statistics.',
        corrections: [
          { original: 'We study', better: 'We studied', why: 'Sigue siendo pasado: study → studied.' },
          { original: 'a exam of statistics', better: 'a statistics exam', why: 'Antes de vocal va “an”, y el tema se coloca antes: a statistics exam.' },
        ],
        moment: 'Te entendí. Dos detalles rápidos: studied, en pasado, y “a statistics exam”. ¿Lo dices otra vez?',
        retry: 'We studied for a statistics exam.',
        help: 'Prueba con: “We studied for…”',
        reply: 'Statistics! That sounds intense. How did you feel about it?',
      },
      {
        student: 'I was nervous, but I think it went well.',
        corrections: [],
        help: 'Puedes decir: “I was nervous, but…”',
        reply: "That's great to hear. You told me a whole story in the past. Really well done!",
      },
    ],
    wins: ['Usaste “I was nervous” con naturalidad', 'Conectaste ideas con “but”', 'Contaste una historia completa en pasado'],
    phrase: { en: 'It went well', es: 'Salió bien' },
  },
  {
    id: 'entrevista',
    title: 'Entrevista de trabajo',
    level: 'B1',
    desc: 'Preséntate y responde como en una entrevista real.',
    icon: Briefcase,
    opener: () => 'Welcome! Thanks for coming in today. Could you tell me a little about yourself?',
    turns: [
      {
        student: 'I am Valentina, I have 23 years and I study industrial engineering.',
        corrections: [{ original: 'I have 23 years', better: 'I am 23 years old', why: 'En inglés la edad se dice con “be”.' }],
        moment: 'Muy buen inicio. Solo un detalle: la edad en inglés va con “be”: I am 23 years old. ¿Lo intentas?',
        retry: "I'm Valentina, I'm 23 years old and I study industrial engineering.",
        help: 'Empieza con: “I’m…, I’m … years old and I study…”',
        reply: 'Great. And why are you interested in this internship?',
      },
      {
        student: 'Because I am interesting in data and I like to solve problems.',
        corrections: [{ original: 'I am interesting in', better: 'I am interested in', why: 'Interested = cómo te sientes; interesting = cómo es algo.' }],
        moment: '¡Me gusta tu respuesta! Pero dijiste “interesting”: así suena a que tú eres interesante. ¿Cómo dirías que te interesa?',
        retry: "Because I'm interested in data and I like solving problems.",
        help: 'Prueba con: “I’m interested in… because…”',
        reply: "That's a strong answer. Can you tell me about a challenge you faced?",
      },
      {
        student: 'Last year I organized a project with five people and we finished on time.',
        corrections: [],
        help: 'Usa el pasado: “Last year I organized…”',
        reply: "Excellent example: clear, specific and in the past tense. You'd do great in a real interview!",
      },
    ],
    wins: ['Respondiste con un ejemplo concreto', 'Usaste “organized” y “finished” en pasado', 'Mantuviste un tono profesional'],
    phrase: { en: 'I faced a challenge when…', es: 'Enfrenté un reto cuando…' },
  },
  {
    id: 'viajes',
    title: 'Viajes',
    level: 'A2+',
    desc: 'Describe un lugar y da recomendaciones.',
    icon: Plane,
    opener: () => "Hi! I heard you love traveling. What's the best place you've visited?",
    turns: [
      {
        student: 'The best place I visited is Cartagena, in Colombia.',
        corrections: [{ original: 'The best place I visited is', better: "The best place I've visited is", why: 'Para experiencias de toda la vida, el present perfect suena más natural.' }],
        moment: "Te entiendo perfecto. Un toque más natural: “The best place I've visited…”. ¿Lo repites?",
        retry: "The best place I've visited is Cartagena, in Colombia.",
        help: "Puedes decir: “The best place I've visited is…”",
        reply: 'Cartagena! What did you like the most?',
      },
      {
        student: 'The old city is very beautiful and the food is amazing.',
        corrections: [],
        help: 'Describe: “The … is beautiful and …”',
        reply: "I'd love to go. Would you recommend it in December?",
      },
      {
        student: 'Yes, but it is very hot and there are many people.',
        corrections: [{ original: 'there are many people', better: "it's really crowded", why: '“Crowded” es la palabra exacta para un lugar lleno de gente.' }],
        moment: '¡Perfecto el “but”! Si quieres sonar más natural: “it’s really crowded”. ¿Lo intentas?',
        retry: "Yes, but it's very hot and really crowded.",
        help: 'Da un consejo: “Yes, but…”',
        reply: 'Good tip! You described a place, gave an opinion and a warning. Great job!',
      },
    ],
    wins: ['Describiste un lugar con adjetivos variados', 'Diste una opinión y un consejo', 'Usaste “but” para matizar'],
    phrase: { en: "It's really crowded", es: 'Está lleno de gente' },
  },
  {
    id: 'series',
    title: 'Series y películas',
    level: 'B1',
    desc: 'Recomienda una serie sin contar el final.',
    icon: Clapperboard,
    opener: () => "Let's talk about series! What are you watching these days?",
    turns: [
      {
        student: 'I am watching a series of detectives, it is very interesting.',
        corrections: [{ original: 'a series of detectives', better: 'a detective series', why: 'En inglés el tipo va antes: a detective series.' }],
        moment: '¡Me encanta! Un detalle de orden: “a detective series”. ¿Lo repites?',
        retry: "I'm watching a detective series, it's really interesting.",
        help: 'Empieza con: “I’m watching…”',
        reply: 'Ooh! What is it about? No spoilers, please!',
      },
      {
        student: "It's about a woman who investigate crimes in her small town.",
        corrections: [{ original: 'who investigate', better: 'who investigates', why: 'Con “a woman” (ella) el verbo lleva -s.' }],
        moment: 'Bien explicado y sin spoilers. Recuerda la -s: “a woman who investigates”. ¿Lo dices otra vez?',
        retry: "It's about a woman who investigates crimes in her small town.",
        help: 'Explica: “It’s about a … who…”',
        reply: 'Sounds great. Would you recommend it to me?',
      },
      {
        student: 'Definitely! The characters are very well written.',
        corrections: [],
        help: 'Recomienda: “Definitely! The … are…”',
        reply: "Then it's on my list! You described, explained and recommended. Excellent.",
      },
    ],
    wins: ['Explicaste una trama sin spoilers', 'Diste una recomendación clara', 'Usaste “well written” como nativa'],
    phrase: { en: 'The characters are well written', es: 'Los personajes están bien construidos' },
  },
]
