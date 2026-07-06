export const DEFAULT_FILTERS = {
  fechaDesde: '',
  fechaHasta: '',
  sucursal: '',
  clienteId: '',
  proveedorId: '',
  categoriaId: '',
  marcaId: '',
  productoId: '',
  vendedorId: '',
  metodoPago: '',
  estadoVenta: '',
  estadoCompra: '',
  activo: '',
}

export function filterVentas(ventas, filters, catalogos = {}) {
  const { productos = [], categorias = [], marcas = [], clientes = [] } = catalogos
  let list = Array.isArray(ventas) ? [...ventas] : []

  if (filters.clienteId) {
    list = list.filter((v) => String(v.cliente_id || '') === String(filters.clienteId))
  }
  if (filters.productoId) {
    list = list.filter((v) =>
      (v.venta_items || []).some((it) => String(it.producto_id) === String(filters.productoId)),
    )
  }
  if (filters.categoriaId) {
    list = list.filter((v) =>
      (v.venta_items || []).some((it) => {
        const p = productos.find((pr) => pr.id === it.producto_id)
        return String(p?.categoria_id || '') === String(filters.categoriaId)
      }),
    )
  }
  if (filters.marcaId) {
    list = list.filter((v) =>
      (v.venta_items || []).some((it) => {
        const p = productos.find((pr) => pr.id === it.producto_id)
        return String(p?.marca_id || '') === String(filters.marcaId)
      }),
    )
  }
  if (filters.metodoPago) {
    const norm = String(filters.metodoPago).trim().toLowerCase()
    list = list.filter((v) =>
      (v.venta_pagos || []).some(
        (p) => String(p.metodo_pago || '').trim().toLowerCase() === norm,
      ),
    )
  }
  if (filters.estadoVenta) {
    list = list.filter((v) => {
      const e = String(v.estado || '').toLowerCase()
      if (filters.estadoVenta === 'cancelada') return e === 'cancelada'
      if (filters.estadoVenta === 'pendiente') {
        const total = parseFloat(v.total) || 0
        const pagado = parseFloat(v.monto_pagado) || 0
        return e !== 'cancelada' && total - pagado > 0.01
      }
      if (filters.estadoVenta === 'pagada') {
        const total = parseFloat(v.total) || 0
        const pagado = parseFloat(v.monto_pagado) || 0
        return e !== 'cancelada' && total - pagado <= 0.01
      }
      return true
    })
  }
  // TODO: filtro sucursal cuando exista campo en ventas
  // TODO: filtro vendedor cuando exista usuario_id en ventas expuesto al dashboard
  void clientes
  return list
}

export function filterCompras(compras, filters, catalogos = {}) {
  const { productos = [] } = catalogos
  let list = Array.isArray(compras) ? [...compras] : []

  if (filters.proveedorId) {
    list = list.filter((c) => String(c.proveedor_id || '') === String(filters.proveedorId))
  }
  if (filters.productoId) {
    list = list.filter((c) =>
      (c.compra_items || []).some((it) => String(it.producto_id) === String(filters.productoId)),
    )
  }
  if (filters.categoriaId) {
    list = list.filter((c) =>
      (c.compra_items || []).some((it) => {
        const p = productos.find((pr) => pr.id === it.producto_id)
        return String(p?.categoria_id || '') === String(filters.categoriaId)
      }),
    )
  }
  if (filters.marcaId) {
    list = list.filter((c) =>
      (c.compra_items || []).some((it) => {
        const p = productos.find((pr) => pr.id === it.producto_id)
        return String(p?.marca_id || '') === String(filters.marcaId)
      }),
    )
  }
  if (filters.metodoPago) {
    const norm = String(filters.metodoPago).trim().toLowerCase()
    list = list.filter((c) =>
      (c.compra_pagos || []).some(
        (p) => String(p.metodo_pago || '').trim().toLowerCase() === norm,
      ),
    )
  }
  if (filters.estadoCompra) {
    list = list.filter((c) => String(c.estado || '').toLowerCase() === filters.estadoCompra)
  }
  return list
}

export function filterProductos(productos, filters) {
  let list = Array.isArray(productos) ? [...productos] : []
  if (filters.categoriaId) {
    list = list.filter((p) => String(p.categoria_id || '') === String(filters.categoriaId))
  }
  if (filters.marcaId) {
    list = list.filter((p) => String(p.marca_id || '') === String(filters.marcaId))
  }
  if (filters.productoId) {
    list = list.filter((p) => String(p.id) === String(filters.productoId))
  }
  if (filters.activo === 'activo') list = list.filter((p) => p.activo !== false)
  if (filters.activo === 'inactivo') list = list.filter((p) => p.activo === false)
  return list
}
