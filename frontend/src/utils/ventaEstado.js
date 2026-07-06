/** Estado de venta cancelada (no impacta stock ni reportes financieros). */
export const VENTA_ESTADO_CANCELADA = 'cancelada'

export function ventaEstaCancelada(venta) {
  return String(venta?.estado || '').toLowerCase() === VENTA_ESTADO_CANCELADA
}

/** Ventas que deben contarse en balances, deudas y stock. */
export function ventaAfectaCalculos(venta) {
  if (!venta || venta.deleted_at) return false
  return !ventaEstaCancelada(venta)
}

/** pendiente | pagado | cancelado */
export function getVentaEstadoDisplay(venta) {
  if (ventaEstaCancelada(venta)) return 'cancelado'
  const total = parseFloat(venta?.total || 0)
  const pagado = parseFloat(venta?.monto_pagado || 0)
  return total - pagado > 0.01 ? 'pendiente' : 'pagado'
}

/**
 * Estado de cobro para registros (ventas normales y ventas rápidas).
 * Ventas rápidas pueden persistir `DEBE`/`PAGADO` en BD; se normaliza a pendiente/pagado.
 */
export function getVentaEstadoDisplayRegistro(venta, opts = {}) {
  const modo = opts.modo === 'rapidas' ? 'rapidas' : 'ventas'
  if (modo === 'rapidas') {
    const e = String(venta?.estado || '').toUpperCase()
    if (e === 'PAGADO') return 'pagado'
    if (e === 'DEBE' || e === 'PENDIENTE') return 'pendiente'
  }
  return getVentaEstadoDisplay(venta)
}

export function getVentaEstadoLabel(estado) {
  switch (estado) {
    case 'cancelado':
      return 'Cancelado'
    case 'pendiente':
      return 'Pendiente'
    case 'pagado':
      return 'Pagado'
    default:
      return estado
  }
}

/** Etiqueta unificada para tablas de registros: PAGADO | PENDIENTE | CANCELADA */
export function getVentaEstadoLabelTabla(estado) {
  switch (estado) {
    case 'cancelado':
      return 'CANCELADA'
    case 'pendiente':
      return 'PENDIENTE'
    case 'pagado':
      return 'PAGADO'
    default:
      return String(estado || '').toUpperCase()
  }
}

export function getVentaEstadoBadgeVariant(estado) {
  switch (estado) {
    case 'cancelado':
      return 'warning'
    case 'pendiente':
      return 'danger'
    case 'pagado':
      return 'success'
    default:
      return 'secondary'
  }
}

/** Fecha de registro o última actualización (updated_at si hubo edición). */
export function getVentaFechaDisplay(venta) {
  if (!venta) return null
  const created = venta.created_at || venta.fecha_hora
  const updated = venta.updated_at
  if (updated && created) {
    const diff = new Date(updated).getTime() - new Date(created).getTime()
    if (diff > 2000) return updated
  }
  return venta.fecha_hora || created
}
