-- Newcom Manager — Bloque 2: flyer de torneo + mensaje de WhatsApp editable.
-- Correr después de 0005_rutinas_progresion.sql.

alter table tournaments
  add column flyer_url text,
  add column whatsapp_message text;

-- ==========================================================================
-- Storage: bucket para flyers de torneo. Mismo criterio que player-photos:
-- ownership por team_id en el path (un torneo nuevo puede no tener id
-- todavía al momento de subir el flyer).
-- ==========================================================================
insert into storage.buckets (id, name, public)
values ('tournament-flyers', 'tournament-flyers', true)
on conflict (id) do nothing;

create policy "coach uploads flyers of own team"
  on storage.objects for insert
  with check (
    bucket_id = 'tournament-flyers'
    and (storage.foldername(name))[1] in (
      select id::text from teams where coach_id = auth.uid()
    )
  );

create policy "coach updates flyers of own team"
  on storage.objects for update
  using (
    bucket_id = 'tournament-flyers'
    and (storage.foldername(name))[1] in (
      select id::text from teams where coach_id = auth.uid()
    )
  );

create policy "coach deletes flyers of own team"
  on storage.objects for delete
  using (
    bucket_id = 'tournament-flyers'
    and (storage.foldername(name))[1] in (
      select id::text from teams where coach_id = auth.uid()
    )
  );

create policy "anyone reads tournament flyers"
  on storage.objects for select
  using (bucket_id = 'tournament-flyers');
