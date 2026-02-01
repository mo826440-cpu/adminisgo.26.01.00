-- Permitir que cualquier persona (incluso no autenticada) pueda leer
-- la versión activa de términos y condiciones y de política de privacidad.
-- Necesario para mostrar /terminos y /privacidad en la landing sin login.

-- Términos y condiciones: lectura pública de la versión activa
CREATE POLICY "Public can view active terminos"
    ON terminos_condiciones FOR SELECT
    USING (activo = TRUE);

-- Política de privacidad: lectura pública de la versión activa
CREATE POLICY "Public can view active politica_privacidad"
    ON politica_privacidad FOR SELECT
    USING (activo = TRUE);
