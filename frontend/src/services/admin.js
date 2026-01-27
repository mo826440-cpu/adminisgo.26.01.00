// Servicio para gestión de administradores globales
import { supabase } from './supabase'

/**
 * Verificar si el usuario actual es admin global
 */
export const esAdminGlobal = async () => {
  try {
    const { data, error } = await supabase.rpc('es_admin_global')
    
    if (error) throw error
    return { data: data || false, error: null }
  } catch (error) {
    console.error('Error al verificar si es admin global:', error)
    return { data: false, error }
  }
}

/**
 * Obtener notificaciones del admin actual
 */
export const obtenerNotificacionesAdmin = async () => {
  try {
    const { data, error } = await supabase.rpc('obtener_notificaciones_admin')
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error al obtener notificaciones admin:', error)
    return { data: [], error }
  }
}

/**
 * Contar notificaciones no leídas del admin actual
 */
export const contarNotificacionesNoLeidas = async () => {
  try {
    const { data, error } = await supabase.rpc('contar_notificaciones_no_leidas')
    
    if (error) throw error
    return { data: data || 0, error: null }
  } catch (error) {
    console.error('Error al contar notificaciones no leídas:', error)
    return { data: 0, error }
  }
}

/**
 * Marcar notificación como leída
 */
export const marcarNotificacionLeida = async (notificacionId) => {
  try {
    const { data, error } = await supabase.rpc('marcar_notificacion_leida', {
      p_notificacion_id: notificacionId
    })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error)
    return { data: null, error }
  }
}

/**
 * Obtener todas las solicitudes de planes personalizados (solo admins)
 */
export const obtenerSolicitudesPlanesPersonalizados = async () => {
  try {
    const { data, error } = await supabase
      .from('solicitudes_personalizadas')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error al obtener solicitudes de planes personalizados:', error)
    return { data: [], error }
  }
}

/**
 * Obtener todos los usuarios (solo admins)
 */
export const obtenerTodosLosUsuarios = async () => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        comercios (*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error al obtener todos los usuarios:', error)
    return { data: [], error }
  }
}

