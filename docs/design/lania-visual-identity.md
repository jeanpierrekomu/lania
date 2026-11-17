# LANIA — Identidad visual (2 nov 2026)

Estilo **EdTech pastel moderno**: turquesa, celeste y azul cielo con detalles cálidos. Premium, nunca infantil. Decisión registrada en [ADR-009](../architecture/ADR-009-lania-rebrand.md).

## Dónde viven los colores
- **Única fuente:** `apps/web/src/app/globals.css` (variables CSS, claro y oscuro). Tailwind las expone como clases (`bg-primary`, `bg-brand-peach`, `text-on-pastel`…). Ningún componente usa HEX directo.
- **Contraste verificado en CI:** `apps/web/tests/unit/contrast.test.ts` (WCAG 2.2 AA, claro y oscuro) y axe en los tests E2E (escritorio y móvil).

## Paleta

| Token | HEX | Uso |
|---|---|---|
| `--brand-turquoise` | `#0EA5A6` | Ilustración y decoración (bordes, detalles) |
| `--primary` | `#097879` | **Botones y enlaces.** Variante oscura del turquesa: con texto blanco da 5,3:1. El turquesa original da 3:1 y no se lee bien |
| `--brand-sky` | `#7DD3FC` | Celeste: ilustraciones, íconos y elementos secundarios |
| `--brand-sky-pastel` / `--primary-soft` | `#E0F7FF` | Azul cielo pastel: tarjetas destacadas, paneles, misión del día |
| `--brand-peach` | `#FFD6A5` | Durazno: recompensas y calidez |
| `--brand-lavender` | `#C7B8FF` | Lavanda: acento ocasional, nunca dominante |
| `--brand-pink` | `#FFB3D1` | Rosa: detalles de personaje y pequeños acentos |
| `--brand-yellow` / `--celebrate` | `#FFD64D` | Amarillo: estrellas, logros, celebración |
| `--bg` | `#F6FBFF` | Fondo general |
| `--surface` | `#FFFFFF` | Tarjetas |
| `--surface-2` | `#E6F3F7` | Paneles secundarios |
| `--ink` | `#0B3D5B` | Texto principal |
| `--ink-muted` | `#4C6570` | Descripciones |
| `--border` | `#D3E8ED` | Bordes y separadores |
| `--on-pastel` | `#0B3D5B` | Texto sobre cualquier pastel de marca (igual en modo oscuro) |
| `--success` | `#2E7D32` | Solo «correcto»; tono separado del turquesa (test de tono) |

Reglas:
- Fondos claros y espacio en blanco; ninguna sección entera en turquesa.
- El feedback nunca depende solo del color: siempre ícono + texto.
- Los pasteles nunca llevan texto blanco; usan `--on-pastel`.

## Componentes compartidos
- `Button`: alto mínimo 48 px (56 px en `lg`), sombra suave, hover con elevación y foco visible de 3 px.
- `Card`: esquinas de 24 px, borde sutil y `shadow-card`.
- `IconChip`: ícono en un círculo pastel (cielo, durazno, lavanda, rosa, amarillo).
- `Eyebrow`: etiqueta en píldora celeste sobre los títulos.
- `Badge`: incluye el tono `celebrate` (amarillo) para logros.
- Tipografía: **Plus Jakarta Sans** (títulos y marca) e **Inter** (contenido).

## Mascota: Lania, la tortuguita
Personaje 2D *cartoon* editorial de trazo limpio: cuerpo turquesa pastel, caparazón turquesa y celeste, ojos grandes, audífonos, gafas sobre la cabeza, pañuelo amarillo o durazno y mochila pequeña. Transmite paciencia, curiosidad, creatividad y confianza.

**Ilustraciones definitivas (3 nov 2026):** las reales del fundador, en `imagenes de lania/`: 11 PNG transparentes de ~1100–1400 px, con Lania de caparazón morado. Reemplazan al kit vectorial anterior.

En la app están convertidas a WebP en `apps/web/public/assets/lania/v2/`, en dos tamaños por expresión:
- `lania-<expresión>.webp`: cuerpo completo, 1024 px, fondo transparente.
- `lania-<expresión>-avatar.webp`: cabeza, 256 px, para avatares redondos.

El registro fijo «expresión → imagen» está en `apps/web/src/lib/mascot.ts`. La carpeta lleva versión (`v2`) para que los navegadores no muestren las imágenes anteriores; si cambian las ilustraciones, crea `v3` y sube `ASSET_VERSION`. Todo respeta la preferencia «Ocultar avatar».

| Archivo original | Expresión en la app | Dónde aparece |
|---|---|---|
| `…02_41_36 p.m.png` (saluda, guiño) | `welcome` | Hero de la landing, login, misión «clase» |
| `…02_51_38 p.m.png` (ojos cerrados, brazo arriba) | `explaining` | Teoría de la clase, mensajes del chat, «Conoce a Lania» |
| `…02_51_50 p.m.png` (guiño, mano en la barbilla) | `thinking` | Intro del diagnóstico, misión «diagnóstico», pista antes del reintento |
| `…02_51_45 p.m.png` (con laptop) | `studying` y `correcting` | «Cómo será la clase», error con corrección |
| `…02_51_54 p.m.png` (ríe, brazo arriba) | `encouraging` | Respuesta correcta, misión «repaso», fin de clase sin dominio |
| `…02_58_46 p.m.png` (ríe, brazos arriba) | `celebrating` | Solo al terminar una clase con la habilidad dominada |
| `…02_58_41 p.m.png` (brazos abiertos) | `speaking` y `goodbye` | Encabezado del chat |
| `…02_33_27 p.m.png` (de frente, tranquila) | `resting` y `listening` | Misión «al día» |
| `…02_33_32`, `…02_33_41`, `…02_33_45 p.m.png` | — | Vistas de referencia (espalda y perfiles); no se usan en la app |

**Ilustraciones que faltan** (hoy comparten imagen o no existen): corrección propia (sin laptop), escucha, descanso, conversación, despedida, y lectura, escritura y sorpresa para los Labs.

## Estado por pantalla

| Pantalla | Estado |
|---|---|
| Landing | ✅ Según el mockup: hero con la tortuguita, «Aprende a tu manera», fila de beneficios |
| Registro / onboarding (`/login`) | ✅ Nueva identidad. Falta la pregunta «¿Cuál es tu objetivo principal?» del mockup (necesita guardarse en el backend) |
| Diagnóstico e informe | ✅ Nueva identidad |
| Dashboard | ✅ Según el mockup: menú lateral en escritorio, misión con Lania, «Tus habilidades» en tarjetas. Sin racha ni puntos: la app aún no los mide y no se inventan |
| Aula (clase, ejercicios, resumen) | ✅ Lania explica la teoría en un bocadillo y reacciona a cada respuesta |
| Chat con Lania, Repaso, Ajustes | ✅ Nueva identidad por tokens y componentes |
| Writing Lab | ⏳ Hoy la escritura vive dentro del diagnóstico; el Lab como pantalla propia aún no existe |
| Speaking Lab · Listening Lab | ⏳ No existen todavía (Entrega 3: voz). Heredarán los tokens y componentes |
| Salones comunitarios | ⏳ No existen (fase posterior) |
| Perfil y progreso académico | ⏳ El progreso está en el dashboard; falta la página propia |
