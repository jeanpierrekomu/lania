# Checklist de pendientes

## Hecho — Entrega 1
- [x] Brief, ADR-001…006, modelo de datos y contratos; monorepo, CI, lint, typecheck, tests
- [x] Vertical slice: login → clase → corrección justa → evidencia → dominio → repaso diferido con ítems distintos
- [x] RLS con tests multiusuario; claves de ejercicios no legibles por el cliente; idempotencia; respuesta original inmutable
- [x] Accesibilidad AA verificada con axe (escritorio y móvil)

## Hecho — Entrega 2 (spec §20)
- [x] Esquema de banco de ítems versionado: `pool` práctica/diagnóstico, lectura con texto, escritura abierta; rúbricas `closed_v2`, `writing_v1`, `diag_v1_bands`
- [x] 27 ítems originales de diagnóstico A1–A2 (gramática, vocabulario, lectura) + 2 consignas de escritura
- [x] Diagnóstico por bloques con persistencia, pausa/reanudación, modo examen, «No lo sé», adaptación mínima e informe con confianza honesta (ADR-007)
- [x] Tutor «Nico» con adaptador de proveedor (OpenAI-compatible: OpenAI u Ollama), salida estructurada validada, anti-alucinación, cuota diaria, idempotencia, «explícame este error»
- [x] Escritura evaluada por IA con rúbrica y reglas deterministas; dudas → revisión
- [x] Métricas de costo/latencia en `ai_requests`, presupuesto mensual, panel de uso; logs sin texto del alumno
- [x] Golden set del corrector: 222 casos, 96,4 % de acuerdo, 0 falsos positivos
- [x] Flujo «esta corrección no es justa» → panel docente → aceptar revierte la nota y recalcula el dominio; auditado
- [x] Pistas antes del reintento que no revelan la respuesta
- [x] Preferencias editables (estilo del tutor, intensidad, español de apoyo, duración, baja estimulación)
- [x] 2 microclases nuevas (pasado con *did*, futuro con *will*) con 30 ejercicios
- [x] Arnés de evaluación de IA (`scripts/eval_ai.py`) con 15 casos

## Decisiones que necesitan al fundador
- [x] **Modelo de IA:** `gpt-6-luna` (tutor `low`, escritura `high`) pasó el arnés (tutor 27/27, inglés válido 11/11, escritura 3/3) a ~2,5 s y ~US$ 0,35/mes por alumno intensivo (solo texto). Ver `docs/operations/openai-candidates-2026-11-02.md`. Pendiente: ampliar el arnés a más de 100 casos con revisión docente.
- [ ] Presupuesto mensual de IA para el piloto (`MONTHLY_AI_SPEND_LIMIT_USD`), ahora también para voz
- [ ] Docente que revise: los 74 ítems `pilot`, las rúbricas y los 6 ítems de diagnóstico marcados como dudosos (ver abajo)
- [ ] Nombre definitivo: hoy **LANIA** como nombre temporal ([ADR-009](architecture/ADR-009-lania-rebrand.md)). Antes de publicidad o dominio: búsqueda denominativa y fonética en Indecopi (la hace el fundador)
- [x] Ilustraciones reales de Lania en la app (11 PNG del fundador)
- [ ] Ilustraciones que faltan: corrección sin laptop, escucha, descanso, conversación, despedida, lectura, escritura y sorpresa ([detalle](design/lania-visual-identity.md))
- [ ] Pantallas nuevas de las guías de marca: onboarding con objetivo, Speaking Lab, Listening Lab, Writing Lab, Salones comunitarios y Perfil y progreso. Racha y puntos solo cuando la app los mida de verdad
- [x] Voz de Lania (Entrega 3): OpenAI `gpt-4o-mini-tts`, voz `marin` (provisional; ver «Siguiente»)
- [ ] Pagos (fase comercial, no ahora): elegir procesador según mercado; Stripe no acepta empresas de Perú. Ver [ADR-008](architecture/ADR-008-payments.md)
- [ ] Proyecto Supabase y repositorio GitHub (ver deploy-piloto.md)

