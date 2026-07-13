-- Newcom Manager — esquema inicial (MVP, un solo rol: Entrenador/Administrador)
-- Correr una sola vez en el SQL Editor del proyecto Supabase.

create extension if not exists "pgcrypto";

-- coaches: 1:1 con auth.users
create table coaches (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  phone       text not null,
  created_at  timestamptz not null default now()
);

-- teams: pertenece a un coach (Fase 2 podría sumar tabla puente coach_teams)
create table teams (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references coaches(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- players
create table players (
  id               uuid primary key default gen_random_uuid(),
  team_id          uuid not null references teams(id) on delete cascade,
  full_name        text not null,
  birth_date       date,
  phone            text,
  whatsapp         text,
  medical_status   text not null default 'unknown'
                     check (medical_status in ('vigente', 'vencido', 'unknown')),
  medical_expiry   date,
  notes            text,
  is_active        boolean not null default true, -- baja lógica, nunca delete físico
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- attendance_sessions
create table attendance_sessions (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references teams(id) on delete cascade,
  session_date  date not null,
  created_at    timestamptz not null default now()
);

-- attendance_records (append-only; upsert por (session_id, player_id))
create table attendance_records (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references attendance_sessions(id) on delete cascade,
  player_id     uuid not null references players(id) on delete cascade,
  present       boolean not null,
  recorded_at   timestamptz not null default now(),
  unique (session_id, player_id)
);

-- exercises: biblioteca reutilizable entre equipos del mismo coach
create table exercises (
  id            uuid primary key default gen_random_uuid(),
  coach_id      uuid not null references coaches(id) on delete cascade,
  title         text not null,
  description   text,
  media_url     text,
  created_at    timestamptz not null default now()
);

-- routines: set ordenado de exercises, asociada a una sesión
create table routines (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references attendance_sessions(id) on delete cascade,
  created_at    timestamptz not null default now()
);

create table routine_exercises (
  id            uuid primary key default gen_random_uuid(),
  routine_id    uuid not null references routines(id) on delete cascade,
  exercise_id   uuid not null references exercises(id) on delete cascade,
  position      int not null
);

-- tournaments
create table tournaments (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references teams(id) on delete cascade,
  match_date    date not null,
  opponent      text not null,
  location      text,
  result        text,
  created_at    timestamptz not null default now()
);

-- índices para los joins/filtros más comunes
create index on teams (coach_id);
create index on players (team_id) where is_active;
create index on attendance_sessions (team_id, session_date desc);
create index on attendance_records (session_id);
create index on exercises (coach_id);
create index on routines (session_id);
create index on routine_exercises (routine_id);
create index on tournaments (team_id, match_date desc);

-- Row Level Security: cada coach solo ve/edita lo suyo.
alter table coaches enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table attendance_sessions enable row level security;
alter table attendance_records enable row level security;
alter table exercises enable row level security;
alter table routines enable row level security;
alter table routine_exercises enable row level security;
alter table tournaments enable row level security;

create policy "coach reads/writes own row" on coaches
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "coach manages own teams" on teams
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());

create policy "coach manages players of own teams" on players
  for all using (
    team_id in (select id from teams where coach_id = auth.uid())
  ) with check (
    team_id in (select id from teams where coach_id = auth.uid())
  );

create policy "coach manages sessions of own teams" on attendance_sessions
  for all using (
    team_id in (select id from teams where coach_id = auth.uid())
  ) with check (
    team_id in (select id from teams where coach_id = auth.uid())
  );

create policy "coach manages attendance of own sessions" on attendance_records
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

create policy "coach manages own exercises" on exercises
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());

create policy "coach manages routines of own sessions" on routines
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

create policy "coach manages routine_exercises of own routines" on routine_exercises
  for all using (
    routine_id in (
      select r.id from routines r
      join attendance_sessions s on s.id = r.session_id
      join teams t on t.id = s.team_id
      where t.coach_id = auth.uid()
    )
  ) with check (
    routine_id in (
      select r.id from routines r
      join attendance_sessions s on s.id = r.session_id
      join teams t on t.id = s.team_id
      where t.coach_id = auth.uid()
    )
  );

create policy "coach manages tournaments of own teams" on tournaments
  for all using (
    team_id in (select id from teams where coach_id = auth.uid())
  ) with check (
    team_id in (select id from teams where coach_id = auth.uid())
  );

-- trigger: crear fila en coaches automáticamente al confirmarse el signup por OTP
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.coaches (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.phone, ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- trigger: mantener updated_at de players
create function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger players_set_updated_at
  before update on players
  for each row execute procedure public.set_updated_at();
