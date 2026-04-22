// Servicio para gestión de ventas
import { supabase } from './supabase'
import { validarLimiteVentas } from './planes'

/** PostgREST/Supabase suele limitar a 1000 filas por respuesta si no se pagina */
const SUPABASE_PAGE_SIZE = 1000

/** Errores transitorios del pooler (PgBouncer / Supavisor modo transacción) o red */
function isTransientQueryError(error) {
  if (!error) return false
  const parts = [error.message, error.details, error.hint, error.code]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase())
  const msg = parts.join(' ')
  const code = String(error.code || '')
  const status = Number(error.status || error.statusCode || 0)
  // PostgREST a veces devuelve 500 genérico; el detalle va en `details` o queda vacío.
  if ([500, 502, 503, 504].includes(status)) {
    if (
      msg.includes('prepared') ||
      msg.includes('prepstmt') ||
      msg.includes('declaración') ||
      msg.includes('caducad') ||
      (msg.includes('statement') && msg.includes('exist')) ||
      msg.includes('connection reset') ||
      msg.includes('econnreset') ||
      msg.includes('upstream') ||
      msg.includes('temporarily unavailable') ||
      msg.includes('timeout') ||
      msg.includes('timed out') ||
      msg.includes('ssl') ||
      msg.trim().length === 0
    ) {
      return true
    }
  }
  return (
    msg.includes('prepared statement') ||
    msg.includes('declaración ha caducado') ||
    msg.includes('declaración debido') ||
    msg.includes('connection reset') ||
    msg.includes('econnreset') ||
    code === '57014' ||
    code === '08P01' ||
    code === '57P01'
  )
}

/**
 * Una página `.range(from, from+pageSize-1)` con reintentos ante pooler/5xx.
 * @param {() => ReturnType<typeof supabase.from>} makeQuery
 */
async function fetchSinglePageWithRetries(makeQuery, from, pageSize) {
  let chunk = null
  let lastError = null
  const st500 = (err) =>
    [500, 502, 503, 504].includes(Number(err?.status || err?.statusCode || 0))
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await makeQuery().range(from, from + pageSize - 1)
    if (!error) {
      chunk = data || []
      break
    }
    lastError = error
    const transient = isTransientQueryError(error)
    const generic5xx = st500(error) && attempt < 2
    const shouldRetry = transient || generic5xx
    if (!shouldRetry || attempt === 4) {
      throw error
    }
    await new Promise((r) => setTimeout(r, 150 * (attempt + 1)))
  }
  if (!Array.isArray(chunk)) {
    throw lastError || new Error('fetchSinglePageWithRetries: sin respuesta')
  }
  return chunk
}

/**
 * Repite la consulta con .range() hasta obtener todas las filas.
 * Reintenta ante fallos transitorios del pooler (varias páginas seguidas suelen dispararlos).
 * @param {() => ReturnType<typeof supabase.from>} makeQuery - builder sin .range()
 * @param {{ interPageDelayMs?: number, parallel?: boolean, maxParallel?: number }} [pageOpts] -
 *   `interPageDelayMs` (default 100): pausa entre páginas en modo secuencial.
 *   `parallel: true`: tras la primera página, pide el resto en lotes paralelos (mejor para listados con miles de filas).
 */
async function fetchAllQueryPages(makeQuery, pageSize = SUPABASE_PAGE_SIZE, pageOpts = {}) {
  const interPageDelayMs = pageOpts.interPageDelayMs ?? 100
  const parallel = pageOpts.parallel === true
  const maxParallel = Math.min(12, Math.max(1, pageOpts.maxParallel ?? 6))

  if (parallel) {
    const first = await fetchSinglePageWithRetries(makeQuery, 0, pageSize)
    const all = [...first]
    if (first.length < pageSize) return all
    let nextFrom = pageSize
    for (;;) {
      const froms = []
      for (let i = 0; i < maxParallel; i++) {
        froms.push(nextFrom + i * pageSize)
      }
      const chunks = await Promise.all(
        froms.map((from) => fetchSinglePageWithRetries(makeQuery, from, pageSize))
      )
      for (const c of chunks) {
        all.push(...c)
        if (c.length < pageSize) return all
      }
      nextFrom += maxParallel * pageSize
    }
  }

  const all = []
  let from = 0
  for (;;) {
    const chunk = await fetchSinglePageWithRetries(makeQuery, from, pageSize)
    all.push(...chunk)
    if (chunk.length < pageSize) break
    from += pageSize
    if (interPageDelayMs > 0) {
      await new Promise((r) => setTimeout(r, interPageDelayMs))
    }
  }
  return all
}

