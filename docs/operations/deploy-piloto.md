# Publicar LANIA para el piloto (paso a paso)

Arquitectura: **Supabase** (base de datos + acceso por correo) · **Render** (API, carpeta `apps/api`) · **Vercel** (web, carpeta `apps/web`). Todo tiene plan gratuito o barato para empezar; la API en Render usa el plan *Starter* (el gratuito se duerme y tarda en despertar).

Necesitas: cuenta de GitHub, la clave de OpenAI que ya usas en `.env` y unos 40 minutos.

> Nunca pegues claves en el chat ni en archivos del repositorio. Solo en los paneles de Supabase, Render y Vercel.

---

## 0. Subir el código a GitHub (una vez)

1. Crea un repositorio **privado** en GitHub (p. ej. `lania`).
2. Sube esta carpeta. El archivo `.gitignore` ya excluye `.env` y `node_modules`.

## 1. Supabase: base de datos y acceso por correo

1. En [supabase.com](https://supabase.com) → **New project**. Región: la más cercana a tus alumnos (p. ej. *São Paulo*). Guarda la contraseña de la base en tu gestor de contraseñas.
2. **Connect → Session pooler**: copia la cadena `postgresql://postgres.xxxx:[TU-CONTRASEÑA]@aws-0-...pooler.supabase.com:5432/postgres`. Será `DATABASE_URL` en Render (usa el *session pooler*: Render no siempre tiene IPv6).
3. **Project Settings → API**: copia la *Project URL* (`https://xxxx.supabase.co`) y la *publishable key* (`sb_publishable_…`).
4. **Project Settings → JWT Keys**: asegúrate de que las *JWT signing keys* asimétricas estén activas (la API valida los tokens con la lista pública de claves, ES256/RS256).
5. **Authentication → Sign In / Providers → Email**: deja activado *Email* y el *magic link*. Desactiva «Allow new users to sign up» si quieres que solo entren las personas que invites (las invitas desde **Authentication → Users → Invite**).
6. **Authentication → URL Configuration**:
   - *Site URL*: la dirección de Vercel (paso 3), p. ej. `https://lania.vercel.app`
   - *Redirect URLs*: `https://lania.vercel.app/login`
7. (Recomendado) **Authentication → Emails → SMTP**: configura un remitente propio. El de Supabase sirve para pruebas pero limita los correos por hora.

Las tablas **no** se crean a mano: la API aplica las migraciones de `supabase/migrations/` y carga el contenido cada vez que se despliega.

## 2. Render: la API

1. En [render.com](https://render.com) → **New → Blueprint** → elige tu repositorio. Render lee `render.yaml` y propone dos servicios: `lania-api` (web) y `lania-retention` (tarea diaria).
2. Completa las variables marcadas como secretas:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | la cadena del *session pooler* (paso 1.2) |
| `SUPABASE_URL` | la *Project URL* (paso 1.3) |
| `CORS_ORIGINS` | `["https://lania.vercel.app"]` (tu dirección de Vercel, con corchetes y comillas) |
| `LLM_API_KEY` | tu clave de OpenAI |
| `LLM_FAST_MODEL` / `LLM_DEEP_MODEL` | los mismos de tu `.env` |
| `LLM_FAST_REASONING_EFFORT` / `LLM_DEEP_REASONING_EFFORT` | los mismos de tu `.env` |
| precios `LLM_*_PRICE_*` | los mismos de tu `.env` |
| `MONTHLY_AI_SPEND_LIMIT_USD` | tope del piloto (incluye voz). Ver `cost-model.md` |
| `STT_MODEL` / `STT_PRICE_PER_MINUTE_USD` | `gpt-transcribe` / `0.0045` |
| `TTS_MODEL` | `gpt-4o-mini-tts` (se apaga el 2027-01-06: ver `cost-model.md`) |

   En `lania-retention` pon también `DATABASE_URL` y `SUPABASE_URL`.
3. **Apply**. El primer despliegue construye la imagen (`apps/api/Dockerfile`), aplica migraciones, siembra el contenido y arranca. Comprueba que `https://lania-api.onrender.com/api/v1/health` responde `{"status":"ok","auth_mode":"supabase",…}`.
4. Genera el audio de los episodios una sola vez: en Render, **lania-api → Shell** → `python -m app.jobs.warm_audio` (92 audios: episodios, lecturas y Speaking; ≈ 2 minutos, unos centavos).

## 3. Vercel: la web

1. En [vercel.com](https://vercel.com) → **Add New → Project** → tu repositorio.
2. **Root Directory**: `apps/web`. Framework: Next.js (se detecta solo). Vercel instala con pnpm desde la raíz del monorepo.
3. Variables de entorno:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://lania-api.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | la *Project URL* |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | la *publishable key* |
| `NEXT_PUBLIC_CONTACT_EMAIL` | (opcional) correo de contacto que aparece en `/privacidad` |

4. **Deploy**. Si la dirección final no es `lania.vercel.app`, actualiza `CORS_ORIGINS` en Render y las URL del paso 1.6.

## 4. Darte rol de docente (para ver el panel `/admin/qa`)

1. Entra a la web con tu correo (enlace mágico) y completa la bienvenida.
2. En Supabase → **SQL Editor**:
   ```sql
   update public.profiles set role = 'teacher_reviewer'
   where id = (select id from auth.users where email = 'TU_CORREO');
   ```
3. En `/admin/qa` verás: uso y costo de IA del mes, comentarios «¿Algo no funcionó?» y disputas de corrección.

## 5. Prueba de humo antes de invitar gente (10 min, con 2 correos tuyos)

- [ ] Entrar con enlace mágico desde el celular y desde la computadora.
- [ ] Completar la bienvenida (aparece el consentimiento del piloto).
- [ ] Hacer el diagnóstico completo y ver el informe.
- [ ] Una clase, un texto en Writing Lab, una lectura en Reading Lab, un episodio de Listening, una conversación de Speaking **hablando** (permite el micrófono).
- [ ] Ver «Mi progreso» y «Misiones» con lo que hiciste.
- [ ] Enviar un comentario con «¿Algo no funcionó?» y verlo en `/admin/qa`.
- [ ] Descargar tus datos y borrar la cuenta de prueba desde Preferencias.

## Qué queda apagado a propósito

- **Salones** (`ROOMS_ENABLED=false`): la base está lista y probada; la pantalla dice «Próximamente».
- **Pagos**: no hay (ADR-008). La landing todavía menciona precios y «7 días gratis»: decide si la ajustas antes de difundirla.
- `/prototipo` y `/sistema` dan 404 en producción.
