// Edge Function: Invitar usuario al comercio (solo admin/dueño)
// Recibe: { email, nombre, rol_id, telefono?, direccion? }
// Verifica que el llamador sea usuario con rol "dueño" y usa su comercio_id.
// Envía invitación por email; el usuario define su contraseña al aceptar.

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
        JSON.stringify({ error: 'Solo el dueño puede invitar usuarios' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const comercioId = usuario.comercio_id as number
    const body = await req.json()
    const { email, nombre, rol_id, telefono, direccion } = body

    if (!email || !nombre || rol_id == null) {
      return new Response(
        JSON.stringify({ error: 'Faltan email, nombre o rol_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.trim(),
      {
        data: {
          comercio_id: comercioId,
          rol_id: Number(rol_id),
          nombre: (nombre || '').trim(),
          telefono: (telefono || '').trim() || null,
          direccion: (direccion || '').trim() || null,
        },
      }
    )

    if (inviteError) {
      const msg = inviteError.message || 'Error al enviar invitación'
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitación enviada. El usuario debe confirmar su correo y establecer contraseña.',
        user_id: inviteData?.user?.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e?.message || 'Error interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