/**
 * Suma de cantidades en venta_items. Si no hay ítems (p. ej. venta rápida sin
 * desglose por producto), se usa 1 cuando total > 0 para listados y gráficos.
 */
function computeVentaUnidadesTotales(venta) {
  const items = venta.venta_items || []
  if (items.length === 0) {
    const total = parseFloat(venta.total)
    return Number.isFinite(total) && total > 0 ? 1 : 0
  }
  return items.reduce((sum, item) => sum + (parseFloat(item.cantidad) || 0), 0)
}

/**
 * PostgREST suele devolver 500 en `ventas` paginadas con offset alto si el select
 * incluye embeds (`clientes`, `usuarios`). Esta función carga solo `id, nombre`
 * por lotes y arma la misma forma `{ clientes, usuarios }` que el embed.
 *
 * @param {Array<Record<string, unknown>>} rows - filas con `cliente_id` y `usuario_id`
 */
export async function hydrateVentasRowsWithClienteUsuarioNombre(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return []

  const clienteIds = [
    ...new Set(rows.map((v) => v.cliente_id).filter((id) => id != null && id !== undefined)),
  ]
  const usuarioIds = [...new Set(rows.map((v) => v.usuario_id).filter(Boolean))]

  const clientesMap = new Map()
  const usuariosMap = new Map()

  if (clienteIds.length > 0) {
    const resp = await Promise.all(
      chunkIds(clienteIds, 500).map((chunk) =>
        supabase.from('clientes').select('id, nombre').in('id', chunk)
      )
    )
    for (const { data, error } of resp) {
      if (error) throw error
      for (const c of data || []) clientesMap.set(Number(c.id), c.nombre)
    }
  }

  if (usuarioIds.length > 0) {
    const resp = await Promise.all(
      chunkIds(usuarioIds, 200).map((chunk) =>
        supabase.from('usuarios').select('id, nombre').in('id', chunk)
      )
    )
    for (const { data, error } of resp) {
      if (error) throw error
      for (const u of data || []) usuariosMap.set(String(u.id), u.nombre)
    }
  }

  return rows.map((v) => ({
    ...v,
    clientes:
      v.cliente_id != null
        ? { id: v.cliente_id, nombre: clientesMap.get(Number(v.cliente_id)) ?? null }
        : null,
    usuarios:
      v.usuario_id != null
        ? { id: v.usuario_id, nombre: usuariosMap.get(String(v.usuario_id)) ?? null }
        : null,
  }))
}

/**
 * Crear una nueva venta
 * Esta función crea la venta y los items asociados en una transacción
 */
