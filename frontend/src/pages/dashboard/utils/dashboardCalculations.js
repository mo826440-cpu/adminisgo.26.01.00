import {
  getVentaEstadoDisplay,
  ventaEstaCancelada,
  ventaAfectaCalculos,
} from '../../../utils/ventaEstado'
import { formatPctChange } from './dashboardFormat'

const DONUT_COLORS = [
  '#22d3ee',
  '#34d399',
  '#a78bfa',
  '#fbbf24',
  '#f87171',
  '#60a5fa',
  '#fb923c',
  '#94a3b8',
]

export { DONUT_COLORS }

function sumVentasTotal(ventas) {
  return (ventas || [])
    .filter(ventaAfectaCalculos)
    .reduce((s, v) => s + (parseFloat(v.total) || 0), 0)
}

function sumUnidadesVentas(ventas) {
  return (ventas || [])
    .filter(ventaAfectaCalculos)
    .reduce((s, v) => {
      const u = parseFloat(v.unidades_totales)
      if (Number.isFinite(u)) return s + u
      const items = v.venta_items || []
      return s + items.reduce((a, it) => a + (parseFloat(it.cantidad) || 0), 0)
    }, 0)
}

function countVentasActivas(ventas) {
  return (ventas || []).filter(ventaAfectaCalculos).length
}

function sumComprasTotal(compras) {
  return (compras || []).reduce((s, c) => s + (parseFloat(c.total) || 0), 0)
}

export function buildKpis({
  ventas,
  compras,
  productos,
  clientes,
  proveedores,
  ventasPrev,
  comprasPrev,
  clientesNuevosPrev = 0,
  clientesNuevos = 0,
}) {
  const ventasTotal = sumVentasTotal(ventas)
  const ventasPrevTotal = sumVentasTotal(ventasPrev)
  const cantVentas = countVentasActivas(ventas)
  const cantVentasPrev = countVentasActivas(ventasPrev)
  const unidades = sumUnidadesVentas(ventas)
  const unidadesPrev = sumUnidadesVentas(ventasPrev)
  const comprasTotal = sumComprasTotal(compras)
  const comprasPrevTotal = sumComprasTotal(comprasPrev)
  const ticket = cantVentas > 0 ? ventasTotal / cantVentas : 0
  const ticketPrev = cantVentasPrev > 0 ? ventasPrevTotal / cantVentasPrev : 0

  const stockTotal = (productos || []).reduce((s, p) => s + (parseFloat(p.stock_actual) || 0), 0)
  const valorInventario = (productos || []).reduce(
    (s, p) => s + (parseFloat(p.stock_actual) || 0) * (parseFloat(p.precio_venta) || 0),
    0,
  )
  const stockCritico = (productos || []).filter(
    (p) => (parseFloat(p.stock_actual) || 0) <= (parseFloat(p.stock_minimo) || 0),
  ).length
  const sinStock = (productos || []).filter((p) => (parseFloat(p.stock_actual) || 0) <= 0).length

  const proveedoresActivos = (proveedores || []).filter((p) => p.activo !== false).length
  const clientesActivos = (clientes || []).filter((c) => c.activo !== false).length

  return [
    {
      id: 'ventas-total',
      label: 'Ventas totales',
      value: ventasTotal,
      format: 'money',
      change: formatPctChange(ventasTotal, ventasPrevTotal),
      compareLabel: 'vs período anterior',
      icon: 'bi-graph-up-arrow',
      tone: 'cyan',
    },
    {
      id: 'cant-ventas',
      label: 'Cantidad de ventas',
      value: cantVentas,
      format: 'number',
      change: formatPctChange(cantVentas, cantVentasPrev),
      compareLabel: 'vs período anterior',
      icon: 'bi-receipt',
      tone: 'green',
    },
    {
      id: 'ticket',
      label: 'Ticket promedio',
      value: ticket,
      format: 'money',
      change: formatPctChange(ticket, ticketPrev),
      compareLabel: 'vs período anterior',
      icon: 'bi-cash-stack',
      tone: 'violet',
    },
    {
      id: 'compras-total',
      label: 'Compras totales',
      value: comprasTotal,
      format: 'money',
      change: formatPctChange(comprasTotal, comprasPrevTotal),
      compareLabel: 'vs período anterior',
      icon: 'bi-truck',
      tone: 'amber',
    },
    {
      id: 'productos-vendidos',
      label: 'Productos vendidos',
      value: unidades,
      format: 'number',
      change: formatPctChange(unidades, unidadesPrev),
      compareLabel: 'vs período anterior',
      icon: 'bi-box-seam',
      tone: 'green',
    },
    {
      id: 'stock-critico',
      label: 'Stock crítico',
      value: stockCritico,
      format: 'number',
      change: null,
      compareLabel: 'productos bajo mínimo',
      icon: 'bi-exclamation-triangle',
      tone: 'red',
    },
    {
      id: 'valor-inventario',
      label: 'Valor inventario',
      value: valorInventario,
      format: 'money',
      change: null,
      compareLabel: 'precio venta × stock',
      icon: 'bi-archive',
      tone: 'cyan',
    },
    {
      id: 'clientes-nuevos',
      label: 'Clientes nuevos',
      value: clientesNuevos,
      format: 'number',
      change: formatPctChange(clientesNuevos, clientesNuevosPrev),
      compareLabel: 'vs período anterior',
      icon: 'bi-person-plus',
      tone: 'violet',
    },
    {
      id: 'clientes-activos',
      label: 'Clientes activos',
      value: clientesActivos,
      format: 'number',
      change: null,
      compareLabel: 'en catálogo',
      icon: 'bi-people',
      tone: 'green',
    },
    {
      id: 'proveedores-activos',
      label: 'Proveedores activos',
      value: proveedoresActivos,
      format: 'number',
      change: null,
      compareLabel: 'en catálogo',
      icon: 'bi-building',
      tone: 'amber',
    },
    // TODO: ganancia estimada cuando exista costo promedio por ítem en ventas
    // TODO: margen bruto cuando precio_compra esté disponible por línea de venta
  ]
}

