-- Newcom Manager — Bloque 4: vista cuadrícula, tipos de torneo, estado de
-- inscripción, modalidad de tarifa. Ligas = torneos con type='liga' cuyas
-- jornadas son las matches ya vinculadas por tournament_id (sin tablas nuevas).
-- Correr después de 0006_tournament_flyer_whatsapp.sql.

alter table tournaments
  add column type text not null default 'encuentro' check (type in ('amistoso', 'encuentro', 'liga')),
  add column registration_status text not null default 'pendiente'
    check (registration_status in ('pendiente', 'inscripto', 'confirmado')),
  add column fee_mode text check (fee_mode in ('individual', 'equipo'));
