-- Newcom Manager — Bloque 3: rutinas (nivel, progresión), ejercicios (grupo
-- muscular/articulación), routine_exercises (adaptaciones y variantes).
-- Correr después de 0004_player_ficha_extras.sql.

-- ==========================================================================
-- routines: nivel + progresión (autoreferencial)
-- ==========================================================================
alter table routines
  add column level text check (level in ('principiante', 'intermedio', 'avanzado')),
  add column next_routine_id uuid references routines(id) on delete set null,
  add constraint routines_next_not_self check (next_routine_id is distinct from id);

-- ==========================================================================
-- exercises: grupo muscular / articulación (multi-select, sin CHECK en la
-- base — igual patrón que teams.training_days, validado por lista fija en la UI)
-- ==========================================================================
alter table exercises
  add column muscle_groups text[] not null default '{}';

comment on column exercises.duration_minutes is
  'Orientativa: la duración real de cada uso se define en routine_exercises.duration_minutes.';

-- ==========================================================================
-- routine_exercises: adaptaciones y variantes puntuales de la rutina (no
-- crean una entrada nueva en la biblioteca de ejercicios)
-- ==========================================================================
alter table routine_exercises
  add column adaptations text,
  add column variants text;