function bucketKey(date, granularity) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return null
  if (granularity === 'year') return `${d.getFullYear()}`
  if (granularity === 'month') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  if (granularity === 'week') {
    const onejan = new Date(d.getFullYear(), 0, 1)
    const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7)
    return `${d.getFullYear()}-S${String(week).padStart(2, '0')}`
  }
  return d.toISOString().slice(0, 10)
}

function bucketLabel(key, granularity) {
  if (granularity === 'day') {
    const d = new Date(key)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  }
  if (granularity === 'month') {
    const [y, m] = key.split('-')
    const d = new Date(Number(y), Number(m) - 1, 1)
    return d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
  }
  return key
}

export function buildEvolutionSeries({
  ventas,
  compras,
  clientesNuevos = [],
  metric = 'ventas',
  granularity = 'day',
  desde,
  hasta,
}) {
  const buckets = new Map()

  const ensure = (key) => {
    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        label: bucketLabel(key, granularity),
        ventas: 0,
        compras: 0,
        ganancias: 0,
        tickets: 0,
        ticketProm: 0,
        clientes: 0,
      })
    }
    return buckets.get(key)
  }

  if (metric === 'ventas' || metric === 'tickets' || metric === 'ticket' || metric === 'ganancias') {
    ;(ventas || []).filter(ventaAfectaCalculos).forEach((v) => {
      const k = bucketKey(v.fecha_hora, granularity)
      if (!k) return
      const b = ensure(k)
      b.ventas += parseFloat(v.total) || 0
      b.tickets += 1
      // TODO: ganancias reales por línea (precio_venta - precio_compra)
    })
  }

  if (metric === 'compras') {
    ;(compras || []).forEach((c) => {
      const k = bucketKey(c.fecha_orden, granularity)
      if (!k) return
      ensure(k).compras += parseFloat(c.total) || 0
    })
  }

  if (metric === 'clientes') {
    ;(clientesNuevos || []).forEach((c) => {
      const k = bucketKey(c.created_at, granularity)
      if (!k) return
      ensure(k).clientes += 1
    })
  }

  buckets.forEach((b) => {
    b.ticketProm = b.tickets > 0 ? b.ventas / b.tickets : 0
    b.ganancias = b.ventas * 0 // TODO
  })

  const metricKey =
    metric === 'compras'
      ? 'compras'
      : metric === 'clientes'
        ? 'clientes'
        : metric === 'tickets'
          ? 'tickets'
          : metric === 'ticket'
            ? 'ticketProm'
            : metric === 'ganancias'
              ? 'ganancias'
              : 'ventas'

  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, b]) => ({
      name: b.label,
      value: b[metricKey] || 0,
    }))
}

