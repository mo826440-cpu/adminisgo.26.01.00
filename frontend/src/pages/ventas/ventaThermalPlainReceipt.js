/**
 * Ticket de venta en texto plano (monoespacio) para impresoras POS que degradan HTML a texto.
 */

export const DEFAULT_VENTA_TICKET_COLS = 42

function dashedLine (cols) {
  return '-'.repeat(Math.min(Math.max(cols, 28), 48))
}

/**
 * Dos columnas sobre una línea: texto izquierda + hueco + importe a la derecha.
 */
export function thermalDetailLine (leftWithoutAmount, amountStr, cols) {
  const L = leftWithoutAmount.trimEnd()
  const R = String(amountStr)
  const gap = cols - L.length - R.length
  if (gap >= 1) return `${L}${' '.repeat(gap)}${R}`
  return `${L}\n${R.padStart(cols)}`
}

/**
 * Etiqueta y valor ("Etiqueta: valor"). Si supera cols, segunda línea con indentación.
 */
export function plainLabelLines (label, value, cols) {
  const v = String(value ?? '')
  const pref = `${String(label ?? '').trim()}: `
  const merged = `${pref}${v}`
  if (merged.length <= cols) return [merged]
  const out = [`${String(label ?? '').trim()}:`]
  wrapGreedyChars(v.trim(), Math.max(cols - 2, 12)).forEach((line) =>
    out.push(`  ${line}`)
  )
  return out
}

/** Word-wrap suave dentro de máximo ancho caracteres */
function wrapGreedyChars (text, maxLen) {
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
  return lines
}

export function buildVentaThermalPlainText ({
  venta,
  comercio,
  formatearMoneda,
  formatearFechaHoraTicket,
  cols = DEFAULT_VENTA_TICKET_COLS
}) {
  if (!venta) return ''

  const lines = []

  lines.push('')
  const nome = String(comercio?.nombre || 'Comercio').trim().toUpperCase()
  if (nome.length <= cols - 8) lines.push(`${' '.repeat(Math.max(0, Math.floor((cols - nome.length) / 2)))}${nome}`)
  else lines.push(...wrapGreedyChars(nome, cols))

  lines.push(dashedLine(cols))

  if (comercio?.direccion) lines.push(comercio.direccion)
  if (comercio?.telefono) lines.push(`Tel: ${comercio.telefono}`)
  if (comercio?.cuit_rut) lines.push(`CUIT: ${comercio.cuit_rut}`)
  if (comercio?.direccion || comercio?.telefono || comercio?.cuit_rut) lines.push('')

  lines.push(...plainLabelLines('Ticket N°', venta.numero_ticket || '-', cols))
  lines.push(...plainLabelLines('Fecha', formatearFechaHoraTicket(venta.fecha_hora), cols))
  if (venta.facturacion) lines.push(...plainLabelLines('Factura', venta.facturacion, cols))
  if (venta.clientes?.nombre) lines.push(...plainLabelLines('Cliente', venta.clientes.nombre, cols))

  lines.push(dashedLine(cols))

  ;(venta.items || []).forEach((it) => {
    lines.push(...wrapGreedyChars(String(it.productos?.nombre || '-'), cols))
    let detalle = `${it.cantidad} x ${formatearMoneda(it.precio_unitario)}`
    if ((it.descuento || 0) > 0) detalle += ` -${Number(it.descuento)}%`
    lines.push(thermalDetailLine(detalle, formatearMoneda(it.subtotal), cols))
    lines.push('')
  })

  lines.push(dashedLine(cols))

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

  lines.push('')
  lines.push(dashedLine(cols))
  lines.push('')
  lines.push('¡Gracias por su compra!')
  if (comercio?.email) lines.push(comercio.email)
  lines.push('')
  lines.push('Conserve este ticket')
  lines.push('')

  return lines.join('\n')
}
