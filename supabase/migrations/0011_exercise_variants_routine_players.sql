-- Newcom Manager — variaciones de ejercicio (hasta 3, opcionales), modo
-- duración/repeticiones+series en el ejercicio base, y asignación de
-- rutinas a jugadores puntuales. Correr después de 0010.

-- ==========================================================================
-- exercises: modo duración vs. repeticiones+series (duration_minutes ya
-- existía, se reutiliza para el modo 'duracion')
-- ==========================================================================
alter table exercises
  add column duration_mode text check (duration_mode in ('duracion', 'repeticiones')),
  add column reps int,
  add column sets int;

-- ==========================================================================
-- exercise_variants: hasta 3 variaciones opcionales de un mismo ejercicio,
-- cada una con su propia descripción/materiales/carga/duración-repeticiones.
-- ==========================================================================
create table exercise_variants (
  id              uuid primary key default gen_random_uuid(),
  exercise_id     uuid not null references exercises(id) on delete cascade,
  position        int not null check (position between 1 and 3),
  description     text,
  materials       text,
  load_text       text,
  duration_mode   text check (duration_mode in ('duracion', 'repeticiones')),
  duration_minutes int,
  reps            int,
  sets            int,
  created_at      timestamptz not null default now(),
  unique (exercise_id, position)
);

create index on exercise_variants (exercise_id);

alter table exercise_variants enable row level security;

create policy "coach manages variants of own exercises" on exercise_variants
  for all using (
    exercise_id in (select id from exercises where coach_id = auth.uid())
  ) with check (
    exercise_id in (select id from exercises where coach_id = auth.uid())
  );

-- ==========================================================================
-- routine_players: a qué jugadores puntuales se les asignó una rutina de la
-- biblioteca (independiente de session_routines, que vincula a una sesión).
-- ==========================================================================
create table routine_players (
  id            uuid primary key default gen_random_uuid(),
  routine_id    uuid not null references routines(id) on delete cascade,
  player_id     uuid not null references players(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (routine_id, player_id)
);

alter table routine_players enable row level security;

create policy "coach manages routine_players of own routines" on routine_players
  for all using (
    routine_id in (select id from routines where coach_id = auth.uid())
  ) with check (
    routine_id in (select id from routines where coach_id = auth.uid())
  );
