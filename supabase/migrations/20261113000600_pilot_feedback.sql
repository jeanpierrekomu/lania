-- Comentarios del piloto («¿Algo no funcionó?»): los escribe la persona, los lee el equipo en el panel docente.
create table public.pilot_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  kind text not null check (kind in ('bug', 'idea', 'content', 'other')),
  message text not null check (char_length(message) between 3 and 2000),
  page text check (char_length(page) <= 200),
  status text not null default 'new' check (status in ('new', 'seen', 'done')),
  created_at timestamptz not null default now()
);
create index pilot_feedback_time_idx on public.pilot_feedback (created_at desc);
alter table public.pilot_feedback enable row level security;
revoke all on public.pilot_feedback from anon, authenticated;
grant select on public.pilot_feedback to authenticated;
create policy "pilot_feedback: read own" on public.pilot_feedback
  for select to authenticated using ((select auth.uid()) = user_id);
