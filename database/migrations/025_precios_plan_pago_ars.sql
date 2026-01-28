-- ============================================
-- Precios del Plan Pago en Pesos Argentinos (ARS)
-- Adminis Go - Actualización de montos para cobro en ARS
-- ============================================
-- Mensual = $25.000,00 (veinticinco mil pesos)
-- Anual   = $250.000,00 (doscientos cincuenta mil pesos)
-- ============================================

UPDATE planes SET
    precio_mensual = 25000.00,
    precio_anual = 250000.00,
    descripcion = 'Plan Pago - 1 usuario principal + 10 usuarios adicionales. Registros ilimitados.'
WHERE nombre = 'basico';
