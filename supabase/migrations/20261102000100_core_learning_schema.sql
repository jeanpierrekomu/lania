-- MODO English — esquema v1 (Entrega 1)
-- Fuente única del esquema (ADR-001). Políticas y grants explicados en ADR-002.
-- Escrituras de dominio/evidencia/notas: SOLO backend. El cliente solo lee lo suyo.

-- ─────────────────────────── utilidades ───────────────────────────
create or replace function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.forbid_update() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'La tabla % es inmutable (registro original del alumno)', tg_table_name
    using errcode = 'restrict_violation';
end;
$$;

-- ─────────────────────────── perfil y preferencias ───────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 60),
  locale text not null default 'es-419' check (locale in ('es-419', 'en-US')),
  timezone text not null default 'America/Lima' check (char_length(timezone) <= 64),
  role text not null default 'student'
    check (role in ('student', 'content_editor', 'teacher_reviewer', 'moderator', 'admin')),
  audio_retention_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.learning_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tutor_persona text not null default 'fun' check (tutor_persona in ('fun', 'calm', 'coach')),
  feedback_intensity text not null default 'balanced'
    check (feedback_intensity in ('gentle', 'balanced', 'intense')),
  lesson_duration_min smallint not null default 10 check (lesson_duration_min in (0, 5, 10, 20)),
  audio_speed numeric(3, 2) not null default 1.00 check (audio_speed between 0.50 and 1.25),
  translation_support text not null default 'when_stuck'
    check (translation_support in ('always', 'when_stuck', 'off')),
  low_stim_mode boolean not null default false,
  topics text[] not null default '{}' check (cardinality(topics) <= 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger learning_preferences_updated_at before update on public.learning_preferences
  for each row execute function public.set_updated_at();

-- Crea perfil y preferencias al registrarse (patrón documentado por Supabase).
create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.learning_preferences (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────── catálogo académico ───────────────────────────
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_]+(\.[a-z0-9_]+)+$'),
  domain text not null
    check (domain in ('grammar', 'vocabulary', 'listening', 'speaking', 'writing', 'reading')),
  cefr_range text,
  name_es text not null,
  description_es text not null,
  prerequisites text[] not null default '{}',
  rubric_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercise_items (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  version integer not null default 1 check (version > 0),
  skill_id uuid not null references public.skills (id),
  type text not null check (type in ('choice', 'fill_blank')),
  cefr_estimate text,
  difficulty smallint not null default 1 check (difficulty between 1 and 5),
  prompt jsonb not null,          -- público: instrucción, enunciado, opciones, pista
  answer_schema jsonb not null,   -- PRIVADO: claves, alternativas, distractores
  rubric_version text not null,
  license text not null default 'original',
  review_status text not null default 'draft'
    check (review_status in ('draft', 'pilot', 'approved', 'retired')),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (external_id, version)
);
create index exercise_items_skill_idx on public.exercise_items (skill_id) where published;

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  version integer not null default 1 check (version > 0),
  title_es text not null,
  level text,
  skill_id uuid not null references public.skills (id),
  content jsonb not null,         -- microteoría (ES + EN)
  review_status text not null default 'draft'
    check (review_status in ('draft', 'pilot', 'approved', 'retired')),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, version)
);

create table public.lesson_items (
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  exercise_id uuid not null references public.exercise_items (id),
  position smallint not null check (position >= 0),
  role text not null default 'practice' check (role in ('warmup', 'practice')),
  primary key (lesson_id, exercise_id),
  unique (lesson_id, position)
);

create trigger skills_updated_at before update on public.skills
  for each row execute function public.set_updated_at();
create trigger exercise_items_updated_at before update on public.exercise_items
  for each row execute function public.set_updated_at();
create trigger lessons_updated_at before update on public.lessons
  for each row execute function public.set_updated_at();

-- ─────────────────────────── intentos y evaluación ───────────────────────────
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercise_items (id),
  client_submission_id uuid not null,       -- idempotencia: doble click = un intento
  mode text not null check (mode in ('practice', 'review', 'diagnostic')),
  original_answer text not null check (char_length(original_answer) between 1 and 2000),
  hint_count smallint not null default 0 check (hint_count between 0 and 10),
  retry_of uuid references public.attempts (id) on delete set null,
  submitted_at timestamptz not null default now(),
  unique (user_id, client_submission_id)
);
create index attempts_user_time_idx on public.attempts (user_id, submitted_at desc);

-- La respuesta original es inmutable (spec §2.2 Etapa D).
create trigger attempts_immutable before update on public.attempts
  for each row execute function public.forbid_update();

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.attempts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('graded', 'needs_review')),
  verdict text check (verdict in (
    'correct', 'valid_alternative', 'less_natural', 'spelling_error', 'partial', 'incorrect'
  )),
  score numeric(4, 3) check (score between 0 and 1),
  max_score numeric(4, 3) not null default 1,
  matched_rule text,
  expected_answer text,
  errors jsonb not null default '[]',
  feedback_es text not null,
  grader text not null,
  grader_version text not null,
  rubric_version text not null,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  review_status text not null default 'none'
    check (review_status in ('none', 'disputed', 'upheld', 'overturned')),
  created_at timestamptz not null default now(),
  check ((status = 'graded') = (verdict is not null and score is not null))
);
create index evaluations_user_idx on public.evaluations (user_id, created_at desc);

