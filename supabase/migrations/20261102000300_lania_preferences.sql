-- LANIA — preferencias de la tutora (docs/lania-audit.md, ADR-009). Solo AGREGA columnas: no toca datos existentes.
alter table public.learning_preferences
  add column humor_level smallint not null default 3 check (humor_level between 0 and 5),
  add column show_avatar boolean not null default true,
  add column reduce_motion boolean not null default false;
-- Los grants de UPDATE sobre la tabla (ADR-002) ya cubren las columnas nuevas; las políticas RLS no cambian.
