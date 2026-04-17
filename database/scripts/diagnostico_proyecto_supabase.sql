-- =============================================================================
-- Diagnóstico rápido del proyecto (solo lectura) — Supabase SQL Editor
-- =============================================================================
-- Ejecutá el script completo y copiá/pega TODAS las tablas de resultados
-- (o exportá como CSV). Sirve para revisar existencia de tablas, RLS y permisos.
-- =============================================================================

-- 1) Versión de PostgreSQL
SELECT current_database() AS base_de_datos, version() AS version_postgresql;

-- 2) ¿Existen tablas clave del esquema public?
SELECT
  to_regclass('public.app_modulos') IS NOT NULL AS existe_app_modulos,
  to_regclass('public.comercio_rol_modulos') IS NOT NULL AS existe_comercio_rol_modulos,
  to_regclass('public.roles') IS NOT NULL AS existe_roles,
  to_regclass('public.usuarios') IS NOT NULL AS existe_usuarios,
  to_regclass('public.comercios') IS NOT NULL AS existe_comercios,
  to_regclass('public.ventas') IS NOT NULL AS existe_ventas,
  to_regclass('public.venta_items') IS NOT NULL AS existe_venta_items,
  to_regclass('public.venta_pagos') IS NOT NULL AS existe_venta_pagos,
  to_regclass('public.ventas_rapidas') IS NOT NULL AS existe_ventas_rapidas,
  to_regclass('public.historial_cajas') IS NOT NULL AS existe_historial_cajas,
  to_regclass('public.compras') IS NOT NULL AS existe_compras,
  to_regclass('public.compra_items') IS NOT NULL AS existe_compra_items,
  to_regclass('public.compra_pagos') IS NOT NULL AS existe_compra_pagos,
  to_regclass('public.otros_costos') IS NOT NULL AS existe_otros_costos,
  to_regclass('public.v_rentabilidad_mensual') IS NOT NULL AS existe_vista_rentabilidad_mensual;

-- 3) Tablas en public: RLS activado y filas aproximadas (reltuples; puede diferir del real)
SELECT
  c.relname AS tabla,
  c.relrowsecurity AS rls_habilitado,
  c.relforcerowsecurity AS rls_forzado,
  COALESCE(s.n_live_tup::bigint, 0) AS filas_estimadas_estadistica
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;

-- 4) Cantidad de políticas RLS por tabla (public)
SELECT tablename AS tabla, COUNT(*)::int AS cantidad_politicas
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 5) Políticas de tablas más usadas en informes / permisos (nombre y comando)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual IS NOT NULL AS tiene_using, with_check IS NOT NULL AS tiene_with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'ventas', 'venta_items', 'venta_pagos', 'compras', 'compra_items', 'compra_pagos',
    'usuarios', 'comercio_rol_modulos', 'app_modulos', 'otros_costos'
  )
ORDER BY tablename, policyname;

-- 6) Roles del catálogo (tabla roles)
SELECT id, nombre, descripcion
FROM public.roles
ORDER BY id;

-- 7) Módulos en catálogo (si existe la tabla)
SELECT id, codigo, nombre, orden
FROM public.app_modulos
ORDER BY orden, id;

-- 8) Matriz permisos: filas totales y por comercio (top 15 comercios por cantidad de filas)
SELECT COUNT(*)::bigint AS total_filas_comercio_rol_modulos
FROM public.comercio_rol_modulos;

SELECT comercio_id, COUNT(*)::int AS filas_matriz
FROM public.comercio_rol_modulos
GROUP BY comercio_id
ORDER BY filas_matriz DESC
LIMIT 15;

-- 9) Funciones útiles del proyecto de permisos / dueño (si existen)
SELECT p.proname AS funcion
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'usuario_tiene_permiso_modulo',
    'usuario_permiso_ventas_o_reportes',
    'usuario_permiso_compras_o_reportes',
    'usuario_es_dueno',
    'get_user_comercio_id',
    'es_admin_global'
  )
ORDER BY p.proname;

-- 10) Vista rentabilidad (definición corta: solo confirmar que existe y tipo)
SELECT c.relkind AS tipo_relacion, pg_get_viewdef(c.oid, true) AS definicion_vista
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'v_rentabilidad_mensual'
  AND c.relkind = 'v';

-- =============================================================================
-- Fin. Copiá todos los bloques de resultados y compartilos (o un export).
-- =============================================================================
