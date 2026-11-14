-- Pagos de venta y de compra se pueden anular sin borrarlos.
-- El trigger deja de sumarlos en monto_pagado / monto_deuda.

ALTER TABLE public.venta_pagos
  ADD COLUMN IF NOT EXISTS anulado_at timestamptz;

ALTER TABLE public.compra_pagos
  ADD COLUMN IF NOT EXISTS anulado_at timestamptz;

CREATE OR REPLACE FUNCTION public.actualizar_montos_venta()
RETURNS TRIGGER AS $$
DECLARE
    v_total DECIMAL(10,2);
    v_pagado DECIMAL(10,2);
    v_venta_id integer;
BEGIN
    v_venta_id := COALESCE(NEW.venta_id, OLD.venta_id);

    SELECT total INTO v_total
    FROM public.ventas
    WHERE id = v_venta_id;

    SELECT COALESCE(SUM(monto_pagado), 0) INTO v_pagado
    FROM public.venta_pagos
    WHERE venta_id = v_venta_id
      AND anulado_at IS NULL;

    UPDATE public.ventas
    SET
        monto_pagado = v_pagado,
        monto_deuda = GREATEST(0, COALESCE(v_total, 0) - v_pagado),
        updated_at = NOW()
    WHERE id = v_venta_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.actualizar_montos_compra()
RETURNS TRIGGER AS $$
DECLARE
    v_total DECIMAL(10,2);
    v_pagado DECIMAL(10,2);
    v_compra_id integer;
BEGIN
    v_compra_id := COALESCE(NEW.compra_id, OLD.compra_id);

    SELECT total INTO v_total
    FROM public.compras
    WHERE id = v_compra_id;

    SELECT COALESCE(SUM(monto_pagado), 0) INTO v_pagado
    FROM public.compra_pagos
    WHERE compra_id = v_compra_id
      AND anulado_at IS NULL;

    UPDATE public.compras
    SET
        monto_pagado = v_pagado,
        monto_deuda = GREATEST(0, COALESCE(v_total, 0) - v_pagado),
        updated_at = NOW()
    WHERE id = v_compra_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
