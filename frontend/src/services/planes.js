// Servicio para gestión de planes y suscripciones
import { supabase } from './supabase'

/**
 * Obtener todos los planes disponibles
 */
export const getPlanes = async () => {
  try {
    const { data, error } = await supabase
      .from('planes')
      .select('*')
      .eq('activo', true)
      .order('id')

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener planes:', error)
    return { data: null, error }
  }
}

/**
 * Obtener plan por ID
 */
export const getPlanById = async (planId) => {
  try {
    const { data, error } = await supabase
      .from('planes')
      .select('*')
      .eq('id', planId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener plan:', error)
    return { data: null, error }
  }
}

/**
 * Obtener estado de suscripción del comercio actual
 */
export const getEstadoSuscripcion = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    // Obtener comercio_id del usuario
    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuarios')
      .select('comercio_id')
      .eq('id', user.id)
      .single()

    if (errorUsuario) throw errorUsuario
    if (!usuario) throw new Error('Usuario no encontrado')

    // Llamar a la función de PostgreSQL
    const { data, error } = await supabase.rpc('obtener_estado_suscripcion', {
      p_comercio_id: usuario.comercio_id
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener estado de suscripción:', error)
    return { data: null, error }
  }
}

/**
 * Validar si puede crear una venta
 */
export const validarLimiteVentas = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    // Obtener comercio_id del usuario
    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuarios')
      .select('comercio_id')
      .eq('id', user.id)
      .single()

    if (errorUsuario) throw errorUsuario
    if (!usuario) throw new Error('Usuario no encontrado')

    // Llamar a la función de validación
    const { data, error } = await supabase.rpc('validar_limite_ventas_mensuales', {
      p_comercio_id: usuario.comercio_id
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al validar límite de ventas:', error)
    return { data: null, error }
  }
}

/**
 * Validar si puede crear un usuario
 */
export const validarLimiteUsuarios = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    // Obtener comercio_id del usuario
    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuarios')
      .select('comercio_id')
      .eq('id', user.id)
      .single()

    if (errorUsuario) throw errorUsuario
    if (!usuario) throw new Error('Usuario no encontrado')

    // Llamar a la función de validación
    const { data, error } = await supabase.rpc('validar_limite_usuarios', {
      p_comercio_id: usuario.comercio_id
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al validar límite de usuarios:', error)
    return { data: null, error }
  }
}

/**
 * Crear solicitud de plan personalizado
 */
export const crearSolicitudPersonalizada = async (solicitudData) => {
  try {
    const { data, error } = await supabase
      .from('solicitudes_personalizadas')
      .insert([{
        nombre: solicitudData.nombre,
        email: solicitudData.email,
        telefono: solicitudData.telefono,
        mensaje: solicitudData.mensaje,
        estado: 'pendiente'
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al crear solicitud personalizada:', error)
    return { data: null, error }
  }
}

