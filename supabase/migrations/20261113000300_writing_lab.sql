-- Writing Lab: consignas de escritura libre propias (no se mezclan con el diagnóstico ni con los repasos
-- de ejercicios cerrados). Las respuestas usan las mismas tablas (attempts/evaluations/skill_evidence).
alter table public.exercise_items drop constraint if exists exercise_items_pool_check;
alter table public.exercise_items
  add constraint exercise_items_pool_check check (pool in ('practice', 'diagnostic', 'writing_lab'));
