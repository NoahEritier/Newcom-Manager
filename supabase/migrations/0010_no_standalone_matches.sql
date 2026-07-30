-- Newcom Manager — elimina el concepto de "partido suelto". Todo partido
-- pasa a pertenecer siempre a un torneo/liga/amistoso (tournaments), aunque
-- ese evento contenga un solo partido. Correr después de 0009.
--
-- Nota: solo había datos de prueba en `matches` con tournament_id null, así
-- que se borran directamente en vez de envolverlos en torneos autogenerados.

delete from matches where tournament_id is null;

alter table matches
  alter column tournament_id set not null;

-- Corrige torneos de prueba cargados con el bug de DateField (fechas
-- invertidas por el parseo UTC) antes de poder validar el constraint de abajo.
update tournaments
set start_date = end_date, end_date = start_date
where end_date is not null and end_date < start_date;

-- Valida a nivel de base que el rango de fechas de un torneo no quede
-- invertido (además de la validación en el formulario).
alter table tournaments
  add constraint tournaments_end_date_after_start
    check (end_date is null or end_date >= start_date);
