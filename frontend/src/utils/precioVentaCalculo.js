/** Parsea texto numérico simple (1500, 1500,50 o 1500.50). */
export function parsePrecioPlainInput(str) {
  const normalized = String(str ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(',', '.')
  if (!normalized) return NaN
  const num = parseFloat(normalized)
  return Number.isFinite(num) ? num : NaN
}

/** Parsea porcentaje (10, 10,5 o 10%). */
export function parsePorcentajeInput(str) {
  const normalized = String(str ?? '')
    .trim()
    .replace(/%/g, '')
    .replace(/\s/g, '')
    .replace(',', '.')
  if (!normalized) return NaN
  const num = parseFloat(normalized)
  return Number.isFinite(num) ? num : NaN
}

/** Precio venta = precio compra + (precio compra × % suma / 100). */
export function calcularPrecioVentaDesdeMargen(precioCompra, porcentajeSuma) {
  const compra = Number(precioCompra)
  const pct = Number(porcentajeSuma)
  if (!Number.isFinite(compra) || compra < 0) return NaN
  if (!Number.isFinite(pct)) return NaN
  return Number((compra * (1 + pct / 100)).toFixed(2))
}

/** Infiere % margen a partir de compra y venta existentes. */
export function inferirPorcentajeMargen(precioCompra, precioVenta) {
  const compra = Number(precioCompra)
  const venta = Number(precioVenta)
  if (!Number.isFinite(compra) || compra <= 0 || !Number.isFinite(venta) || venta < 0) return ''
  const pct = (venta / compra - 1) * 100
  if (!Number.isFinite(pct)) return ''
  return String(Number(pct.toFixed(2)))
}

export function precioCompraToInput(val) {
  const num = Number(val)
  if (!Number.isFinite(num) || num <= 0) return ''
  return String(num)
}
