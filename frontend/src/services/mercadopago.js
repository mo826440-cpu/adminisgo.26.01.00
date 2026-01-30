// Servicio para integración con Mercado Pago
import { supabase } from './supabase'

/**
 * Crear preferencia de pago para checkout de Mercado Pago
 * @param {Object} datos - Datos del pago
 * @param {number} datos.planId - ID del plan
 * @param {string} datos.planNombre - Nombre del plan
 * @param {number} datos.monto - Monto a pagar
 * @param {string} datos.tipoPago - 'mensual' o 'anual'
 * @param {number} datos.comercioId - ID del comercio
 * @param {string} datos.emailUsuario - Email del usuario
 * @returns {Promise<{data: {preferenceId: string, initPoint: string}, error: Error|null}>}
 */
export const crearPreferenciaPago = async (datos) => {
  try {
    // Llamar a API Route de Vercel
    // En producción: https://adminisgo.com/api/mercadopago/crear-preferencia
    // En desarrollo: http://localhost:5173/api/mercadopago/crear-preferencia (si usas proxy)
    const apiUrl = import.meta.env.VITE_API_URL || '/api'
    const response = await fetch(`${apiUrl}/mercadopago/crear-preferencia`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
      const mensaje = errorData.details
        ? `${errorData.error}: ${errorData.details}`
        : (errorData.error || 'Error al crear preferencia de pago')
      throw new Error(mensaje)
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    console.error('Error al crear preferencia de pago:', error)
    return { data: null, error }
  }
}

/**
 * Crear preferencia para usuario adicional
 * @param {Object} datos - Datos del pago
 * @param {number} datos.comercioId - ID del comercio
 * @param {string} datos.emailUsuario - Email del usuario
 * @returns {Promise<{data: {preferenceId: string, initPoint: string}, error: Error|null}>}
 */
export const crearPreferenciaUsuarioAdicional = async (datos) => {
  try {
    const { data, error } = await supabase.rpc('crear_preferencia_usuario_adicional', {
      p_comercio_id: datos.comercioId,
      p_email_usuario: datos.emailUsuario
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al crear preferencia para usuario adicional:', error)
    return { data: null, error }
  }
}

/**
 * Verificar estado de pago después del checkout
 * @param {string} paymentId - ID del pago de Mercado Pago
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
export const verificarEstadoPago = async (paymentId) => {
  try {
    const { data, error } = await supabase.rpc('verificar_pago_mercadopago', {
      p_payment_id: paymentId
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al verificar estado de pago:', error)
    return { data: null, error }
  }
}

/**
 * Obtener información de suscripción activa
 * @param {number} comercioId - ID del comercio
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
export const obtenerSuscripcionActiva = async (comercioId) => {
  try {
    const { data, error } = await supabase
      .from('suscripciones')
      .select('*')
      .eq('comercio_id', comercioId)
      .eq('estado', 'activa')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener suscripción activa:', error)
    return { data: null, error }
  }
}

/**
 * Cancelar suscripción
 * @param {number} suscripcionId - ID de la suscripción
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
export const cancelarSuscripcion = async (suscripcionId) => {
  try {
    // Primero cancelar en Mercado Pago (si tiene subscription_id)
    // Luego actualizar en BD
    const { data, error } = await supabase.rpc('cancelar_suscripcion_mercadopago', {
      p_suscripcion_id: suscripcionId
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al cancelar suscripción:', error)
    return { data: null, error }
  }
}
