import { useId } from 'react'
import { cn } from '@/app/lib/cn'
import { Lania } from './Lania'

/** Character-sheet views of Lania: front, three-quarter and profile (static, neutral). */
export type LaniaView = 'front' | 'threeQuarter' | 'profile'

const C = {
  skin: 'var(--illo-skin)',
  skinShade: 'var(--illo-skin-shade)',
  hair: 'var(--illo-hair)',
  hairShine: 'var(--illo-hair-shine)',
  hairDeep: 'var(--illo-hair-deep)',
  mouth: 'var(--illo-mouth)',
  blush: 'var(--illo-blush)',
  coral: 'var(--illo-coral)',
  coralShade: 'var(--illo-coral-shade)',
  coralDeep: 'var(--illo-coral-deep)',
  violet: 'var(--illo-violet)',
  violetShade: 'var(--illo-violet-shade)',
  violetLight: 'var(--illo-violet-light)',
  white: 'var(--illo-white)',
}

function ThreeQuarter({ uid }: { uid: string }) {
  const face =
    'M 150 170 C 150 128 176 104 206 104 C 232 104 250 122 252 150 C 252 176 246 206 236 228 C 228 242 218 250 206 252 C 188 254 170 246 160 230 C 154 220 152 210 150 200 C 148 190 146 182 150 170 Z'
  return (
    <g>
      <defs>
        <clipPath id={`tq-face-${uid}`}>
          <path d={face} />
        </clipPath>
      </defs>
      <g data-layer="hair-back">
        <circle cx={240} cy={62} r={24} fill={C.hair} />
        <path d="M 224 58 Q 228 44 242 41" stroke={C.hairShine} strokeWidth={5} strokeLinecap="round" />
        <path
          d="M 206 78 C 156 78 128 108 128 160 C 128 202 134 232 148 250 C 158 260 172 258 176 248 L 236 248 C 244 258 262 260 274 250 C 290 232 296 200 294 160 C 292 110 260 78 206 78 Z"
          fill={C.hairDeep}
        />
        <ellipse cx={234} cy={84} rx={18} ry={7.5} fill={C.coralDeep} />
      </g>
      <g data-layer="neck">
        <rect x={188} y={222} width={36} height={76} fill={C.skin} />
        <path d="M 188 232 C 196 254 216 254 224 232 L 224 260 C 214 268 198 268 188 260 Z" fill={C.skinShade} />
      </g>
      <g data-layer="torso">
        <path
          d="M 92 440 C 94 368 110 324 154 306 C 168 299 180 292 186 286 L 224 286 C 232 292 246 298 262 304 C 306 322 322 366 324 440 Z"
          fill={C.skin}
        />
        <path
          d="M 92 440 C 94 368 110 324 154 306 C 164 301 172 297 176 295 Q 202 316 226 294 C 234 296 246 300 262 304 C 306 322 322 366 324 440 Z"
          fill={C.violet}
        />
        <path d="M 176 295 Q 202 316 226 294" stroke={C.violetShade} strokeWidth={4} strokeLinecap="round" />
        <path d="M 92 440 C 94 368 110 324 154 306 C 162 301 168 297 172 295 C 174 330 166 386 152 440 Z" fill={C.coral} />
        <path d="M 324 440 C 322 366 306 322 262 304 C 250 298 240 295 232 294 C 228 330 236 386 252 440 Z" fill={C.coral} />
        <path d="M 182 287 L 158 299 L 168 334 L 182 306 Z" fill={C.coralShade} />
        <path d="M 226 287 L 256 300 L 242 338 L 226 306 Z" fill={C.coralShade} />
        <rect x={268} y={350} width={32} height={28} rx={5} fill={C.coralShade} />
        <rect x={276} y={330} width={6} height={26} rx={3} fill={C.violet} />
        <path d="M 122 342 C 116 374 114 406 114 440" stroke={C.coralShade} strokeWidth={3} strokeLinecap="round" />
      </g>
      <g data-layer="head">
        <ellipse cx={252} cy={190} rx={10} ry={14} fill={C.skin} />
        <path d="M 254 182 Q 260 190 254 199" stroke={C.skinShade} strokeWidth={2.6} strokeLinecap="round" />
        <path d={face} fill={C.skin} />
        <g clipPath={`url(#tq-face-${uid})`}>
          <path
            d="M 152 184 C 158 160 186 138 218 132 C 238 128 252 134 260 150 L 260 100 L 140 100 Z"
            fill={C.skinShade}
            opacity={0.55}
          />
          <path d="M 236 150 C 248 176 246 214 226 244 L 270 250 L 270 140 Z" fill={C.skinShade} opacity={0.3} />
        </g>
        <ellipse cx={162} cy={209} rx={7} ry={5} fill={C.blush} opacity={0.42} />
        <ellipse cx={226} cy={209} rx={12} ry={6} fill={C.blush} opacity={0.42} />
        <path d="M 191 189 Q 184 202 190 205.5 Q 195 207 199 204" stroke={C.skinShade} strokeWidth={3.4} strokeLinecap="round" />
        <g data-layer="eyes">
          <ellipse cx={168} cy={182} rx={5} ry={7.8} fill={C.hair} />
          <circle cx={169.8} cy={179} r={1.9} fill={C.white} />
          <ellipse cx={214} cy={182} rx={6.6} ry={8} fill={C.hair} />
          <circle cx={216.4} cy={179} r={2.2} fill={C.white} />
          <g stroke={C.hair} strokeWidth={2.6} strokeLinecap="round">
            <path d="M 163 176 L 158 172" />
            <path d="M 220 176 L 226 172" />
          </g>
        </g>
        <path data-layer="mouth" d="M 180 221 Q 191 229 203 220" stroke={C.mouth} strokeWidth={3.8} strokeLinecap="round" />
      </g>
      <g data-layer="hair-front">
        <path
          d="M 246 84 C 206 76 158 92 144 138 C 136 166 136 206 148 236 C 154 250 166 256 174 250 C 178 246 176 240 172 236 C 162 216 158 192 162 168 C 168 146 194 128 224 122 C 238 118 250 126 253 140 C 255 152 255 164 252 174 C 268 150 268 110 246 84 Z"
          fill={C.hair}
        />
        <path d="M 172 116 C 184 104 204 97 228 97" stroke={C.hairShine} strokeWidth={7} strokeLinecap="round" />
        <g stroke={C.hair} strokeWidth={4.6} strokeLinecap="round">
          <path d="M 158 161 Q 167 155 178 158" />
          <path d="M 202 158 Q 215 153 230 161" />
        </g>
        <path d="M 250 177 Q 256 172 262 179" stroke={C.violet} strokeWidth={3} strokeLinecap="round" />
        <circle cx={258} cy={181} r={3.2} fill={C.violetLight} />
      </g>
    </g>
  )
}

