import { useId } from 'react'
import { cn } from '@/app/lib/cn'

/**
 * Lania · profesora de IA de LANIA.
 * Front-view editorial character built from named layers so it can be
 * re-rigged in Rive/Lottie: hair-back, neck, torso, head, face, hair-front, arms.
 */
export type LaniaExpression =
  | 'neutral'
  | 'welcome'
  | 'listening'
  | 'explaining'
  | 'thinking'
  | 'correcting'
  | 'celebrating'

type EyeKind = 'open' | 'happy' | 'up' | 'wide'
type BrowKind = 'neutral' | 'raised' | 'quizzical' | 'kind' | 'focused'
type MouthKind = 'smile' | 'gentle' | 'grin' | 'talk' | 'side'
type ArmKind = 'rest' | 'wave' | 'ear' | 'point' | 'chin' | 'chest' | 'cheer'
type HandKind = 'open' | 'index'
type Pt = readonly [number, number]

interface Pose {
  eyes: EyeKind
  brows: BrowKind
  mouth: MouthKind
  arms: ArmKind
  tilt: number
}

const POSES: Record<LaniaExpression, Pose> = {
  neutral: { eyes: 'open', brows: 'neutral', mouth: 'smile', arms: 'rest', tilt: 0 },
  welcome: { eyes: 'happy', brows: 'raised', mouth: 'grin', arms: 'wave', tilt: -4 },
  listening: { eyes: 'wide', brows: 'raised', mouth: 'gentle', arms: 'ear', tilt: 6 },
  explaining: { eyes: 'open', brows: 'focused', mouth: 'talk', arms: 'point', tilt: -3 },
  thinking: { eyes: 'up', brows: 'quizzical', mouth: 'side', arms: 'chin', tilt: 5 },
  correcting: { eyes: 'open', brows: 'kind', mouth: 'smile', arms: 'chest', tilt: -6 },
  celebrating: { eyes: 'happy', brows: 'raised', mouth: 'grin', arms: 'cheer', tilt: 0 },
}

const CROPS = {
  bust: '0 0 400 440',
  portrait: '52 20 296 330',
  head: '84 24 232 232',
} as const

export type LaniaCrop = keyof typeof CROPS

export interface LaniaProps {
  expression?: LaniaExpression
  /** Animates the mouth as if speaking. */
  talking?: boolean
  crop?: LaniaCrop
  /** Idle motion (blink, breathe, gestures). Global motion preferences still apply. */
  animated?: boolean
  className?: string
  /** Accessible label; omit for decorative usage. */
  title?: string
}

const C = {
  skin: 'var(--illo-skin)',
  skinShade: 'var(--illo-skin-shade)',
  skinLight: 'var(--illo-skin-light)',
  hair: 'var(--illo-hair)',
  hairShine: 'var(--illo-hair-shine)',
  hairDeep: 'var(--illo-hair-deep)',
  mouth: 'var(--illo-mouth)',
  tongue: 'var(--illo-tongue)',
  blush: 'var(--illo-blush)',
  coral: 'var(--illo-coral)',
  coralShade: 'var(--illo-coral-shade)',
  coralDeep: 'var(--illo-coral-deep)',
  violet: 'var(--illo-violet)',
  violetShade: 'var(--illo-violet-shade)',
  violetLight: 'var(--illo-violet-light)',
  lavender: 'var(--illo-lavender)',
  mint: 'var(--illo-mint-light)',
  white: 'var(--illo-white)',
}

const FACE =
  'M 146 170 C 146 130 170 104 200 104 C 230 104 254 130 254 170 C 254 210 232 244 200 250 C 168 244 146 210 146 170 Z'

const HAIR_BACK =
  'M 200 78 C 150 78 120 110 120 160 C 120 200 124 232 140 250 C 150 260 166 258 170 248 L 230 248 C 236 256 250 258 260 248 C 274 230 280 200 280 160 C 280 110 250 78 200 78 Z'

