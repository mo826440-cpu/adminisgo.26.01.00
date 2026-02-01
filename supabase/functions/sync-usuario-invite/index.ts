// Edge Function: Sincronizar usuario invitado a public.usuarios
// Llamada por el cliente tras el primer login si no tiene fila en public.usuarios.
// Lee user_metadata del usuario en auth (comercio_id, rol_id, nombre, etc.) e inserta en public.usuarios.

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

    const meta = user.user_metadata || {}
    const comercioId = meta.comercio_id
    if (comercioId == null) {
      return new Response(
        JSON.stringify({ success: false, message: 'No es un usuario invitado a un comercio' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data: existing } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, message: 'Usuario ya existe en public.usuarios' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: insertError } = await supabaseAdmin.from('usuarios').insert({
      id: user.id,
      comercio_id: Number(comercioId),
      rol_id: Number(meta.rol_id ?? 2),
      nombre: (meta.nombre || user.email || '').trim(),
      email: (user.email || '').trim(),
      telefono: (meta.telefono || '').trim() || null,
      direccion: (meta.direccion || '').trim() || null,
      activo: true,
    })

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Usuario creado en public.usuarios' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e?.message || 'Error interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
