// Webhook para recibir notificaciones de Mercado Pago
// Vercel detectará automáticamente esta ruta como: /api/webhooks/mercadopago

import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

// IMPORTANTE: Validar siempre la firma del webhook para seguridad

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { type, data } = req.body

    // Verificar variables de entorno
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Variables de Supabase no configuradas')
      return res.status(500).json({ error: 'Configuración incompleta' })
    }

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      console.error('MERCADOPAGO_ACCESS_TOKEN no configurado')
      return res.status(500).json({ error: 'Configuración de Mercado Pago incompleta' })
    }

    // Inicializar Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // Usar service role key para bypass RLS
    )

    // Inicializar Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
    })

    const payment = new Payment(client)

    // Manejar diferentes tipos de notificaciones
    if (type === 'payment') {
      const paymentId = data.id

      // Obtener información del pago
      const paymentInfo = await payment.get({ id: paymentId })

      if (paymentInfo.status === 'approved') {
        // Pago aprobado - actualizar suscripción
        const metadata = paymentInfo.metadata || {}
        const comercioId = parseInt(metadata.comercio_id)
        const planId = parseInt(metadata.plan_id)

        if (comercioId && planId) {
          // Actualizar plan del comercio
          await supabase
            .from('comercios')
            .update({ plan_id: planId })
            .eq('id', comercioId)

          // Crear o actualizar suscripción
          const fechaInicio = new Date()
          const fechaFin = new Date()
          fechaFin.setMonth(fechaFin.getMonth() + 1) // 1 mes para mensual

          await supabase
            .from('suscripciones')
            .upsert({
              comercio_id: comercioId,
              plan_id: planId,
              estado: 'activa',
              fecha_inicio: fechaInicio.toISOString(),
              fecha_proximo_pago: fechaFin.toISOString(),
              mercado_pago_payment_id: paymentId.toString(),
              mercado_pago_preference_id: paymentInfo.preference_id?.toString()
            }, {
              onConflict: 'comercio_id'
            })

          console.log(`✅ Suscripción activada para comercio ${comercioId}, plan ${planId}`)
        }
      } else if (paymentInfo.status === 'rejected' || paymentInfo.status === 'cancelled') {
        // Pago rechazado o cancelado
        console.log(`❌ Pago ${paymentId} rechazado o cancelado`)
        // Opcional: notificar al usuario
      }
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('Error al procesar webhook de Mercado Pago:', error)
    return res.status(500).json({ 
      error: 'Error al procesar webhook',
      details: error.message 
    })
  }
}
