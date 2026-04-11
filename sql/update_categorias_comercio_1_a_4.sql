-- Ejecutar en Supabase → SQL Editor
-- Mueve solo las categorías importadas (id 14–33) de comercio_id 1 a 4.
--
-- Requisito: debe existir public.comercios.id = 4.

-- Verificación previa
SELECT id, nombre, comercio_id
FROM public.categorias
WHERE id BETWEEN 14 AND 33
ORDER BY id;

-- Actualización acotada
UPDATE public.categorias
SET comercio_id = 4,
    updated_at = now()
WHERE id BETWEEN 14 AND 33
  AND comercio_id = 1;

-- Comprobar resultado (comercio_id debería ser 4)
SELECT id, nombre, comercio_id
FROM public.categorias
WHERE id BETWEEN 14 AND 33
ORDER BY id;
