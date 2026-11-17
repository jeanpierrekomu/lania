# ADR-009 — Marca LANIA y tutora «Lania»

**Estado:** aceptado · 2026-11-02 · Nombre **temporal de MVP** hasta la búsqueda en Indecopi.

## Contexto
- El fundador entregó `LANIA_Identidad_Personalidad_Ilustraciones_MVP_Claude.md`: nueva marca (LANIA), tutora con IA «Lania», paleta violeta/durazno, tipografías Sora + Inter y preferencias de humor, avatar y animaciones.
- El documento asumía un tutor «Lucas». En el código no existía: el tutor era **«Nico»** (ver [auditoría](../lania-audit.md)).
- La base de datos no guarda el nombre del tutor, solo el estilo (`fun` / `calm` / `coach`).

## Decisión
1. **Marca centralizada.** `apps/web/src/lib/brand.ts` (`APP_NAME`, `TUTOR_NAME`, descriptor, tagline) y `NEXT_PUBLIC_APP_NAME` para cambiar el nombre sin tocar código. En la API, `app_name` en `config.py`.
2. **Prompt en capas con versión nueva** (`lania-tutor-v1`, `lania-writing-v1`): identidad (es una IA y lo dice si le preguntan), modelo de corrección en 5 pasos, ritmo y atención, límites, estilo y nivel de humor 0–5. Se activó solo después de pasar el arnés: tutor 27/27, inglés válido 11/11, escritura 5/5 (`docs/operations/ai-eval-gpt-6-luna-gpt-6-luna-2026-11-02-2036.md`).
3. **Sin migración de datos del tutor.** Los valores `fun` / `calm` / `coach` se conservan; solo cambian las etiquetas: Divertida / Tranquila / Directa. Los mensajes antiguos que digan «Nico» no se reescriben.
4. **Preferencias nuevas** (migración `20261102000300_lania_preferences.sql`): `humor_level` (0–5, por defecto 3), `show_avatar` y `reduce_motion`.
5. **Sistema visual:** tokens LANIA en `globals.css` (claro y oscuro), contraste AA verificado en CI por `tests/unit/contrast.test.ts` y por axe en E2E.
   - **Identidad visual definitiva del fundador (2 nov 2026):** reemplaza al violeta/durazno del primer documento. Turquesa, celeste y azul cielo pastel con detalles cálidos (durazno, lavanda, rosa, amarillo), Plus Jakarta Sans + Inter. Los botones usan una variante oscura del turquesa (`#097879`) porque `#0EA5A6` con texto blanco solo da 3:1. Detalle en [lania-visual-identity.md](../design/lania-visual-identity.md).
6. **Mascota: Lania es una tortuguita ilustrada.** Usa las ilustraciones reales del fundador (`imagenes de lania/`), convertidas a WebP en `public/assets/lania/v2/` (registro en `lib/mascot.ts`). Algunas expresiones comparten ilustración hasta tener la propia. El prompt de la IA no cambia: Lania sigue presentándose como tutora con IA. Todo funciona igual con el avatar oculto.
7. **Identificadores técnicos sin renombrar:** `@modo/*`, `modo-api`, claves `modo.*` del navegador y `~/.modo-english`. Renombrarlos cerraría sesiones o dejaría huérfana la base local, sin beneficio visible.

## Consecuencias
- Volver atrás o cambiar de nombre otra vez = editar `brand.ts` / `NEXT_PUBLIC_APP_NAME` y la versión del prompt; los datos no cambian.
- Cualquier cambio futuro del prompt de Lania debe pasar el arnés antes de activarse.
- Pendiente del fundador: búsqueda en Indecopi, las 6 ilustraciones de la tortuguita y el proveedor de voz (femenina, español latino + inglés).
