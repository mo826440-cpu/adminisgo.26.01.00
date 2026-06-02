import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatMoneyAR } from '../pages/reportes/reporteVentasUtils'

function slugArchivo(texto) {
  const base = String(texto || 'productos')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 48)
  return base || 'productos'
}

function codigoProducto(p) {
  return String(p.codigo_barras || p.codigo_interno || '—').trim() || '—'
}

/**
 * PDF de listado de productos filtrados por categoría.
 * @param {{ categoriaNombre: string, productos: Array<{ nombre?: string, codigo_barras?: string, codigo_interno?: string, precio_venta?: number }> }} opts
 */
export function downloadProductosCategoriaPdf({ categoriaNombre, productos }) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const tituloCategoria = String(categoriaNombre || '').trim()
  if (!tituloCategoria) return
  const generado = new Date().toLocaleString('es-AR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Listado de productos', 14, 16)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Categoría: ${tituloCategoria}`, 14, 23)

  const lista = Array.isArray(productos) ? productos : []
  const head = [['Nombre', 'Código', 'Precio']]
  const body =
    lista.length === 0
      ? [['—', 'Sin productos en este filtro', '—']]
      : lista.map((p) => [
          String(p.nombre || '—'),
          codigoProducto(p),
          formatMoneyAR(p.precio_venta),
        ])

  autoTable(doc, {
    startY: 30,
    head,
    body,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [22, 78, 99] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    margin: { left: 14, right: 14, bottom: 24 },
  })

  const pageH = doc.internal.pageSize.getHeight()
  let yPie = (doc.lastAutoTable?.finalY ?? 30) + 12
  if (yPie > pageH - 20) {
    doc.addPage()
    yPie = pageH - 18
  }
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.text(`Categoría: ${tituloCategoria}`, 14, yPie)
  doc.text(`Fecha de generación del reporte: ${generado}`, 14, yPie + 5)
  doc.setTextColor(0, 0, 0)

  const fechaArchivo = new Date().toISOString().slice(0, 10)
  doc.save(`productos_${slugArchivo(tituloCategoria)}_${fechaArchivo}.pdf`)
}
