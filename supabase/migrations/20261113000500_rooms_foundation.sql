-- Salones (conversación en grupos pequeños): SOLO la base. Desactivados en el piloto (ROOMS_ENABLED=false).
-- Diseño objetivo: chat + notas de voz transcritas por turnos, máx. 5 personas, Lania modera.
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  title_es text not null,
  topic_es text not null,
  goal_es text not null,
  level text not null,
  capacity smallint not null default 5 check (capacity between 2 and 5),
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'open', 'closed')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'moderator')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (room_id, user_id)
);

create table public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,   -- null = mensaje de Lania
  kind text not null check (kind in ('text', 'voice', 'lania')),
  text text not null check (char_length(text) between 1 and 1000),
  reported_at timestamptz,
  hidden_at timestamptz,
  created_at timestamptz not null default now()
);
create index room_messages_room_time_idx on public.room_messages (room_id, created_at);

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_messages enable row level security;
revoke all on public.rooms, public.room_members, public.room_messages from anon, authenticated;
grant select on public.rooms, public.room_members, public.room_messages to authenticated;

-- Función auxiliar (security definer) para no consultar room_members dentro de su propia política (recursión).
create or replace function public.is_room_member(target uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.room_members m where m.room_id = target and m.user_id = (select auth.uid()))
$$;
revoke execute on function public.is_room_member(uuid) from anon, public;
grant execute on function public.is_room_member(uuid) to authenticated;

create policy "rooms: read" on public.rooms for select to authenticated using (true);
-- Solo quien es (o fue) miembro ve quiénes están y qué se dijo en la sala.
create policy "room_members: read own rooms" on public.room_members for select to authenticated
  using (public.is_room_member(room_id));
create policy "room_messages: read own rooms" on public.room_messages for select to authenticated
  using (hidden_at is null and public.is_room_member(room_id));
