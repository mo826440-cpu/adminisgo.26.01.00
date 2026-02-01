// Servicio para gestión de usuarios
import { supabase } from './supabase'

/**
 * Obtener información del usuario actual (de la tabla usuarios) con nombre del rol
 */
export const getUsuario = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select('*, roles(nombre)')
      .eq('id', user.id)
      .single()

    if (error) throw error
    const row = data
    if (row?.roles) {
      row.rol_nombre = Array.isArray(row.roles) ? row.roles[0]?.nombre : row.roles?.nombre
    }
    return { data: row, error: null }
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return { data: null, error }
  }
}

/**
 * Lista de roles para selector (dueño, vendedor, cajero, almacenero)
 */
export const getRoles = async () => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('id, nombre, descripcion')
      .order('id')

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error al obtener roles:', error)
    return { data: [], error }
  }
}

/**
 * Usuarios del comercio actual (para la página de administración; RLS filtra por comercio)
 */
export const getUsuariosDelComercio = async () => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, telefono, direccion, activo, created_at, roles(id, nombre)')
      .order('nombre')

    if (error) throw error
    const list = (data || []).map((u) => ({
      ...u,
      rol_nombre: Array.isArray(u.roles) ? u.roles[0]?.nombre : u.roles?.nombre,
    }))
    return { data: list, error: null }
  } catch (error) {
    console.error('Error al obtener usuarios del comercio:', error)
    return { data: [], error }
  }
}

/**
 * Invitar usuario al comercio (envía correo de invitación; el usuario define contraseña al aceptar).
 * Solo debe llamarse si el usuario actual es dueño (la Edge Function verifica rol).
 * @param {Object} payload - { email, nombre, rol_id, telefono?, direccion? }
 */
export const invitarUsuario = async (payload) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Debes iniciar sesión')
    }

    const url = `${import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')}/functions/v1/create-comercio-user`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email: payload.email?.trim(),
        nombre: payload.nombre?.trim(),
        rol_id: payload.rol_id,
        telefono: payload.telefono?.trim() || null,
        direccion: payload.direccion?.trim() || null,
      }),
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(json?.error || `Error ${res.status}`)
    }
    return { data: json, error: null }
  } catch (error) {
    console.error('Error al invitar usuario:', error)
    return { data: null, error }
  }
}

/**
 * Sincronizar usuario invitado a public.usuarios (llamar tras primer login si getUsuario devuelve null).
 * La Edge Function lee user_metadata e inserta en public.usuarios.
 */
export const syncUsuarioInvitado = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      return { data: null, error: new Error('Sin sesión') }
    }

    const url = `${import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')}/functions/v1/sync-usuario-invite`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({}),
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok && res.status !== 401) {
      return { data: null, error: new Error(json?.error || `Error ${res.status}`) }
    }
    return { data: json, error: null }
  } catch (error) {
    console.error('Error al sincronizar usuario invitado:', error)
    return { data: null, error }
  }
}

/**
 * Eliminar cuenta del comercio (solo dueño).
 * Elimina todos los usuarios del comercio en Auth y luego el comercio (CASCADE borra el resto).
 * Llamar desde Configuraciones; después hacer signOut y redirigir.
 */
export const eliminarCuentaComercio = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Debes iniciar sesión')
    }

    const url = `${import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')}/functions/v1/eliminar-cuenta-comercio`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({}),
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(json?.error || `Error ${res.status}`)
    }
    return { data: json, error: null }
  } catch (error) {
    console.error('Error al eliminar cuenta:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar información del usuario actual
 */
export const updateUsuario = async (datosUsuario) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    const { data, error } = await supabase
      .from('usuarios')
      .update(datosUsuario)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return { data: null, error }
  }
}