const HAIR_FRONT =
  'M 232 84 C 196 78 150 92 136 138 C 128 166 128 206 140 236 C 146 250 160 256 168 250 C 172 246 170 240 166 236 C 156 216 152 192 156 168 C 162 146 186 128 214 122 C 232 118 246 124 252 136 C 254 150 254 162 250 172 C 262 150 258 110 232 84 Z'

const TORSO_BASE =
  'M 84 440 C 86 366 104 322 150 304 C 164 298 176 292 182 286 L 218 286 C 224 292 236 298 250 304 C 296 322 314 366 316 440 Z'
const TEE =
  'M 84 440 C 86 366 104 322 150 304 C 160 299 168 295 172 293 Q 200 314 228 293 C 232 295 240 299 250 304 C 296 322 314 366 316 440 Z'
const JACKET_L = 'M 84 440 C 86 366 104 322 150 304 C 160 299 166 296 170 294 C 174 330 168 386 156 440 Z'
const JACKET_R = 'M 316 440 C 314 366 296 322 250 304 C 240 299 234 296 230 294 C 226 330 232 386 244 440 Z'

const SPARK = 'M 0 -10 C 1.6 -2.2 2.2 -1.6 10 0 C 2.2 1.6 1.6 2.2 0 10 C -1.6 2.2 -2.2 1.6 -10 0 C -2.2 -1.6 -1.6 -2.2 0 -10 Z'

interface ArmSpec {
  s: Pt
  e: Pt
  w: Pt
  hand: HandKind
  angle: number
  /** Fraction of forearm covered by the rolled sleeve. */
  sleeve?: number
  wave?: boolean
  flip?: boolean
}

const ARMS: Record<ArmKind, ArmSpec[]> = {
  rest: [],
  wave: [{ s: [290, 342], e: [340, 308], w: [332, 222], hand: 'open', angle: 8, wave: true }],
  cheer: [
    { s: [110, 342], e: [60, 308], w: [68, 222], hand: 'open', angle: -10, flip: true },
    { s: [290, 342], e: [340, 308], w: [332, 222], hand: 'open', angle: 10 },
  ],
  point: [{ s: [292, 342], e: [324, 392], w: [326, 286], hand: 'index', angle: -4 }],
  ear: [{ s: [292, 342], e: [334, 326], w: [296, 232], hand: 'index', angle: -35 }],
  chin: [{ s: [112, 342], e: [128, 416], w: [174, 290], hand: 'index', angle: 20, flip: true }],
  chest: [{ s: [112, 342], e: [108, 422], w: [172, 352], hand: 'open', angle: 58, flip: true, sleeve: 0.5 }],
}

function Hand({ kind, flip }: { kind: HandKind; flip?: boolean }) {
  const body = (() => {
    if (kind === 'open') {
      return (
        <g>
          <g stroke={C.skin} strokeLinecap="round" fill="none">
            <path d="M -9 -26 L -11.5 -46" strokeWidth={9} />
            <path d="M -3 -28 L -3.6 -51" strokeWidth={9} />
            <path d="M 3.2 -28 L 4.6 -49" strokeWidth={9} />
            <path d="M 9 -24 L 11.8 -41" strokeWidth={8.4} />
            <path d="M -12 -9 L -23 -21" strokeWidth={9.5} />
          </g>
          <path d="M -14 2 C -17 -8 -17 -22 -13 -31 L 13 -31 C 17 -22 17 -8 14 2 C 9 7 -9 7 -14 2 Z" fill={C.skin} />
          <g stroke={C.skinShade} strokeWidth={1.6} strokeLinecap="round" opacity={0.85}>
            <path d="M -6.6 -44 L -6.6 -35" />
            <path d="M 0.6 -46 L 0.4 -36" />
            <path d="M 7.4 -42 L 7 -34" />
          </g>
          <path d="M -6 -12 C -2 -8 4 -8 8 -12" stroke={C.skinShade} strokeWidth={2} strokeLinecap="round" fill="none" />
        </g>
      )
    }
    if (kind === 'index') {
      return (
        <g>
          <path d="M -6 -24 L -7 -54" stroke={C.skin} strokeWidth={8.5} strokeLinecap="round" />
          <rect x={-13} y={-31} width={27} height={33} rx={12} fill={C.skin} />
          <g stroke={C.skinShade} strokeWidth={2} strokeLinecap="round" fill="none">
            <path d="M -1 -21 L 12 -21" />
            <path d="M -1 -12 L 12 -12" />
            <path d="M -13 -14 C -8 -18 -2 -18 2 -14" />
          </g>
        </g>
      )
    }
    return null
  })()
  return flip ? <g transform="scale(-1 1)">{body}</g> : body
}

