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
5. **Authentication → Sign In / Providers**: activa **«Allow anonymous sign-ins»**. El piloto no tiene login: cada persona entra como invitada con un clic («Empezar a practicar») y su progreso queda en su navegador. Supabase limita las cuentas anónimas por IP; si ves abuso, activa el CAPTCHA en **Authentication → Attack Protection**. (Las pantallas de correo están listas en `components/auth/auth-screen.tsx` por si más adelante quieres pedir cuenta.)
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

1. Entra a la web con «Empezar a practicar» y completa la bienvenida con un nombre que reconozcas (p. ej. «Jean docente»).
2. En Supabase → **SQL Editor**:
   ```sql
   update public.profiles set role = 'teacher_reviewer'
   where display_name = 'Jean docente';
   ```
3. En `/admin/qa` verás: uso y costo de IA del mes, comentarios «¿Algo no funcionó?» y disputas de corrección.

## 5. Prueba de humo antes de invitar gente (10 min, con 2 correos tuyos)

- [ ] Tocar «Empezar a practicar» desde el celular y desde la computadora (entra sin correo).
- [ ] Completar la bienvenida (aparece el consentimiento del piloto).
- [ ] Hacer el diagnóstico completo y ver el informe.
- [ ] Una clase, un texto en Writing Lab, una lectura en Reading Lab, un episodio de Listening, una conversación de Speaking **hablando** (permite el micrófono).
- [ ] Ver «Mi progreso» y «Misiones» con lo que hiciste.
- [ ] Enviar un comentario con «¿Algo no funcionó?» y verlo en `/admin/qa`.
- [ ] Descargar tus datos y borrar la cuenta de prueba desde Preferencias.

## 6. Si algo se cae (vigilante, copias y cómo volver)

**Qué ve la gente:** la página principal vive en Vercel y sigue funcionando aunque se caiga el servidor. Dentro de la app, si la API no responde, aparece «Lania está descansando un momento», que reintenta sola cada 30 s. El progreso no se pierde.

### Vigilante gratis (te avisa si se cae)
1. Crea una cuenta en [uptimerobot.com](https://uptimerobot.com) (plan Free).
2. **Add New Monitor** → tipo **HTTP(s)** → URL `https://lania-api.onrender.com/api/v1/health/ready` → cada 5 minutos. Esa dirección comprueba que la API **y** la base de datos responden.
3. Agrega otro monitor para la web: `https://lania-iota.vercel.app`.
4. En **Alert Contacts** pon tu correo (y Telegram si quieres). Te llega un aviso cuando se cae y otro cuando vuelve.

### Copia diaria automática
El job `.github/workflows/backup.yml` corre todos los días. Guarda una copia **cifrada** de la base como *artifact* del repositorio privado durante 30 días, comprueba que el servidor responde y, de paso, evita que Supabase pause el proyecto gratis por 7 días sin uso.

1. GitHub → tu repositorio `lania` → **Settings → Secrets and variables → Actions**.
2. **New repository secret** `SUPABASE_DB_URL`: la cadena del *Session pooler* (la misma que `DATABASE_URL` en Render).
3. **New repository secret** `BACKUP_PASSPHRASE`: una frase larga que **guardas aparte** (gestor de contraseñas). Sin ella las copias no se pueden abrir.
4. En la pestaña **Variables**, agrega `API_HEALTH_URL` = `https://lania-api.onrender.com/api/v1/health/ready`.
5. Pruébalo ya: **Actions → Copia diaria → Run workflow**. Al terminar verás el archivo en **Artifacts**.

### Restaurar una copia (si se pierden datos)
1. Crea un proyecto Supabase **nuevo y vacío** (no restaures encima de uno con datos).
2. Descarga el *artifact* de **Actions → Copia diaria** y descífralo en tu computadora:
   ```bash
   gpg -d lania-AAAA-MM-DD_HHMM.sql.gz.gpg | gunzip > lania.sql
   ```
   (Te pide la `BACKUP_PASSPHRASE`.)
3. Cárgala en el proyecto nuevo con su cadena del *Session pooler*:
   ```bash
   psql "postgresql://…pooler.supabase.com:5432/postgres" -v ON_ERROR_STOP=1 -f lania.sql
   ```
4. Cambia `DATABASE_URL` y `SUPABASE_URL` en Render (y las de Vercel) al proyecto nuevo, y vuelve a correr `python -m app.jobs.warm_audio` para regenerar el audio.

Esta restauración se probó de punta a punta en local: todas las cuentas, ejercicios, intentos y correcciones vuelven idénticos.

### Si Supabase pausó el proyecto
En [supabase.com/dashboard](https://supabase.com/dashboard) aparece «Paused» → **Restore project**. Tarda unos minutos. Con la copia diaria activa no debería pasar.

## Qué queda apagado a propósito

- **Salones** (`ROOMS_ENABLED=false`): la base está lista y probada; la pantalla dice «Próximamente».
- **Pagos**: no hay (ADR-008). La landing todavía menciona precios y «7 días gratis»: decide si la ajustas antes de difundirla.
- `/prototipo` y `/sistema` dan 404 en producción.
