# ADR-010 — El diseño LANIA pasa a la app principal

**Estado:** aceptado · 2026-11-03 · Pedido por el fundador («Sí, reemplázala»).

## Contexto
- `apps/prototype` (Vite + React Router) tiene el diseño completo de Figma Make: 18 pantallas, la tortuguita y la paleta turquesa, pero con datos de demostración.
- `apps/web` (Next.js) tiene todo lo real: sesión, diagnóstico, clases con corrector, repasos, tutora con IA, ajustes y revisión docente, con pruebas E2E y de accesibilidad.

## Decisión
1. **La app principal sigue siendo `apps/web`** (ADR-001). El diseño se copia en `apps/web/src/ui/` y se usa desde las rutas de Next.
2. **Adaptador de navegación** (`src/ui/router.tsx`): traduce la API mínima de React Router que usan las pantallas (`Link`, `NavLink`, `useNavigate`, `useSearchParams`…) a `next/navigation`, sin reescribirlas. También traduce rutas del prototipo a las reales (`/diagnostico` → `/diagnostic`).
3. **Un solo sistema de estilos** (`globals.css`): el tema del diseño manda; se agregan alias para los nombres que usan las pantallas reales (`surface-2`, `ink-muted`, `error`…), así se ven coherentes mientras se rediseñan.
4. **Rutas**
   - Públicas: `/` (landing nueva), `/login`, `/onboarding` (vista previa), `/sistema` (marca), `/prototipo` (mapa).
   - Alumno, con el menú nuevo (`LaniaShell` + `AppShell`): `/app` (inicio real), `/app/aula` (aula real), `/review`, `/tutor`, `/preferences`, `/diagnostic`, `/learn/[slug]`, `/admin/qa`.
   - **Vista previa** (datos de ejemplo, con aviso visible): `/app/speaking`, `/app/listening`, `/app/writing`, `/app/salones`, `/app/misiones`, `/app/progreso`.
   - `/dashboard` redirige a `/app`.
5. **Recorrido guiado** en la primera visita (`GuidedTour`): se recuerda en el navegador y se repite desde «Ver recorrido».
6. **Honestidad de datos:** ninguna sección de vista previa se presenta como progreso real; racha, puntos y niveles por habilidad no se muestran como reales hasta medirlos.

## Consecuencias
- Las pantallas de vista previa se conectan una por una a datos reales; al hacerlo se reactivan para esa carpeta las reglas de lint relajadas (`eslint.config.mjs`).
- Inicio, diagnóstico, clases, repaso, tutor y ajustes conservan su lógica y su estilo anterior por dentro del menú nuevo; el siguiente paso es rediseñarlas con los componentes del diseño.
- `apps/prototype` queda como fuente y referencia visual del diseño.