function Arm({ spec, animated }: { spec: ArmSpec; animated: boolean }) {
  const { s, e, w } = spec
  const len = Math.hypot(w[0] - e[0], w[1] - e[1])
  const d: Pt = [(w[0] - e[0]) / len, (w[1] - e[1]) / len]
  const t = spec.sleeve ?? 0.42
  const c: Pt = [e[0] + (w[0] - e[0]) * t, e[1] + (w[1] - e[1]) * t]
  const c1: Pt = [c[0] - d[0] * 6, c[1] - d[1] * 6]
  const c2: Pt = [c[0] + d[0] * 6, c[1] + d[1] * 6]
  const p = (pt: Pt) => `${pt[0]} ${pt[1]}`
  return (
    <g>
      <path d={`M ${p(s)} L ${p(e)}`} stroke={C.coral} strokeWidth={40} strokeLinecap="round" />
      <g
        className={cn('illo-view', spec.wave && animated && 'animate-wave')}
        style={{ transformOrigin: `${e[0]}px ${e[1]}px` }}
      >
        <path d={`M ${p(e)} L ${p(c)}`} stroke={C.coral} strokeWidth={34} strokeLinecap="round" />
        <path d={`M ${p(c2)} L ${p(w)}`} stroke={C.skin} strokeWidth={22} strokeLinecap="round" />
        <path d={`M ${p(c1)} L ${p(c2)}`} stroke={C.coralDeep} strokeWidth={38} />
        <g transform={`translate(${p(w)}) rotate(${spec.angle})`}>
          <Hand kind={spec.hand} flip={spec.flip} />
        </g>
      </g>
    </g>
  )
}

function Eyes({ kind, animated }: { kind: EyeKind; animated: boolean }) {
  if (kind === 'happy') {
    return (
      <g stroke={C.hair} strokeWidth={4.2} strokeLinecap="round" fill="none">
        <path d="M 169 185 Q 178 174 187 185" />
        <path d="M 213 185 Q 222 174 231 185" />
      </g>
    )
  }
  const r = kind === 'wide' ? { rx: 7, ry: 8.8 } : { rx: 6.4, ry: 8 }
  const off = kind === 'up' ? [3, -3] : [0, 0]
  const cx = [178 + off[0], 222 + off[0]]
  const cy = 182 + off[1]
  return (
    <g>
      <g className={cn('illo-part', animated && 'animate-blink')}>
        {cx.map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={cy} rx={r.rx} ry={r.ry} fill={C.hair} />
            <circle cx={x + 2.4} cy={cy - 3} r={2.2} fill={C.white} />
          </g>
        ))}
        <g stroke={C.hair} strokeWidth={2.6} strokeLinecap="round">
          <path d={`M ${cx[0] - 6} ${cy - 6} L ${cx[0] - 12} ${cy - 10}`} />
          <path d={`M ${cx[1] + 6} ${cy - 6} L ${cx[1] + 12} ${cy - 10}`} />
        </g>
      </g>
    </g>
  )
}

const BROWS: Record<BrowKind, [string, string]> = {
  neutral: ['M 166 161 Q 178 154 190 158', 'M 210 158 Q 222 154 234 161'],
  raised: ['M 166 155 Q 178 146 190 152', 'M 210 152 Q 222 146 234 155'],
  quizzical: ['M 166 160 Q 178 156 190 159', 'M 210 151 Q 222 142 234 150'],
  kind: ['M 166 157 Q 178 150 190 151', 'M 210 151 Q 222 150 234 157'],
  focused: ['M 166 158 Q 178 151 190 156', 'M 210 156 Q 222 151 234 158'],
}

