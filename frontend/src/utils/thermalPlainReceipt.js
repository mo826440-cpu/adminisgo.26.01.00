/**
 * Tickets POS en texto plano (monoespacio) para drivers que degradan HTML/tablas.
 */

export const DEFAULT_THERMAL_COLS = 42

/** Compatibilidad con importaciones antiguas. */
export const DEFAULT_VENTA_TICKET_COLS = DEFAULT_THERMAL_COLS

/** Guiones ~5 caracteres más cortos que cols para no pasarse del ancho del rollo. */
export function thermalDash(cols = DEFAULT_THERMAL_COLS) {
  return '-'.repeat(Math.max(26, cols - 5))
}

/**
 * Centra en una línea de ancho cols (relleno solo a la izquierda).
 */
export function thermalCenterLine(text, cols = DEFAULT_THERMAL_COLS) {
  const t = String(text ?? '').trim()
  if (!t.length) return ''
  const clipped = t.length > cols ? `${t.slice(0, Math.max(1, cols - 3))}...` : t
  const pad = Math.floor((cols - clipped.length) / 2)
  return `${' '.repeat(Math.max(0, pad))}${clipped}`
}

function wrapGreedyChars(text, maxLen) {
  const t = String(text).trim()
  if (!t.length) return []
  if (maxLen <= 12) return [t.slice(0, Math.max(maxLen, 12))]
  const words = t.replace(/\s+/g, ' ').split(/\s+/)
  const lines = []
  let row = ''

  words.forEach((w) => {
    if (!row.length) {
      row = w
      return
    }
    if (`${row} ${w}`.length <= maxLen) row += ` ${w}`
    else {
      lines.push(row)
      row = w.length > maxLen ? w.slice(0, maxLen) : w
    }
  })

  while (row.length > maxLen) {
    lines.push(row.slice(0, maxLen))
    row = row.slice(maxLen)
  }
  if (row.length) lines.push(row)
  return lines.length ? lines : [t]
}

export function thermalCenterParagraph(text, cols = DEFAULT_THERMAL_COLS) {
  return wrapGreedyChars(String(text ?? '').trim(), cols).map((ln) => thermalCenterLine(ln, cols))
}

export function thermalDetailLine(leftWithoutAmount, amountStr, cols = DEFAULT_THERMAL_COLS) {
  const L = leftWithoutAmount.trimEnd()
  const R = String(amountStr)
  const gap = cols - L.length - R.length
  if (gap >= 1) return `${L}${' '.repeat(gap)}${R}`
  return `${L}\n${R.padStart(cols)}`
}

export function plainLabelLines(label, value, cols = DEFAULT_THERMAL_COLS) {
  const v = String(value ?? '')
  const pref = `${String(label ?? '').trim()}: `
  const merged = `${pref}${v}`
  if (merged.length <= cols) return [merged]
  const out = [`${String(label ?? '').trim()}:`]
  wrapGreedyChars(v.trim(), Math.max(cols - 2, 12)).forEach((line) => out.push(`  ${line}`))
  return out
}

/** Pie legal unificado (igual que ventas rápidas). */
export function thermalFooterStandard(cols = DEFAULT_THERMAL_COLS, { email = null } = {}) {
  const lines = []
  lines.push('')
  lines.push(...thermalCenterParagraph('¡Gracias por su compra!', cols))
  if (email) {
    lines.push('')
    lines.push(...thermalCenterParagraph(email, cols))
  }
  lines.push('')
  lines.push(...thermalCenterParagraph('Este ticket no es una factura ni tiene validez fiscal.', cols))
  lines.push('')
  lines.push(...thermalCenterParagraph('Solo es un comprobante de venta.', cols))
  lines.push('')
  lines.push(...thermalCenterParagraph('Conserve este ticket.', cols))
  lines.push('')
  return lines
}

function pushCenteredNombreComercio(lines, comercio, cols) {
  const nome = String(comercio?.nombre || 'Comercio').trim().toUpperCase()
  wrapGreedyChars(nome, cols).forEach((ln) => lines.push(thermalCenterLine(ln, cols)))
}

function pushDatosComercio(lines, comercio, cols = DEFAULT_THERMAL_COLS) {
  let any = false
  if (comercio?.direccion) {
    wrapGreedyChars(comercio.direccion, cols).forEach((ln) => {
      lines.push(ln)
    })
    any = true
  }
  if (comercio?.telefono) {
    lines.push(`Tel: ${comercio.telefono}`)
    any = true
  }
  if (comercio?.cuit_rut) {
    lines.push(`CUIT: ${comercio.cuit_rut}`)
    any = true
  }
  if (any) lines.push('')
}

