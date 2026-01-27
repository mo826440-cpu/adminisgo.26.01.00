// Servicio de Autenticación
import { supabase } from './supabase'

/**
 * Registro de nuevo usuario
 */
export const signUp = async (email, password, userData = {}) => {
  try {
    // En desarrollo, forzar localhost para evitar redirecciones a producción
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const redirectUrl = isDevelopment 
      ? 'http://localhost:5173/auth/callback'
      : `${window.location.origin}/auth/callback`
    
    console.log('[signUp] URL de redirección:', redirectUrl, { hostname: window.location.hostname, origin: window.location.origin })
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData, // Datos adicionales para el perfil
        emailRedirectTo: redirectUrl
      }
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error en signUp:', error)
    return { data: null, error }
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
 * Recuperar contraseña (enviar email de recuperación)
 */
export const resetPassword = async (email) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
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
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
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

