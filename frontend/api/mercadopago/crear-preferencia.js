// API Route para crear preferencia de pago en Mercado Pago
// Vercel detectará automáticamente esta ruta como: /api/mercadopago/crear-preferencia

import { MercadoPagoConfig, Preference } from 'mercadopago'

// IMPORTANTE: Esta función se ejecuta en el backend de Vercel
// NUNCA exponer el ACCESS_TOKEN en el frontend

export default async function handler(req, res) {
  // CORS headers para permitir llamadas desde el frontend
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { planId, planNombre, monto, tipoPago, comercioId, emailUsuario } = req.body

    // Validar datos
    if (!planId || !monto || !comercioId || !emailUsuario) {
      return res.status(400).json({ error: 'Datos incompletos' })
    }

    // Verificar que existe ACCESS_TOKEN
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      console.error('MERCADOPAGO_ACCESS_TOKEN no configurado')
      return res.status(500).json({ error: 'Configuración de Mercado Pago incompleta' })
    }

    // Inicializar Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      options: {
        timeout: 5000,
        idempotencyKey: `plan-${comercioId}-${Date.now()}`
      }
    })

    const preference = new Preference(client)

    // URL base de la app
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://adminisgo.com')

    // Crear preferencia de pago
    const preferenceData = {
      items: [
        {
          title: `Plan ${planNombre} - ${tipoPago === 'mensual' ? 'Mensual' : 'Anual'}`,
          description: `Suscripción ${tipoPago} al Plan ${planNombre}`,
          quantity: 1,
          unit_price: parseFloat(monto),
          currency_id: 'ARS'
        }
      ],
      payer: {
        email: emailUsuario
      },
      back_urls: {
        success: `${appUrl}/configuracion/cambiar-plan?status=approved`,
        failure: `${appUrl}/configuracion/cambiar-plan?status=rejected`,
        pending: `${appUrl}/configuracion/cambiar-plan?status=pending`
      },
      auto_return: 'approved',
      statement_descriptor: 'Adminis Go', // Descripción que aparece en el resumen de tarjeta
      metadata: {
        plan_id: planId.toString(),
        plan_nombre: planNombre,
        comercio_id: comercioId.toString(),
        tipo_pago: tipoPago
      },
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      // Configuraciones adicionales para sandbox
      binary_mode: false, // Permite pagos pendientes
      expires: false // No expira la preferencia
    }

    const response = await preference.create({ body: preferenceData })

    return res.status(200).json({
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point
    })
  } catch (error) {
    console.error('Error al crear preferencia de Mercado Pago:', error)
    return res.status(500).json({ 
      error: 'Error al crear preferencia de pago',
      details: error.message 
    })
  }
}