export function buildVentaThermalPlainText({
  venta,
  comercio,
  formatearMoneda,
  formatearFechaHoraTicket,
  cols = DEFAULT_THERMAL_COLS
}) {
  if (!venta) return ''

  const lines = []
  lines.push('')
  pushCenteredNombreComercio(lines, comercio, cols)
  lines.push(thermalDash(cols))
  pushDatosComercio(lines, comercio, cols)

  lines.push(...plainLabelLines('Ticket N°', venta.numero_ticket || '-', cols))
  lines.push(...plainLabelLines('Fecha', formatearFechaHoraTicket(venta.fecha_hora), cols))
  if (venta.facturacion) lines.push(...plainLabelLines('Factura', venta.facturacion, cols))
  if (venta.clientes?.nombre) lines.push(...plainLabelLines('Cliente', venta.clientes.nombre, cols))
  lines.push('')

  ;(venta.items || []).forEach((it) => {
    wrapGreedyChars(String(it.productos?.nombre || '-'), cols).forEach((ln) => lines.push(ln))
    let detalle = `${it.cantidad} x ${formatearMoneda(it.precio_unitario)}`
    if ((it.descuento || 0) > 0) detalle += ` -${Number(it.descuento)}%`
    lines.push(thermalDetailLine(detalle, formatearMoneda(it.subtotal), cols))
    lines.push('')
  })

  lines.push(...plainLabelLines('Subtotal', formatearMoneda(venta.subtotal ?? venta.total), cols))

  if (Number(venta.monto_deuda) > 0) {
    lines.push(...plainLabelLines('Pagado', formatearMoneda(venta.monto_pagado), cols))
    lines.push(...plainLabelLines('Saldo', formatearMoneda(venta.monto_deuda), cols))
  }

  lines.push(...plainLabelLines('TOTAL', formatearMoneda(venta.total), cols))

  if ((venta.pagos || []).length > 0) {
    lines.push('')
    lines.push('Formas de Pago:')
    ;(venta.pagos || []).forEach((p) => {
      lines.push(
        thermalDetailLine(
          String(p.metodo_pago || '').trimEnd(),
          formatearMoneda(p.monto_pagado),
          cols
        )
      )
    })
  }

  lines.push(...thermalFooterStandard(cols, { email: comercio?.email }))
  return lines.join('\n')
}

export function buildVentaRapidaThermalPlainText({
  ventaRapida,
  comercio,
  formatearMoneda,
  formatearFechaHoraTicket,
  cols = DEFAULT_THERMAL_COLS
}) {
  if (!ventaRapida) return ''

  const lines = []
  lines.push('')
  pushCenteredNombreComercio(lines, comercio, cols)
  lines.push(thermalDash(cols))
  pushDatosComercio(lines, comercio, cols)

  lines.push(...plainLabelLines('Boleto N°', ventaRapida.ventas?.numero_ticket || '-', cols))
  lines.push(...plainLabelLines('Fecha', formatearFechaHoraTicket(ventaRapida.fecha_hora), cols))
  if (ventaRapida.clientes?.nombre) {
    lines.push(...plainLabelLines('Cliente', ventaRapida.clientes.nombre, cols))
  }
  lines.push('')

  lines.push(
    thermalDetailLine('Total parcial:', formatearMoneda(ventaRapida.total), cols)
  )

  if (ventaRapida?.monto_pagado > 0) {
    lines.push(...plainLabelLines('Pagado', formatearMoneda(ventaRapida.monto_pagado), cols))
  }
  if (
    ventaRapida.estado === 'DEBE' &&
    ventaRapida.total - ventaRapida.monto_pagado > 0.01
  ) {
    lines.push(
      ...plainLabelLines(
        'Saldo',
        formatearMoneda(ventaRapida.total - ventaRapida.monto_pagado),
        cols
      )
    )
  }

  lines.push(thermalDetailLine('TOTAL:', formatearMoneda(ventaRapida.total), cols))

  if (ventaRapida.metodo_pago) {
    lines.push('')
    lines.push('Formas de Pago:')
    lines.push(
      thermalDetailLine(
        String(ventaRapida.metodo_pago).trimEnd(),
        formatearMoneda(ventaRapida.monto_pagado),
        cols
      )
    )
  }

  lines.push(...thermalFooterStandard(cols, { email: comercio?.email }))
  return lines.join('\n')
}

