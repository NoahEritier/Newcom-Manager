-- Newcom Manager — ampliación de esquema (spec funcional de pantallas)
-- Correr una sola vez en el SQL Editor del proyecto Supabase, después de 0001_init.sql.

-- ==========================================================================
-- teams: nombre de equipo, género, categoría, agenda de entrenamientos
-- ==========================================================================
alter table teams
  add column discipline text,
  add column default_location text,
  add column default_schedule text,
  add column visibility text not null default 'private' check (visibility in ('private', 'public')),
  add column gender text check (gender in ('masculino', 'femenino', 'mixto')),
  add column category text,
  -- días de entrenamiento recurrentes, 0=domingo .. 6=sábado (igual que Date.getDay() en JS)
  add column training_days smallint[] not null default '{}';

-- ==========================================================================
-- players: foto y contacto de emergencia
-- ==========================================================================
alter table players
  add column photo_url text,
  add column emergency_contact_name text,
  add column emergency_contact_phone text;

-- ==========================================================================
-- attendance_sessions / attendance_records: hora, ubicación, nota, edición
-- ==========================================================================
alter table attendance_sessions
  add column session_time time,
  add column location text;

alter table attendance_records
  add column note text,
  add column edited_at timestamptz;

-- ==========================================================================
-- exercises: categoría (lista fija), duración, materiales
-- ==========================================================================
alter table exercises
  add column category text check (
    category in ('entrada_en_calor', 'tecnica', 'tactica', 'fisico', 'otro')
  ),
  add column duration_minutes int,
  add column materials text;

-- ==========================================================================
-- routines: pasan de "1 por sesión" a biblioteca reutilizable (favoritas,
-- duplicables), vinculada a sesiones vía session_routines.
-- ==========================================================================
create table session_routines (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references attendance_sessions(id) on delete cascade,
  routine_id    uuid not null references routines(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (session_id, routine_id)
);

-- migrar vínculos existentes (rutinas de prueba ya creadas 1:1 con una sesión)
insert into session_routines (session_id, routine_id)
select session_id, id from routines where session_id is not null;

alter table routines
  add column coach_id uuid references coaches(id) on delete cascade,
  add column team_id uuid references teams(id) on delete cascade,
  add column title text,
  add column is_favorite boolean not null default false;

-- backfill de las rutinas existentes: coach/equipo heredado de su sesión, título default
update routines r
set coach_id = t.coach_id,
    team_id = s.team_id,
    title = 'Rutina del ' || to_char(s.session_date, 'DD/MM/YYYY')
from attendance_sessions s
join teams t on t.id = s.team_id
where r.session_id = s.id;

-- si quedara alguna rutina huérfana (no debería, pero por las dudas no rompas la migración)
delete from routines where coach_id is null;

alter table routines
  alter column coach_id set not null,
  alter column title set not null,
  drop column session_id;

alter table routine_exercises
  add column duration_minutes int,
  add column notes text;

-- ==========================================================================
-- tournaments: hora, local/visitante, dirección, marcador, visibilidad, calendar
-- ==========================================================================
alter table tournaments
  add column match_time time,
  add column home_away text check (home_away in ('local', 'visitante')),
  add column address text,
  add column score_own int,
  add column score_opponent int,
  add column visibility text not null default 'private' check (visibility in ('private', 'public')),
  add column synced_with_calendar boolean not null default false;

-- ==========================================================================
-- RLS: session_routines + política de routines actualizada (ya no pasa por session_id)
-- ==========================================================================
alter table session_routines enable row level security;

create policy "coach manages session_routines of own sessions" on session_routines
  for all using (
    session_id in (
      select s.id from attendance_sessions s
      join teams t on t.id = s.team_id
      where t.coach_id = auth.uid()
    )
  ) with check (
    session_id in (
      select s.id from attendance_sessions s
      join teams t on t.id = s.team_id
      where t.coach_id = auth.uid()
    )
  );

drop policy if exists "coach manages routines of own sessions" on routines;

create policy "coach manages own routines" on routines
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());