export function buildPaymentDonut(ventas) {
  const grupos = {}
  ;(ventas || []).filter(ventaAfectaCalculos).forEach((v) => {
    ;(v.venta_pagos || []).forEach((p) => {
      const label = String(p.metodo_pago || 'Otro').trim() || 'Otro'
      grupos[label] = (grupos[label] || 0) + (parseFloat(p.monto_pagado) || 0)
    })
  })
  return Object.entries(grupos)
    .filter(([, v]) => v > 0.01)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function buildCategoryDonut(ventas, productos, categorias) {
  const grupos = {}
  ;(ventas || []).filter(ventaAfectaCalculos).forEach((v) => {
    ;(v.venta_items || []).forEach((it) => {
      const p = productos.find((pr) => pr.id === it.producto_id)
      const catId = p?.categoria_id
      const cat = categorias.find((c) => c.id === catId)
      const name = cat?.nombre || p?.categorias?.nombre || 'Otros'
      const monto =
        (parseFloat(it.precio_unitario) || 0) * (parseFloat(it.cantidad) || 0) ||
        (parseFloat(v.total) || 0) / Math.max(1, (v.venta_items || []).length)
      grupos[name] = (grupos[name] || 0) + monto
    })
  })
  return Object.entries(grupos)
    .filter(([, v]) => v > 0.01)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function buildTopProducts(ventas, productos, limit = 10) {
  const map = new Map()
  ;(ventas || []).filter(ventaAfectaCalculos).forEach((v) => {
    ;(v.venta_items || []).forEach((it) => {
      const id = it.producto_id || 'sin'
      const p = productos.find((pr) => pr.id === id)
      const label = p?.nombre || 'Sin nombre'
      if (!map.has(id)) map.set(id, { id, name: label, qty: 0, amount: 0 })
      const row = map.get(id)
      const cant = parseFloat(it.cantidad) || 0
      row.qty += cant
      row.amount +=
        (parseFloat(it.precio_unitario) || 0) * cant ||
        (parseFloat(v.total) || 0) / Math.max(1, (v.venta_items || []).length)
    })
  })
  return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, limit)
}

export function buildTopClientes(ventas, clientes, limit = 8) {
  const map = new Map()
  ;(ventas || []).filter(ventaAfectaCalculos).forEach((v) => {
    const id = v.cliente_id || 'sin'
    const c = clientes.find((cl) => cl.id === id)
    const name = c?.nombre || 'Sin cliente'
    if (!map.has(id)) map.set(id, { id, name, count: 0, amount: 0, lastDate: null })
    const row = map.get(id)
    row.count += 1
    row.amount += parseFloat(v.total) || 0
    const fh = v.fecha_hora ? new Date(v.fecha_hora) : null
    if (fh && (!row.lastDate || fh > row.lastDate)) row.lastDate = fh
  })
  return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, limit)
}

