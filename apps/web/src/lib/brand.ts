/**
 * Identidad de marca centralizada (docs/lania-audit.md, ADR-009). LANIA es nombre PROVISIONAL de MVP,
 * pendiente de búsqueda de antecedentes en Indecopi. Cambiar aquí (o NEXT_PUBLIC_APP_NAME) renombra la UI.
 */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "LANIA";
export const APP_WORDMARK = "lania"; // se muestra en minúsculas con el punto de acento: «lania.»
export const APP_DESCRIPTOR = "Tu profe de inglés con IA";
export const APP_TAGLINE = "Inglés a tu manera. Sin miedo a hablar.";

/** La tutora es una IA y la interfaz lo dice siempre. */
export const TUTOR_NAME = "Lania";