export const createVenta = async (ventaData) => {
  try {
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    // Validar límite de ventas mensuales
    const { data: validacion, error: errorValidacion } = await validarLimiteVentas()
    if (errorValidacion) {
      throw new Error(`Error al validar límite: ${errorValidacion.message}`)
    }
    
    if (validacion && !validacion.puede_crear) {
      const error = new Error(validacion.mensaje || 'Has alcanzado el límite de ventas mensuales')
      error.tipo = validacion.tipo_error || 'limite_ventas'
      error.detalles = validacion
      throw error
    }

    // Generar número de ticket único (formato: TICKET-YYYYMMDD-HHMMSS-XXXX)
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const numeroTicket = `TICKET-${dateStr}-${timeStr}-${random}`

    const facturacion = ventaData.facturacion?.trim() || null
    const metodosPagoArr = Array.isArray(ventaData.pagos) ? ventaData.pagos : []
    const metodosUnicos = [...new Set(metodosPagoArr.map(p => String(p.metodo_pago || '').trim()).filter(Boolean))]

    // Preparar datos de la venta
    const venta = {
      numero_ticket: numeroTicket,
      cliente_id: ventaData.cliente_id || null,
      usuario_id: user.id,
      fecha_hora: ventaData.fecha_hora || undefined,
      facturacion,
      subtotal: ventaData.subtotal || 0,
      descuento: ventaData.descuento || 0,
      impuestos: ventaData.impuestos || 0,
      total: ventaData.total || 0,
      metodo_pago: metodosUnicos.length > 0 ? metodosUnicos.join(', ') : (ventaData.metodo_pago || 'efectivo'),
      estado: 'completada',
      observaciones: ventaData.observaciones || null
    }

    // Crear la venta
    const { data: ventaCreada, error: errorVenta } = await supabase
      .from('ventas')
      .insert([venta])
      .select()
      .single()

    if (errorVenta) {
      throw errorVenta
    }

    // Crear los items de la venta
    if (ventaData.items && ventaData.items.length > 0) {
      const items = ventaData.items.map(item => ({
        venta_id: ventaCreada.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        descuento: item.descuento || 0,
        subtotal: item.subtotal
      }))

      const { error: errorItems } = await supabase
        .from('venta_items')
        .insert(items)

      if (errorItems) {
        // Si hay error al crear items, eliminar la venta creada
        await supabase.from('ventas').delete().eq('id', ventaCreada.id)
        throw errorItems
      }

      // Actualizar stock de productos
      for (const item of ventaData.items) {
        // Obtener stock actual del producto
        const { data: producto, error: errorProducto } = await supabase
          .from('productos')
          .select('stock_actual')
          .eq('id', item.producto_id)
          .single()

        if (errorProducto) {
          console.error('Error al obtener producto:', errorProducto)
          continue
        }

        const nuevoStock = (producto.stock_actual || 0) - item.cantidad

        // Actualizar stock
        const { error: errorStock } = await supabase
          .from('productos')
          .update({ stock_actual: nuevoStock < 0 ? 0 : nuevoStock })
          .eq('id', item.producto_id)

        if (errorStock) {
          console.error('Error al actualizar stock:', errorStock)
          // No lanzar error aquí para no romper la transacción, solo loguear
        }
      }
    }

    // Crear pagos (venta_pagos) si se envían
    if (metodosPagoArr.length > 0) {
      const pagosRows = metodosPagoArr.map(p => ({
        venta_id: ventaCreada.id,
        metodo_pago: String(p.metodo_pago || '').trim(),
        monto_pagado: parseFloat(p.monto_pagado || 0) || 0,
        fecha_pago: p.fecha_pago || new Date().toISOString(),
        observaciones: p.observaciones || null
      }))

      const { error: errorPagos } = await supabase
        .from('venta_pagos')
        .insert(pagosRows)

      if (errorPagos) {
        // Borrar venta: CASCADE borra items/pagos
        await supabase.from('ventas').delete().eq('id', ventaCreada.id)
        throw errorPagos
      }
    }

    return { data: ventaCreada, error: null }
  } catch (error) {
    console.error('Error al crear venta:', error)
    // Mensajes más claros para constraints comunes
    if (error?.code === '23505') {
      if (String(error.message || '').toLowerCase().includes('idx_ventas_comercio_facturacion_unique')) {
        return { data: null, error: new Error('La facturación ya está en uso. Por favor, usá un número diferente.') }
      }
      return { data: null, error: new Error('Ya existe un registro con datos duplicados. Revisá los campos únicos.') }
    }
    return { data: null, error }
  }
}

/**
 * Listado de ventas para la pantalla de registros.
 * Filtra por rango de fechas en servidor (evita descargar todo el historial).
 * Sin embed de venta_items en la query paginada (payload y RLS mucho más livianos).
 * Las unidades: preferís la RPC `ventas_listado_unidades_agg` (migración 039) en una sola
 * ida a la base; si no existe o falla, se usa el plan B (consultas por lotes a venta_items).
 *
 * Rango por defecto (últimos 3 meses): coincide con el texto de la UI de ventas y evita
 * barrer toda la tabla `ventas` (antes el listado filtraba solo en cliente y podía tardar
 * minutos con mucho historial, sobre todo con RLS por módulo en Supabase).
 *
 * @param {{ fechaDesde?: string, fechaHasta?: string }} [opts] - 'YYYY-MM-DD' en calendario local; si falta una fecha, últimos 3 meses
 */
