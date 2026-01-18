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
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return
      
      console.log('Auth event:', event, 'Session:', session ? 'present' : 'null')
      
      // Manejar diferentes eventos de autenticación
      if (event === 'SIGNED_OUT') {
        // Solo cerrar sesión si es explícitamente un SIGNED_OUT
        setSession(null)
        setUser(null)
        setLoading(false)
      } else if (session) {
        // Si hay sesión, actualizar siempre
        setSession(session)
        setUser(session.user)
        setLoading(false)
      } else if (event === 'TOKEN_REFRESHED') {
        // Cuando se refresca el token, intentar obtener la sesión actualizada
        try {
          const { session: refreshedSession } = await getSession()
          if (mountedRef.current && refreshedSession) {
            setSession(refreshedSession)
            setUser(refreshedSession.user)
          }
        } catch (error) {
          console.error('Error al obtener sesión refrescada:', error)
        }
        setLoading(false)
      } else {
        // Para otros eventos sin sesión, intentar recuperar la sesión guardada
        // No establecer user como null inmediatamente (puede ser un error temporal)
        try {
          const { session: currentSession } = await getSession()
          if (mountedRef.current) {
            if (currentSession) {
              setSession(currentSession)
              setUser(currentSession.user)
            } else {
              // Solo si realmente no hay sesión, entonces cerrar
              setSession(null)
              setUser(null)
            }
          }
        } catch (error) {
          console.error('Error al recuperar sesión:', error)
          // Mantener el estado actual si hay error al recuperar
        }
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