export function buildTopProveedores(compras, proveedores, limit = 8) {
  const map = new Map()
  ;(compras || []).forEach((c) => {
    const id = c.proveedor_id || 'sin'
    const p = proveedores.find((pr) => pr.id === id)
    const name = p?.nombre_razon_social || 'Sin proveedor'
    if (!map.has(id)) map.set(id, { id, name, count: 0, amount: 0, lastDate: null })
    const row = map.get(id)
    row.count += 1
    row.amount += parseFloat(c.total) || 0
    const fd = c.fecha_orden ? new Date(c.fecha_orden) : null
    if (fd && (!row.lastDate || fd > row.lastDate)) row.lastDate = fd
  })
  return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, limit)
}

export function buildVentaEstados(ventas) {
  let pagadas = { count: 0, amount: 0 }
  let pendientes = { count: 0, amount: 0 }
  let canceladas = { count: 0, amount: 0 }

  ;(ventas || []).forEach((v) => {
    const total = parseFloat(v.total) || 0
    if (ventaEstaCancelada(v)) {
      canceladas.count += 1
      canceladas.amount += total
      return
    }
    const estado = getVentaEstadoDisplay(v)
    if (estado === 'pendiente') {
      pendientes.count += 1
      pendientes.amount += parseFloat(v.monto_deuda) || Math.max(0, total - (parseFloat(v.monto_pagado) || 0))
    } else {
      pagadas.count += 1
      pagadas.amount += total
    }
  })

  return [
    { id: 'pagadas', label: 'Pagadas', ...pagadas, tone: 'green' },
    { id: 'pendientes', label: 'Pendientes', ...pendientes, tone: 'amber' },
    { id: 'canceladas', label: 'Canceladas', ...canceladas, tone: 'red' },
    // TODO: anuladas / devueltas si se modelan estados aparte
  ]
}

export function buildCompraEstados(compras) {
  const recibidas = { count: 0, amount: 0 }
  const pendientes = { count: 0, amount: 0 }
  const canceladas = { count: 0, amount: 0 }
  const parciales = { count: 0, amount: 0 }

  ;(compras || []).forEach((c) => {
    const total = parseFloat(c.total) || 0
    const estado = String(c.estado || '').toLowerCase()
    const pagado = parseFloat(c.monto_pagado) || 0
    if (estado === 'cancelada') {
      canceladas.count += 1
      canceladas.amount += total
    } else if (estado === 'recibida') {
      recibidas.count += 1
      recibidas.amount += total
    } else if (pagado > 0.01 && pagado < total - 0.01) {
      parciales.count += 1
      parciales.amount += total - pagado
    } else {
      pendientes.count += 1
      pendientes.amount += total
    }
  })

  return [
    { id: 'recibidas', label: 'Recibidas', ...recibidas, tone: 'green' },
    { id: 'pendientes', label: 'Pendientes', ...pendientes, tone: 'amber' },
    { id: 'parciales', label: 'Parciales', ...parciales, tone: 'cyan' },
    { id: 'canceladas', label: 'Canceladas', ...canceladas, tone: 'red' },
  ]
}

export function buildStockIndicators(productos) {
  const bajo = (productos || []).filter(
    (p) => {
      const s = parseFloat(p.stock_actual) || 0
      const min = parseFloat(p.stock_minimo) || 0
      return s > 0 && s <= min
    },
  )
  const sin = (productos || []).filter((p) => (parseFloat(p.stock_actual) || 0) <= 0)
  const valor = (productos || []).reduce(
    (s, p) => s + (parseFloat(p.stock_actual) || 0) * (parseFloat(p.precio_venta) || 0),
    0,
  )
  return {
    bajoStock: bajo.slice(0, 10),
    sinStock: sin.slice(0, 10),
    valorInventario: valor,
    // TODO: productos próximos a vencer
    // TODO: rotación de stock (requiere histórico de movimientos)
  }
}

