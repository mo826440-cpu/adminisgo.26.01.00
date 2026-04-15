import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'
import { formatMoneyAR, mesTituloPie } from './reporteVentasUtils'

const PDF_CHART_BG = '#1e1e24'
const PDF_CHART_TEXT = '#e8e8e8'
const PIE_GREEN = '#28a745'
const PIE_RED = '#dc3545'
const PIE_EMPTY = '#6c757d'

const PAGE_MARGIN = 14
const PAGE_BOTTOM_MM = 287

function safeFileSlug(s) {
  return String(s || '').replace(/[^\d-]/g, '').slice(0, 10) || 'fecha'
}

/** @returns {number} posición Y (mm) para el siguiente bloque de contenido */
function addTitle(doc, titulo, desde, hasta, detalleFiltro) {
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text(titulo, PAGE_MARGIN, 16)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Período (consulta): ${desde} al ${hasta}`, PAGE_MARGIN, 23)
  let nextY = 28
  if (detalleFiltro) {
    doc.setFontSize(8)
    const lines = doc.splitTextToSize(String(detalleFiltro), 180)
    doc.text(lines, PAGE_MARGIN, nextY)
    nextY += lines.length * 3.2 + 4
    doc.setFontSize(10)
  }
  return nextY
}

function tableMontos(doc, startY, rows, totales) {
  const head = [['Mes', 'Total $', '$ Pagado', '$ Deuda']]
  const body =
    rows.length === 0
      ? [['—', 'Sin datos', '', '']]
      : rows.map((r) => [
          r.labelCorto,
          formatMoneyAR(r.totalMonto),
          formatMoneyAR(r.montoPagado),
          formatMoneyAR(r.montoDeuda),
        ])
  const foot =
    rows.length === 0
      ? []
      : [
          [
            'Total general',
            formatMoneyAR(totales.totalMonto),
            formatMoneyAR(totales.montoPagado),
            formatMoneyAR(totales.montoDeuda),
          ],
        ]

  autoTable(doc, {
    startY,
    head,
    body,
    foot,
    showFoot: rows.length ? 'lastPage' : 'never',
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 126, 234] },
    footStyles: { fontStyle: 'bold', fillColor: [240, 240, 240] },
  })
  return doc.lastAutoTable?.finalY ?? startY
}

function tableVolumenVentas(doc, startY, rows, totales) {
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Cantidad de ventas', PAGE_MARGIN, startY + 6)
  const y = startY + 10

  const head = [['Mes', 'Nº ventas', 'Cobradas', 'Con deuda']]
  const body =
    rows.length === 0
      ? [['—', 'Sin datos', '', '']]
      : rows.map((r) => [r.labelCorto, r.numVentas, r.ventasCobradas, r.ventasConDeuda])
  const foot =
    rows.length === 0
      ? []
      : [
          [
            'Total general',
            totales.numVentas,
            totales.ventasCobradas,
            totales.ventasConDeuda,
          ],
        ]

  autoTable(doc, {
    startY: y,
    head,
    body,
    foot,
    showFoot: rows.length ? 'lastPage' : 'never',
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 126, 234] },
    footStyles: { fontStyle: 'bold', fillColor: [240, 240, 240] },
  })
  return doc.lastAutoTable?.finalY ?? y
}

function tableVolumenCompras(doc, startY, rows, totales) {
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Cantidad de compras', PAGE_MARGIN, startY + 6)
  const y = startY + 10

  const head = [['Mes', 'Nº compras', 'Pagadas', 'Con deuda']]
  const body =
    rows.length === 0
      ? [['—', 'Sin datos', '', '']]
      : rows.map((r) => [r.labelCorto, r.numCompras, r.comprasPagadas, r.comprasConDeuda])
  const foot =
    rows.length === 0
      ? []
      : [
          [
            'Total general',
            totales.numCompras,
            totales.comprasPagadas,
            totales.comprasConDeuda,
          ],
        ]

  autoTable(doc, {
    startY: y,
    head,
    body,
    foot,
    showFoot: rows.length ? 'lastPage' : 'never',
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 126, 234] },
    footStyles: { fontStyle: 'bold', fillColor: [240, 240, 240] },
  })
  return doc.lastAutoTable?.finalY ?? y
}

function paintPieSlice(ctx, cx, cy, radius, startAng, sweep, fill) {
  if (sweep <= 0.0001) return startAng
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.arc(cx, cy, radius, startAng, startAng + sweep)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  return startAng + sweep
}

/** Cuadrado de leyenda + texto (PDF tortas) */
function drawPieLegendLine(ctx, xBase, yMid, color, text) {
  const sw = 10
  const gap = 8
  const xSw = xBase
  const ySw = yMid - sw / 2
  ctx.fillStyle = color
  ctx.fillRect(xSw, ySw, sw, sw)
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 1
  ctx.strokeRect(xSw + 0.5, ySw + 0.5, sw - 1, sw - 1)
  ctx.fillStyle = PDF_CHART_TEXT
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = '12px system-ui, "Segoe UI", sans-serif'
  ctx.fillText(text, xSw + sw + gap, yMid)
}

/**
 * Tortas dibujadas en Canvas (html2canvas no pinta bien conic-gradient en muchos navegadores).
 * @param {Array<{ year: number, monthIndex: number, numVentas?: number, ventasCobradas?: number, ventasConDeuda?: number, numCompras?: number, comprasPagadas?: number, comprasConDeuda?: number }>} rows
 * @param {'ventas' | 'compras'} tipo
 */
function buildPiesGridCanvas(rows, tipo) {
  const COLS = 2
  const cellW = 380
  const cellH = 300
  const n = Math.min(rows?.length || 0, 48)
  const rowsN = Math.max(1, Math.ceil(n / COLS))
  const canvas = document.createElement('canvas')
  canvas.width = COLS * cellW
  canvas.height = rowsN * cellH
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.fillStyle = PDF_CHART_BG
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < n; i++) {
    const r = rows[i]
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const x0 = col * cellW
    const y0 = row * cellH
    const cx = x0 + cellW / 2
    const cy = y0 + 118
    const rad = 62

    const total = tipo === 'ventas' ? r.numVentas : r.numCompras
    const ok = tipo === 'ventas' ? r.ventasCobradas : r.comprasPagadas
    const bad = tipo === 'ventas' ? r.ventasConDeuda : r.comprasConDeuda

    ctx.fillStyle = PDF_CHART_TEXT
    ctx.font = 'bold 15px system-ui, "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(mesTituloPie(r.year, r.monthIndex), cx, y0 + 26)

    if (!total || total <= 0) {
      ctx.beginPath()
      ctx.arc(cx, cy, rad, 0, Math.PI * 2)
      ctx.fillStyle = PIE_EMPTY
      ctx.fill()
    } else {
      let ang = -Math.PI / 2
      const okSweep = (ok / total) * Math.PI * 2
      const badSweep = (bad / total) * Math.PI * 2
      ang = paintPieSlice(ctx, cx, cy, rad, ang, okSweep, PIE_GREEN)
      paintPieSlice(ctx, cx, cy, rad, ang, badSweep, PIE_RED)
    }

    const pctOk = total > 0 ? Math.round((ok / total) * 1000) / 10 : 0
    const pctBad = total > 0 ? Math.min(100, Math.round((bad / total) * 1000) / 10) : 0
    const okLabel = tipo === 'ventas' ? 'COBRADAS' : 'PAGADAS'
    const legX = x0 + 18
    drawPieLegendLine(ctx, legX, y0 + cellH - 44, PIE_GREEN, `${okLabel}: ${ok} (${pctOk}%)`)
    drawPieLegendLine(ctx, legX, y0 + cellH - 24, PIE_RED, `CON DEUDA: ${bad} (${pctBad}%)`)
  }

  return canvas
}

function appendRasterCanvasToDoc(doc, sourceCanvas, yStart, caption) {
  if (!sourceCanvas) return yStart
  const contentW = 210 - PAGE_MARGIN * 2

  let y = yStart + 4
  if (y > PAGE_BOTTOM_MM - 50) {
    doc.addPage()
    y = PAGE_MARGIN + 4
  }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(caption, PAGE_MARGIN, y)
  y += 6

  const dataUrl = sourceCanvas.toDataURL('image/png')
  let imgW = contentW
  let imgH = (sourceCanvas.height / sourceCanvas.width) * imgW
  const maxH = 185
  if (imgH > maxH) {
    imgH = maxH
    imgW = (sourceCanvas.width / sourceCanvas.height) * imgH
  }

  while (y + imgH > PAGE_BOTTOM_MM) {
    doc.addPage()
    y = PAGE_MARGIN
  }

  doc.addImage(dataUrl, 'PNG', PAGE_MARGIN, y, imgW, imgH)
  return y + imgH + 8
}

/**
 * Barras: captura DOM con clon en tema oscuro (solo para el PDF).
 * @param {HTMLElement | null | undefined} element
 */
async function appendChartRasterToDoc(doc, element, yStart, caption) {
  if (!element) return yStart
  const contentW = 210 - PAGE_MARGIN * 2

  let y = yStart + 4
  if (y > PAGE_BOTTOM_MM - 50) {
    doc.addPage()
    y = PAGE_MARGIN + 4
  }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(caption, PAGE_MARGIN, y)
  y += 6

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: PDF_CHART_BG,
    logging: false,
    useCORS: true,
    allowTaint: true,
    scrollX: 0,
    scrollY: 0,
    onclone(_clonedDoc, clonedElement) {
      const root = clonedElement
      root.style.background = PDF_CHART_BG
      root.style.color = PDF_CHART_TEXT
      root.style.border = '1px solid #444'
      root.style.boxShadow = 'none'
      const textSelectors = [
        '.reporte-ventas-barra-mes',
        '.reporte-ventas-barra-valor',
        '.reporte-ventas-leyenda-barras',
        '.reporte-ventas-leyenda-barras span',
      ].join(',')
      root.querySelectorAll(textSelectors).forEach((node) => {
        if (node instanceof HTMLElement) node.style.color = PDF_CHART_TEXT
      })
    },
  })

  const dataUrl = canvas.toDataURL('image/png')
  let imgW = contentW
  let imgH = (canvas.height / canvas.width) * imgW
  const maxH = 185
  if (imgH > maxH) {
    imgH = maxH
    imgW = (canvas.width / canvas.height) * imgH
  }

  while (y + imgH > PAGE_BOTTOM_MM) {
    doc.addPage()
    y = PAGE_MARGIN
  }

  doc.addImage(dataUrl, 'PNG', PAGE_MARGIN, y, imgW, imgH)
  return y + imgH + 8
}

function escapeHtmlAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Ticket por iframe + srcdoc (evita about:blank y bloqueo de popups).
 * @param {{ titulo: string, texto: string }} opts
 */
export function printReporteTicket({ titulo, texto }) {
  const safePre = escapeHtmlAttr(texto)
  const safeTitle = escapeHtmlAttr(titulo)

  const docHtml = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${safeTitle}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  pre { margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.35; white-space: pre-wrap; word-break: break-word; }
</style></head><body><pre>${safePre}</pre></body></html>`

  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', String(titulo))
  iframe.setAttribute('srcdoc', docHtml)
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;'
  document.body.appendChild(iframe)

  const cw = iframe.contentWindow
  if (!cw) {
    iframe.remove()
    window.alert('No se pudo preparar la impresión del ticket.')
    return
  }

  let printed = false
  const runPrint = () => {
    if (printed) return
    printed = true
    try {
      cw.focus()
      cw.print()
    } catch (e) {
      console.error(e)
      window.alert('No se pudo abrir el diálogo de impresión.')
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
      }, 900)
    }
  }

  const schedulePrint = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(runPrint, 120)
      })
    })
  }

  iframe.addEventListener('load', schedulePrint)
  setTimeout(runPrint, 1000)
}

