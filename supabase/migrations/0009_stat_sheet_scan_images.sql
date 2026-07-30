-- Newcom Manager — Estadísticas (Bloque 3/4): corrección de esquema.
-- El Bloque 1 asumía una sola imagen por planilla (`match_stat_sheets`), pero
-- el diseño de planilla del Bloque 2 es un cuadernillo de una página POR
-- JUGADOR — cada jugador tiene su propia foto escaneada, no hay "una imagen
-- de la planilla" a nivel de partido. Se mueve el campo de auditoría de
-- imagen a `player_match_stats`, que es donde corresponde 1 a 1.
-- Correr después de 0008_match_stats.sql.

alter table match_stat_sheets
  drop column scanned_image_url,
  drop column scanned_at;

alter table player_match_stats
  add column scanned_image_url text,
  add column scanned_at timestamptz;
