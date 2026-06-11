-- Configuración de impresoras térmicas por comercio (JSON)
ALTER TABLE public.configuracion_comercio
  ADD COLUMN IF NOT EXISTS config_impresoras JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.configuracion_comercio.config_impresoras IS
  'Opciones de ticket POS: ancho (pos58|pos80), toggles de secciones, tipo y peso de fuente.';