/**
 * @param {{ desde: string, hasta: string, rows: unknown[], totales: unknown, chartElements?: { barras?: HTMLElement | null } | null, detalleFiltro?: string }} opts
 */
export async function downloadReporteVentasPdf({ desde, hasta, rows, totales, chartElements, detalleFiltro }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const yTop = addTitle(doc, 'Reporte de ventas', desde, hasta, detalleFiltro)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Montos', PAGE_MARGIN, yTop + 2)

  let y = tableMontos(doc, yTop + 4, rows, totales)
  y += 6

  if (rows.length && chartElements?.barras) {
    y = await appendChartRasterToDoc(
      doc,
      chartElements.barras,
      y,
      'Gráfico: montos ($ pagado / $ deuda)'
    )
  }

  y += 4
  y = tableVolumenVentas(doc, y, rows, totales)
  y += 6

  if (rows.length) {
    const pieCanvas = buildPiesGridCanvas(rows, 'ventas')
    y = appendRasterCanvasToDoc(doc, pieCanvas, y, 'Gráfico: cantidad de ventas (por mes)')
  }

  const slug = `${safeFileSlug(desde)}_${safeFileSlug(hasta)}`
  doc.save(`reporte-ventas-${slug}.pdf`)
}

/**
 * @param {{ desde: string, hasta: string, rows: unknown[], totales: unknown, chartElements?: { barras?: HTMLElement | null } | null, detalleFiltro?: string }} opts
 */
