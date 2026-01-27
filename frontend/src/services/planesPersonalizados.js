// Servicio para gestión de planes personalizados
import { supabase } from './supabase'

/**
 * Obtener plan personalizado del comercio actual
 */
export const obtenerPlanPersonalizado = async (comercioId = null) => {
  try {
    const { data, error } = await supabase.rpc('obtener_plan_personalizado', {
      p_comercio_id: comercioId
    })
    
    if (error) throw error
    
    // La función retorna un array, tomamos el primero
    const plan = data && data.length > 0 ? data[0] : null
    
    return { data: plan, error: null }
  } catch (error) {
    console.error('Error al obtener plan personalizado:', error)
    return { data: null, error }
  }
}

/**
 * Crear solicitud de plan personalizado
 * @param {Object} datosSolicitud - Datos de la solicitud
 * @param {string} datosSolicitud.nombre - Nombre del solicitante
 * @param {string} datosSolicitud.email - Email del solicitante
 * @param {string} datosSolicitud.telefono - Teléfono (opcional)
 * @param {string} datosSolicitud.mensaje - Mensaje explicando necesidades
 */
export const crearSolicitudPlanPersonalizado = async (datosSolicitud) => {
  try {
    // Obtener comercio_id del usuario actual (si está logueado)
    let comercioId = null
    try {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('comercio_id')
        .maybeSingle()
      
      comercioId = usuario?.comercio_id || null
    } catch (e) {
      // Si no hay usuario, comercioId queda null (para solicitudes sin cuenta)
      console.log('Usuario no autenticado o sin comercio')
    }
    
    const { data, error } = await supabase
      .from('solicitudes_personalizadas')
      .insert({
        nombre: datosSolicitud.nombre,
        email: datosSolicitud.email,
        telefono: datosSolicitud.telefono || null,
        mensaje: datosSolicitud.mensaje,
        comercio_id: comercioId,
        estado: 'pendiente'
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Crear notificación para todos los admins
    try {
      await supabase.rpc('crear_notificacion_para_todos_admins', {
        p_tipo: 'nueva_solicitud_plan',
        p_titulo: 'Nueva solicitud de plan personalizado',
        p_mensaje: `Se ha recibido una nueva solicitud de plan personalizado de ${datosSolicitud.nombre} (${datosSolicitud.email})`,
        p_datos_adicionales: { solicitud_id: data.id }
      })
    } catch (notifError) {
      // No fallar si no se puede crear la notificación
      console.warn('No se pudo crear notificación:', notifError)
    }
    
    return { data, error: null }
  } catch (error) {
    console.error('Error al crear solicitud de plan personalizado:', error)
    return { data: null, error }
  }
}

/**
 * Obtener facturas del comercio actual
 */
export const obtenerFacturasComercio = async (comercioId = null) => {
  try {
    const { data, error } = await supabase.rpc('obtener_facturas_comercio', {
      p_comercio_id: comercioId
    })
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error al obtener facturas del comercio:', error)
    return { data: [], error }
  }
}

/**
 * Actualizar datos de facturación en una suscripción
 * @param {number} suscripcionId - ID de la suscripción
 * @param {Object} datosFacturacion - Datos de facturación
 */
export const actualizarFacturacionSuscripcion = async (suscripcionId, datosFacturacion) => {
  try {
    const { data, error } = await supabase.rpc('actualizar_facturacion_suscripcion', {
      p_suscripcion_id: suscripcionId,
      p_numero_factura: datosFacturacion.numeroFactura,
      p_cae: datosFacturacion.cae,
      p_fecha_emision: datosFacturacion.fechaEmision,
      p_tipo_factura: datosFacturacion.tipoFactura,
      p_factura_pdf_url: datosFacturacion.facturaPdfUrl || null
    })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al actualizar facturación de suscripción:', error)
    return { data: null, error }
  }
}

