/** WCAG 2.x relative luminance and contrast ratio for hex colors. */
function channel(c: number) {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function luminance(hex: string) {
  const h = hex.replace('#', '').trim()
  const full = h.length === 3 ? h.split('').map((x) => x + x).join('') : h
  const n = parseInt(full, 16)
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

export function contrastRatio(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

/** Reads the live value of a design token (CSS custom property). */
export function tokenValue(name: string) {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
