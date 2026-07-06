import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatMoney, formatNumber, formatDateAR } from './dashboardFormat'

export function downloadDashboardPdf({ analytics, filters, userEmail }) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const generado = new Date().toLocaleString('es-AR')

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Dashboard — Resumen', 14, 16)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Período: ${filters.fechaDesde} — ${filters.fechaHasta}`, 14, 24)
  doc.text(`Generado: ${generado}`, 14, 30)
  if (userEmail) doc.text(`Usuario: ${userEmail}`, 14, 36)

  const kpiRows = (analytics.kpis || []).slice(0, 10).map((k) => [
    k.label,
    k.format === 'money' ? formatMoney(k.value) : formatNumber(k.value),
    k.change != null ? `${k.change.toFixed(1)}%` : '—',
  ])

  autoTable(doc, {
    startY: 42,
    head: [['Indicador', 'Valor', 'Variación']],
    body: kpiRows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [34, 211, 238] },
  })

  let y = (doc.lastAutoTable?.finalY ?? 42) + 10
  doc.setFont('helvetica', 'bold')
  doc.text('Top productos', 14, y)
  doc.setFont('helvetica', 'normal')
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Producto', 'Unidades', 'Importe']],
    body: (analytics.topProducts || []).map((p) => [p.name, p.qty, formatMoney(p.amount)]),
    styles: { fontSize: 8 },
  })

  doc.save(`dashboard_${filters.fechaDesde}_${filters.fechaHasta}.pdf`)
}

export function downloadDashboardExcel({ analytics, filters }) {
  // TODO: implementar exportación Excel (.xlsx) cuando se agregue dependencia
  const lines = [
    ['Dashboard', filters.fechaDesde, filters.fechaHasta],
    ['Indicador', 'Valor'],
    ...(analytics.kpis || []).map((k) => [
      k.label,
      k.format === 'money' ? k.value : k.value,
    ]),
  ]
  const csv = lines.map((row) => row.join(';')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dashboard_${filters.fechaDesde}_${filters.fechaHasta}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
