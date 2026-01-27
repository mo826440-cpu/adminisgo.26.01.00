// Servicio para gestión de usuarios adicionales
import { supabase } from './supabase'

/**
 * Obtener usuarios adicionales del comercio actual
 */
export const obtenerUsuariosAdicionales = async (comercioId = null) => {
  try {
    const { data, error } = await supabase.rpc('obtener_usuarios_adicionales', {
      p_comercio_id: comercioId
    })
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error al obtener usuarios adicionales:', error)
    return { data: [], error }
  }
}

/**
 * Validar si un usuario adicional puede cambiar sus datos
 */
export const validarCambiosDisponibles = async (usuarioAdicionalId) => {
  try {
    const { data, error } = await supabase.rpc('validar_cambios_disponibles', {
      p_usuario_adicional_id: usuarioAdicionalId
    })
    
    if (error) throw error
    return { data: data || false, error: null }
  } catch (error) {
    console.error('Error al validar cambios disponibles:', error)
    return { data: false, error }
  }
}

/**
 * Cambiar datos de un usuario adicional
 * @param {number} usuarioAdicionalId - ID del usuario adicional
 * @param {string} nombreNuevo - Nuevo nombre
 * @param {string} emailNuevo - Nuevo email (opcional)
 */
export const cambiarDatosUsuarioAdicional = async (usuarioAdicionalId, nombreNuevo, emailNuevo = null) => {
  try {
    const { data, error } = await supabase.rpc('cambiar_datos_usuario_adicional', {
      p_usuario_adicional_id: usuarioAdicionalId,
      p_nombre_nuevo: nombreNuevo,
      p_email_nuevo: emailNuevo
    })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al cambiar datos de usuario adicional:', error)
    return { data: null, error }
  }
}

/**
 * Crear usuario adicional
 * @param {Object} datosUsuario - Datos del usuario adicional
 * @param {string} datosUsuario.nombre - Nombre del usuario
 * @param {string} datosUsuario.email - Email (opcional, solo si tiene login)
 * @param {boolean} datosUsuario.tieneLogin - Si tiene login en Supabase Auth
 */
export const crearUsuarioAdicional = async (datosUsuario) => {
  try {
    // Obtener comercio_id del usuario actual
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('comercio_id')
      .single()
    
    if (!usuario || !usuario.comercio_id) {
      throw new Error('No se encontró el comercio del usuario')
    }
    
    const { data, error } = await supabase
      .from('usuarios_adicionales')
      .insert({
        comercio_id: usuario.comercio_id,
        nombre: datosUsuario.nombre,
        email: datosUsuario.email || null,
        tiene_login: datosUsuario.tieneLogin || false,
        usuario_auth_id: null, // Se asignará después si tiene login
        cambios_realizados: 0,
        ultimo_reseteo_cambios: new Date().toISOString().split('T')[0],
        activo: true
      })
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al crear usuario adicional:', error)
    return { data: null, error }
  }
}

/**
 * Desactivar usuario adicional (cancelar puesto)
 */
export const desactivarUsuarioAdicional = async (usuarioAdicionalId) => {
  try {
    const { data, error } = await supabase
      .from('usuarios_adicionales')
      .update({ activo: false })
      .eq('id', usuarioAdicionalId)
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al desactivar usuario adicional:', error)
    return { data: null, error }
  }
}

/**
 * Reactivar usuario adicional
 */
export const reactivarUsuarioAdicional = async (usuarioAdicionalId) => {
  try {
    const { data, error } = await supabase
      .from('usuarios_adicionales')
      .update({ activo: true })
      .eq('id', usuarioAdicionalId)
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al reactivar usuario adicional:', error)
    return { data: null, error }
  }
}

/**
 * Obtener historial de cambios de un usuario adicional
 */
export const obtenerHistorialCambiosUsuario = async (usuarioAdicionalId) => {
  try {
    const { data, error } = await supabase
      .from('historial_cambios_usuario')
      .select('*')
      .eq('usuario_adicional_id', usuarioAdicionalId)
      .order('fecha_cambio', { ascending: false })
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error al obtener historial de cambios:', error)
    return { data: [], error }
  }
}

