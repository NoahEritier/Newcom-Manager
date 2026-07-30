-- Newcom Manager — Estadísticas de desempeño (Bloque 1: esquema).
-- Correr después de 0007_tournament_grid_types_leagues.sql.

-- ==========================================================================
-- players: número de camiseta, necesario para pre-cargar la planilla
-- escaneable (Bloque 2) con nombre + número por jugador.
-- ==========================================================================
alter table players
  add column jersey_number int;

-- ==========================================================================
-- match_stat_sheets: una planilla por partido (cubre partido suelto, de
-- torneo, o jornada de liga — las 3 son filas de `matches`).
-- ==========================================================================
create table match_stat_sheets (
  id                 uuid primary key default gen_random_uuid(),
  match_id           uuid not null references matches(id) on delete cascade,
  status             text not null default 'borrador'
                       check (status in ('borrador', 'escaneada', 'revisada', 'confirmada')),
  scanned_image_url  text,          -- foto original de la planilla, para auditoría
  scanned_at         timestamptz,
  confirmed_at       timestamptz,
  created_at         timestamptz not null default now(),
  unique (match_id)
);

create index on match_stat_sheets (match_id);

-- ==========================================================================
-- player_match_stats: un conteo por jugador y por planilla. Columnas fijas
-- (no JSON) — ver justificación en la propuesta de Bloque 1: tipado en TS,
-- agregaciones simples, y el detalle jugada-por-jugada de Fase 2 es
-- estructuralmente otra tabla (una fila por jugada), no algo que deba vivir
-- acá, así que esto no compromete nada de cara a esa fase.
-- ==========================================================================
create table player_match_stats (
  id                    uuid primary key default gen_random_uuid(),
  sheet_id              uuid not null references match_stat_sheets(id) on delete cascade,
  player_id             uuid not null references players(id) on delete cascade,

  -- saques
  serve_total           int not null default 0,
  serve_aces            int not null default 0,
  serve_errors          int not null default 0,

  -- recepciones (escala buena/regular/mala)
  reception_good        int not null default 0,
  reception_regular     int not null default 0,
  reception_bad         int not null default 0,

  -- ataques
  attack_total          int not null default 0,
  attack_points         int not null default 0,
  attack_errors         int not null default 0,

  -- faltas (conteo simple)
  double_touch_faults   int not null default 0,
  invasion_faults       int not null default 0,
  flecha_faults         int not null default 0,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (sheet_id, player_id)
);

create index on player_match_stats (sheet_id);
create index on player_match_stats (player_id);

create trigger player_match_stats_set_updated_at
  before update on player_match_stats
  for each row execute procedure public.set_updated_at();

-- ==========================================================================
-- Storage: bucket para la imagen original de cada planilla escaneada.
-- Mismo criterio que player-photos/tournament-flyers: ownership por team_id
-- en el path.
-- ==========================================================================
insert into storage.buckets (id, name, public)
values ('stat-sheets', 'stat-sheets', true)
on conflict (id) do nothing;

create policy "coach uploads stat sheets of own team"
  on storage.objects for insert
  with check (
    bucket_id = 'stat-sheets'
    and (storage.foldername(name))[1] in (
      select id::text from teams where coach_id = auth.uid()
    )
  );

create policy "coach updates stat sheets of own team"
  on storage.objects for update
  using (
    bucket_id = 'stat-sheets'
    and (storage.foldername(name))[1] in (
      select id::text from teams where coach_id = auth.uid()
    )
  );

create policy "coach deletes stat sheets of own team"
  on storage.objects for delete
  using (
    bucket_id = 'stat-sheets'
    and (storage.foldername(name))[1] in (
      select id::text from teams where coach_id = auth.uid()
    )
  );

create policy "anyone reads stat sheets"
  on storage.objects for select
  using (bucket_id = 'stat-sheets');

-- ==========================================================================
-- RLS
-- ==========================================================================
alter table match_stat_sheets enable row level security;
alter table player_match_stats enable row level security;

create policy "coach manages match_stat_sheets of own matches" on match_stat_sheets
  for all using (
    match_id in (
      select m.id from matches m
      join teams t on t.id = m.team_id
      where t.coach_id = auth.uid()
    )
  ) with check (
    match_id in (
      select m.id from matches m
      join teams t on t.id = m.team_id
      where t.coach_id = auth.uid()
    )
  );

create policy "coach manages player_match_stats of own sheets" on player_match_stats
  for all using (
    sheet_id in (
      select s.id from match_stat_sheets s
      join matches m on m.id = s.match_id
      join teams t on t.id = m.team_id
      where t.coach_id = auth.uid()
    )
  ) with check (
    sheet_id in (
      select s.id from match_stat_sheets s
      join matches m on m.id = s.match_id
      join teams t on t.id = m.team_id
      where t.coach_id = auth.uid()
    )
  );
