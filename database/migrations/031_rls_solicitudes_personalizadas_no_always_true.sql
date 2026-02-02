-- ============================================
-- RLS solicitudes_personalizadas: quitar política "always true"
-- ============================================
-- El Security Advisor marca "RLS Policy Always True" en solicitudes_personalizadas
-- porque la política INSERT usaba WITH CHECK (true). Se reemplaza por una condición
-- que exige datos mínimos (nombre, email, mensaje no vacíos) sin cambiar el flujo:
-- cualquier usuario o anónimo puede crear una solicitud con esos campos válidos.

DROP POLICY IF EXISTS "Anyone can create solicitudes" ON solicitudes_personalizadas;

CREATE POLICY "Anyone can create solicitudes"
  ON solicitudes_personalizadas FOR INSERT
  WITH CHECK (
    nombre IS NOT NULL AND trim(nombre) <> ''
    AND email IS NOT NULL AND trim(email) <> ''
    AND mensaje IS NOT NULL AND trim(mensaje) <> ''
  );
