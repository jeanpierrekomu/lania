# Auditoría de rebranding MODO English → LANIA (2 nov 2026)

Fuente: `LANIA_Identidad_Personalidad_Ilustraciones_MVP_Claude.md`. Detalle de la decisión en [ADR-009](architecture/ADR-009-lania-rebrand.md).

## Hallazgo principal
El documento asume un tutor llamado **«Lucas»**. **No existe:** una búsqueda en todo el repositorio da 0 apariciones. El tutor actual se llama **«Nico»**, y su nombre sale de dos fuentes centralizadas:

| Lugar | Qué había | Acción |
|---|---|---|
| `apps/web/src/lib/brand.ts` | `APP_NAME = "MODO English"`, `TUTOR_NAME = "Nico"` | Cambiar a LANIA / Lania; añadir descriptor y tagline |
| `apps/api/app/ai/prompts/academic.py` | `BASE_ACADEMIC = "Eres Nico, tutor…"`, versión `tutor_v1` | Prompt nuevo de Lania en capas, versión `lania-tutor-v1`; verificar con el arnés antes de activar |
| `apps/api/app/core/config.py` | `app_name = "MODO English"` | LANIA |
| Textos sueltos en componentes y servicios | «Nico», «Tutor con IA», «el profesor con IA», estilos en masculino | Usar la constante de la tutora; concordancia en femenino |
| Preferencias (`learning_preferences.tutor_persona`) | `fun` / `calm` / `coach` | **Se conservan los valores**; solo cambian las etiquetas visibles: Divertida / Tranquila / Directa |
| Base de datos | No guarda el nombre del tutor | **Sin migración de datos.** Los mensajes históricos que digan «Nico» no se tocan |
| Arnés de IA (`tests/ai_eval/cases_v1.yaml`) | Mensajes que saludan a «Nico» | Actualizar y volver a evaluar |
| Tests unitarios y E2E | Textos «Nico» y «Paciente y tranquilo» | Actualizar sin perder cobertura |

## Lo que NO se renombra, a propósito
- Paquetes internos `@modo/web` y `@modo/contracts`, y el nombre del proyecto Python `modo-api`: son identificadores técnicos, no visibles.
- Claves de navegador `modo.session.v1`, `modo.lesson.*` y `modo.review.*`: renombrarlas cerraría la sesión de todos y perdería la posición en las clases.
- Carpeta de datos local `~/.modo-english` y la variable `MODO_E2E_PG_DIR`: renombrarlas dejaría huérfana la base local.
- Archivos de migración ya aplicados: son historia inmutable.
- Ítems de contenido que mencionan «tu profesor»: hablan de un profesor humano dentro del ejercicio, no de la tutora.

## Sin repositorio git
Esta carpeta no es un repositorio git, así que no se creó la rama `feat/lania-rebrand` que propone el documento. La reversión se apoya en el ADR, los tests y el `NEXT_PUBLIC_APP_NAME` configurable.
