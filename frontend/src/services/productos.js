// Servicio para gestión de productos
import { supabase } from './supabase'

/**
 * Obtener todos los productos
 */
export const getProductos = async () => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        categorias: categoria_id (id, nombre),
        marcas: marca_id (id, nombre)
      `)
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) throw error
    return { data: await adjuntarCodigosBarras(data || []), error: null }
  } catch (error) {
    console.error('Error al obtener productos:', error)
    return { data: null, error }
  }
}

/**
 * Obtener un producto por ID
 */
export const getProducto = async (id) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        categorias: categoria_id (id, nombre),
        marcas: marca_id (id, nombre)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    const [conCodigos] = await adjuntarCodigosBarras(data ? [data] : [])
    return { data: conCodigos || null, error: null }
  } catch (error) {
    console.error('Error al obtener producto:', error)
    return { data: null, error }
  }
}

function codigosDesdeColumna(producto) {
  const codigo = String(producto?.codigo_barras ?? '').trim()
  if (!codigo) return []
  return [{ codigo, observacion: '', orden: 0 }]
}

function esTablaCodigosAusente(error) {
  const texto = `${error?.code || ''} ${error?.message || ''}`.toLowerCase()
  return texto.includes('producto_codigos_barras') || texto.includes('pgrst205') || texto.includes('42p01')
}

async function adjuntarCodigosBarras(productos) {
  const lista = Array.isArray(productos) ? productos : []
  if (lista.length === 0) return []

  const ids = lista.map((p) => p.id).filter((id) => id != null)
  const { data, error } = await supabase
    .from('producto_codigos_barras')
    .select('id, producto_id, codigo, observacion, orden')
    .in('producto_id', ids)
    .order('orden', { ascending: true })
    .order('id', { ascending: true })

  if (error) {
    if (!esTablaCodigosAusente(error)) {
      console.error('Error al leer códigos de barras:', error)
    }
    return lista.map((p) => ({ ...p, codigos_barras: codigosDesdeColumna(p) }))
  }

  const porProducto = new Map()
  for (const fila of data || []) {
    const pid = fila.producto_id
    if (!porProducto.has(pid)) porProducto.set(pid, [])
    porProducto.get(pid).push({
      id: fila.id,
      codigo: String(fila.codigo ?? ''),
      observacion: fila.observacion || '',
      orden: fila.orden ?? 0,
    })
  }

  return lista.map((p) => {
    const filas = porProducto.get(p.id) || []
    return {
      ...p,
      codigos_barras: filas.length > 0 ? filas : codigosDesdeColumna(p),
    }
  })
}

async function buscarProductoIdPorCodigo(codigo) {
  const { data, error } = await supabase
    .from('producto_codigos_barras')
    .select('producto_id')
    .eq('codigo', codigo)
    .limit(1)
    .maybeSingle()

  if (error) {
    if (esTablaCodigosAusente(error)) return { productoId: null, error: null }
    throw error
  }
  return { productoId: data?.producto_id ?? null, error: null }
}

/**
 * Producto activo por código de barras (un comercio; RLS aplica).
 */
export const getProductoPorCodigoBarras = async (codigoBarras) => {
  const codigo = (codigoBarras && String(codigoBarras).trim()) || ''
  if (!codigo) {
    return { data: null, error: null }
  }
  try {
    const { productoId } = await buscarProductoIdPorCodigo(codigo)
    let query = supabase
      .from('productos')
      .select(`
        id,
        nombre,
        codigo_barras,
        precio_venta,
        stock_actual,
        categorias: categoria_id (id, nombre),
        marcas: marca_id (id, nombre)
      `)
      .eq('activo', true)
      .limit(1)

    query = productoId ? query.eq('id', productoId) : query.eq('codigo_barras', codigo)
    const { data, error } = await query.maybeSingle()

    if (error) throw error
    if (!data) return { data: null, error: null }
    const [conCodigos] = await adjuntarCodigosBarras([data])
    return { data: conCodigos || null, error: null }
  } catch (error) {
    console.error('Error al buscar producto por código de barras:', error)
    return { data: null, error }
  }
}

const CONSULTA_STOCK_SELECT = `
  id,
  nombre,
  codigo_barras,
  codigo_interno,
  precio_venta,
  stock_actual,
  stock_minimo,
  unidad_medida
