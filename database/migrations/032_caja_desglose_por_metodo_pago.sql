-- ============================================
-- Caja: desglose por método de pago
-- ============================================
-- Permite apertura/cierre con importes por tipo: efectivo, virtual (qr+transferencia+débito),
-- crédito y otros. Compatible con registros antiguos (importe total se considera efectivo si no hay desglose).

ALTER TABLE historial_cajas
  ADD COLUMN IF NOT EXISTS importe_efectivo DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS importe_virtual DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS importe_credito DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS importe_otros DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN historial_cajas.importe_efectivo IS 'Efectivo en apertura/cierre';
COMMENT ON COLUMN historial_cajas.importe_virtual IS 'QR + transferencia + débito';
COMMENT ON COLUMN historial_cajas.importe_credito IS 'Crédito';
COMMENT ON COLUMN historial_cajas.importe_otros IS 'Cheque, otro, etc.';