export async function downloadReporteComprasPdf({ desde, hasta, rows, totales, chartElements, detalleFiltro }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const yTop = addTitle(doc, 'Reporte de compras', desde, hasta, detalleFiltro)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Montos', PAGE_MARGIN, yTop + 2)

  let y = tableMontos(doc, yTop + 4, rows, totales)
  y += 6

  if (rows.length && chartElements?.barras) {
    y = await appendChartRasterToDoc(
      doc,
      chartElements.barras,
      y,
      'Gráfico: montos ($ pagado / $ deuda)'
    )
  }

  y += 4
  y = tableVolumenCompras(doc, y, rows, totales)
  y += 6

  if (rows.length) {
    const pieCanvas = buildPiesGridCanvas(rows, 'compras')
    y = appendRasterCanvasToDoc(doc, pieCanvas, y, 'Gráfico: cantidad de compras (por mes)')
  }

  const slug = `${safeFileSlug(desde)}_${safeFileSlug(hasta)}`
  doc.save(`reporte-compras-${slug}.pdf`)
}

function tableBalances(doc, startY, rows, totales) {
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen por mes', PAGE_MARGIN, startY)

  const head = [['Mes', 'Total ventas', 'Total compras', 'Rentabilidad']]
  const body =
    rows.length === 0
      ? [['—', 'Sin datos', '', '']]
      : rows.map((r) => [
          r.labelCorto,
          formatMoneyAR(r.totalVentas),
          formatMoneyAR(r.totalCompras),
          formatMoneyAR(r.rentabilidad),
        ])
  const foot =
    rows.length === 0
      ? []
      : [
          [
            'Total general',
            formatMoneyAR(totales.totalVentas),
            formatMoneyAR(totales.totalCompras),
            formatMoneyAR(totales.rentabilidad),
          ],
        ]

  autoTable(doc, {
    startY: startY + 6,
    head,
    body,
    foot,
    showFoot: rows.length ? 'lastPage' : 'never',
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 126, 234] },
    footStyles: { fontStyle: 'bold', fillColor: [240, 240, 240] },
  })
  return doc.lastAutoTable?.finalY ?? startY
}

