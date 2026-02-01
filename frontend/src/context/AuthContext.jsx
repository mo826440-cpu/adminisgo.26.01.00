// Contexto de Autenticación
import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { getSession, onAuthStateChange } from '../services/auth'
import { getUsuario, syncUsuarioInvitado } from '../services/usuarios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(false)

  const loadUsuario = async () => {
    const { data, error } = await getUsuario()
    if (error || !data) return null
    return data
  }

  useEffect(() => {
    mountedRef.current = true

    const initSession = async (sess) => {
      if (!sess) {
        setUsuario(null)
        return
      }
      let u = await loadUsuario()
      if (!u && sess.user?.user_metadata?.comercio_id != null) {
        await syncUsuarioInvitado()
        u = await loadUsuario()
      }
      if (mountedRef.current) setUsuario(u)
    }

    getSession().then(({ session: sess, error }) => {
      if (mountedRef.current) {
        if (sess) {
          setSession(sess)
          setUser(sess.user)
          initSession(sess)
        } else if (error) {
          console.error('Error al obtener sesión:', error)
        }
        setLoading(false)
      }
    })

    const { data: { subscription } } = onAuthStateChange(async (event, sess) => {
      if (!mountedRef.current) return

      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setUsuario(null)
        setLoading(false)
      } else if (sess) {
        setSession(sess)
        setUser(sess.user)
        await initSession(sess)
        if (mountedRef.current) setLoading(false)
      } else {
        setLoading(false)
      }
    })

    return () => {
      mountedRef.current = false
      if (subscription) subscription.unsubscribe()
    }
  }, [])

  const isAdmin = usuario?.rol_nombre === 'dueño'

  const value = {
    user,
    session,
    usuario,
    loading,
    isAuthenticated: !!user,
    isAdmin,
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

