import { cn } from '@/app/lib/cn'

export type HairStyle = 'short' | 'curly' | 'long' | 'ponytail' | 'buzz' | 'wavy' | 'bun'
export type SkinTone = 1 | 2 | 3 | 4 | 5

export interface AvatarLook {
  skin: SkinTone
  hair: HairStyle
  hairColor: 'dark' | 'brown' | 'chestnut' | 'black' | 'honey'
  shirt: 'violet' | 'coral' | 'mint' | 'ink' | 'lavender' | 'amber'
  glasses?: boolean
  beard?: boolean
  earring?: boolean
}

const SKIN: Record<SkinTone, [string, string]> = {
  1: ['var(--illo-skin-1)', 'var(--illo-skin-1-shade)'],
  2: ['var(--illo-skin-2)', 'var(--illo-skin-2-shade)'],
  3: ['var(--illo-skin)', 'var(--illo-skin-shade)'],
  4: ['var(--illo-skin-4)', 'var(--illo-skin-4-shade)'],
  5: ['var(--illo-skin-5)', 'var(--illo-skin-5-shade)'],
}
const HAIR = {
  dark: 'var(--illo-hair)',
  brown: 'var(--illo-hair-brown)',
  chestnut: 'var(--illo-hair-chestnut)',
  black: 'var(--illo-hair-black)',
  honey: 'var(--illo-hair-honey)',
}
const SHIRT = {
  violet: ['var(--color-violet-500)', 'var(--color-violet-700)'],
  coral: ['var(--color-coral-400)', 'var(--color-coral-600)'],
  mint: ['var(--color-mint-400)', 'var(--color-mint-600)'],
  ink: ['var(--color-night-700)', 'var(--color-night-900)'],
  lavender: ['var(--color-violet-300)', 'var(--color-violet-500)'],
  amber: ['var(--color-amber-300)', 'var(--color-amber-500)'],
}

function HairBack({ style, color }: { style: HairStyle; color: string }) {
  switch (style) {
    case 'long':
      return <path d="M34 54c-2-22 10-34 26-34s28 12 26 34l3 44c-9 5-20 4-26-2h-6c-6 6-17 7-26 2Z" fill={color} />
    case 'wavy':
      return (
        <path
          d="M34 56c-3-22 10-35 26-35s29 13 26 35c3 6 1 13-4 16 2 6-3 11-9 10-3 5-10 5-13 1-3 4-10 4-13-1-6 1-11-4-9-10-5-3-7-10-4-16Z"
          fill={color}
        />
      )
    case 'curly':
      return (
        <g fill={color}>
          <circle cx="60" cy="34" r="27" />
          {[
            [36, 30],
            [42, 18],
            [56, 11],
            [72, 13],
            [83, 24],
            [86, 38],
            [34, 44],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="10" />
          ))}
        </g>
      )
    case 'ponytail':
      return <path d="M78 34c14 2 18 16 14 30-2 8-8 12-12 10 4-9 3-20-6-26Z" fill={color} />
    case 'bun':
      return <circle cx="60" cy="16" r="11" fill={color} />
    default:
      return null
  }
}

function HairFront({ style, color }: { style: HairStyle; color: string }) {
  switch (style) {
    case 'short':
      return <path d="M37 50c-3-18 7-29 23-29 17 0 26 11 23 29-4-9-11-14-23-14-10 0-17 4-23 14Z" fill={color} />
    case 'buzz':
      return <path d="M38 47c0-15 9-23 22-23s22 8 22 23c-5-7-12-10-22-10s-17 3-22 10Z" fill={color} opacity={0.92} />
    case 'curly':
      return <path d="M37 46c2-14 11-21 23-21s21 7 23 21c-6-6-14-8-23-8s-17 2-23 8Z" fill={color} />
    case 'long':
    case 'wavy':
      return <path d="M36 54c-2-19 8-31 24-31 15 0 26 11 24 30-7-10-18-15-32-13-6 2-12 7-16 14Z" fill={color} />
    case 'ponytail':
    case 'bun':
      return <path d="M37 50c-2-17 8-27 23-27s25 10 23 27c-6-8-14-12-23-12s-17 4-23 12Z" fill={color} />
  }
}

export interface PersonAvatarProps {
  look: AvatarLook
  speaking?: boolean
  className?: string
  title?: string
}

/** Simple editorial portraits for students in rooms, testimonials and profiles. */
export function PersonAvatar({ look, speaking, className, title }: PersonAvatarProps) {
  const [skin, shade] = SKIN[look.skin]
  const hair = HAIR[look.hairColor]
  const [shirt, shirtShade] = SHIRT[look.shirt]
  return (
    <svg
      viewBox="0 0 120 120"
      className={cn('block', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <HairBack style={look.hair} color={hair} />
      <rect x="51" y="68" width="18" height="24" fill={skin} />
      <path d="M51 74c5 6 13 6 18 0v8c-5 4-13 4-18 0Z" fill={shade} />
      <path d="M14 122c2-22 18-34 46-34s44 12 46 34Z" fill={shirt} />
      <path d="M48 88c4 6 20 6 24 0" stroke={shirtShade} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <ellipse cx="38" cy="56" rx="5" ry="7" fill={skin} />
      <ellipse cx="82" cy="56" rx="5" ry="7" fill={skin} />
      {look.earring && <circle cx="82" cy="64" r="2.2" fill="var(--color-coral-400)" />}
      <ellipse cx="60" cy="52" rx="22" ry="25" fill={skin} />
      {look.beard && <path d="M40 60c3 11 10 17 20 17s17-6 20-17c-5 6-11 9-20 9s-15-3-20-9Z" fill={hair} />}
      <ellipse cx="47" cy="62" rx="5" ry="3" fill="var(--illo-blush)" opacity="0.35" />
      <ellipse cx="73" cy="62" rx="5" ry="3" fill="var(--illo-blush)" opacity="0.35" />
      <circle cx="51.5" cy="55" r="2.8" fill="var(--illo-hair)" />
      <circle cx="68.5" cy="55" r="2.8" fill="var(--illo-hair)" />
      <g stroke="var(--illo-hair)" strokeWidth="2.6" strokeLinecap="round" fill="none">
        <path d="M46 47.5q5-3 10-.5" />
        <path d="M64 47q5-2.5 10 .5" />
      </g>
      {speaking ? (
        <ellipse cx="60" cy="66.5" rx="5" ry="4" fill="var(--illo-mouth)" />
      ) : (
        <path d="M54 65q6 5 12 0" stroke="var(--illo-mouth)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      )}
      <path d="M59 56q-2 5 1.5 6" stroke={shade} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {look.glasses && (
        <g stroke="var(--illo-hair)" strokeWidth="2.2" fill="none">
          <circle cx="51.5" cy="55" r="7" />
          <circle cx="68.5" cy="55" r="7" />
          <path d="M58.5 55h3" />
        </g>
      )}
      <HairFront style={look.hair} color={hair} />
    </svg>
  )
}
