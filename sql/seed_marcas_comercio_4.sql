-- Ejecutar en Supabase → SQL Editor
-- Carga marcas desde el volcado gestion_kioscos (marcas.sql).
-- comercio_id = 4 (ajustá si hace falta).
--
-- Nota: en MySQL cada marca tenía idCategoria; public.marcas en Supabase no tiene esa columna,
-- así que esa relación no se migra aquí (suele ir en productos u otra tabla).

INSERT INTO public.marcas (comercio_id, nombre, descripcion, logo_url, activo)
VALUES
  (4, 'Marlboro', NULL, NULL, true),
  (4, 'Parliament', NULL, NULL, true),
  (4, 'Philip Morris', NULL, NULL, true),
  (4, 'Milenio', NULL, NULL, true),
  (4, 'Pier', NULL, NULL, true),
  (4, 'Liverpool', NULL, NULL, true),
  (4, 'Kiel', NULL, NULL, true),
  (4, 'Mil', NULL, NULL, true),
  (4, 'Master', NULL, NULL, true),
  (4, 'Red Point', NULL, NULL, true),
  (4, 'Golden', NULL, NULL, true),
  (4, 'Lucky Strike', NULL, NULL, true),
  (4, 'Chesterfield', NULL, NULL, true),
  (4, 'Chacabuco', NULL, NULL, true),
  (4, 'Las Perdices', NULL, NULL, true),
  (4, 'Perro Callejero', NULL, NULL, true),
  (4, 'Vi??as de Balbo', NULL, NULL, true),
  (4, 'Oveja Black', NULL, NULL, true),
  (4, 'Huelga de Amores', NULL, NULL, true),
  (4, 'Colón', NULL, NULL, true),
  (4, 'La Iride', NULL, NULL, true),
  (4, 'Chanchullo', NULL, NULL, true),
  (4, 'Conejo Negro', NULL, NULL, true),
  (4, 'Sin Palabras', NULL, NULL, true),
  (4, 'Portillo', NULL, NULL, true);