/**
 * @param {{ desde: string, hasta: string, rows: Array<{ labelCorto: string, totalVentas: number, totalCompras: number, rentabilidad: number }>, totales: { totalVentas: number, totalCompras: number, rentabilidad: number }, chartElements?: { barras?: HTMLElement | null } | null, detalleFiltro?: string }} opts
 */
export async function downloadReporteBalancesPdf({ desde, hasta, rows, totales, chartElements, detalleFiltro }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const yTop = addTitle(doc, 'Reporte de balances', desde, hasta, detalleFiltro)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.text('Rentabilidad mensual = total ventas − total compras (mismo mes).', PAGE_MARGIN, yTop + 2)

  let y = tableBalances(doc, yTop + 8, rows, totales)
  y += 6

  if (rows.length && chartElements?.barras) {
    y = await appendChartRasterToDoc(
      doc,
      chartElements.barras,
      y,
      'Gráfico: ventas, compras y rentabilidad'
    )
  }

  const slug = `${safeFileSlug(desde)}_${safeFileSlug(hasta)}`
  doc.save(`reporte-balances-${slug}.pdf`)
}

function pushTicketWrapped(L, text, w) {
  const s = String(text || '')
  for (let i = 0; i < s.length; i += w) {
    L.push(s.slice(i, i + w))
  }
}

export function buildTicketTextBalances({ desde, hasta, rows, totales, detalleFiltro }) {
  const w = 40
  const L = []
  L.push(line(w))
  L.push('ADMINIS GO')
  L.push('REPORTE DE BALANCES')
  L.push(line(w))
  L.push(`Desde: ${desde}`)
  L.push(`Hasta: ${hasta}`)
  if (detalleFiltro) {
    L.push(line(w, '.'))
    pushTicketWrapped(L, detalleFiltro, w)
  }
  L.push(line(w))
  L.push('MES   VENTAS     COMPRAS    RENTA')
  if (!rows.length) {
    L.push('(sin datos)')
  } else {
    for (const r of rows) {
      L.push(
        `${String(r.labelCorto).padEnd(4)} ${formatMoneyAR(r.totalVentas).padStart(10)} ${formatMoneyAR(r.totalCompras).padStart(10)} ${formatMoneyAR(r.rentabilidad).padStart(10)}`
      )
    }
    L.push(line(w, '='))
    L.push(
      `TOT ${formatMoneyAR(totales.totalVentas).padStart(10)} ${formatMoneyAR(totales.totalCompras).padStart(10)} ${formatMoneyAR(totales.rentabilidad).padStart(10)}`
    )
  }
  L.push(line(w))
  L.push(`Generado: ${new Date().toLocaleString('es-AR')}`)
  return L.join('\n')
}

