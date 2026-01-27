// Servicio para gestión de comercio
import { supabase } from './supabase'

/**
 * Crear comercio y usuario después del registro
 * Esta función debe ser llamada después de signUp en auth
 */
export const crearComercioYUsuario = async (datosComercio) => {
  try {
    const { data, error } = await supabase.rpc('crear_comercio_y_usuario', {
      p_nombre_comercio: datosComercio.nombre_comercio,
      p_nombre_usuario: datosComercio.nombre_usuario,
      p_direccion: datosComercio.direccion || null,
      p_telefono: datosComercio.telefono || null,
      p_email_comercio: datosComercio.email_comercio || null,
      p_telefono_usuario: datosComercio.telefono_usuario || null,
      p_plan_id: datosComercio.plan_id || 1  // Por defecto plan gratis
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al crear comercio y usuario:', error)
    return { data: null, error }
  }
}

/**
 * Obtener información del comercio del usuario actual
 */
export const getComercio = async () => {
  try {
    // Log para depuración
    const { data: user } = await supabase.auth.getUser()
    console.log('[getComercio] Usuario autenticado:', user?.user?.id)
    
    const { data, error } = await supabase
      .from('comercios')
      .select('*')
      .maybeSingle() // Usar maybeSingle() en lugar de single() para no lanzar error si no hay registro

    // Log para depuración
    console.log('[getComercio] Resultado de query:', { data, error, errorCode: error?.code })

    // maybeSingle() retorna null en data si no hay registro, pero no lanza error
    if (error && error.code !== 'PGRST116') {
      console.error('[getComercio] Error al obtener comercio:', error)
      throw error
    }
    
    // Si no hay error o el error es "no encontrado", retornar data (puede ser null)
    // IMPORTANTE: Verificar explícitamente que data no sea un objeto vacío o undefined
    const comercio = data && Object.keys(data).length > 0 ? data : null
    console.log('[getComercio] Comercio retornado:', comercio)
    
    return { data: comercio, error: null }
  } catch (error) {
    console.error('[getComercio] Excepción al obtener comercio:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar información del comercio
 */
export const updateComercio = async (datosComercio) => {
  try {
    // Primero obtener el comercio para tener su ID (RLS ya filtra por comercio_id del usuario)
    const { data: comercioActual, error: errorGet } = await supabase
      .from('comercios')
      .select('id')
      .single()

    if (errorGet) throw errorGet

    if (!comercioActual || !comercioActual.id) {
      throw new Error('No se encontró el comercio para actualizar')
    }

    // Ahora actualizar usando el ID
    const { data, error } = await supabase
      .from('comercios')
      .update(datosComercio)
      .eq('id', comercioActual.id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al actualizar comercio:', error)
    return { data: null, error }
  }
}