export const getVentas = async (opts = {}) => {
  try {
    let { fechaDesde, fechaHasta } = opts
    if (!fechaDesde || !fechaHasta) {
      const d = defaultVentasListYmdRange()
      fechaDesde = d.fechaDesde
      fechaHasta = d.fechaHasta
    }

    const { inicio, fin, queryStart, queryEnd } = boundsFromYmdStrings(fechaDesde, fechaHasta)

    const ventasBase = await fetchAllQueryPages(
      () =>
        (
          supabase
            .from('ventas')
            .select(`
        id,
        fecha_hora,
        facturacion,
        subtotal,
        descuento,
        impuestos,
        total,
        metodo_pago,
        monto_pagado,
        monto_deuda,
        estado,
        observaciones,
        numero_ticket,
        cliente_id,
        usuario_id,
        comercio_id
      `)
            .is('deleted_at', null)
            .gte('fecha_hora', queryStart.toISOString())
            .lte('fecha_hora', queryEnd.toISOString())
            .order('fecha_hora', { ascending: false })
        ),
      SUPABASE_PAGE_SIZE,
      // Secuencial: varias peticiones paralelas a `ventas` + RLS 038 saturan el pool y dan 500.
      { interPageDelayMs: 0 }
    )

    const enRango = (ventasBase || []).filter((venta) => {
      if (!venta.fecha_hora) return false
      const fv = new Date(venta.fecha_hora)
      return fv >= inicio && fv <= fin
    })

    if (enRango.length === 0) {
      return { data: [], error: null }
    }

    const enRangoHydrated = await hydrateVentasRowsWithClienteUsuarioNombre(enRango)

    const ids = enRangoHydrated.map((v) => v.id).filter((id) => id != null)

    const { data: aggRows, error: aggErr } = await supabase.rpc('ventas_listado_unidades_agg', {
      p_desde: queryStart.toISOString(),
      p_hasta: queryEnd.toISOString(),
    })

    const useAggRpc = !aggErr && Array.isArray(aggRows)
    const sumCantidadByVentaId = new Map()
    if (useAggRpc) {
      for (const row of aggRows) {
        if (row?.venta_id == null) continue
        sumCantidadByVentaId.set(Number(row.venta_id), parseFloat(row.suma_cantidad) || 0)
      }
    }

    const itemsByVentaId = new Map()
    if (!useAggRpc && ids.length > 0) {
      const idChunks = chunkIds(ids, 500)
      const itemResponses = await Promise.all(
        idChunks.map((idsPart) =>
          supabase.from('venta_items').select('venta_id, cantidad').in('venta_id', idsPart)
        )
      )
      const allItems = []
      for (const { data, error } of itemResponses) {
        if (error) throw error
        if (Array.isArray(data)) allItems.push(...data)
      }
      for (const it of allItems) {
        const key = it.venta_id
        if (!itemsByVentaId.has(key)) itemsByVentaId.set(key, [])
        itemsByVentaId.get(key).push(it)
      }
    }

    const ventasConUnidades = enRangoHydrated.map((venta) => {
      if (useAggRpc) {
        const sum = sumCantidadByVentaId.has(venta.id)
          ? sumCantidadByVentaId.get(venta.id)
          : null
        const venta_items =
          sum != null && sum > 0 ? [{ cantidad: sum }] : []
        const hydrated = { ...venta, venta_items }
        return {
          ...hydrated,
          unidades_totales: computeVentaUnidadesTotales(hydrated),
        }
      }
      const venta_items = itemsByVentaId.get(venta.id) || []
      const hydrated = { ...venta, venta_items }
      return {
        ...hydrated,
        unidades_totales: computeVentaUnidadesTotales(hydrated),
      }
    })

    return { data: ventasConUnidades, error: null }
  } catch (error) {
    console.error('Error al obtener ventas:', error)
    return { data: null, error }
  }
}

/**
 * Resumen de ventas del día (cantidad y monto total) - para Dashboard
 * Usa fecha/hora local del navegador.
 */
