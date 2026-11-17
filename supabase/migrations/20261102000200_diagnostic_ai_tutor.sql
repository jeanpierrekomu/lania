-- MODO English — esquema v2 (Entrega 2): diagnóstico, escritura abierta, IA medida, tutor, revisión.
-- Mismo patrón que v1 (ADR-002): RLS en todo, el cliente solo lee lo suyo, el backend escribe.

-- ─────────────────────────── banco de ítems ───────────────────────────
alter table public.exercise_items
  add column pool text not null default 'practice' check (pool in ('practice', 'diagnostic'));
alter table public.exercise_items drop constraint exercise_items_type_check;
alter table public.exercise_items
  add constraint exercise_items_type_check check (type in ('choice', 'fill_blank', 'open_response'));
grant select (pool) on public.exercise_items to authenticated;

-- ─────────────────────────── llamadas a IA (costo, latencia, auditoría) ───────────────────────────
create table public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  task text not null check (task in ('tutor_reply', 'writing_eval')),
  provider text not null,
  model text not null,
  prompt_version text not null,
  request_key text unique,                       -- idempotencia: nunca pagar dos veces el mismo turno
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric(12, 6),             -- NULL si el precio no está configurado: no inventamos
  latency_ms integer,
  status text not null check (status in ('ok', 'invalid_output', 'provider_error', 'timeout')),
  error_code text,
  created_at timestamptz not null default now()
);
create index ai_requests_user_time_idx on public.ai_requests (user_id, created_at desc);
create index ai_requests_time_idx on public.ai_requests (created_at desc);

-- ─────────────────────────── evaluaciones: campos de IA y rúbrica ───────────────────────────
alter table public.evaluations
  add column model_id text,
  add column ai_request_id uuid references public.ai_requests (id) on delete set null,
  add column criteria_scores jsonb,
  add column strengths_es text,
  add column natural_version_en text,
  add column retry_hint_es text;

alter table public.evaluation_disputes
  add column reviewer_id uuid references auth.users (id) on delete set null,
  add column resolution_note text check (char_length(resolution_note) <= 500);

-- ─────────────────────────── diagnóstico ───────────────────────────
create table public.diagnostic_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  version text not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  report jsonb
);
create unique index diagnostic_one_active_per_user
  on public.diagnostic_runs (user_id) where status = 'in_progress';
create index diagnostic_runs_user_idx on public.diagnostic_runs (user_id, started_at desc);

create table public.diagnostic_run_items (
  run_id uuid not null references public.diagnostic_runs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercise_items (id),
  position smallint not null,
  block text not null check (block in ('grammar_vocab', 'reading', 'writing')),
  status text not null default 'pending' check (status in ('pending', 'answered', 'skipped')),
  skip_reason text,
  attempt_id uuid references public.attempts (id) on delete set null,
  primary key (run_id, exercise_id),
  unique (run_id, position)
);

create table public.diagnostic_sections (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.diagnostic_runs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id uuid not null references public.skills (id),
  band text not null check (band in ('not_assessed', 'below_a1', 'a1', 'a2', 'pending_review')),
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  evidence_count integer not null default 0,
  correct_count numeric(5, 2) not null default 0,
  notes_es text,
  algorithm_version text not null,
  unique (run_id, skill_id)
);

-- ─────────────────────────── tutor ───────────────────────────
create table public.tutor_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  persona text not null check (persona in ('fun', 'calm', 'coach')),
  context jsonb not null default '{}',             -- p. ej. evaluación a explicar; nunca datos sensibles
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '90 days'   -- retención mínima (spec §6.3)
);
create index tutor_conversations_user_idx on public.tutor_conversations (user_id, updated_at desc);

create table public.tutor_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.tutor_conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  text text not null check (char_length(text) between 1 and 4000),
  corrections jsonb not null default '[]',
  client_message_id uuid,
  ai_request_id uuid references public.ai_requests (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (conversation_id, client_message_id)
);
create index tutor_messages_conv_idx on public.tutor_messages (conversation_id, created_at);

-- ─────────────────────────── auditoría (acciones de staff) ───────────────────────────
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  object_type text not null,
  object_id uuid,
  metadata_safe jsonb not null default '{}',       -- sin PII ni texto del alumno
  created_at timestamptz not null default now()
);

-- ─────────────────────────── RLS y privilegios ───────────────────────────
alter table public.ai_requests enable row level security;
alter table public.diagnostic_runs enable row level security;
alter table public.diagnostic_run_items enable row level security;
alter table public.diagnostic_sections enable row level security;
alter table public.tutor_conversations enable row level security;
alter table public.tutor_messages enable row level security;
alter table public.audit_events enable row level security;

revoke all on public.ai_requests, public.diagnostic_runs, public.diagnostic_run_items,
  public.diagnostic_sections, public.tutor_conversations, public.tutor_messages, public.audit_events
from anon, authenticated;

-- ai_requests y audit_events: sin acceso desde el cliente (solo backend / staff vía API).

grant select on public.diagnostic_runs, public.diagnostic_run_items, public.diagnostic_sections,
  public.tutor_conversations, public.tutor_messages to authenticated;

create policy "diagnostic_runs: read own" on public.diagnostic_runs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "diagnostic_run_items: read own" on public.diagnostic_run_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "diagnostic_sections: read own" on public.diagnostic_sections
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "tutor_conversations: read own" on public.tutor_conversations
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "tutor_messages: read own" on public.tutor_messages
  for select to authenticated using ((select auth.uid()) = user_id);
