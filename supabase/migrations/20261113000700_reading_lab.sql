-- Reading Lab: lecturas originales por nivel y tema; sus preguntas son ítems choice con pool «reading»
-- (se corrigen en el servidor y cuentan como evidencia de lectura). Nunca entran en lecciones ni repasos.
alter table public.exercise_items drop constraint if exists exercise_items_pool_check;
alter table public.exercise_items add constraint exercise_items_pool_check
  check (pool in ('practice', 'diagnostic', 'writing_lab', 'listening', 'reading'));