export const getResumenVentasDelDia = async () => {
  try {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    const { data, error } = await supabase
      .from('ventas')
      .select('id, total')
      .is('deleted_at', null)
      .gte('fecha_hora', startOfDay.toISOString())
      .lte('fecha_hora', endOfDay.toISOString())

    if (error) throw error
    const lista = data || []
    const cantidad = lista.length
    const total = lista.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0)
    return { data: { cantidad, total }, error: null }
  } catch (error) {
    console.error('Error al obtener resumen ventas del día:', error)
    return { data: null, error }
  }
}

/**
 * Ventas de los últimos N días (para gráfico por día) - id, total, fecha_hora y unidades por venta
 */
export const getVentasUltimosDias = async (dias = 7) => {
  try {
    const now = new Date()
    const desde = new Date(now)
    desde.setDate(desde.getDate() - dias)
    desde.setHours(0, 0, 0, 0)
    const data = await fetchAllQueryPages(
      () =>
        (
          supabase
            .from('ventas')
            .select(`
        id,
        total,
        fecha_hora,
        venta_items(cantidad)
      `)
            .is('deleted_at', null)
            .gte('fecha_hora', desde.toISOString())
            .order('fecha_hora', { ascending: true })
        ),
      SUPABASE_PAGE_SIZE,
      { interPageDelayMs: 0 }
    )

    const ventasConUnidades = (data || []).map((venta) => ({
      ...venta,
      unidades_totales: computeVentaUnidadesTotales(venta),
    }))

    return { data: ventasConUnidades, error: null }
  } catch (error) {
    console.error('Error al obtener ventas últimos días:', error)
    return { data: null, error }
  }
}

const MS_DAY = 24 * 60 * 60 * 1000

