// Servicio de Autenticación
import { supabase } from './supabase'

/**
 * El alta pública está cerrada. Las cuentas las crea el administrador
 * con la invitación (Edge Function create-comercio-user).
 */
export const signUp = async () => {
  return {
    data: null,
    error: new Error('El registro público está deshabilitado. El acceso lo crea el administrador.'),
  }
}

/**
 * Inicio de sesión
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error en signIn:', error)
    return { data: null, error }
  }
}

/**
 * Cerrar sesión
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error en signOut:', error)
    return { error }
  }
}

/**
 * Obtener usuario actual
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { user, error: null }
  } catch (error) {
    console.error('Error en getCurrentUser:', error)
    return { user: null, error }
  }
}

/**
 * Obtener sesión actual
 */
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return { session, error: null }
  } catch (error) {
    console.error('Error en getSession:', error)
    return { session: null, error }
  }
}

/**
 * Recuperar contraseña (enviar email de recuperación).
 * redirectTo usa siempre el origen actual (en adminisgo.com va a producción; si corrés en local, a localhost).
 */
export const resetPassword = async (email) => {
  try {
    const redirectTo = `${window.location.origin}/reset-password`
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error en resetPassword:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar contraseña
 */
export const updatePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error en updatePassword:', error)
    return { data: null, error }
  }
}

/**
 * Inicio de sesión con Google (OAuth)
 */
export const signInWithGoogle = async () => {
  try {
    const redirectTo = `${window.location.origin}/auth/callback`
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error en signInWithGoogle:', error)
    return { data: null, error }
  }
}

/**
 * Escuchar cambios de autenticación
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

