// Contexto de Autenticación
import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { getSession, onAuthStateChange } from '../services/auth'
import { getUsuario, syncUsuarioInvitado } from '../services/usuarios'
import { fetchPermisosMapForUser } from '../services/permisos'
import { NAV_ORDER_PATHS } from '../constants/modulosPermiso'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [permisosMap, setPermisosMap] = useState(null)
  const [loadingPermisos, setLoadingPermisos] = useState(false)
  const mountedRef = useRef(false)

  const loadUsuario = async () => {
    const { data, error } = await getUsuario()
    if (error || !data) return null
    return data
  }

  const loadPermisos = useCallback(async (u) => {
    if (!u) {
      setPermisosMap(null)
      setLoadingPermisos(false)
      return
    }
    const nombre = (u.rol_nombre || '').toLowerCase().trim()
    if (nombre === 'dueño') {
      setPermisosMap({ __dueno: true })
      setLoadingPermisos(false)
      return
    }
    setLoadingPermisos(true)
    try {
      const map = await fetchPermisosMapForUser(u)
      setPermisosMap(map && map.__dueno ? { __dueno: true } : map || {})
    } catch (e) {
      console.error('Error al cargar permisos:', e)
      setPermisosMap({})
    } finally {
      setLoadingPermisos(false)
    }
  }, [])

  const refreshPermisos = useCallback(async () => {
    const u = await loadUsuario()
    if (mountedRef.current && u) {
      setUsuario(u)
      await loadPermisos(u)
    }
  }, [loadPermisos])

  useEffect(() => {
    mountedRef.current = true

    const initSession = async (sess) => {
      if (!sess) {
        setUsuario(null)
        setPermisosMap(null)
        setLoadingPermisos(false)
        return
      }
      let u = await loadUsuario()
      if (!u && sess.user?.user_metadata?.comercio_id != null) {
        await syncUsuarioInvitado()
        u = await loadUsuario()
      }
      if (mountedRef.current) {
        setUsuario(u)
        await loadPermisos(u)
      }
    }

    getSession().then(({ session: sess, error }) => {
      if (mountedRef.current) {
        if (sess) {
          setSession(sess)
          setUser(sess.user)
          void initSession(sess)
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
        setPermisosMap(null)
        setLoadingPermisos(false)
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
  }, [loadPermisos])

  const isAdmin = usuario?.rol_nombre === 'dueño'

  const puedeModulo = useCallback(
    (codigo) => {
      if (!codigo) return false
      if (isAdmin) return true
      if (!permisosMap || permisosMap.__dueno) return isAdmin
      return !!permisosMap[codigo]
    },
    [isAdmin, permisosMap]
  )

  const firstNavigatePath = useCallback(
    (excludePathname) => {
      const ex = excludePathname || ''
      for (const [codigo, path] of NAV_ORDER_PATHS) {
        if (ex === path) continue
        if (puedeModulo(codigo)) return path
      }
      return '/'
    },
    [puedeModulo]
  )

  /** Usuario autenticado con rol no dueño y ningún módulo de la matriz en true */
  const sinAccesoNingunModulo = useMemo(() => {
    if (!usuario || isAdmin || loadingPermisos) return false
    if (!permisosMap || permisosMap.__dueno) return false
    return !NAV_ORDER_PATHS.some(([codigo]) => permisosMap[codigo] === true)
  }, [usuario, isAdmin, loadingPermisos, permisosMap])

  const value = useMemo(
    () => ({
      user,
      session,
      usuario,
      loading,
      isAuthenticated: !!user,
      isAdmin,
      permisosMap,
      loadingPermisos,
      puedeModulo,
      firstNavigatePath,
      sinAccesoNingunModulo,
      refreshPermisos,
    }),
    [
      user,
      session,
      usuario,
      loading,
      isAdmin,
      permisosMap,
      loadingPermisos,
      puedeModulo,
      firstNavigatePath,
      sinAccesoNingunModulo,
      refreshPermisos,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook compartido con el provider (patrón estándar de React Context)
// eslint-disable-next-line react-refresh/only-export-components -- useAuthContext debe vivir junto al Provider
export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de AuthProvider')
  }
  return context
}