function chunkIds(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/**
 * Rango YMD por defecto alineado a `VentasList` (filtro inicial ~3 meses).
 * Documentado para el equipo: no cambiar sin revisar la pantalla y la carga en Supabase.
 */
function defaultVentasListYmdRange() {
  const ahora = new Date()
  const desde = new Date(ahora.getFullYear(), ahora.getMonth() - 3, ahora.getDate())
  const y = (d) => d.getFullYear()
  const m = (d) => String(d.getMonth() + 1).padStart(2, '0')
  const day = (d) => String(d.getDate()).padStart(2, '0')
  return {
    fechaDesde: `${y(desde)}-${m(desde)}-${day(desde)}`,
    fechaHasta: `${y(ahora)}-${m(ahora)}-${day(ahora)}`,
  }
}

function boundsFromYmdStrings(fechaDesde, fechaHasta) {
  const [yDesde, mDesde, dDesde] = fechaDesde.split('-').map(Number)
  const [yHasta, mHasta, dHasta] = fechaHasta.split('-').map(Number)
  const inicio = new Date(yDesde, mDesde - 1, dDesde, 0, 0, 0, 0)
  const fin = new Date(yHasta, mHasta - 1, dHasta, 23, 59, 59, 999)
  const queryStart = new Date(inicio.getTime() - 2 * MS_DAY)
  const queryEnd = new Date(fin.getTime() + 2 * MS_DAY)
  return { inicio, fin, queryStart, queryEnd }
}

/**
 * Ventas en un rango de fechas (para gráfico) - con unidades por venta
 * desde/hasta: objetos Date (inicio y fin de día en hora local del usuario).
 *
 * Se filtra en cliente con el mismo criterio que la lista de ventas, porque
 * comparar solo con toISOString() en PostgREST puede desalinear días según zona
 * horaria y cómo quedó guardado fecha_hora.
 */
export const getVentasPorRangoFechas = async (desde, hasta) => {
  try {
    const inicio = new Date(desde)
    inicio.setHours(0, 0, 0, 0)
    const fin = new Date(hasta)
    fin.setHours(23, 59, 59, 999)

    const queryStart = new Date(inicio.getTime() - 2 * MS_DAY)
    const queryEnd = new Date(fin.getTime() + 2 * MS_DAY)

    // IMPORTANTE:
    // Evitamos embeds (venta_items/venta_pagos) en la consulta paginada porque PostgREST
    // puede devolver 500 en offsets altos con joins/embeds pesados. Cargamos detalles en 2 pasos.
    const ventasBase = await fetchAllQueryPages(
      () =>
        (
          supabase
            .from('ventas')
            .select(`
        id,
        total,
        monto_pagado,
        monto_deuda,
        fecha_hora,
        cliente_id,
        estado
      `)
            .is('deleted_at', null)
            .gte('fecha_hora', queryStart.toISOString())
            .lte('fecha_hora', queryEnd.toISOString())
            .order('fecha_hora', { ascending: true })
        ),
      SUPABASE_PAGE_SIZE,
      { interPageDelayMs: 0 }
    )

    const enRango = (ventasBase || []).filter((venta) => {
      if (!venta.fecha_hora) return false
      const fv = new Date(venta.fecha_hora)
      return fv >= inicio && fv <= fin
    })

    const ids = enRango.map((v) => v.id).filter((id) => id != null)

    const itemsByVentaId = new Map()
    const pagosByVentaId = new Map()

    if (ids.length > 0) {
      // PostgREST tiene límites prácticos al tamaño del querystring; chunk 500 para evitar 414/500.
      const idChunks = chunkIds(ids, 500)

      const allItems = []
      for (const idsPart of idChunks) {
        const { data, error } = await supabase
          .from('venta_items')
          .select('venta_id, producto_id, cantidad')
          .in('venta_id', idsPart)
        if (error) throw error
        if (Array.isArray(data)) allItems.push(...data)
      }

      for (const it of allItems) {
        const key = it.venta_id
        if (!itemsByVentaId.has(key)) itemsByVentaId.set(key, [])
        itemsByVentaId.get(key).push(it)
      }

      const allPagos = []
      for (const idsPart of idChunks) {
        const { data, error } = await supabase
          .from('venta_pagos')
          .select('venta_id, metodo_pago, monto_pagado')
          .in('venta_id', idsPart)
        if (error) throw error
        if (Array.isArray(data)) allPagos.push(...data)
      }

      for (const p of allPagos) {
        const key = p.venta_id
        if (!pagosByVentaId.has(key)) pagosByVentaId.set(key, [])
        pagosByVentaId.get(key).push(p)
      }
    }

    const ventasConUnidades = enRango.map((venta) => {
      const venta_items = itemsByVentaId.get(venta.id) || []
      const venta_pagos = pagosByVentaId.get(venta.id) || []
      const hydrated = { ...venta, venta_items, venta_pagos }
      return { ...hydrated, unidades_totales: computeVentaUnidadesTotales(hydrated) }
    })

    return { data: ventasConUnidades, error: null }
  } catch (error) {
    console.error('Error al obtener ventas por rango:', error)
    return { data: null, error }
  }
}

const updateStockByDelta = async (productoId, delta) => {
  const { data: producto, error: errorProducto } = await supabase
    .from('productos')
    .select('stock_actual')
    .eq('id', productoId)
    .single()

  if (errorProducto) {
    throw errorProducto
  }

  const nuevoStock = (producto.stock_actual || 0) + delta

  const { error: errorStock } = await supabase
    .from('productos')
    .update({ stock_actual: nuevoStock < 0 ? 0 : nuevoStock })
    .eq('id', productoId)

  if (errorStock) {
    throw errorStock
  }
}

/**
 * Actualizar una venta y sus items/pagos
 */
export const updateVenta = async (id, ventaData) => {
  try {
    const { data: ventaActual, error: errorVentaActual } = await supabase
      .from('ventas')
      .select('id')
      .eq('id', id)
      .single()

    if (errorVentaActual || !ventaActual) throw errorVentaActual || new Error('Venta no encontrada')

    const { data: itemsActuales, error: errorItemsActuales } = await supabase
      .from('venta_items')
      .select('producto_id, cantidad')
      .eq('venta_id', id)

    if (errorItemsActuales) throw errorItemsActuales

    const facturacion = ventaData.facturacion?.trim() || null
    const metodosPagoArr = Array.isArray(ventaData.pagos) ? ventaData.pagos : []
    const metodosUnicos = [...new Set(metodosPagoArr.map(p => String(p.metodo_pago || '').trim()).filter(Boolean))]

    const ventaUpdate = {
      cliente_id: ventaData.cliente_id || null,
      fecha_hora: ventaData.fecha_hora || undefined,
      facturacion,
      subtotal: ventaData.subtotal || 0,
      descuento: ventaData.descuento || 0,
      impuestos: ventaData.impuestos || 0,
      total: ventaData.total || 0,
      metodo_pago: metodosUnicos.length > 0 ? metodosUnicos.join(', ') : (ventaData.metodo_pago || 'efectivo'),
      observaciones: ventaData.observaciones || null,
      updated_at: new Date().toISOString()
    }

    const { error: errorUpdate } = await supabase
      .from('ventas')
      .update(ventaUpdate)
      .eq('id', id)

    if (errorUpdate) throw errorUpdate

    // Revertir stock previo
    if (itemsActuales && itemsActuales.length > 0) {
      for (const item of itemsActuales) {
        await updateStockByDelta(item.producto_id, parseFloat(item.cantidad || 0))
      }
    }

    // Reemplazar items
    const { error: errorDeleteItems } = await supabase
      .from('venta_items')
      .delete()
      .eq('venta_id', id)

    if (errorDeleteItems) throw errorDeleteItems

    if (ventaData.items && ventaData.items.length > 0) {
      const items = ventaData.items.map(item => ({
        venta_id: id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        descuento: item.descuento || 0,
        subtotal: item.subtotal
      }))

      const { error: errorInsertItems } = await supabase
        .from('venta_items')
        .insert(items)

      if (errorInsertItems) throw errorInsertItems

      // Aplicar nuevo stock
      for (const item of ventaData.items) {
        await updateStockByDelta(item.producto_id, -parseFloat(item.cantidad || 0))
      }
    }

    // Reemplazar pagos
    const { error: errorDeletePagos } = await supabase
      .from('venta_pagos')
      .delete()
      .eq('venta_id', id)

    if (errorDeletePagos) throw errorDeletePagos

    if (metodosPagoArr.length > 0) {
      const pagosRows = metodosPagoArr.map(p => ({
        venta_id: id,
        metodo_pago: String(p.metodo_pago || '').trim(),
        monto_pagado: parseFloat(p.monto_pagado || 0) || 0,
        fecha_pago: p.fecha_pago || new Date().toISOString(),
        observaciones: p.observaciones || null
      }))

      const { error: errorPagos } = await supabase
        .from('venta_pagos')
        .insert(pagosRows)

      if (errorPagos) throw errorPagos
    }

    return { data: { id }, error: null }
  } catch (error) {
    console.error('Error al actualizar venta:', error)
    return { data: null, error }
  }
}

/**
 * Eliminar una venta (soft delete) y restaurar stock
 */
export const deleteVenta = async (id) => {
  try {
    const { data: items, error: errorItems } = await supabase
      .from('venta_items')
      .select('producto_id, cantidad')
      .eq('venta_id', id)

    if (errorItems) throw errorItems

    const { error: errorUpdate } = await supabase
      .from('ventas')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (errorUpdate) throw errorUpdate

    if (items && items.length > 0) {
      for (const item of items) {
        await updateStockByDelta(item.producto_id, parseFloat(item.cantidad || 0))
      }
    }

    return { data: { id }, error: null }
  } catch (error) {
    console.error('Error al eliminar venta:', error)
    return { data: null, error }
  }
}

/**
 * Obtener una venta por ID con sus items
 */
export const getVentaById = async (id) => {
  try {
    const { data: venta, error: errorVenta } = await supabase
      .from('ventas')
      .select(`
        *,
        clientes:cliente_id(nombre, email),
        usuarios:usuario_id(nombre)
      `)
      .eq('id', id)
      .single()

    if (errorVenta) throw errorVenta

    const { data: items, error: errorItems } = await supabase
      .from('venta_items')
      .select(`
        *,
        productos:producto_id(id, nombre, codigo_barras)
      `)
      .eq('venta_id', id)

    if (errorItems) throw errorItems

    const { data: pagos, error: errorPagos } = await supabase
      .from('venta_pagos')
      .select('*')
      .eq('venta_id', id)
      .order('fecha_pago', { ascending: true })

    if (errorPagos) throw errorPagos

    return { 
      data: { ...venta, items: items || [], pagos: pagos || [] }, 
      error: null 
    }
  } catch (error) {
    console.error('Error al obtener venta:', error)
    return { data: null, error }
  }
}
