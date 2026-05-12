import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatMoneyAR } from '../pages/reportes/reporteVentasUtils'

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

function escapeCsvCampo(val) {
  const t = String(val ?? '')
  if (/[;"\n\r]/.test(t)) return `"${t.replace(/"/g, '""')}"`
  return t
}

/**
 * CSV separado por `;` y BOM UTF-8 — se abre bien en Excel regional AR.
 * @param {string} clienteNombre
 * @param {Array<Record<string, unknown>>} ventasRaw — filas de `ventas`
 */
export function downloadClienteMovimientosCsv(clienteNombre, ventasRaw) {
  const headers = [
    'Fecha',
    'Ticket',
    'Total',
    'Pagado',
    'Deuda',
    'Estado',
    'Método',
    'Facturación',
    'Observaciones',
  ]
  const rows = (ventasRaw || []).map((v) => [
    formatFechaCorta(v.fecha_hora),
    v.numero_ticket ?? v.id,
    Number(v.total || 0).toFixed(2),
    Number(v.monto_pagado || 0).toFixed(2),
    Number(v.monto_deuda || 0).toFixed(2),
    v.estado ?? '',
    v.metodo_pago ?? '',
    v.facturacion ?? '',
    String(v.observaciones || '').replace(/\r?\n/g, ' '),
  ])
  const lineas = [headers.map(escapeCsvCampo).join(';')]
  for (const r of rows) {
    lineas.push(r.map(escapeCsvCampo).join(';'))
  }
  const bom = '\uFEFF'
  const blob = new Blob([bom + lineas.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `movimientos_${slugArchivo(clienteNombre)}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

/**
 * PDF con jsPDF + autotable (misma familia que los informes del módulo Reportes).
 * @param {string} clienteNombre
 * @param {Array<Record<string, unknown>>} ventasRaw
 */
export function downloadClienteMovimientosPdf(clienteNombre, ventasRaw) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Historial de movimientos (ventas)', 14, 16)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Cliente: ${String(clienteNombre || '—')}`, 14, 23)
  doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 14, 28)

  const head = [['Fecha', 'Ticket', 'Total', 'Pagado', 'Deuda', 'Estado']]
  const lista = ventasRaw || []
  const body =
    lista.length === 0
      ? [['—', 'Sin ventas con este cliente', '', '', '', '']]
      : lista.map((v) => [
          formatFechaCorta(v.fecha_hora),
          String(v.numero_ticket ?? v.id),
          formatMoneyAR(v.total),
          formatMoneyAR(v.monto_pagado),
          formatMoneyAR(v.monto_deuda),
          String(v.estado ?? '').slice(0, 14),
        ])

  autoTable(doc, {
    startY: 33,
    head,
    body,
    styles: { fontSize: 7, cellPadding: 1.2 },
    headStyles: { fillColor: [22, 78, 99] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    margin: { left: 14, right: 14 },
  })

  doc.save(`movimientos_${slugArchivo(clienteNombre)}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
