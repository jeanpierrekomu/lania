# Privacidad y seguridad — estado para el piloto (13 nov 2026)

- **Minimización:** `profiles` no guarda email, nombre real, empresa ni datos de salud. El nombre visible es opcional.
- **Aislamiento:** RLS en todas las tablas; el backend decide el propietario por el JWT, nunca por el payload. Tests: `test_rls.py`, `test_users_are_isolated`.
- **Integridad académica:** las claves de los ejercicios no salen del backend (grant por columnas + test); nadie puede escribir su propio dominio.
- **Respuesta original inmutable** (trigger) y correcciones versionadas.
- **Login local** solo existe con `APP_ENV=local/test`; la app no arranca con login local en otro entorno (test).
- **Login real:** Supabase Auth con enlace mágico; la API valida el JWT por JWKS y rechaza el login local fuera de local.
- **Consentimiento:** obligatorio en la bienvenida; se guarda la fecha (`profiles.pilot_consent_at`) y un evento de auditoría.
- **Derechos:** `GET /api/v1/privacy/export` (todo en JSON) y `DELETE /api/v1/privacy/account` (borra en cascada; queda auditoría sin PII). En la app: Preferencias → Tus datos.
- **Retención:** job diario `app.jobs.retention` — conversaciones con la tutora a los 90 días, audio sintetizado de respuestas a los 30 días.
- **Voz:** el audio del alumno se valida por cabecera (tipo real, tamaño ≤ 8 MB, ≤ 120 s), se transcribe y **no se guarda**; solo queda la transcripción.
- **Abuso y costos:** límite de 120 peticiones/minuto por persona, cuotas diarias (tutor, escritura, conversación) y tope mensual de IA. El TTS solo lee textos de la propia conversación o del catálogo (nunca texto libre).
- **Aviso:** `/privacidad`, en lenguaje claro.
- **Pendiente:** CSP, asesoría legal sobre la Ley 29733 (Perú) y transferencia internacional de datos (proveedores fuera del país).
