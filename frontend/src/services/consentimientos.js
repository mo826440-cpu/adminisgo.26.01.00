// Servicio para gestión de consentimientos
import { supabase } from './supabase'

/**
 * Verificar si el usuario tiene consentimiento actual de términos
 */
export const verificarConsentimientoActual = async () => {
  try {
    const { data, error } = await supabase.rpc('verificar_consentimiento_actual')
    
    if (error) throw error
    return { data: data || false, error: null }
  } catch (error) {
    console.error('Error al verificar consentimiento actual:', error)
    return { data: false, error }
  }
}

/**
 * Obtener consentimiento de términos del usuario actual
 */
export const obtenerConsentimientoTerminos = async () => {
  try {
    const { data, error } = await supabase.rpc('obtener_consentimiento_terminos_usuario')
    
    if (error) throw error
    
    // La función retorna un array, tomamos el primero
    const consentimiento = data && data.length > 0 ? data[0] : null
    
    return { data: consentimiento, error: null }
  } catch (error) {
    console.error('Error al obtener consentimiento de términos:', error)
    return { data: null, error }
  }
}

/**
 * Obtener todos los consentimientos del usuario actual
 */
export const obtenerConsentimientosUsuario = async () => {
  try {
    const { data, error } = await supabase.rpc('obtener_consentimientos_usuario')
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error al obtener consentimientos del usuario:', error)
    return { data: [], error }
  }
}

/**
 * Guardar consentimiento (términos o eliminación de cuenta)
 * @param {Object} datosConsentimiento - Datos del consentimiento
 * @param {string} datosConsentimiento.tipo - 'terminos_condiciones' o 'eliminacion_cuenta'
 * @param {string} datosConsentimiento.versionTerminos - Versión de términos (solo para tipo 'terminos_condiciones')
 * @param {string} datosConsentimiento.firmaImagenUrl - URL de la imagen de la firma en Storage
 * @param {string} datosConsentimiento.ipAddress - IP del usuario
 * @param {string} datosConsentimiento.userAgent - User agent del navegador
 * @param {Object} datosConsentimiento.datosEliminados - Datos eliminados (solo para tipo 'eliminacion_cuenta')
 */
export const guardarConsentimiento = async (datosConsentimiento) => {
  try {
    // Obtener usuario autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    // Obtener comercio_id del usuario actual (puede ser null si aún no tiene comercio)
    // Durante el registro, el usuario aún no tiene comercio asignado
    let comercioId = null
    try {
      const { data: usuario, error: errorUsuario } = await supabase
        .from('usuarios')
        .select('comercio_id')
        .eq('id', user.id)
        .maybeSingle()
      
      if (errorUsuario && errorUsuario.code !== 'PGRST116') {
        // PGRST116 es "no encontrado", que es válido durante el registro
        throw errorUsuario
      }
      
      comercioId = usuario?.comercio_id || null
    } catch (err) {
      // Si no tiene comercio aún (durante registro), comercioId será null
      // Esto es válido porque el campo comercio_id en consentimientos es nullable
      console.log('Usuario aún no tiene comercio asignado (registro en curso)')
    }
    
    const { data, error } = await supabase
      .from('consentimientos')
      .insert({
        usuario_id: user.id,
        comercio_id: comercioId, // Puede ser null durante el registro
        tipo_consentimiento: datosConsentimiento.tipo,
        version_terminos: datosConsentimiento.versionTerminos || null,
        firma_imagen_url: datosConsentimiento.firmaImagenUrl,
        ip_address: datosConsentimiento.ipAddress,
        user_agent: datosConsentimiento.userAgent,
        datos_eliminados: datosConsentimiento.datosEliminados || null
      })
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al guardar consentimiento:', error)
    return { data: null, error }
  }
}

/**
 * Subir firma a Supabase Storage
 * Si el bucket no existe, guarda el data URL directamente
 * @param {string} firmaDataUrl - Data URL de la imagen de la firma (canvas.toDataURL())
 * @param {string} tipo - 'terminos' o 'eliminacion'
 * @param {string} usuarioId - ID del usuario
 */
export const subirFirmaAStorage = async (firmaDataUrl, tipo, usuarioId) => {
  try {
    // Convertir data URL a blob
    const response = await fetch(firmaDataUrl)
    const blob = await response.blob()
    
    // Crear nombre de archivo único
    const fileName = `${usuarioId}-${Date.now()}.png`
    // Corregir path: era firmas/firmas/terminos, ahora es firmas/terminos
    const filePath = `${tipo}/${fileName}`
    
    // Intentar subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from('firmas')
      .upload(filePath, blob, {
        contentType: 'image/png',
        upsert: false
      })
    
    // Si el bucket no existe, usar el data URL directamente
    if (error) {
      // Si es error de "bucket not found", guardar data URL directamente
      if (error.message?.includes('Bucket not found') || error.message?.includes('bucket') || error.statusCode === 400) {
        console.warn('Bucket "firmas" no encontrado en Supabase Storage. Guardando firma como data URL.')
        // Retornar el data URL como si fuera una URL válida
        // La base de datos puede almacenar data URLs (aunque son largos)
        return { 
          data: { 
            url: firmaDataUrl, 
            path: `data-url-${tipo}-${fileName}`,
            isDataUrl: true 
          }, 
          error: null 
        }
      }
      // Si es otro error, lanzarlo
      throw error
    }
    
    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('firmas')
      .getPublicUrl(filePath)
    
    return { data: { url: publicUrl, path: filePath, isDataUrl: false }, error: null }
  } catch (error) {
    console.error('Error al subir firma a Storage:', error)
    
    // Si falla completamente, permitir usar el data URL como fallback
    if (error.message?.includes('Bucket not found') || error.message?.includes('bucket')) {
      console.warn('Usando data URL como fallback debido a bucket no encontrado.')
      const fileName = `${usuarioId}-${Date.now()}.png`
      return { 
        data: { 
          url: firmaDataUrl, 
          path: `data-url-${tipo}-${fileName}`,
          isDataUrl: true 
        }, 
        error: null 
      }
    }
    
    return { data: null, error }
  }
}

