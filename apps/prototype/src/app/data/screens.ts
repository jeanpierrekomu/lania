import {
  ClipboardCheck,
  Compass,
  GraduationCap,
  Headphones,
  House,
  LayoutGrid,
  ChartLine,
  Map,
  Mic,
  Palette,
  PenLine,
  Radio,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface ScreenInfo {
  code: string
  path: string
  title: string
  group: 'Marketing' | 'Primeros pasos' | 'Aplicación' | 'Sistema'
  desc: string
  icon: LucideIcon
}

export const SCREENS: ScreenInfo[] = [
  { code: 'A', path: '/', title: 'Landing page', group: 'Marketing', desc: 'Portada, beneficios, metodología, salones, precios y FAQ.', icon: Sparkles },
  { code: 'B', path: '/onboarding', title: 'Onboarding', group: 'Primeros pasos', desc: 'Objetivo, nivel, intereses, ritmo, profesora y accesibilidad.', icon: Compass },
  { code: 'C', path: '/diagnostico', title: 'Diagnóstico de inglés', group: 'Primeros pasos', desc: 'Una pregunta a la vez, 5 habilidades, pausa y continuación.', icon: ClipboardCheck },
  { code: 'D', path: '/app', title: 'Dashboard', group: 'Aplicación', desc: 'Saludo de Lania, objetivo, habilidades, repasos y salas.', icon: House },
  { code: 'E', path: '/app/aula', title: 'Aula con Lania', group: 'Aplicación', desc: 'Clase guiada con pistas, explicación y feedback contextual.', icon: GraduationCap },
  { code: 'F', path: '/app/speaking', title: 'Speaking Lab', group: 'Aplicación', desc: 'Conversación inmersiva, subtítulos, velocidad y correcciones.', icon: Mic },
  { code: 'G', path: '/app/listening', title: 'Listening Lab', group: 'Aplicación', desc: 'Reproductor accesible, transcripción por fragmentos y quiz.', icon: Headphones },
  { code: 'H', path: '/app/writing', title: 'Writing Lab', group: 'Aplicación', desc: 'Editor limpio, revisión, reescritura y comparación.', icon: PenLine },
  { code: 'I', path: '/app/salones', title: 'Salones comunitarios', group: 'Aplicación', desc: 'Grupos pequeños por nivel, tema y horario.', icon: Users },
  { code: 'I·2', path: '/app/salones/cafe-internacional', title: 'Sala en vivo', group: 'Aplicación', desc: 'Cuatro estudiantes y Lania como moderadora.', icon: Radio },
  { code: 'J', path: '/app/progreso', title: 'Perfil y progreso', group: 'Aplicación', desc: 'Competencias, errores recurrentes, evaluaciones y plan.', icon: ChartLine },
  { code: '+', path: '/app/misiones', title: 'Misiones y situaciones', group: 'Aplicación', desc: 'Gamificación ligera: misiones, historias y dominio.', icon: Map },
  { code: 'S', path: '/sistema', title: 'Marca y sistema de diseño', group: 'Sistema', desc: 'Moodboard, logo, color, tipografía, componentes y Lania.', icon: Palette },
  { code: 'P', path: '/prototipo', title: 'Mapa del prototipo', group: 'Sistema', desc: 'Flujo navegable y vistas a 1440, 768 y 390 px.', icon: LayoutGrid },
]
