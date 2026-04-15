// Servicio: otros costos (tabla con RLS solo dueño)
import { supabase } from './supabase'

const TIPOS = ['Fijo', 'Variable', 'Inversión']

/**
 * @param {{ tipo?: string, fechaDesde?: string, fechaHasta?: string }} filtros
 * - tipo: valor del enum o vacío / 'todos' para no filtrar
 * - fechaDesde / fechaHasta: 'YYYY-MM-DD' en hora local (inicio/fin de día)
 */
export const getOtrosCostos = async (filtros = {}) => {
  try {
    let q = supabase.from('otros_costos').select('*').order('created_at', { ascending: false })

    const tipo = filtros.tipo
    if (tipo && tipo !== 'todos' && TIPOS.includes(tipo)) {
      q = q.eq('tipo', tipo)
    }

    const fd = filtros.fechaDesde?.trim()
    const fh = filtros.fechaHasta?.trim()
    if (fd) {
      const [y, m, d] = fd.split('-').map(Number)
      const inicio = new Date(y, m - 1, d, 0, 0, 0, 0)
      q = q.gte('created_at', inicio.toISOString())
    }
    if (fh) {
      const [y, m, d] = fh.split('-').map(Number)
      const fin = new Date(y, m - 1, d, 23, 59, 59, 999)
      q = q.lte('created_at', fin.toISOString())
    }

    const { data, error } = await q
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error al obtener otros costos:', error)
    return { data: null, error }
  }
}

/**
 * @param {{ comercio_id: number, usuario_id: string, tipo: string, descripcion: string, costo: number }} row
 */
export const createOtroCosto = async (row) => {
  try {
    const { data, error } = await supabase
      .from('otros_costos')
      .insert([
        {
          comercio_id: row.comercio_id,
          usuario_id: row.usuario_id,
          tipo: row.tipo,
          descripcion: String(row.descripcion || '').trim(),
          costo: row.costo,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al crear otro costo:', error)
    return { data: null, error }
  }
}

export const deleteOtroCosto = async (id) => {
  try {
    const { error } = await supabase.from('otros_costos').delete().eq('id', id)
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error al eliminar otro costo:', error)
    return { error }
  }
}

export const OTROS_COSTOS_TIPOS = TIPOS