function line(w, ch = '-') {
  return ch.repeat(Math.min(w, 42))
}

export function buildTicketTextVentas({ desde, hasta, rows, totales, detalleFiltro }) {
  const w = 40
  const L = []
  L.push(line(w))
  L.push('ADMINIS GO')
  L.push('REPORTE DE VENTAS')
  L.push(line(w))
  L.push(`Desde: ${desde}`)
  L.push(`Hasta: ${hasta}`)
  if (detalleFiltro) {
    L.push(line(w, '.'))
    pushTicketWrapped(L, detalleFiltro, w)
  }
  L.push(line(w))
  L.push('MONTOS')
  L.push('Mes      Total    Pagado  Deuda')
  if (!rows.length) {
    L.push('(sin datos)')
  } else {
    for (const r of rows) {
      L.push(
        `${String(r.labelCorto).padEnd(4)} ${formatMoneyAR(r.totalMonto).padStart(10)} ${formatMoneyAR(r.montoPagado).padStart(8)} ${formatMoneyAR(r.montoDeuda).padStart(8)}`
      )
    }
    L.push(line(w, '='))
    L.push(
      `TOT ${formatMoneyAR(totales.totalMonto).padStart(10)} ${formatMoneyAR(totales.montoPagado).padStart(8)} ${formatMoneyAR(totales.montoDeuda).padStart(8)}`
    )
  }
  L.push(line(w))
  L.push('CANTIDADES')
  L.push('Mes     Nº  Cobr. Deuda')
  if (!rows.length) {
    L.push('(sin datos)')
  } else {
    for (const r of rows) {
      L.push(
        `${String(r.labelCorto).padEnd(4)} ${String(r.numVentas).padStart(4)} ${String(r.ventasCobradas).padStart(5)} ${String(r.ventasConDeuda).padStart(5)}`
      )
    }
    L.push(line(w, '='))
    L.push(
      `TOT ${String(totales.numVentas).padStart(4)} ${String(totales.ventasCobradas).padStart(5)} ${String(totales.ventasConDeuda).padStart(5)}`
    )
  }
  L.push(line(w))
  L.push(`Generado: ${new Date().toLocaleString('es-AR')}`)
  return L.join('\n')
}

export function buildTicketTextCompras({ desde, hasta, rows, totales, detalleFiltro }) {
  const w = 40
  const L = []
  L.push(line(w))
  L.push('ADMINIS GO')
  L.push('REPORTE DE COMPRAS')
  L.push(line(w))
  L.push(`Desde: ${desde}`)
  L.push(`Hasta: ${hasta}`)
  if (detalleFiltro) {
    L.push(line(w, '.'))
    pushTicketWrapped(L, detalleFiltro, w)
  }
  L.push(line(w))
  L.push('MONTOS')
  L.push('Mes      Total    Pagado  Deuda')
  if (!rows.length) {
    L.push('(sin datos)')
  } else {
    for (const r of rows) {
      L.push(
        `${String(r.labelCorto).padEnd(4)} ${formatMoneyAR(r.totalMonto).padStart(10)} ${formatMoneyAR(r.montoPagado).padStart(8)} ${formatMoneyAR(r.montoDeuda).padStart(8)}`
      )
    }
    L.push(line(w, '='))
    L.push(
      `TOT ${formatMoneyAR(totales.totalMonto).padStart(10)} ${formatMoneyAR(totales.montoPagado).padStart(8)} ${formatMoneyAR(totales.montoDeuda).padStart(8)}`
    )
  }
  L.push(line(w))
  L.push('CANTIDADES')
  L.push('Mes     Nº  Pag.  Deuda')
  if (!rows.length) {
    L.push('(sin datos)')
  } else {
    for (const r of rows) {
      L.push(
        `${String(r.labelCorto).padEnd(4)} ${String(r.numCompras).padStart(4)} ${String(r.comprasPagadas).padStart(5)} ${String(r.comprasConDeuda).padStart(5)}`
      )
    }
    L.push(line(w, '='))
    L.push(
      `TOT ${String(totales.numCompras).padStart(4)} ${String(totales.comprasPagadas).padStart(5)} ${String(totales.comprasConDeuda).padStart(5)}`
    )
  }
  L.push(line(w))
  L.push(`Generado: ${new Date().toLocaleString('es-AR')}`)
  return L.join('\n')
}
