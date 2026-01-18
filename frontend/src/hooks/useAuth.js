// Hook personalizado para autenticación
import { useState, useEffect } from 'react'
import { getCurrentUser, getSession, onAuthStateChange } from '../services/auth'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión inicial
    getSession().then(({ session, error }) => {
      if (session) {
        setSession(session)
        setUser(session.user)
      }
      setLoading(false)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user
  }
}