export function buildCompraThermalPlainText({
  compra,
  comercio,
  formatearMoneda,
  formatearFechaHoraTicket,
  estadoTexto,
  cols = DEFAULT_THERMAL_COLS
}) {
  if (!compra) return ''

  const lines = []
  lines.push('')
  pushCenteredNombreComercio(lines, comercio, cols)
  lines.push(thermalDash(cols))
  pushDatosComercio(lines, comercio, cols)

  lines.push(...plainLabelLines('Orden N°', compra.numero_orden || '-', cols))
  lines.push(...plainLabelLines('Fecha', formatearFechaHoraTicket(compra.fecha_orden), cols))
  if (compra.proveedores?.nombre_razon_social) {
    lines.push(...plainLabelLines('Proveedor', compra.proveedores.nombre_razon_social, cols))
  }
  lines.push(...plainLabelLines('Estado', estadoTexto || '-', cols))
  lines.push('')

  ;(compra.items || []).forEach((it) => {
    wrapGreedyChars(String(it.productos?.nombre || '-'), cols).forEach((ln) => lines.push(ln))
    let detalle = `${it.cantidad_solicitada} x ${formatearMoneda(it.precio_unitario)}`
    if ((it.descuento || 0) > 0) detalle += ` -${Number(it.descuento)}%`
    if ((it.impuesto || 0) > 0) detalle += ` +${Number(it.impuesto)}%`
    lines.push(thermalDetailLine(detalle, formatearMoneda(it.subtotal), cols))
    lines.push('')
  })

  lines.push(...plainLabelLines('Subtotal Base', formatearMoneda(compra.subtotal), cols))

  if (compra.descuento > 0) {
    lines.push(...plainLabelLines('Descuentos', formatearMoneda(compra.descuento), cols))
  }
  if (compra.impuestos > 0) {
    lines.push(...plainLabelLines('Impuestos', formatearMoneda(compra.impuestos), cols))
  }
  if (compra.monto_pagado > 0) {
    lines.push(...plainLabelLines('Pagado', formatearMoneda(compra.monto_pagado), cols))
  }
  if (compra.monto_deuda > 0) {
    lines.push(...plainLabelLines('Deuda', formatearMoneda(compra.monto_deuda), cols))
  }

  lines.push(thermalDetailLine('TOTAL:', formatearMoneda(compra.total), cols))

  if ((compra.pagos || []).length > 0) {
    lines.push('')
    lines.push('Formas de Pago:')
    ;(compra.pagos || []).forEach((p) => {
      lines.push(
        thermalDetailLine(String(p.metodo_pago || '').trimEnd(), formatearMoneda(p.monto_pagado), cols)
      )
    })
  }

  lines.push(...thermalFooterStandard(cols, { email: comercio?.email }))
  return lines.join('\n')
}

export function buildHistorialCajasThermalPlainText({
  historial,
  fechaDesde,
  fechaHasta,
  totales,
  comercio,
  formatearMoneda,
  formatearFechaHora,
  cols = DEFAULT_THERMAL_COLS
}) {
  const list = historial || []
  if (!list.length) return ''

  const lines = []
  lines.push('')
  pushCenteredNombreComercio(lines, comercio, cols)
  lines.push(thermalDash(cols))
  pushDatosComercio(lines, comercio, cols)

  lines.push(...thermalCenterParagraph('Historial de Cajas', cols))
  lines.push('')
  if (fechaDesde) lines.push(...plainLabelLines('Desde', formatearFechaHora(fechaDesde), cols))
  if (fechaHasta) lines.push(...plainLabelLines('Hasta', formatearFechaHora(fechaHasta), cols))
  if (fechaDesde || fechaHasta) lines.push('')

  list.forEach((registro) => {
    const tipoTxt = registro.tipo_operacion === 'apertura' ? 'Apertura' : 'Cierre'
    const headline = `${tipoTxt} - ${registro.usuarios?.nombre || '-'}`
    wrapGreedyChars(headline, cols).forEach((ln) => lines.push(ln))
    lines.push(thermalDetailLine(formatearFechaHora(registro.fecha_hora), formatearMoneda(registro.importe), cols))
    lines.push('')
  })

  lines.push(thermalDetailLine('Total Aperturas:', formatearMoneda(totales?.totalAperturas ?? 0), cols))
  lines.push(thermalDetailLine('Total Cierres:', formatearMoneda(totales?.totalCierres ?? 0), cols))
  lines.push(
    thermalDetailLine('Diferencia:', formatearMoneda(totales?.diferencia ?? 0), cols)
  )

  lines.push(...thermalFooterStandard(cols, { email: comercio?.email }))
  return lines.join('\n')
}
