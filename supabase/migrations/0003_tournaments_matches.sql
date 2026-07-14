-- Newcom Manager — separa "torneo" (evento, puede tener varios partidos) de
-- "partido" (uno solo, suelto o dentro de un torneo). Correr después de 0002b.

-- La tabla `tournaments` actual en realidad guarda partidos (fecha, rival,
-- marcador). Pasa a llamarse `matches`; `tournaments` se recrea como el
-- evento contenedor.
alter table tournaments rename to matches;

-- ==========================================================================
-- tournaments: el evento (puede durar varios días y tener varios partidos)
-- ==========================================================================
create table tournaments (
  id                  uuid primary key default gen_random_uuid(),
  team_id             uuid not null references teams(id) on delete cascade,
  title               text not null,
  start_date          date not null,
  end_date            date,
  location            text,
  address             text,
  participating_teams text,
  fee                 numeric,
  is_paid             boolean not null default false,
  funding_source      text,
  created_at          timestamptz not null default now()
);

create index on tournaments (team_id, start_date desc);

alter table matches
  add column tournament_id uuid references tournaments(id) on delete cascade;

create index on matches (tournament_id);

-- ==========================================================================
-- tournament_attendees: qué jugadores van a un torneo (seleccionables, como
-- en Asistencia)
-- ==========================================================================
create table tournament_attendees (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  player_id     uuid not null references players(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (tournament_id, player_id)
);

-- ==========================================================================
-- RLS
-- ==========================================================================
drop policy if exists "coach manages tournaments of own teams" on matches;
create policy "coach manages own matches" on matches
  for all using (
    team_id in (select id from teams where coach_id = auth.uid())
  ) with check (
    team_id in (select id from teams where coach_id = auth.uid())
  );

alter table tournaments enable row level security;
create policy "coach manages own tournaments" on tournaments
  for all using (
    team_id in (select id from teams where coach_id = auth.uid())
  ) with check (
    team_id in (select id from teams where coach_id = auth.uid())
  );

alter table tournament_attendees enable row level security;
create policy "coach manages own tournament_attendees" on tournament_attendees
  for all using (
    tournament_id in (
      select id from tournaments where team_id in (select id from teams where coach_id = auth.uid())
    )
  ) with check (
    tournament_id in (
      select id from tournaments where team_id in (select id from teams where coach_id = auth.uid())
    )
  );
