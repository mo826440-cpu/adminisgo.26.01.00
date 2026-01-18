// Contexto de Autenticación
import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { getCurrentUser, getSession, onAuthStateChange } from '../services/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    
    // Obtener sesión inicial
    getSession().then(({ session, error }) => {
      if (mountedRef.current) {
        if (session) {
          setSession(session)
          setUser(session.user)
        } else if (error) {
          // Solo loguear el error, no cerrar sesión si hay token guardado
          console.error('Error al obtener sesión:', error)
        }
        setLoading(false)
      }
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      if (!mountedRef.current) return
      
      // Solo cerrar sesión si es explícitamente un SIGNED_OUT
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setLoading(false)
      } else if (session) {
        // Si hay sesión, actualizar siempre
        setSession(session)
        setUser(session.user)
        setLoading(false)
      } else {
        // Para eventos sin sesión (pueden ser errores temporales),
        // mantener el estado actual en lugar de cerrar sesión
        // Supabase manejará el refresco automático del token
        setLoading(false)
      }
    })

    return () => {
      mountedRef.current = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de AuthProvider')
  }
  return context
}

