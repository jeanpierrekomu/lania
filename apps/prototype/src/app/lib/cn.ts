import { extendTailwindMerge } from 'tailwind-merge'

/** Knows LANIA's custom shadow tokens so overrides resolve predictably. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      shadow: ['soft', 'lift', 'float', 'glow', 'glow-coral', 'inset-line'],
    },
  },
})

/** Joins conditional class names; later Tailwind classes win over earlier conflicting ones. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(' '))
}
