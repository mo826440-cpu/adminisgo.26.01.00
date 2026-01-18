// Contexto de Autenticación
import { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, getSession, onAuthStateChange } from '../services/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    // Obtener sesión inicial
    getSession().then(({ session, error }) => {
      if (mounted) {
        if (session) {
          setSession(session)
          setUser(session.user)
        } else if (error) {
          console.error('Error al obtener sesión:', error)
        }
        setLoading(false)
      }
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
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

