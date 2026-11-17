# ADR-005 — Almacenamiento de audio

**Estado:** aceptado (diseño) · implementación en Entrega 3 · 2026-11-02

- Por defecto **no se retiene audio crudo** tras transcribir. `profiles.audio_retention_consent` (default `false`) habilita «guardar mis grabaciones para progreso», revocable.
- Si hay consentimiento: bucket privado de Supabase Storage, ruta `user/{uid}/...`, URLs firmadas de corta vida, `expires_at` con borrado automático, nunca compartido con salas.
- Audios de listening del catálogo: generados una vez, cacheados y servidos públicamente solo si no contienen datos personales.
- Validación en servidor de tipo MIME real, tamaño y duración; nunca se usa voz de alumnos para entrenar sin consentimiento específico.
