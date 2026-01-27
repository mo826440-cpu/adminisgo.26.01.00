// Servicio para gestión de términos y condiciones
import { supabase } from './supabase'

/**
 * Obtener la versión actual de términos y condiciones
 */
export const obtenerTerminosActuales = async () => {
  try {
    const { data, error } = await supabase.rpc('obtener_terminos_actuales')
    
    if (error) throw error
    
    // La función retorna un array, tomamos el primero
    const terminos = data && data.length > 0 ? data[0] : null
    
    return { data: terminos, error: null }
  } catch (error) {
    console.error('Error al obtener términos actuales:', error)
    return { data: null, error }
  }
}

/**
 * Obtener una versión específica de términos
 */
export const obtenerVersionTerminos = async (version) => {
  try {
    const { data, error } = await supabase
      .from('terminos_condiciones')
      .select('*')
      .eq('version', version)
      .single()
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener versión de términos:', error)
    return { data: null, error }
  }
}

/**
 * Obtener todas las versiones de términos (solo admins)
 */
export const obtenerTodasLasVersionesTerminos = async () => {
  try {
    const { data, error } = await supabase
      .from('terminos_condiciones')
      .select('*')
      .order('fecha_publicacion', { ascending: false })
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error al obtener todas las versiones de términos:', error)
    return { data: [], error }
  }
}

