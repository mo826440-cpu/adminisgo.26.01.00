// @ts-nocheck — Edge Function para Deno; Cursor no tiene tipos de Deno, se desactiva el chequeo aquí.
// Edge Function: Eliminar cuenta y comercio (solo dueño)
// Elimina todos los usuarios del comercio en Auth y luego el comercio (CASCADE borra el resto).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

function jsonResponse(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  // Preflight: debe ser lo primero y devolver 200 para que el navegador acepte CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Falta cabecera Authorization' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return jsonResponse({ error: 'Configuración del servidor incompleta' }, 500)
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      return jsonResponse({ error: 'No autorizado' }, 401)
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('comercio_id, roles!inner(nombre)')
      .eq('id', user.id)
      .single()

    if (usuarioError || !usuario) {
      return jsonResponse({ error: 'Usuario sin comercio asociado' }, 403)
    }

    const rolNombre = (usuario as { roles?: { nombre: string } }).roles?.nombre
    if (rolNombre !== 'dueño') {
      return jsonResponse({ error: 'Solo el dueño puede eliminar la cuenta del comercio' }, 403)
    }

    const comercioId = usuario.comercio_id as number

    const { data: usuariosDelComercio, error: listError } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('comercio_id', comercioId)

    if (listError) {
      return jsonResponse({ error: listError.message }, 500)
    }

    // Borrar en orden para no violar FKs: primero tablas que referencian usuarios/comercio
    const tablesToDeleteByComercio = [
      'ventas',           // CASCADE borra venta_items
      'compras',          // CASCADE borra compra_items
      'movimientos_inventario',
      'historial_cajas',
      'ventas_rapidas',
    ] as const
    for (const table of tablesToDeleteByComercio) {
      const { error: delErr } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('comercio_id', comercioId)
      if (delErr) {
        return jsonResponse({ error: `Error al borrar ${table}: ${delErr.message}` }, 500)
      }
    }

    const userIds = (usuariosDelComercio || []).map((u) => u.id as string)
    for (const uid of userIds) {
      await supabaseAdmin.auth.admin.deleteUser(uid)
    }

    const { error: deleteComercioError } = await supabaseAdmin
      .from('comercios')
      .delete()
      .eq('id', comercioId)

    if (deleteComercioError) {
      return jsonResponse({ error: deleteComercioError.message }, 500)
    }

    return jsonResponse({ success: true, message: 'Cuenta y datos del comercio eliminados' }, 200)
  } catch (e) {
    return jsonResponse({ error: (e as Error)?.message || 'Error interno' }, 500)
  }
})

export {}