create table public.evaluation_disputes (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null unique references public.evaluations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 500),
  status text not null default 'open' check (status in ('open', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index evaluation_disputes_status_idx on public.evaluation_disputes (status, created_at);

-- ─────────────────────────── evidencia, dominio y repaso ───────────────────────────
create table public.skill_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id uuid not null references public.skills (id),
  attempt_id uuid not null unique references public.attempts (id) on delete cascade,
  exercise_id uuid not null references public.exercise_items (id),
  context text not null check (context in ('practice', 'review', 'retry', 'diagnostic')),
  hint_count smallint not null default 0,
  difficulty smallint not null,
  result text not null check (result in ('correct', 'partial', 'incorrect', 'needs_review')),
  created_at timestamptz not null default now()
);
create index skill_evidence_user_skill_idx on public.skill_evidence (user_id, skill_id, created_at desc);

create table public.skill_mastery (
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  state text not null default 'not_assessed',
  confidence text not null default 'low' check (confidence in ('low', 'medium', 'high')),
  evidence_count integer not null default 0,
  recent_accuracy numeric(4, 3),
  distinct_days integer not null default 0,
  rationale_es text,
  algorithm_version text not null,
  last_assessed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, skill_id),
  constraint mastery_state_check check (
    state in ('not_assessed', 'emerging', 'developing', 'proficient', 'review_due')
  )
);
create index skill_mastery_user_idx on public.skill_mastery (user_id);

create table public.review_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  due_at timestamptz not null,
  step smallint not null default 0 check (step >= 0),
  interval_days smallint not null check (interval_days > 0),
  status text not null default 'pending' check (status in ('pending', 'completed', 'superseded')),
  outcome text check (outcome in ('passed', 'failed')),
  reason text not null check (reason in ('error', 'retention', 'review_passed', 'review_failed')),
  source_attempt_id uuid references public.attempts (id) on delete set null,
  algorithm_version text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index review_one_pending_per_skill
  on public.review_schedule (user_id, skill_id) where status = 'pending';
create index review_schedule_due_idx on public.review_schedule (user_id, due_at) where status = 'pending';

-- ─────────────────────────── RLS y privilegios mínimos ───────────────────────────
alter table public.profiles enable row level security;
alter table public.learning_preferences enable row level security;
alter table public.skills enable row level security;
alter table public.exercise_items enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_items enable row level security;
alter table public.attempts enable row level security;
alter table public.evaluations enable row level security;
alter table public.evaluation_disputes enable row level security;
alter table public.skill_evidence enable row level security;
alter table public.skill_mastery enable row level security;
alter table public.review_schedule enable row level security;

revoke all on
  public.profiles, public.learning_preferences, public.skills, public.exercise_items,
  public.lessons, public.lesson_items, public.attempts, public.evaluations,
  public.evaluation_disputes, public.skill_evidence, public.skill_mastery, public.review_schedule
from anon, authenticated;

revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- Perfil: leer el propio; editar solo campos no privilegiados (role NO).
grant select on public.profiles to authenticated;
grant update (display_name, locale, timezone) on public.profiles to authenticated;
create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

grant select, update on public.learning_preferences to authenticated;
create policy "preferences: read own" on public.learning_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "preferences: update own" on public.learning_preferences
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Contenido publicado: lectura para usuarios autenticados.
grant select on public.skills to authenticated;
create policy "skills: read" on public.skills for select to authenticated using (true);

-- answer_schema queda fuera del grant: las claves nunca llegan al cliente.
grant select (id, external_id, version, skill_id, type, cefr_estimate, difficulty, prompt,
              rubric_version, license, review_status, published)
  on public.exercise_items to authenticated;
create policy "exercise_items: read published" on public.exercise_items
  for select to authenticated using (published);

grant select on public.lessons to authenticated;
create policy "lessons: read published" on public.lessons
  for select to authenticated using (published);

grant select on public.lesson_items to authenticated;
create policy "lesson_items: read published" on public.lesson_items
  for select to authenticated using (
    exists (select 1 from public.lessons l where l.id = lesson_id and l.published)
  );

-- Datos del alumno: solo lectura de lo propio. Escritura exclusiva del backend.
grant select on public.attempts, public.evaluations, public.evaluation_disputes,
  public.skill_evidence, public.skill_mastery, public.review_schedule to authenticated;

create policy "attempts: read own" on public.attempts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "evaluations: read own" on public.evaluations
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "disputes: read own" on public.evaluation_disputes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "evidence: read own" on public.skill_evidence
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "mastery: read own" on public.skill_mastery
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "reviews: read own" on public.review_schedule
  for select to authenticated using ((select auth.uid()) = user_id);
