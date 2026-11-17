export type IssueCategory = 'Gramática' | 'Vocabulario' | 'Tono'

export interface Issue {
  id: string
  start: number
  end: number
  original: string
  suggestion: string
  category: IssueCategory
  title: string
  explanation: string
  hint: string
}

type Built = Omit<Issue, 'id' | 'start' | 'end' | 'original'>

const PAST: Record<string, string> = {
  work: 'worked',
  study: 'studied',
  live: 'lived',
  go: 'went',
  make: 'made',
  have: 'had',
  see: 'saw',
  visit: 'visited',
  play: 'played',
  watch: 'watched',
  eat: 'ate',
  meet: 'met',
}
const THIRD: Record<string, string> = { work: 'works', live: 'lives', want: 'wants', like: 'likes', study: 'studies', go: 'goes', need: 'needs' }

const keepCase = (orig: string, next: string) => (orig[0] === orig[0]?.toUpperCase() ? next[0].toUpperCase() + next.slice(1) : next)

/** Typical errors of Spanish-speaking learners, explained briefly in Spanish. */
const RULES: { re: RegExp; build: (m: RegExpExecArray) => Built }[] = [
  {
    re: /^(Hello|Hi)(,?\s+(?:Ms\.|Mr\.|Mrs\.|Dr\.))/gim,
    build: (m) => ({
      suggestion: `Dear${m[2].replace(/^,/, '')}`,
      category: 'Tono',
      title: 'Saludo formal',
      explanation: 'En un correo formal, “Dear Ms. Rivera” suena más profesional que “Hello”.',
      hint: '¿Es un correo formal o entre amigos?',
    }),
  },
  {
    re: /\bI have (\d+) years\b(?! old)/gi,
    build: (m) => ({
      suggestion: `I am ${m[1]} years old`,
      category: 'Gramática',
      title: 'La edad va con “be”',
      explanation: 'En inglés la edad se dice con be: I am 23 years old, no con have.',
      hint: '¿Qué verbo usa el inglés para decir la edad?',
    }),
  },
  {
    re: /\bActually,? (I|we) (study|work|live)\b/g,
    build: (m) => ({
      suggestion: `Currently, ${m[1]} ${m[2]}`,
      category: 'Vocabulario',
      title: 'Falso amigo: actually',
      explanation: '“Actually” significa “en realidad”. Para “actualmente” usa currently.',
      hint: '¿“Actually” significa lo mismo que “actualmente”?',
    }),
  },
  {
    re: /\b(I am|I'm|she is|he is|we are|they are) interesting in\b/gi,
    build: (m) => ({
      suggestion: `${m[1]} interested in`,
      category: 'Gramática',
      title: 'Interested vs. interesting',
      explanation: '“Interested” describe cómo te sientes tú; “interesting”, cómo es algo.',
      hint: '¿Tú eres interesante… o estás interesada?',
    }),
  },
  {
    re: /\b(Last (?:year|week|weekend|month|summer)|Yesterday),? (I|we|she|he|they) (work|study|live|go|make|have|see|visit|play|watch|eat|meet)\b/gi,
    build: (m) => ({
      suggestion: `${m[1]} ${m[2]} ${PAST[m[3].toLowerCase()]}`,
      category: 'Gramática',
      title: 'Pasado simple',
      explanation: `“${m[1]}” indica una acción terminada: ${m[3].toLowerCase()} → ${PAST[m[3].toLowerCase()]}.`,
      hint: 'Mira la expresión de tiempo al inicio de la frase.',
    }),
  },
  {
    re: /\bwhere I make (weekly )?reports\b/gi,
    build: (m) => ({
      suggestion: `where I prepared ${m[1] ?? ''}reports`,
      category: 'Vocabulario',
      title: 'Make vs. prepare',
      explanation: 'Con “reports” se usa prepare o write. Y como ya pasó, va en pasado: prepared.',
      hint: '¿Qué verbo va con “reports”? ¿Y en qué tiempo?',
    }),
  },
  {
    re: /\bI am agree\b/gi,
    build: () => ({
      suggestion: 'I agree',
      category: 'Gramática',
      title: '“Agree” ya es verbo',
      explanation: 'Se dice “I agree”. No necesita “am”.',
      hint: '¿Necesitas “am” delante de agree?',
    }),
  },
  {
    re: /\bthe key of\b/gi,
    build: (m) => ({
      suggestion: keepCase(m[0], 'the key to'),
      category: 'Vocabulario',
      title: 'Preposición: key to',
      explanation: 'Decimos “the key to success”, con to.',
      hint: '¿Qué preposición acompaña a “key”?',
    }),
  },
  {
    re: /\b(Can|Could) you explain me\b/gi,
    build: () => ({
      suggestion: 'Could you explain to me',
      category: 'Gramática',
      title: 'Explain to me',
      explanation: '“Explain” necesita to antes de la persona. Y could suena más amable en un correo formal.',
      hint: 'Explain + ¿qué palabra? + persona',
    }),
  },
  {
    re: /\bpeople is\b/gi,
    build: (m) => ({ suggestion: keepCase(m[0], 'people are'), category: 'Gramática', title: 'People es plural', explanation: '“People” es plural: people are.', hint: '¿“People” es singular o plural?' }),
  },
  {
    re: /\bmore better\b/gi,
    build: () => ({ suggestion: 'better', category: 'Gramática', title: 'Comparativo', explanation: '“Better” ya es comparativo: no necesita more.', hint: '¿Hace falta “more”?' }),
  },
  {
    re: /\bdepends? of\b/gi,
    build: (m) => ({ suggestion: m[0].replace(/of$/i, 'on'), category: 'Vocabulario', title: 'Depend on', explanation: 'En inglés se dice “depend on”.', hint: '¿Qué preposición va con depend?' }),
  },
  {
    re: /\bsince (\d+) years\b/gi,
    build: (m) => ({ suggestion: `for ${m[1]} years`, category: 'Gramática', title: 'For vs. since', explanation: 'Para duraciones usamos for; since va con un punto de inicio.', hint: '¿Es una duración o un momento?' }),
  },
  {
    re: /\ba (exam|interview|idea|amazing|apple|hour|internship|email|office|answer|opportunity)\b/gi,
    build: (m) => ({ suggestion: `an ${m[1]}`, category: 'Gramática', title: 'A vs. an', explanation: 'Antes de sonido vocal usamos “an”: an exam, an interview.', hint: '¿Cómo empieza a sonar la palabra?' }),
  },
  {
    re: /\b(he|she|it) (work|live|want|like|study|go|need)\b/gi,
    build: (m) => ({
      suggestion: `${m[1]} ${THIRD[m[2].toLowerCase()]}`,
      category: 'Gramática',
      title: 'Tercera persona: -s',
      explanation: `Con he/she/it el verbo lleva -s en presente: ${THIRD[m[2].toLowerCase()]}.`,
      hint: '¿Qué le pasa al verbo con he, she o it?',
    }),
  },
]

export function checkText(text: string): Issue[] {
  const found: Issue[] = []
  RULES.forEach((rule, r) => {
    rule.re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = rule.re.exec(text))) {
      const built = rule.build(m)
      if (built.suggestion !== m[0]) found.push({ id: `${r}-${m.index}`, start: m.index, end: m.index + m[0].length, original: m[0], ...built })
      if (!rule.re.global) break
    }
  })
  found.sort((a, b) => a.start - b.start)
  const kept: Issue[] = []
  for (const iss of found) if (!kept.length || iss.start >= kept[kept.length - 1].end) kept.push(iss)
  return kept
}

export function applyIssue(text: string, issue: Issue) {
  return text.slice(0, issue.start) + issue.suggestion + text.slice(issue.end)
}

export function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}