function Mouth({ kind, talking, animated }: { kind: MouthKind; talking: boolean; animated: boolean }) {
  if (talking || kind === 'talk') {
    return (
      <g className={cn('illo-part', talking && animated && 'animate-talk')} style={{ transformOrigin: 'center top' }}>
        <path d="M 190 219 Q 200 216 210 219 Q 212 232 200 233 Q 188 232 190 219 Z" fill={C.mouth} />
        <path d="M 194 229 Q 200 225 206 229 Q 203 232.5 200 232.5 Q 197 232.5 194 229 Z" fill={C.tongue} />
      </g>
    )
  }
  if (kind === 'grin') {
    return (
      <g>
        <path d="M 184 216 Q 200 219 216 216 Q 214 238 200 240 Q 186 238 184 216 Z" fill={C.mouth} />
        <path d="M 187 217.6 Q 200 220.2 213 217.6 L 212 222.5 Q 200 224.5 188 222.5 Z" fill={C.white} />
        <path d="M 192 233 Q 200 228 208 233 Q 204 239 200 239 Q 196 239 192 233 Z" fill={C.tongue} />
      </g>
    )
  }
  const d = {
    smile: 'M 187 220 Q 200 230 213 220',
    gentle: 'M 190 222 Q 200 228 210 222',
    side: 'M 194 225 Q 203 224 211 219',
    talk: '',
    grin: '',
  }[kind]
  return <path d={d} stroke={C.mouth} strokeWidth={3.8} strokeLinecap="round" fill="none" />
}

