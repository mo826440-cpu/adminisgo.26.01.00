/**
 * Tickets POS en texto plano (monoespacio) para drivers que degradan HTML/tablas.
 */

export const DEFAULT_THERMAL_COLS = 42

/** Compatibilidad con importaciones antiguas. */
export const DEFAULT_VENTA_TICKET_COLS = DEFAULT_THERMAL_COLS

/** Línea divisoria de exactamente `cols` caracteres (mismo ancho que filas e importes). */
export function thermalDash(cols = DEFAULT_THERMAL_COLS) {
  const n = Math.max(1, cols)
  return '-'.repeat(n)
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

/**
 * Igual que wrapGreedyChars, pero une la última línea con la anterior si queda
 * muy corta (evita "tiene" solo en una línea, etc.).
 */
function wrapGreedyMergeOrphans(text, maxLen, minTail = 10) {
  const lines = [...wrapGreedyChars(text, maxLen)]
  while (lines.length >= 2) {
    const last = lines[lines.length - 1]
    if (last.length >= minTail) break
    const prev = lines[lines.length - 2]
    const merged = `${prev} ${last}`.replace(/\s+/g, ' ').trim()
    if (merged.length <= maxLen) {
      lines[lines.length - 2] = merged
      lines.pop()
    } else break
  }
  return lines
}

/** Celda alineada a la izquierda (relleno a la derecha), ancho fijo. */
function thermalCellRpad(text, w) {
  const t = String(text ?? '')
  const c = t.length > w ? t.slice(0, w) : t
  return c + ' '.repeat(Math.max(0, w - c.length))
}

/** Celda alineada a la derecha (relleno a la izquierda), ancho fijo. */
function thermalCellLpad(text, w) {
  const t = String(text ?? '')
  const c = t.length > w ? t.slice(0, w) : t
  return ' '.repeat(Math.max(0, w - c.length)) + c
}

/** Anchos columnas ítems venta: PROD. + UN. + $UN. + $TOT. = cols */
function ventaItemsColumnWidths(cols = DEFAULT_THERMAL_COLS) {
  if (cols >= 42) {
    return { wP: 17, wQ: 4, wU: 11, wT: 10 }
  }
  const wQ = Math.min(8, Math.max(5, Math.floor(cols * 0.22)))
  const wU = Math.max(7, Math.floor((cols - wQ) * 0.34))
  const wT = Math.max(7, Math.floor((cols - wQ) * 0.34))
  const wP = Math.max(8, cols - wQ - wU - wT)
  return { wP, wQ, wU, wT }
}

export function thermalCenterParagraph(text, cols = DEFAULT_THERMAL_COLS) {
  return wrapGreedyChars(String(text ?? '').trim(), cols).map((ln) => thermalCenterLine(ln, cols))
}

export function thermalDetailLine(leftWithoutAmount, amountStr, cols = DEFAULT_THERMAL_COLS) {
  const R = String(amountStr ?? '').trim()
  let L = String(leftWithoutAmount ?? '').trimEnd()
  if (R.length > cols) {
    return R.slice(0, cols)
  }
  const maxLeft = cols - R.length - 1
  if (L.length > maxLeft) {
    if (maxLeft < 1) return R.padStart(cols)
    L = L.slice(0, maxLeft)
  }
  const gap = cols - L.length - R.length
  return `${L}${' '.repeat(Math.max(0, gap))}${R}`
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
  lines.push(...thermalCenterParagraph('¡GRACIAS POR SU COMPRA!', cols))
  if (email) {
    lines.push('')
    lines.push(...thermalCenterParagraph(email, cols))
  }
  lines.push('')
  lines.push(
    ...wrapGreedyMergeOrphans('Este ticket no es una factura, ni tiene validez fiscal.', cols).map((ln) =>
      thermalCenterLine(ln, cols)
    )
  )
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

  const { wP, wQ, wU, wT } = ventaItemsColumnWidths(cols)
  const lines = []
  lines.push('')
  pushCenteredNombreComercio(lines, comercio, cols)
  lines.push(thermalDash(cols))
  pushDatosComercio(lines, comercio, cols)

  lines.push(...plainLabelLines('Boleto N°', venta.numero_ticket || '-', cols))
  lines.push(...plainLabelLines('Fecha', formatearFechaHoraTicket(venta.fecha_hora), cols))
  if (venta.facturacion) lines.push(...plainLabelLines('Factura', venta.facturacion, cols))
  if (venta.clientes?.nombre) lines.push(...plainLabelLines('Cliente', venta.clientes.nombre, cols))
  lines.push('')
  lines.push(thermalDash(cols))

  lines.push(
    thermalCellRpad('PROD.', wP) +
      thermalCellLpad('UN.', wQ) +
      thermalCellLpad('$UN.', wU) +
      thermalCellLpad('$TOT.', wT)
  )
  lines.push(thermalDash(cols))

  ;(venta.items || []).forEach((it) => {
    let nameBase = String(it.productos?.nombre || '-').trim()
    if ((it.descuento || 0) > 0) nameBase += ` (-${Number(it.descuento)}%)`
    const wrapLines = nameBase.length ? wrapGreedyChars(nameBase, wP) : ['-']
    const unitStr = formatearMoneda(it.precio_unitario)
    const totStr = formatearMoneda(it.subtotal)
    const qtyStr = String(it.cantidad ?? '')
    wrapLines.forEach((nameLine, lineIdx) => {
      if (lineIdx === 0) {
        lines.push(
          thermalCellRpad(nameLine, wP) +
            thermalCellLpad(qtyStr, wQ) +
            thermalCellLpad(unitStr, wU) +
            thermalCellLpad(totStr, wT)
        )
      } else {
        lines.push(thermalCellRpad(nameLine, wP) + ' '.repeat(wQ + wU + wT))
      }
    })
  })

  if (!(venta.items || []).length) {
    lines.push(thermalCellRpad('Sin ítems', wP))
  }

  lines.push(thermalDash(cols))
  lines.push(thermalDetailLine('TOTAL VENTA', formatearMoneda(venta.total), cols))

  if ((venta.pagos || []).length > 0) {
    lines.push('')
    lines.push('')
    lines.push(thermalDetailLine('FORMA PAGO', '', cols))
    lines.push(thermalDash(cols))
    ;(venta.pagos || []).forEach((p) => {
      lines.push(
        thermalDetailLine(
          String(p.metodo_pago || '').trimEnd(),
          formatearMoneda(p.monto_pagado),
          cols
        )
      )
    })
    lines.push(thermalDash(cols))
  }

  lines.push(thermalDetailLine('TOTAL PAGADO', formatearMoneda(venta.monto_pagado ?? 0), cols))
  if (Number(venta.monto_deuda) > 0.01) {
    lines.push(thermalDetailLine('TOTAL DEUDA', formatearMoneda(venta.monto_deuda), cols))
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

  const venta = {
    numero_ticket: ventaRapida.numero_ticket ?? ventaRapida.ventas?.numero_ticket,
    fecha_hora: ventaRapida.fecha_hora,
    facturacion: ventaRapida.facturacion ?? null,
    clientes: ventaRapida.clientes,
    total: ventaRapida.total,
    subtotal: ventaRapida.subtotal ?? ventaRapida.total,
    monto_pagado: ventaRapida.monto_pagado,
    monto_deuda:
      ventaRapida.monto_deuda ??
      ventaRapida.ventas?.monto_deuda ??
      Math.max(0, Number(ventaRapida.total || 0) - Number(ventaRapida.monto_pagado || 0)),
    items: ventaRapida.items || [],
    pagos: ventaRapida.pagos || [],
  }

  const base = buildVentaThermalPlainText({
    venta,
    comercio,
    formatearMoneda,
    formatearFechaHoraTicket,
    cols,
  })

  // Bloque de firmas al pie (solo en tickets de venta rápida).
  // Se inserta después de la línea "Conserve este ticket.".
  const lines = String(base || '').split('\n')
  const idx = lines.findIndex((ln) => String(ln || '').includes('Conserve este ticket.'))
  const insertAt = idx >= 0 ? idx + 1 : lines.length
  const firmaBlock = [
    '',
    '',
    '',
    '',
    '',
    '______________________________',
    'Firma Cliente',
    '',
    '',
    '',
    '',
    '',
    '______________________________',
    'Firma Representante',
    '',
    '',
    '',
    '',
    '',
  ]
  lines.splice(insertAt, 0, ...firmaBlock)
  return lines.join('\n')
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Convierte un ticket en texto plano (con saltos de línea) a HTML seguro para renderizar dentro de <pre>.
 * Permite poner ciertas líneas en negrita (envolviendo la línea completa en <strong>).
 */
export function thermalPlainTextToHtml(
  plainText,
  { boldLinePrefixes = [], boldFirstNonEmptyLine = false } = {}
) {
  const prefixes = Array.isArray(boldLinePrefixes) ? boldLinePrefixes.filter(Boolean) : []
  const lines = String(plainText ?? '').split('\n')
  let firstBoldDone = false
  return lines
    .map((ln) => {
      const raw = String(ln ?? '')
      const trimmed = raw.trim()
      const trimmedStart = raw.trimStart()
      const boldByPrefix = prefixes.some((p) => trimmedStart.startsWith(p))
      const boldByFirst =
        Boolean(boldFirstNonEmptyLine) && !firstBoldDone && trimmed.length > 0
      const safe = escapeHtml(raw)
      const isBold = boldByPrefix || boldByFirst
      if (boldByFirst) firstBoldDone = true
      return isBold ? `<strong>${safe}</strong>` : safe
    })
    .join('\n')
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
