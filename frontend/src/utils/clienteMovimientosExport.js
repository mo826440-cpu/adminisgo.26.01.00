import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatMoneyAR } from '../pages/reportes/reporteVentasUtils'
import { getVentaEstadoDisplay } from './ventaEstado'

function slugArchivo(nombre) {
  const base = String(nombre || 'cliente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 48)
  return base || 'cliente'
}

function formatFechaCorta(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return String(iso)
  }
}

function formatFechaSolo(fechaInput) {
  if (!fechaInput) return '—'
  try {
    const d = fechaInput instanceof Date ? fechaInput : new Date(`${fechaInput}T12:00:00`)
    return d.toLocaleDateString('es-AR')
  } catch {
    return String(fechaInput)
  }
}

/** Estado de cobro para exportes PDF, no el `estado` operativo de la venta en BD. */
function getVentaEstadoExportLabel(venta) {
  const key = getVentaEstadoDisplay(venta)
  if (key === 'cancelado') return 'Cancelada'
  if (key === 'pendiente') return 'Incompleta'
  return 'Completa'
}

/**
 * Filtra ventas para exportes de historial del cliente.
 * @param {Array<Record<string, unknown>>} ventasRaw
 * @param {{ tipo?: 'total'|'deudas', fechaDesde?: string, fechaHasta?: string }} [options]
 */
export function filterClienteMovimientosVentas(ventasRaw, options = {}) {
  const { tipo = 'total', fechaDesde, fechaHasta } = options
  let list = [...(ventasRaw || [])]

  if (tipo === 'deudas') {
    list = list.filter((v) => (parseFloat(v.monto_deuda) || 0) > 0.009)
  }

  if (fechaDesde) {
    const desde = new Date(`${fechaDesde}T00:00:00`)
    list = list.filter((v) => v.fecha_hora && new Date(v.fecha_hora) >= desde)
  }

  if (fechaHasta) {
    const hasta = new Date(`${fechaHasta}T23:59:59.999`)
    list = list.filter((v) => v.fecha_hora && new Date(v.fecha_hora) <= hasta)
  }

  return list
}

export function calcularTotalDeudaVentas(ventas) {
  return (ventas || []).reduce((sum, v) => sum + (parseFloat(v.monto_deuda) || 0), 0)
}

function getPeriodoExportLabel(fechaDesde, fechaHasta) {
  if (!fechaDesde && !fechaHasta) return 'Período: todo el historial'
  return `Período: ${formatFechaSolo(fechaDesde)} — ${formatFechaSolo(fechaHasta)}`
}

/**
 * PDF con jsPDF + autotable (misma familia que los informes del módulo Reportes).
 * @param {string} clienteNombre
 * @param {Array<Record<string, unknown>>} ventasRaw
 * @param {{ tipo?: 'total'|'deudas', fechaDesde?: string, fechaHasta?: string }} [options]
 */