export function buildAlerts({ productos, ventas, compras, clientes }) {
  const alerts = []
  const critico = (productos || []).filter(
    (p) => (parseFloat(p.stock_actual) || 0) <= (parseFloat(p.stock_minimo) || 0),
  )
  critico.slice(0, 5).forEach((p) => {
    alerts.push({
      id: `stock-${p.id}`,
      type: 'danger',
      icon: 'bi-exclamation-triangle',
      text: `Stock crítico: ${p.nombre} (${p.stock_actual ?? 0} u.)`,
    })
  })

  ;(ventas || [])
    .filter((v) => getVentaEstadoDisplay(v) === 'pendiente')
    .slice(0, 3)
    .forEach((v) => {
      const cli = clientes.find((c) => c.id === v.cliente_id)
      alerts.push({
        id: `deuda-${v.id}`,
        type: 'warning',
        icon: 'bi-credit-card',
        text: `Venta pendiente: ${cli?.nombre || 'Cliente'} — $${(parseFloat(v.monto_deuda) || 0).toLocaleString('es-AR')}`,
      })
    })

  ;(compras || [])
    .filter((c) => String(c.estado || '').toLowerCase() === 'pendiente')
    .slice(0, 3)
    .forEach((c) => {
      alerts.push({
        id: `compra-${c.id}`,
        type: 'info',
        icon: 'bi-truck',
        text: `Compra pendiente #${c.id?.slice?.(0, 8) || ''}`,
      })
    })

  // TODO: productos sin movimiento 90 días
  return alerts
}

export function buildLatestVentas(ventas, clientes, limit = 8) {
  return [...(ventas || [])]
    .sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
    .slice(0, limit)
    .map((v) => {
      const cli = clientes.find((c) => c.id === v.cliente_id)
      const pago = (v.venta_pagos || [])[0]?.metodo_pago || '—'
      return {
        id: v.id,
        fecha: v.fecha_hora,
        cliente: cli?.nombre || '—',
        pago,
        total: parseFloat(v.total) || 0,
        estado: getVentaEstadoDisplay(v),
      }
    })
}

export function buildLatestCompras(compras, proveedores, limit = 8) {
  return [...(compras || [])]
    .sort((a, b) => new Date(b.fecha_orden) - new Date(a.fecha_orden))
    .slice(0, limit)
    .map((c) => {
      const prov = proveedores.find((p) => p.id === c.proveedor_id)
      return {
        id: c.id,
        fecha: c.fecha_orden,
        proveedor: prov?.nombre_razon_social || '—',
        total: parseFloat(c.total) || 0,
        estado: String(c.estado || 'pendiente').toLowerCase(),
      }
    })
}

export function buildFeaturedProducts(ventas, productos) {
  const top = buildTopProducts(ventas, productos, 5)
  const lowStock = [...(productos || [])]
    .filter((p) => (parseFloat(p.stock_actual) || 0) > 0)
    .sort((a, b) => (parseFloat(a.stock_actual) || 0) - (parseFloat(b.stock_actual) || 0))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      name: p.nombre,
      qty: parseFloat(p.stock_actual) || 0,
      amount: parseFloat(p.precio_venta) || 0,
      type: 'low-stock',
    }))
  return { topSold: top, lowStock }
}

export function buildComparisons({ ventasHoy, ventasAyer, ventasSemana, ventasSemanaPrev, ventasMes, ventasMesPrev }) {
  const pct = (a, b) => formatPctChange(a, b)
  return [
    { id: 'hoy', label: 'Hoy vs ayer', change: pct(sumVentasTotal(ventasHoy), sumVentasTotal(ventasAyer)) },
    { id: 'semana', label: 'Semana vs anterior', change: pct(sumVentasTotal(ventasSemana), sumVentasTotal(ventasSemanaPrev)) },
    { id: 'mes', label: 'Mes vs anterior', change: pct(sumVentasTotal(ventasMes), sumVentasTotal(ventasMesPrev)) },
  ]
}
