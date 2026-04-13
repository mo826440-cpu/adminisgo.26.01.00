-- =============================================================================
-- 035: Eliminar tabla ventas_rapidas
-- =============================================================================
-- La app ya no usa esta tabla. CASCADE elimina triggers, índices y políticas RLS asociadas a la tabla.
--
-- Ejecutar en Supabase SOLO después de desplegar el frontend (y la edge de borrado de cuenta).
-- Pasos: Guias_Inicio/PASOS_ELIMINAR_TABLA_VENTAS_RAPIDAS.md
-- =============================================================================

DROP TABLE IF EXISTS ventas_rapidas CASCADE;

-- Función usada solo por el trigger de inserción de ventas_rapidas (la tabla ya no existe).
DROP FUNCTION IF EXISTS set_ventas_rapidas_comercio_id();
