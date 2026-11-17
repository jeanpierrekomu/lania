-- Piloto con personas reales: consentimiento informado y nombre visible desde el registro por correo.

-- Fecha en que la persona aceptó participar en el piloto (null = todavía no). Lo escribe solo el backend.
alter table public.profiles add column pilot_consent_at timestamptz;

-- Supabase guarda los datos del formulario de registro en auth.users.raw_user_meta_data.
create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 60), ''))
  on conflict do nothing;
  insert into public.learning_preferences (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from anon, authenticated, public;
