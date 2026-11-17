-- Voz por turnos (Entrega 3, ADR-003/ADR-005): Speaking Lab, Listening Lab y caché de audio sintetizado.
-- El audio del alumno NO se guarda: se transcribe y se descarta (solo queda el texto).

alter table public.ai_requests drop constraint if exists ai_requests_task_check;
alter table public.ai_requests add constraint ai_requests_task_check
  check (task in ('tutor_reply', 'writing_eval', 'speaking_turn', 'speech_to_text', 'text_to_speech'));

alter table public.exercise_items drop constraint if exists exercise_items_pool_check;
alter table public.exercise_items add constraint exercise_items_pool_check
  check (pool in ('practice', 'diagnostic', 'writing_lab', 'listening'));

-- Audio generado por TTS (episodios de listening y respuestas de Lania). Sin datos personales:
-- la clave es un hash del texto, la voz y el modelo. Solo lo lee el backend.
create table public.tts_cache (
  key text primary key,
  kind text not null check (kind in ('listening', 'reply')),
  model text not null,
  voice text not null,
  mime text not null,
  data bytea not null,
  created_at timestamptz not null default now()
);
alter table public.tts_cache enable row level security;
revoke all on public.tts_cache from anon, authenticated;

create table public.speaking_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scenario text not null check (scenario ~ '^[a-z0-9_-]{2,40}$'),
  step smallint not null default 0,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index speaking_sessions_user_idx on public.speaking_sessions (user_id, created_at desc);

create table public.speaking_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.speaking_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  client_turn_id uuid not null,
  step smallint not null,
  input_mode text not null check (input_mode in ('voice', 'text')),
  transcript text not null check (char_length(transcript) between 1 and 2000),
  audio_seconds numeric(6, 1),
  feedback jsonb not null default '{}',
  reply_en text not null,
  ai_request_id uuid references public.ai_requests (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, client_turn_id)
);
create index speaking_turns_session_idx on public.speaking_turns (session_id, created_at);

alter table public.speaking_sessions enable row level security;
alter table public.speaking_turns enable row level security;
revoke all on public.speaking_sessions from anon, authenticated;
revoke all on public.speaking_turns from anon, authenticated;
grant select on public.speaking_sessions, public.speaking_turns to authenticated;
create policy "speaking_sessions: read own" on public.speaking_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "speaking_turns: read own" on public.speaking_turns
  for select to authenticated using ((select auth.uid()) = user_id);
