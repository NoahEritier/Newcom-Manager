-- Newcom Manager — localidad + clubes sede por torneo (con dirección para
-- Maps), partido asociado a un club + cancha (texto libre), y estado de
-- partido (programado/jugado) que determina si corresponde cargar resultado.
-- Correr después de 0011.

-- ==========================================================================
-- tournaments: reemplaza lugar/dirección sueltos por localidad — el lugar
-- puntual ahora vive en tournament_clubs (puede haber más de uno).
-- ==========================================================================
alter table tournaments
  drop column location,
  drop column address,
  add column locality text;

-- ==========================================================================
-- tournament_clubs: sedes del torneo (nombre + dirección para Maps). Un
-- torneo puede tener uno o varios.
-- ==========================================================================
create table tournament_clubs (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name          text not null,
  address       text,
  created_at    timestamptz not null default now()
);

create index on tournament_clubs (tournament_id);

alter table tournament_clubs enable row level security;

create policy "coach manages clubs of own tournaments" on tournament_clubs
  for all using (
    tournament_id in (
      select id from tournaments where team_id in (select id from teams where coach_id = auth.uid())
    )
  ) with check (
    tournament_id in (
      select id from tournaments where team_id in (select id from teams where coach_id = auth.uid())
    )
  );

-- ==========================================================================
-- matches: lugar/dirección sueltos se reemplazan por club_id (referencia a
-- tournament_clubs) + cancha (texto libre, no amerita tabla propia). Se
-- agrega status: 'programado' (sin resultado, solo para organizarse) vs.
-- 'jugado' (con resultado cargado).
-- ==========================================================================
alter table matches
  drop column location,
  drop column address,
  add column club_id uuid references tournament_clubs(id) on delete set null,
  add column court_name text,
  add column status text not null default 'programado' check (status in ('programado', 'jugado'));

create index on matches (club_id);
