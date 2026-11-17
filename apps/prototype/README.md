# LANIA · Prototipo navegable

Copia de la estructura completa del diseño «Diseñar la plataforma educativa LANIA» (Figma Make) dentro del proyecto. Tiene 18 pantallas conectadas y a Lania, la tortuguita, como personaje.

```bash
pnpm dev:prototype     # desde la raíz → http://localhost:3001
```

## Qué es y qué no es
- **Es** la referencia de estructura, navegación y diseño de toda la plataforma: landing, onboarding, diagnóstico, dashboard, aula, Speaking/Listening/Writing Lab, salones, sala en vivo, misiones, progreso, sistema de marca y mapa del prototipo (`/prototipo`).
- **No está conectado al backend.** Los datos son de demostración (`src/app/data/`, alumna «Valentina»): niveles, rachas, compañeros y salones son ficticios. Las preferencias se guardan solo en el navegador.
- La app real, con corrector, dominio, repasos e IA, sigue en `apps/web` (puerto 3000). Las pantallas se irán pasando allí una por una, conectadas a datos reales.

## Cambios respecto al original de Figma Make
- **Personaje:** la Lania humana dibujada en SVG se reemplazó por las ilustraciones reales de la tortuguita (`public/lania/`). `components/illustrations/Lania.tsx` mantiene la misma API (`expression`, `crop`, `talking`, `animated`, `title`), así que ninguna pantalla cambió. La hoja de modelo usa las vistas reales: frente, tres cuartos, perfil y espalda.
- **Paleta:** las escalas `violet`, `coral` y `mint` conservan su nombre, pero ahora son turquesa, durazno y verde de logro, con la paleta oficial de LANIA (`src/index.css`). Los contrastes de texto cumplen WCAG AA.
- **Accesibilidad:** texto gris más legible, nombres accesibles en enlaces de solo ícono en móvil, panel de pestañas válido y sin desbordes horizontales a 375 px. Pendiente a propósito: los números decorativos del landing y los ejemplos de «uso incorrecto» del sistema de marca.
- **Tema claro en todo:** Speaking Lab, la sala en vivo, la sección «Método» del inicio y el plan destacado de precios eran oscuros; ahora son claros (decisión del fundador, 3 nov 2026).
- **Herramientas:** se quitaron los plugins y scripts de Figma Make; queda Vite + React + Tailwind v4.

## Expresiones de Lania → ilustración

| Expresión | Ilustración |
|---|---|
| `neutral`, `listening` | De frente, tranquila |
| `welcome` | Saluda con guiño |
| `explaining` | Brazo arriba, ojos cerrados |
| `thinking` | Mano en la barbilla |
| `correcting` | Con laptop |
| `celebrating` | Brazos arriba |
