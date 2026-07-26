import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

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

function formatPrecioSoloNumero(val) {
  const num = Number(val || 0)
  return num.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
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
 * Filas para tabla unificada: Producto/Variante | Categoría | Código | Precio
 * @param {Array} productos
 * @param {string} categoriaNombre
 */
export function buildProductosListaPreciosRows(productos, categoriaNombre) {
  const lista = Array.isArray(productos) ? productos : []
  const categoria = String(categoriaNombre || '—').trim() || '—'
  return [...lista]
    .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'))
    .map((p) => [
      String(p.nombre || '—'),
      categoria,
      codigoProducto(p),
      formatPrecioSoloNumero(p.precio_venta),
    ])
}

/**
 * @deprecated Preferí buildProductosListaPreciosRows. Se mantiene por compatibilidad.
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

const HEADER_TEAL = [22, 78, 99]
const ROW_BLUE = [186, 220, 240]
const ROW_BLUE_ALT = [210, 232, 246]

/**
 * PDF lista de precios (tabla única: producto, categoría, código, precio).
 * @param {{ categoriaNombre: string, productos: Array<{ nombre?: string, codigo_barras?: string, codigo_interno?: string, precio_venta?: number }> }} opts
 */
export function downloadProductosCategoriaPdf({ categoriaNombre, productos }) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const tituloCategoria = String(categoriaNombre || '').trim()
  if (!tituloCategoria) return

  const margin = 14
  const lista = Array.isArray(productos) ? productos : []
  const body = buildProductosListaPreciosRows(lista, tituloCategoria)

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('LISTA DE PRECIOS', margin, 18)

  autoTable(doc, {
    startY: 24,
    head: [['Producto/Variante', 'Categoría', 'Código', 'Precio']],
    body:
      body.length > 0
        ? body
        : [['—', tituloCategoria, '—', formatPrecioSoloNumero(0)]],
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: { top: 2.2, bottom: 2.2, left: 2.5, right: 2.5 },
      lineColor: [255, 255, 255],
      lineWidth: 0.35,
      textColor: [0, 0, 0],
      valign: 'middle',
      fillColor: ROW_BLUE,
    },
    headStyles: {
      fillColor: HEADER_TEAL,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineColor: [255, 255, 255],
      lineWidth: 0.35,
    },
    alternateRowStyles: {
      fillColor: ROW_BLUE_ALT,
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 38, halign: 'center' },
      3: { cellWidth: 32, halign: 'right', cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 } },
    },
    margin: { left: margin, right: margin, bottom: 20 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        // El texto lo dibujamos en didDrawCell ($ izq. + monto der.)
        data.cell.text = ['']
      }
    },
    didDrawCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 3) return
      const raw = body[data.row.index]?.[3]
      if (raw == null) return
      const { x, y, width, height } = data.cell
      const padX = 2.5
      const midY = y + height / 2 + 1
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0)
      doc.text('$', x + padX, midY)
      doc.text(String(raw), x + width - padX, midY, { align: 'right' })
    },
  })

  const generado = new Date().toLocaleString('es-AR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
  const pageH = doc.internal.pageSize.getHeight()
  let yPie = (doc.lastAutoTable?.finalY ?? 24) + 10
  if (yPie > pageH - 16) {
    doc.addPage()
    yPie = pageH - 14
  }
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text(`Fecha de generación: ${generado}`, margin, yPie)
  doc.setTextColor(0, 0, 0)

  const fechaArchivo = new Date().toISOString().slice(0, 10)
  doc.save(`productos_${slugArchivo(tituloCategoria)}_${fechaArchivo}.pdf`)
}
