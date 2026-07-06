import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatMoneyAR } from '../pages/reportes/reporteVentasUtils'
import { todosMismoPrecio } from './productosCategoriaPdf'

function formatFechaReporte() {
  return new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Arma filas para el PDF de categorías seleccionadas.
 * Precio único → categoría | general | precio
 * Varios precios → categoría | — | — y luego | producto | precio
 *
 * @param {Array<{ nombre?: string, productos?: Array<{ nombre?: string, precio_venta?: number }> }>} categorias
 */
export function buildCategoriasPreciosPdfBody(categorias) {
  const body = []
  const lista = Array.isArray(categorias) ? categorias : []

  for (const cat of lista) {
    const nombre = String(cat.nombre || '—').trim() || '—'
    const productos = Array.isArray(cat.productos) ? cat.productos : []

    if (productos.length === 0) {
      body.push([nombre, '—', '—'])
      continue
    }

    if (todosMismoPrecio(productos)) {
      body.push([nombre, 'general', formatMoneyAR(productos[0]?.precio_venta)])
      continue
    }

    body.push([nombre, '—', '—'])
    const ordenados = [...productos].sort((a, b) =>
      String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'),
    )
    for (const p of ordenados) {
      body.push(['', String(p.nombre || '—'), formatMoneyAR(p.precio_venta)])
    }
  }

  return body
}

/**
 * PDF con detalle de precios de categorías seleccionadas.
 * @param {{ categorias: Array<{ nombre?: string, productos?: Array<{ nombre?: string, precio_venta?: number }> }> }} opts
 */
export function downloadCategoriasSeleccionPdf({ categorias }) {
  const lista = Array.isArray(categorias) ? categorias : []
  if (lista.length === 0) return

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  const fecha = formatFechaReporte()

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Fecha:', margin, 14)
  doc.text(fecha, pageW - margin, 14, { align: 'right' })

  const body = buildCategoriasPreciosPdfBody(lista)

  autoTable(doc, {
    startY: 20,
    head: [['CATEGORÍA', 'PRODUCTOS', 'PRECIO']],
    body,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 2.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.15,
      textColor: [0, 0, 0],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [244, 177, 131],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 62 },
      1: { cellWidth: 62 },
      2: { halign: 'center' },
    },
    alternateRowStyles: { fillColor: [210, 210, 210] },
    margin: { left: margin, right: margin, bottom: 16 },
  })

  const fechaArchivo = new Date().toISOString().slice(0, 10)
  doc.save(`categorias_precios_${lista.length}_${fechaArchivo}.pdf`)
}
