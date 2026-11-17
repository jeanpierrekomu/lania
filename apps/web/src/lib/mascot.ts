/**
 * Mascota de LANIA: Lania, la tortuguita. Registro fijo «expresión → imagen».
 *
 * Origen: ilustraciones reales del fundador en `imagenes de lania/` (PNG transparentes, ~1100–1400 px),
 * convertidas a WebP en `public/assets/lania/v2/`:
 * - `lania-<pose>.webp`: cuerpo completo, 1024 × 1024, fondo transparente (ilustraciones).
 * - `lania-<pose>-avatar.webp`: cabeza, 256 × 256 (avatares redondos).
 * Algunas expresiones comparten ilustración hasta tener la propia (ver docs/design/lania-visual-identity.md).
 */
export const MASCOT_POSES = {
  welcome: "Bienvenida",
  explaining: "Explicación",
  thinking: "Reflexión",
  correcting: "Corrección",
  celebrating: "Celebración",
  encouraging: "Ánimo",
  studying: "Estudio",
  resting: "Descanso",
  listening: "Escucha",
  speaking: "Conversación",
  goodbye: "Despedida",
} as const;

export type MascotPose = keyof typeof MASCOT_POSES;

/** Sube este número (y la carpeta) cuando cambien las ilustraciones: evita que el navegador muestre las anteriores. */
const ASSET_VERSION = "v2";

export const mascotSrc = (pose: MascotPose, variant: "avatar" | "scene") =>
  `/assets/lania/${ASSET_VERSION}/lania-${pose}${variant === "avatar" ? "-avatar" : ""}.webp`;
