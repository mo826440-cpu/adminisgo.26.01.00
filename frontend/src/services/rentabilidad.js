// Consultas de rentabilidad mensual (vista v_rentabilidad_mensual en Supabase)
import { supabase } from './supabase'

/**
 * @param {string | null} orFilter - filtro PostgREST .or(), p. ej. and(anio.eq.2024,mes.eq.3),and(anio.eq.2025,mes.eq.1)
 * @returns {Promise<{ data: unknown[] | null, error: Error | null }>}
 */
export async function getRentabilidadMensual({ orFilter } = {}) {
  try {
    let q = supabase.from('v_rentabilidad_mensual').select('*')
    if (orFilter) {
      q = q.or(orFilter)
    }
    const { data, error } = await q
    if (error) throw error
    return { data: data || [], error: null }
  } catch (e) {
    return { data: null, error: e }
  }
}
