-- Opcional: borrar solo el intento de import que usaba codigo_interno = id numérico (1, 2, … 100, …)
-- y dejó la tabla a medias. NO borra filas con codigo_interno tipo mig-123.
--
-- Revisá antes:
-- SELECT id, codigo_interno, nombre FROM public.productos WHERE comercio_id = 4 ORDER BY id;

-- DELETE FROM public.productos
-- WHERE comercio_id = 4
--   AND codigo_interno IS NOT NULL
--   AND codigo_interno ~ '^[0-9]+$';