## Para revisión docente (ítems dudosos detectados por los autores)
- Diagnóstico: presente simple .03 («hasn't» marcado como poco natural), futuro .01 («am studying» como parcial), pasado irregular .03 («has made» + «last week»), pasado irregular .01 mezcla preposición («went a party») con verbo irregular, niveles CEFR estimados.
- Clases: modales (couldn't/can/would) marcados parciales cuando la consigna pide did/will; «is getting» para predicción como distractor.

## Problemas conocidos del corrector (xfail estricto en el golden set)
- Oraciones reordenadas o con errores tipográficos fuera del hueco → se marcan incorrectas (2 falsos negativos).
- Faltan diagnósticos genéricos para *will*/pasado/negativa continua en ítems de presente (hoy van como «no reconocida» con opción de revisión).

## Hecho — Marca LANIA (ADR-009)
- [x] Tutor «Nico» → tutora «Lania» sin migración de datos; prompt en capas `lania-tutor-v1` validado con el arnés (27/27, 11/11, 5/5)
- [x] Identidad «EdTech pastel»: turquesa, celeste y azul cielo + durazno, lavanda, rosa y amarillo; Plus Jakarta Sans + Inter; contraste AA verificado en CI (claro y oscuro); landing, dashboard, aula, login, diagnóstico y chat rediseñados
- [x] Preferencias de humor (0–5), avatar visible/oculto y animaciones reducidas
- [x] Menú usable en móvil (375 px) con «Salir» siempre visible

## Prototipo de estructura completa (`apps/prototype`)
- [x] Copia de las 18 pantallas del diseño de Figma Make, con la tortuguita real y la paleta turquesa
- [x] Solo tema claro en las dos apps (no siguen el modo oscuro del sistema)
- [x] El diseño LANIA es la app principal (localhost:3000): landing, menú nuevo, recorrido guiado; secciones reales dentro del menú nuevo ([ADR-010](architecture/ADR-010-diseno-en-app-principal.md))
- [ ] Rediseñar con los componentes nuevos las pantallas reales que aún usan el estilo anterior por dentro: inicio, clase, repaso, diagnóstico, chat y ajustes
- [x] Conectar a datos reales las secciones en vista previa (ver «Piloto con personas reales»)
- [x] Racha = días seguidos con práctica real; sin puntos. Nivel por habilidad = diagnóstico. Salones: pendientes

## Hecho — Piloto con personas reales (13 nov 2026)
- [x] Login real por enlace mágico (Supabase Auth) en la web; la API ya validaba JWT por JWKS. Acceso local intacto para desarrollo
- [x] Bienvenida guardada en el servidor (`learner_goals`) con consentimiento del piloto obligatorio; primera visita → bienvenida
- [x] Privacidad: `/privacidad`, descargar mis datos y borrar cuenta (Preferencias → Tus datos), retención diaria (conversaciones 90 días, audio de respuestas 30 días)
- [x] Límite de peticiones por persona; cuota diaria de Writing (20) y Speaking (60) activas
- [x] Mi progreso con datos reales: nivel por habilidad del diagnóstico, temas y dominio, repasos, errores recientes y días con práctica real (sin puntos)
- [x] Writing Lab real: 8 consignas originales, corrección con rúbrica writing_v1, reescritura, comparación e historial
- [x] Voz (Entrega 3): STT `gpt-transcribe` y TTS `gpt-4o-mini-tts` verificados; audio del alumno validado y nunca guardado; caché de TTS
- [x] Listening Lab real: 5 episodios originales, 15 preguntas corregidas en el servidor (cuentan como evidencia), dictado
- [x] Speaking Lab real: 2 escenarios (entrevista, hotel), turnos por voz o por escrito, correcciones ancladas al texto, voz de Lania
- [x] Reading Lab real: 5 lecturas originales A1–B1 (perfil, anuncio de trabajo, reseña, correo, artículo), glosario tocable con audio, lectura en voz alta por párrafo y 15 preguntas corregidas en el servidor
- [x] Misiones reales: 3 situaciones que encadenan clase → escucha → escritura → conversación; avance solo por evidencia
- [x] Salones: base en la API (salas, cupo, mensajes solo para miembros, reportes, RLS) apagada con `ROOMS_ENABLED=false`; pantalla «Próximamente»
- [x] «¿Algo no funcionó?» dentro de la app → panel `/admin/qa`
- [x] Despliegue: `apps/api/Dockerfile`, `render.yaml`, guía [deploy-piloto.md](operations/deploy-piloto.md); `/prototipo` y `/sistema` ocultos en producción

## Antes de abrir el piloto (lo hace el fundador)
- [ ] Crear cuentas y seguir [deploy-piloto.md](operations/deploy-piloto.md): GitHub privado, Supabase, Render, Vercel
- [ ] Decidir la landing: hoy promete precios y «7 días gratis» que no existen en el piloto
- [ ] Revisión docente del contenido nuevo: 8 consignas de escritura, 5 episodios + 15 preguntas, 5 lecturas + 15 preguntas, 2 escenarios, 3 misiones (todo `review_status: pilot`)
- [ ] Elegir la voz de Lania (hoy `marin`) y confirmar el tope mensual de IA, que ahora incluye voz
- [ ] Revisión legal del aviso de privacidad (Ley 29733, Perú) antes de usuarios fuera del círculo cercano

## Siguiente
- [ ] **TTS antes del 6 ene 2027:** OpenAI apaga `gpt-4o-mini-tts`; elegir otro proveedor o adaptar a Realtime ([cost-model](operations/cost-model.md))
- [ ] Activar Salones: moderación de Lania por turnos, notas de voz, panel de reportes/expulsión, pantalla real
- [ ] Listening/speaking dentro del diagnóstico; mini prueba de confirmación A1/A2
- [ ] Analítica de uso agregada (dónde se traban las personas) sin texto del alumno
- [ ] `supabase test db` (pgTAP) en CI; hoy el aislamiento se prueba con pytest contra Postgres real
