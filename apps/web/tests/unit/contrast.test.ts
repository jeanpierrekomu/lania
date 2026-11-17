import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/** WCAG 2.2: contraste de los tokens REALES de globals.css (tema claro, el único). Falla si alguien rompe la paleta. */
const css = fs.readFileSync(path.resolve(__dirname, "../../src/app/globals.css"), "utf8");

/** Lee `--token: #hex` y `--token: var(--otro)` (resuelto contra `base`). */
function block(source: string, base: Record<string, string> = {}): Record<string, string> {
  const out: Record<string, string> = { ...base };
  for (const m of source.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6}|var\(--([\w-]+)\))/g)) {
    const value = m[3] ? out[m[3]] : m[2];
    if (value) out[m[1]] = value.toLowerCase();
  }
  return out;
}
const end = css.indexOf("/* fin-tokens-semanticos */");
if (end < 0) throw new Error("globals.css debe marcar el fin de los tokens semánticos");
const light = block(css.slice(css.indexOf(":root {"), end));

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function ratio(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// [texto, fondo] — texto normal: mínimo 4.5:1
const TEXT_PAIRS: [string, string][] = [
  ["ink", "bg"], ["ink", "surface"], ["ink", "surface-2"], ["ink", "primary-soft"], ["ink", "accent-soft"],
  ["ink-muted", "bg"], ["ink-muted", "surface"], ["ink-muted", "surface-2"], ["ink-muted", "primary-soft"], ["primary-ink", "primary"], ["primary-ink", "primary-hover"],
  ["primary", "surface"], ["primary", "bg"], ["primary", "primary-soft"], ["primary", "surface-2"],
  ["accent-ink", "bg"], ["accent-ink", "accent-soft"],
  ["ink", "celebrate-soft"], ["celebrate-ink", "celebrate-soft"], ["celebrate-on", "celebrate"],
  ["on-pastel", "brand-sky"], ["on-pastel", "brand-sky-pastel"], ["on-pastel", "brand-peach"], ["on-pastel", "brand-lavender"],
  ["on-pastel", "brand-pink"], ["on-pastel", "brand-yellow"],
  ["success", "success-soft"], ["warning", "warning-soft"], ["error", "error-soft"], ["error", "surface"],
];

describe.each([
  ["claro", light],
])("contraste AA en modo %s", (_, tokens) => {
  it.each(TEXT_PAIRS)("%s sobre %s ≥ 4.5:1", (fg, bg) => {
    expect(tokens[fg], fg).toBeDefined();
    expect(tokens[bg], bg).toBeDefined();
    expect(ratio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(4.5);
  });
  it("foco visible ≥ 3:1 sobre el fondo", () => {
    expect(ratio(tokens.focus, tokens.bg)).toBeGreaterThanOrEqual(3);
  });
});

it("la app es solo de tema claro: no sigue el modo oscuro del sistema", () => {
  expect(css).not.toContain("prefers-color-scheme: dark");
  expect(css).toMatch(/color-scheme:\s*light/);
});

it("el tema del diseño usa la paleta turquesa: el color de botones es el mismo en los dos sistemas", () => {
  expect(css).toMatch(/--color-primary:\s*#097879/);
  expect(light.primary).toBe("#097879");
});

it("la paleta del documento de identidad LANIA se respeta en modo claro", () => {
  expect(light).toMatchObject({
    "brand-turquoise": "#0ea5a6", "brand-sky": "#7dd3fc", "brand-sky-pastel": "#e0f7ff", "brand-peach": "#ffd6a5",
    "brand-lavender": "#c7b8ff", "brand-pink": "#ffb3d1", "brand-yellow": "#ffd64d",
    surface: "#ffffff", bg: "#f6fbff", "surface-2": "#e6f3f7", ink: "#0b3d5b", "ink-muted": "#4c6570", border: "#d3e8ed",
  });
});

it("el turquesa de marca NO se usa con texto blanco (no llega a 4.5:1): los botones usan su variante oscura", () => {
  expect(ratio(light["brand-turquoise"], "#ffffff")).toBeLessThan(4.5);
  expect(ratio(light.primary, light["primary-ink"])).toBeGreaterThanOrEqual(4.5);
});

it("«correcto» (verde) se distingue del celeste de marca", () => {
  // El feedback además lleva icono y texto; esto evita que acierto y marca parezcan el mismo color.
  const hue = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  };
  expect(Math.abs(hue(light.success) - hue(light.primary))).toBeGreaterThan(40);
});