export function downloadClienteMovimientosPdf(clienteNombre, ventasRaw, options = {}) {
  const { tipo = 'total', fechaDesde, fechaHasta } = options
  const lista = filterClienteMovimientosVentas(ventasRaw, { tipo, fechaDesde, fechaHasta })
  const totalDeuda = calcularTotalDeudaVentas(lista)
  const titulo =
    tipo === 'deudas' ? 'Historial de ventas con deuda' : 'Historial total de ventas'
  const vacioMsg =
    tipo === 'deudas'
      ? 'Sin ventas con deuda en el criterio seleccionado'
      : 'Sin ventas en el criterio seleccionado'

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(titulo, 14, 16)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Cliente: ${String(clienteNombre || '—')}`, 14, 23)
  doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 14, 28)
  doc.text(getPeriodoExportLabel(fechaDesde, fechaHasta), 14, 33)

  const head = [['Fecha', 'Ticket', 'Total', 'Pagado', 'Deuda', 'Estado']]
  const body =
    lista.length === 0
      ? [['—', vacioMsg, '', '', '', '']]
      : lista.map((v) => [
          formatFechaCorta(v.fecha_hora),
          String(v.numero_ticket ?? v.id),
          formatMoneyAR(v.total),
          formatMoneyAR(v.monto_pagado),
          formatMoneyAR(v.monto_deuda),
          getVentaEstadoExportLabel(v),
        ])

  autoTable(doc, {
    startY: 38,
    head,
    body,
    styles: { fontSize: 7, cellPadding: 1.2 },
    headStyles: { fillColor: [22, 78, 99] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    margin: { left: 14, right: 14 },
  })

  const finalY = (doc.lastAutoTable?.finalY ?? 38) + 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total deuda: ${formatMoneyAR(totalDeuda)}`, 14, finalY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(
    `${lista.length} venta(s) incluida(s)`,
    14,
    finalY + 5
  )

  const tipoSlug = tipo === 'deudas' ? 'deudas' : 'total'
  doc.save(
    `movimientos_${tipoSlug}_${slugArchivo(clienteNombre)}_${new Date().toISOString().slice(0, 10)}.pdf`
  )
}

function formatMontoOGuion(valor) {
  const n = Number(valor) || 0
  if (Math.abs(n) <= 0.009) return '—'
  return formatMoneyAR(n)
}

/**
 * PDF de estado de cuenta (libro de movimientos de la cuenta corriente).
 * @param {string} clienteNombre
 * @param {Array<Record<string, unknown>>} movimientos
 * @param {{
 *  periodoLabel?: string,
 *  totalCredito?: number,
 *  totalCobrado?: number,
 *  saldoPendiente?: number,
 * }} [options]
 */
export function downloadClienteEstadoCuentaPdf(clienteNombre, movimientos, options = {}) {
  const lista = Array.isArray(movimientos) ? movimientos : []
  const periodoLabel = options.periodoLabel || 'Período: todo el historial'
  const totalCredito = Number(options.totalCredito) || 0
  const totalCobrado = Number(options.totalCobrado) || 0
  const saldoPendiente = Number(options.saldoPendiente) || 0

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Estado de cuenta corriente', 14, 16)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Cliente: ${String(clienteNombre || '—')}`, 14, 23)
  doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 14, 28)
  doc.text(periodoLabel, 14, 33)

  const body =
    lista.length === 0
      ? [['—', 'Sin movimientos en el criterio seleccionado', '', '', '', '']]
      : lista.map((m) => [
          m.esSaldoAnterior ? String(m.fechaLabel || 'Mes anterior') : formatFechaCorta(m.fecha),
          `${m.anulado ? '[ANULADO] ' : ''}${String(m.detalle || '—')}`,
          formatMontoOGuion(m.cargo),
          formatMontoOGuion(m.pago),
          formatMontoOGuion(m.resto),
          formatMoneyAR(m.saldo),
        ])

  autoTable(doc, {
    startY: 38,
    head: [['Fecha', 'Detalle de la operación', 'Cargo / Venta', 'Pago / Cobro', 'Resto venta', 'Saldo pendiente']],
    body,
    styles: { fontSize: 7, cellPadding: 1.2 },
    headStyles: { fillColor: [22, 78, 99] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  const finalY = (doc.lastAutoTable?.finalY ?? 38) + 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total vendido a crédito: ${formatMoneyAR(totalCredito)}`, 14, finalY)
  doc.text(`Total cobrado: ${formatMoneyAR(totalCobrado)}`, 14, finalY + 5)
  doc.text(`Saldo pendiente: ${formatMoneyAR(saldoPendiente)}`, 14, finalY + 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`${lista.length} movimiento(s) incluido(s)`, 14, finalY + 16)

  doc.save(
    `estado_cuenta_${slugArchivo(clienteNombre)}_${new Date().toISOString().slice(0, 10)}.pdf`
  )
}
