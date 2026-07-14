-- Newcom Manager — corrección de 0002_expand_schema.sql
-- La sentencia "ALTER TABLE routines ... DROP COLUMN session_id" falló por
-- dependencias de policies y se revirtió entera (incluyendo los SET NOT NULL),
-- dejando el resto de 0002 a medio aplicar. Este script es idempotente: se
-- puede correr las veces que haga falta sin romper nada ya aplicado.

-- ==========================================================================
-- Columnas que puedan haber quedado sin aplicar (todas con guarda IF NOT EXISTS)
-- ==========================================================================
alter table teams
  add column if not exists discipline text,
  add column if not exists default_location text,
  add column if not exists default_schedule text,
  add column if not exists visibility text not null default 'private',
  add column if not exists gender text,
  add column if not exists category text,
  add column if not exists training_days smallint[] not null default '{}';

alter table teams
  drop constraint if exists teams_visibility_check,
  add constraint teams_visibility_check check (visibility in ('private', 'public'));

alter table teams
  drop constraint if exists teams_gender_check,
  add constraint teams_gender_check check (gender in ('masculino', 'femenino', 'mixto'));

alter table players
  add column if not exists photo_url text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text;

alter table attendance_sessions
  add column if not exists session_time time,
  add column if not exists location text;

alter table attendance_records
  add column if not exists note text,
  add column if not exists edited_at timestamptz;

alter table exercises
  add column if not exists category text,
  add column if not exists duration_minutes int,
  add column if not exists materials text;

alter table exercises
  drop constraint if exists exercises_category_check,
  add constraint exercises_category_check check (
    category in ('entrada_en_calor', 'tecnica', 'tactica', 'fisico', 'otro')
  );

alter table routine_exercises
  add column if not exists duration_minutes int,
  add column if not exists notes text;

alter table tournaments
  add column if not exists match_time time,
  add column if not exists home_away text,
  add column if not exists address text,
  add column if not exists score_own int,
  add column if not exists score_opponent int,
  add column if not exists visibility text not null default 'private',
  add column if not exists synced_with_calendar boolean not null default false;

alter table tournaments
  drop constraint if exists tournaments_home_away_check,
  add constraint tournaments_home_away_check check (home_away in ('local', 'visitante'));

alter table tournaments
  drop constraint if exists tournaments_visibility_check,
  add constraint tournaments_visibility_check check (visibility in ('private', 'public'));

-- ==========================================================================
-- routines: terminar la migración de "1 por sesión" a biblioteca reutilizable
-- ==========================================================================
create table if not exists session_routines (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references attendance_sessions(id) on delete cascade,
  routine_id    uuid not null references routines(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (session_id, routine_id)
);

alter table routines
  add column if not exists coach_id uuid references coaches(id) on delete cascade,
  add column if not exists team_id uuid references teams(id) on delete cascade,
  add column if not exists title text,
  add column if not exists is_favorite boolean not null default false;

-- si quedara alguna fila sin coach_id/title por el rollback parcial, backfillear
-- solo es posible si session_id todavía existe; si ya se borró (tu caso), esto
-- no hace nada y pasamos directo al DELETE de huérfanas.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'routines' and column_name = 'session_id'
  ) then
    update routines r
    set coach_id = coalesce(r.coach_id, t.coach_id),
        team_id = coalesce(r.team_id, s.team_id),
        title = coalesce(r.title, 'Rutina del ' || to_char(s.session_date, 'DD/MM/YYYY'))
    from attendance_sessions s
    join teams t on t.id = s.team_id
    where r.session_id = s.id;
  end if;
end $$;

delete from routines where coach_id is null;

alter table routines alter column coach_id set not null;
alter table routines alter column title set not null;

alter table routines drop column if exists session_id;

-- ==========================================================================
-- RLS: recrear políticas rotas por el rollback parcial
-- ==========================================================================
alter table session_routines enable row level security;

drop policy if exists "coach manages session_routines of own sessions" on session_routines;
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
drop policy if exists "coach manages own routines" on routines;
create policy "coach manages own routines" on routines
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());

drop policy if exists "coach manages routine_exercises of own routines" on routine_exercises;
create policy "coach manages routine_exercises of own routines" on routine_exercises
  for all using (
    routine_id in (select id from routines where coach_id = auth.uid())
  ) with check (
    routine_id in (select id from routines where coach_id = auth.uid())
  );
