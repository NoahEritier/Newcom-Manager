-- Newcom Manager — Bloque 1: ficha de jugador (otro deporte, lesiones, foto vía Storage)
-- Correr después de 0003_tournaments_matches.sql.

-- ==========================================================================
-- players: otro deporte y lesiones (booleano + detalle condicional)
-- ==========================================================================
alter table players
  add column practices_other_sport boolean not null default false,
  add column other_sport_detail text,
  add column has_injuries boolean not null default false,
  add column injuries_detail text;

-- ==========================================================================
-- Storage: bucket para fotos de jugador. photo_url sigue siendo la columna
-- que guarda la URL pública; antes se pegaba un link externo a mano, ahora
-- se sube desde la galería/cámara del dispositivo.
-- Convención de path: player-photos/{team_id}/{uuid}.jpg — se valida
-- ownership por team_id (no por player_id) porque al dar de alta un
-- jugador nuevo todavía no existe su fila en `players`.
-- ==========================================================================
insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do nothing;

create policy "coach uploads photos of own team"
  on storage.objects for insert
  with check (
    bucket_id = 'player-photos'
    and (storage.foldername(name))[1] in (
      select id::text from teams where coach_id = auth.uid()
    )
  );

create policy "coach updates photos of own team"
  on storage.objects for update
  using (
    bucket_id = 'player-photos'
    and (storage.foldername(name))[1] in (
      select id::text from teams where coach_id = auth.uid()
    )
  );

create policy "coach deletes photos of own team"
  on storage.objects for delete
  using (
    bucket_id = 'player-photos'
    and (storage.foldername(name))[1] in (
      select id::text from teams where coach_id = auth.uid()
    )
  );

create policy "anyone reads player photos"
  on storage.objects for select
  using (bucket_id = 'player-photos');
