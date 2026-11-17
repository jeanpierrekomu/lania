-- Meta, intereses y ritmo que la persona elige en la bienvenida (onboarding). Personaliza el plan;
-- no es evidencia de nivel: el nivel solo sale del diagnóstico y de los intentos (ADR-002).
create table public.learner_goals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  goal text not null check (goal ~ '^[a-z_]{2,30}$'),
  self_level text not null check (self_level ~ '^[a-z0-9_]{1,10}$'),
  interests text[] not null default '{}' check (cardinality(interests) between 1 and 5),
  session_minutes smallint not null check (session_minutes in (5, 15, 30)),
  onboarded_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger learner_goals_updated_at before update on public.learner_goals
  for each row execute function public.set_updated_at();

alter table public.learner_goals enable row level security;
revoke all on public.learner_goals from anon, authenticated;
grant select on public.learner_goals to authenticated;
create policy "learner_goals: read own" on public.learner_goals
  for select to authenticated using ((select auth.uid()) = user_id);