function Profile({ uid }: { uid: string }) {
  const head =
    'M 214 104 C 190 104 172 116 166 138 C 163 148 163 158 164 166 C 162 172 158 180 154 188 C 150 194 146 198 146 201 C 146 205 152 206 158 206 C 158 210 156 213 156 216 C 158 219 162 220 162 221 C 159 223 158 226 159 229 C 160 233 162 236 164 238 C 162 244 166 250 176 252 C 196 256 216 252 230 240 C 238 230 244 214 244 200 L 244 120 Z'
  return (
    <g>
      <defs>
        <clipPath id={`pf-face-${uid}`}>
          <path d={head} />
        </clipPath>
      </defs>
      <g data-layer="hair-back">
        <circle cx={258} cy={66} r={24} fill={C.hair} />
        <path d="M 242 62 Q 246 48 260 45" stroke={C.hairShine} strokeWidth={5} strokeLinecap="round" />
        <path
          d="M 186 98 C 214 74 268 80 286 124 C 298 158 294 214 280 244 C 272 258 254 262 244 252 C 238 246 238 238 244 232 C 256 218 258 198 254 180 C 248 156 232 126 204 110 Z"
          fill={C.hairDeep}
        />
        <ellipse cx={250} cy={86} rx={17} ry={7} fill={C.coralDeep} transform="rotate(18 250 86)" />
      </g>
      <g data-layer="neck">
        <path d="M 196 236 L 188 300 L 238 300 L 234 232 Z" fill={C.skin} />
        <path d="M 194 246 C 206 258 222 256 234 242 L 236 266 C 222 274 204 272 192 262 Z" fill={C.skinShade} />
      </g>
      <g data-layer="torso">
        <path
          d="M 134 440 C 134 390 142 342 162 314 C 174 300 192 292 210 290 L 232 290 C 254 294 270 306 276 330 C 284 364 288 404 290 440 Z"
          fill={C.violet}
        />
        <path d="M 178 302 C 188 297 198 296 208 294" stroke={C.violetShade} strokeWidth={4} strokeLinecap="round" />
        <path d="M 232 290 C 254 294 270 306 276 330 C 284 364 288 404 290 440 L 240 440 L 236 300 Z" fill={C.coral} />
        <path
          d="M 224 298 C 248 298 264 318 264 346 L 268 440 L 198 440 L 196 346 C 196 318 204 298 224 298 Z"
          fill={C.coral}
        />
        <path d="M 240 332 C 244 370 246 404 246 440" stroke={C.coralShade} strokeWidth={3} strokeLinecap="round" />
        <path d="M 202 292 L 234 288 L 244 306 L 214 314 Z" fill={C.coralShade} />
      </g>
      <g data-layer="head">
        <path d={head} fill={C.skin} />
        <g clipPath={`url(#pf-face-${uid})`}>
          <path d="M 160 170 C 172 146 196 128 230 124 L 250 124 L 250 96 L 150 96 Z" fill={C.skinShade} opacity={0.55} />
        </g>
        <ellipse cx={196} cy={210} rx={12} ry={6} fill={C.blush} opacity={0.42} />
        <path d="M 156 200 Q 160 203 163 199" stroke={C.skinShade} strokeWidth={2.4} strokeLinecap="round" />
        <ellipse cx={230} cy={188} rx={10} ry={14} fill={C.skin} />
        <path d="M 226 180 Q 234 188 228 197" stroke={C.skinShade} strokeWidth={2.6} strokeLinecap="round" />
        <g data-layer="eyes">
          <ellipse cx={178} cy={182} rx={4.2} ry={7.4} fill={C.hair} />
          <circle cx={179.2} cy={179} r={1.6} fill={C.white} />
          <path d="M 182 176 L 188 172" stroke={C.hair} strokeWidth={2.6} strokeLinecap="round" />
        </g>
        <path data-layer="mouth" d="M 160 221 Q 165 223 170 220" stroke={C.mouth} strokeWidth={3.4} strokeLinecap="round" />
      </g>
      <g data-layer="hair-front">
        <path
          d="M 206 88 C 180 86 160 104 156 130 C 155 140 156 148 160 154 C 168 138 184 126 206 120 C 226 116 240 124 246 136 L 252 176 C 262 150 258 112 236 96 Z"
          fill={C.hair}
        />
        <path d="M 176 108 C 188 98 206 94 226 96" stroke={C.hairShine} strokeWidth={7} strokeLinecap="round" />
        <path d="M 168 161 Q 177 155 188 158" stroke={C.hair} strokeWidth={4.6} strokeLinecap="round" />
        <path d="M 226 174 Q 233 168 239 176" stroke={C.violet} strokeWidth={3} strokeLinecap="round" />
        <circle cx={235} cy={178} r={3.2} fill={C.violetLight} />
      </g>
    </g>
  )
}

export function LaniaTurnaround({ view, className }: { view: LaniaView; className?: string }) {
  const uid = useId().replace(/:/g, '')
  if (view === 'front') return <Lania expression="neutral" animated={false} className={className} />
  return (
    <svg viewBox="0 0 400 440" className={cn('block', className)} aria-hidden fill="none">
      {view === 'threeQuarter' ? <ThreeQuarter uid={uid} /> : <Profile uid={uid} />}
    </svg>
  )
}
