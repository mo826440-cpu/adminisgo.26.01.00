// Edge Function: Eliminar cuenta y comercio (solo dueño)
// Elimina todos los usuarios del comercio en Auth y luego el comercio (CASCADE borra el resto).

// Para que Cursor/TypeScript reconozca Deno (el IDE no usa tipos de Deno por defecto)
declare const Deno: {
  env: { get(key: string): string | undefined }
  serve(handler: (req: Request) => Response | Promise<Response>): void
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Falta cabecera Authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Configuración del servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('comercio_id, roles!inner(nombre)')
      .eq('id', user.id)
      .single()

    if (usuarioError || !usuario) {
      return new Response(
        JSON.stringify({ error: 'Usuario sin comercio asociado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const rolNombre = (usuario as { roles?: { nombre: string } }).roles?.nombre
    if (rolNombre !== 'dueño') {
      return new Response(
        JSON.stringify({ error: 'Solo el dueño puede eliminar la cuenta del comercio' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const comercioId = usuario.comercio_id as number

    const { data: usuariosDelComercio, error: listError } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('comercio_id', comercioId)

    if (listError) {
      return new Response(
        JSON.stringify({ error: listError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
      return new Response(
        JSON.stringify({ error: deleteComercioError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Cuenta y datos del comercio eliminados' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e?.message || 'Error interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
