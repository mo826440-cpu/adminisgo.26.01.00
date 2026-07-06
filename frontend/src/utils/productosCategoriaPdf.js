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

function precioKey(p) {
  return Number(parseFloat(p?.precio_venta ?? 0).toFixed(2))
}

/** True si todos los productos tienen el mismo precio de venta. */
export function todosMismoPrecio(productos) {
  const lista = Array.isArray(productos) ? productos : []
  if (lista.length === 0) return false
  const keys = new Set(lista.map(precioKey))
  return keys.size === 1
}

/** Agrupa productos por precio de venta (orden descendente de precio). */
export function agruparProductosPorPrecio(productos) {
  const lista = Array.isArray(productos) ? productos : []
  const map = new Map()
  for (const p of lista) {
    const key = precioKey(p)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(p)
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([precio, items]) => ({ precio, items }))
}

/**
 * Arma filas para autoTable: precio único → solo nombres; varios precios → bloques por precio.
 */
export function buildProductosCategoriaPdfSections(productos) {
  const lista = Array.isArray(productos) ? productos : []
  if (lista.length === 0) {
    return { mode: 'empty', sections: [] }
  }

  if (todosMismoPrecio(lista)) {
    return {
      mode: 'uniform',
      precioUnico: lista[0]?.precio_venta,
      sections: [
        {
          precio: lista[0]?.precio_venta,
          rows: lista.map((p) => [String(p.nombre || '—'), codigoProducto(p)]),
        },
      ],
    }
  }

  return {
    mode: 'grouped',
    sections: agruparProductosPorPrecio(lista).map((g) => ({
      precio: g.precio,
      rows: g.items.map((p) => [String(p.nombre || '—'), codigoProducto(p)]),
    })),
  }
}

/**
 * PDF de listado de productos filtrados por categoría.
 * Si todos comparten precio, se imprime una sola vez en la categoría (sin repetir por producto).
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
  doc.text('Listado de precios', 14, 16)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const lista = Array.isArray(productos) ? productos : []
  const layout = buildProductosCategoriaPdfSections(lista)

  let startY = 23
  if (layout.mode === 'uniform') {
    doc.text(`Categoría: ${tituloCategoria}`, 14, startY)
    doc.setFont('helvetica', 'bold')
    doc.text(`Precio: ${formatMoneyAR(layout.precioUnico)}`, 14, startY + 6)
    doc.setFont('helvetica', 'normal')
    startY += 12
  } else if (layout.mode === 'grouped') {
    doc.text(`Categoría: ${tituloCategoria}`, 14, startY)
    startY += 7
  } else {
    doc.text(`Categoría: ${tituloCategoria}`, 14, startY)
    startY += 7
  }

  if (layout.mode === 'empty') {
    autoTable(doc, {
      startY,
      head: [['Nombre', 'Código']],
      body: [['—', 'Sin productos en esta categoría']],
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [22, 78, 99] },
      margin: { left: 14, right: 14, bottom: 24 },
    })
  } else if (layout.mode === 'uniform') {
    autoTable(doc, {
      startY,
      head: [['Producto / variante', 'Código']],
      body: layout.sections[0].rows,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [22, 78, 99] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      margin: { left: 14, right: 14, bottom: 24 },
    })
  } else {
    let y = startY
    layout.sections.forEach((section, idx) => {
      if (idx > 0) y = (doc.lastAutoTable?.finalY ?? y) + 8
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(`Precio: ${formatMoneyAR(section.precio)}`, 14, y)
      doc.setFont('helvetica', 'normal')
      autoTable(doc, {
        startY: y + 3,
        head: [['Producto / variante', 'Código']],
        body: section.rows,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [22, 78, 99] },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: 14, right: 14, bottom: 24 },
      })
    })
  }

  const pageH = doc.internal.pageSize.getHeight()
  let yPie = (doc.lastAutoTable?.finalY ?? startY) + 12
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
