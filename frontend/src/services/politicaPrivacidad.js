// Servicio para gestión de política de privacidad
import { supabase } from './supabase'

/**
 * Obtener la versión actual de política de privacidad
 */
export const obtenerPoliticaPrivacidadActual = async () => {
  try {
    const { data, error } = await supabase.rpc('obtener_politica_privacidad_actual')
    
    if (error) throw error
    
    // La función retorna un array, tomamos el primero
    const politica = data && data.length > 0 ? data[0] : null
    
    return { data: politica, error: null }
  } catch (error) {
    console.error('Error al obtener política de privacidad actual:', error)
    return { data: null, error }
  }
}

/**
 * Obtener una versión específica de política de privacidad
 */
export const obtenerVersionPoliticaPrivacidad = async (version) => {
  try {
    const { data, error } = await supabase
      .from('politica_privacidad')
      .select('*')
      .eq('version', version)
      .single()
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener versión de política de privacidad:', error)
    return { data: null, error }
  }
}

/**
 * Obtener todas las versiones de política de privacidad (solo admins)
 */
export const obtenerTodasLasVersionesPoliticaPrivacidad = async () => {
  try {
    const { data, error } = await supabase
      .from('politica_privacidad')
      .select('*')
      .order('fecha_publicacion', { ascending: false })
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error al obtener todas las versiones de política de privacidad:', error)
    return { data: [], error }
  }
}