`

/**
 * Consulta rápida de stock y precio por código de barras o código interno.
 */
export const consultarProductoStockPrecio = async (codigo) => {
  const valor = String(codigo || '').trim()
  if (!valor) return { data: null, error: null }
  try {
    const { productoId } = await buscarProductoIdPorCodigo(valor)
    const byBarcode = await supabase
      .from('productos')
      .select(CONSULTA_STOCK_SELECT)
      .eq(productoId ? 'id' : 'codigo_barras', productoId || valor)
      .eq('activo', true)
      .limit(1)
      .maybeSingle()
    if (byBarcode.error) throw byBarcode.error
    if (byBarcode.data) {
      const [conCodigos] = await adjuntarCodigosBarras([byBarcode.data])
      return { data: conCodigos || byBarcode.data, error: null }
    }

    const byInterno = await supabase
      .from('productos')
      .select(CONSULTA_STOCK_SELECT)
      .eq('codigo_interno', valor)
      .eq('activo', true)
      .limit(1)
      .maybeSingle()
    if (byInterno.error) throw byInterno.error
    return { data: byInterno.data || null, error: null }
  } catch (error) {
    console.error('Error al consultar stock y precio del producto:', error)
    return { data: null, error }
  }
}

async function idsInactivosConCodigos(codigos, productoIdExcluir = null) {
  const buscados = [...new Set(codigos.map((codigo) => String(codigo ?? '').trim()).filter(Boolean))]
  if (buscados.length === 0) return []

  const ids = new Set()
  let columna = supabase.from('productos').select('id').eq('activo', false).in('codigo_barras', buscados)
  if (productoIdExcluir) columna = columna.neq('id', productoIdExcluir)
  const porColumna = await columna
  if (porColumna.error) throw porColumna.error
  for (const fila of porColumna.data || []) ids.add(fila.id)

  let hijos = supabase
    .from('producto_codigos_barras')
    .select('producto_id, productos!producto_codigos_barras_producto_id_fkey!inner(activo)')
    .in('codigo', buscados)
    .eq('productos.activo', false)
  if (productoIdExcluir) hijos = hijos.neq('producto_id', productoIdExcluir)
  const porHijos = await hijos
  if (porHijos.error) {
    if (!esTablaCodigosAusente(porHijos.error)) throw porHijos.error
  } else {
    for (const fila of porHijos.data || []) {
      if (fila.producto_id != null) ids.add(fila.producto_id)
    }
  }

  return [...ids]
}

/**
 * Un producto dado de baja conserva el registro por el historial, pero suelta sus códigos.
 */
export const liberarCodigosDeProductosInactivos = async (codigos, productoIdExcluir = null) => {
  try {
    const ids = await idsInactivosConCodigos(codigos, productoIdExcluir)
    if (ids.length === 0) return { error: null }

    const borrado = await supabase.from('producto_codigos_barras').delete().in('producto_id', ids)
    if (borrado.error && !esTablaCodigosAusente(borrado.error)) throw borrado.error

    const actualizado = await supabase
      .from('productos')
      .update({ codigo_barras: null })
      .in('id', ids)
      .eq('activo', false)
    if (actualizado.error) throw actualizado.error
    return { error: null }
  } catch (error) {
    console.error('Error al liberar códigos de productos inactivos:', error)
    return { error: error instanceof Error ? error : new Error(error.message || 'Error al liberar códigos') }
  }
}

/**
 * Verificar si un código de barras ya identifica a un producto activo.
 */
export const verificarCodigoBarras = async (codigoBarras, productoIdExcluir = null) => {
  const codigo = String(codigoBarras ?? '').trim()
  if (!codigo) return { existe: false, error: null }
  try {
    let query = supabase
      .from('productos')
      .select('id', { count: 'exact', head: true })
      .eq('activo', true)
      .eq('codigo_barras', codigo)

    if (productoIdExcluir) {
      query = query.neq('id', productoIdExcluir)
    }

    const { count, error } = await query
    if (error) throw error
    if ((count || 0) > 0) return { existe: true, error: null }

    let codigosQuery = supabase
      .from('producto_codigos_barras')
      .select('producto_id, productos!producto_codigos_barras_producto_id_fkey!inner(activo)')
      .eq('codigo', codigo)
      .eq('productos.activo', true)

    if (productoIdExcluir) {
      codigosQuery = codigosQuery.neq('producto_id', productoIdExcluir)
    }

    const codigos = await codigosQuery
    if (codigos.error) {
      if (esTablaCodigosAusente(codigos.error)) return { existe: false, error: null }
      throw codigos.error
    }
    return { existe: (codigos.data || []).length > 0, error: null }
  } catch (error) {
    console.error('Error al verificar código de barras:', error)
    return { existe: false, error }
  }
}

export const reemplazarCodigosBarras = async (productoId, codigos) => {
  const filas = (Array.isArray(codigos) ? codigos : [])
    .map((fila, index) => ({
      producto_id: Number(productoId),
      codigo: String(fila?.codigo ?? '').trim(),
      observacion: String(fila?.observacion ?? '').trim() || null,
      orden: index,
    }))
    .filter((fila) => fila.codigo)

  try {
    const borrado = await supabase
      .from('producto_codigos_barras')
      .delete()
      .eq('producto_id', productoId)

    if (borrado.error) {
      if (esTablaCodigosAusente(borrado.error)) {
        throw new Error(
          'Falta aplicar la migración de códigos de barras en Supabase. El producto se guardó con el primer código.',
        )
      }
      throw borrado.error
    }

    if (filas.length === 0) return { error: null }

    const { error } = await supabase.from('producto_codigos_barras').insert(filas)
    if (error) {
      if (error.code === '23505' || String(error.message || '').includes('codigo_barras_en_uso')) {
        throw new Error('Uno de los códigos de barras ya identifica a otro producto.')
      }
      if (esTablaCodigosAusente(error)) {
        throw new Error(
          'Falta aplicar la migración de códigos de barras en Supabase. El producto se guardó con el primer código.',
        )
      }
      throw error
    }
    return { error: null }
  } catch (error) {
    console.error('Error al guardar códigos de barras:', error)
    return { error: error instanceof Error ? error : new Error(error.message || 'Error al guardar códigos') }
  }
}

/**
 * Verificar si existe un código interno
 */
export const verificarCodigoInterno = async (codigoInterno, productoIdExcluir = null) => {
  try {
    let query = supabase
      .from('productos')
      .select('id', { count: 'exact', head: true })
      .eq('codigo_interno', codigoInterno)
      .eq('activo', true)

    if (productoIdExcluir) {
      query = query.neq('id', productoIdExcluir)
    }

    const { count, error } = await query

    if (error) throw error
    return { existe: (count || 0) > 0, error: null }
  } catch (error) {
    console.error('Error al verificar código interno:', error)
    return { existe: false, error }
  }
}

/**
 * Verificar si existe un producto con el mismo nombre
 */
export const verificarNombreProducto = async (nombre, productoIdExcluir = null) => {
  try {
    let query = supabase
      .from('productos')
      .select('id', { count: 'exact', head: true })
      .eq('nombre', nombre.trim())
      .eq('activo', true)

    if (productoIdExcluir) {
      query = query.neq('id', productoIdExcluir)
    }

    const { count, error } = await query

    if (error) throw error
    return { existe: (count || 0) > 0, error: null }
  } catch (error) {
    console.error('Error al verificar nombre del producto:', error)
    return { existe: false, error }
  }
}

/**
 * Crear un nuevo producto
 */
export const createProducto = async (producto) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .insert([producto])
      .select()
      .single()

    if (error) {
      // Traducir errores comunes de PostgreSQL a mensajes más amigables
      if (error.code === '23505') {
        // Violación de restricción única
        if (error.message.includes('codigo_barras')) {
          throw new Error('El código de barras ya está en uso. Por favor, usa un código diferente.')
        }
        if (error.message.includes('codigo_interno')) {
          throw new Error('El código interno ya está en uso. Por favor, usa un código diferente.')
        }
        throw new Error('Ya existe un producto con estos datos. Por favor, verifica los campos únicos.')
      }
      if (error.code === '42501') {
        throw new Error('No tienes permisos para crear productos.')
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error al crear producto:', error)
    // Si el error ya es un Error con mensaje, retornarlo directamente
    if (error instanceof Error) {
      return { data: null, error }
    }
    // Si es un objeto de error de Supabase, convertir a Error
    return { data: null, error: error instanceof Error ? error : new Error(error.message || 'Error al crear producto') }
  }
}

/**
 * Actualizar precio de venta de varios productos a la vez.
 * @param {Array<number|string>} productoIds
 * @param {number} precioVenta
 */
export const updateProductosPrecioBulk = async (productoIds, precioVenta) => {
  const ids = (Array.isArray(productoIds) ? productoIds : []).filter((id) => id != null)
  const precio = Number(precioVenta)
  if (ids.length === 0) {
    return { data: [], error: new Error('No hay productos seleccionados') }
  }
  if (!Number.isFinite(precio) || precio < 0) {
    return { data: [], error: new Error('Precio inválido') }
  }

  try {
    const responses = await Promise.all(
      ids.map((id) =>
        supabase.from('productos').update({ precio_venta: precio }).eq('id', id).select('id, precio_venta').single(),
      ),
    )
    const failed = responses.find((r) => r.error)
    if (failed?.error) throw failed.error
    return { data: responses.map((r) => r.data).filter(Boolean), error: null }
  } catch (error) {
    console.error('Error al actualizar precios en lote:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error(error.message || 'Error al actualizar precios'),
    }
  }
}

/**
 * Actualizar un producto
 */
export const updateProducto = async (id, producto) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .update(producto)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      // Traducir errores comunes de PostgreSQL a mensajes más amigables
      if (error.code === '23505') {
        // Violación de restricción única
        if (error.message.includes('codigo_barras')) {
          throw new Error('El código de barras ya está en uso. Por favor, usa un código diferente.')
        }
        if (error.message.includes('codigo_interno')) {
          throw new Error('El código interno ya está en uso. Por favor, usa un código diferente.')
        }
        throw new Error('Ya existe un producto con estos datos. Por favor, verifica los campos únicos.')
      }
      if (error.code === '42501') {
        throw new Error('No tienes permisos para actualizar productos.')
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error al actualizar producto:', error)
    // Si el error ya es un Error con mensaje, retornarlo directamente
    if (error instanceof Error) {
      return { data: null, error }
    }
    // Si es un objeto de error de Supabase, convertir a Error
    return { data: null, error: error instanceof Error ? error : new Error(error.message || 'Error al actualizar producto') }
  }
}

/**
 * Eliminar un producto (soft delete - actualizar activo a false)
 */
export const deleteProducto = async (id) => {
  try {
    const borrado = await supabase.from('producto_codigos_barras').delete().eq('producto_id', id)
    if (borrado.error && !esTablaCodigosAusente(borrado.error)) throw borrado.error

    const { data, error } = await supabase
      .from('productos')
      .update({ activo: false, codigo_barras: null })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al eliminar producto:', error)
    return { data: null, error }
  }
}

/**
 * Obtener categorías
 */
export const getCategorias = async () => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener categorías:', error)
    return { data: null, error }
  }
}

/**
 * Obtener marcas
 */
export const getMarcas = async () => {
  try {
    const { data, error } = await supabase
      .from('marcas')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener marcas:', error)
    return { data: null, error }
  }
}

/**
 * Producto marcado como preferible (default al cargar ventas).
 */
export const getProductoPreferible = async () => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias(nombre), marcas(nombre)')
      .eq('activo', true)
      .eq('preferible', true)
      .maybeSingle()

    if (error) throw error
    const [conCodigos] = await adjuntarCodigosBarras(data ? [data] : [])
    return { data: conCodigos || null, error: null }
  } catch (error) {
    console.error('Error al obtener producto preferible:', error)
    return { data: null, error }
  }
}