export function Lania({
  expression = 'neutral',
  talking = false,
  crop = 'bust',
  animated = true,
  className,
  title,
}: LaniaProps) {
  const uid = useId().replace(/:/g, '')
  const pose = POSES[expression]
  const arms = ARMS[pose.arms]
  const headStyle = {
    transform: `rotate(${pose.tilt}deg)`,
    transformOrigin: '200px 250px',
    transition: 'transform 500ms cubic-bezier(.3,1.3,.5,1)',
  }
  const faceClip = `lania-face-${uid}`

  return (
    <svg
      viewBox={CROPS[crop]}
      className={cn('block', className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
    >
      <defs>
        <clipPath id={faceClip}>
          <path d={FACE} />
        </clipPath>
      </defs>

      <g className={cn('illo-view', animated && 'animate-breathe')}>
        {expression === 'celebrating' && (
          <g>
            {(
              [
                [96, 120, 1.3, C.coralDeep],
                [306, 104, 1, C.violetLight],
                [150, 52, 0.8, C.mint],
                [270, 30, 1.1, C.coralDeep],
              ] as const
            ).map(([x, y, s, fill], i) => (
              <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
                <path
                  d={SPARK}
                  fill={fill}
                  className={cn('illo-part', animated && 'animate-spark')}
                  style={{ animationDelay: `${i * 0.35}s` }}
                />
              </g>
            ))}
          </g>
        )}
        {expression === 'thinking' && (
          <g fill={C.violetLight}>
            <circle cx={286} cy={122} r={4} opacity={0.6} />
            <circle cx={302} cy={104} r={6} opacity={0.8} />
            <circle cx={324} cy={82} r={9} />
          </g>
        )}

        {/* hair-back */}
        <g className="illo-view" style={headStyle}>
          <circle cx={218} cy={62} r={24} fill={C.hair} />
          <path d="M 202 58 Q 206 44 220 41" stroke={C.hairShine} strokeWidth={5} strokeLinecap="round" />
          <path d={HAIR_BACK} fill={C.hairDeep} />
          <ellipse cx={214} cy={84} rx={19} ry={7.5} fill={C.coralDeep} />
          <path d="M 199 83 Q 214 88 229 83" stroke={C.coralShade} strokeWidth={2.4} strokeLinecap="round" />
        </g>

        {/* neck */}
        <rect x={182} y={222} width={36} height={76} fill={C.skin} />
        <path d="M 182 232 C 190 254 210 254 218 232 L 218 260 C 208 268 192 268 182 260 Z" fill={C.skinShade} />

        {/* torso */}
        <path d={TORSO_BASE} fill={C.skin} />
        <path d={TEE} fill={C.violet} />
        <path d="M 172 293 Q 200 314 228 293" stroke={C.violetShade} strokeWidth={4} strokeLinecap="round" />
        <path d="M 170 294 C 174 330 168 386 156 440 L 168 440 C 180 386 184 330 178 296 Z" fill={C.violetShade} />
        <path d="M 230 294 C 226 330 232 386 244 440 L 232 440 C 220 386 216 330 222 296 Z" fill={C.violetShade} />
        <path d={JACKET_L} fill={C.coral} />
        <path d={JACKET_R} fill={C.coral} />
        <path d="M 178 286 L 152 299 L 166 336 L 181 306 Z" fill={C.coralShade} />
        <path d="M 222 286 L 248 299 L 234 336 L 219 306 Z" fill={C.coralShade} />
        <rect x={258} y={348} width={32} height={28} rx={5} fill={C.coralShade} />
        <rect x={266} y={328} width={6} height={26} rx={3} fill={C.violet} />
        <path d="M 258 356 L 290 356" stroke={C.coralDeep} strokeWidth={2} />
        {pose.arms !== 'cheer' && pose.arms !== 'chin' && pose.arms !== 'chest' && (
          <path d="M 118 342 C 112 374 110 406 110 440" stroke={C.coralShade} strokeWidth={3} strokeLinecap="round" />
        )}
        {pose.arms === 'rest' || pose.arms === 'chin' || pose.arms === 'chest' ? (
          <path d="M 282 342 C 288 374 290 406 290 440" stroke={C.coralShade} strokeWidth={3} strokeLinecap="round" />
        ) : null}

        {/* head */}
        <g className="illo-view" style={headStyle}>
          <ellipse cx={253} cy={186} rx={10} ry={14} fill={C.skin} />
          <path d="M 255 178 Q 261 186 255 195" stroke={C.skinShade} strokeWidth={2.6} strokeLinecap="round" />
          <path d={FACE} fill={C.skin} />
          <g clipPath={`url(#${faceClip})`}>
            <path
              d="M 150 184 C 156 160 184 138 216 132 C 236 128 250 134 258 150 L 258 100 L 140 100 Z"
              fill={C.skinShade}
              opacity={0.55}
            />
          </g>
          <ellipse cx={164} cy={209} rx={11} ry={6} fill={C.blush} opacity={0.42} />
          <ellipse cx={236} cy={209} rx={11} ry={6} fill={C.blush} opacity={0.42} />
          <path
            d="M 199 190 Q 194 202 200 205 Q 204 206 207 203"
            stroke={C.skinShade}
            strokeWidth={3.4}
            strokeLinecap="round"
            fill="none"
          />
          <Eyes kind={pose.eyes} animated={animated} />
          <Mouth kind={pose.mouth} talking={talking} animated={animated} />

          {/* hair-front */}
          <path d={HAIR_FRONT} fill={C.hair} />
          <path d="M 166 116 C 178 104 198 97 222 97" stroke={C.hairShine} strokeWidth={7} strokeLinecap="round" />
          <path d="M 139 178 C 137 198 139 214 145 228" stroke={C.hairShine} strokeWidth={5} strokeLinecap="round" />
          <g stroke={C.hair} strokeWidth={4.6} strokeLinecap="round" fill="none">
            <path d={BROWS[pose.brows][0]} />
            <path d={BROWS[pose.brows][1]} />
          </g>

          {/* ear cuff · the subtle AI signal */}
          {pose.arms === 'ear' && (
            <circle
              cx={259}
              cy={176}
              r={9}
              fill={C.violetLight}
              className={cn('illo-part', animated && 'animate-glow')}
              opacity={0.45}
            />
          )}
          <path d="M 251 172 Q 257 167 263 174" stroke={C.violet} strokeWidth={3} strokeLinecap="round" />
          <circle cx={259} cy={176} r={3.2} fill={C.violetLight} />
        </g>

        {/* arms */}
        {arms.map((spec, i) => (
          <Arm key={i} spec={spec} animated={animated} />
        ))}
      </g>
    </svg>
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
