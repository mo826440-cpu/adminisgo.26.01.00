// Contexto de Autenticación
import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { getSession, onAuthStateChange, signOut } from '../services/auth'
import { getUsuario, syncUsuarioInvitado } from '../services/usuarios'
import { fetchPermisosMapForUser } from '../services/permisos'
import { NAV_ORDER_PATHS } from '../constants/modulosPermiso'
import { guardarAvisoAcceso, marcarRecuperacionClave } from '../utils/accesoSesion'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [permisosMap, setPermisosMap] = useState(null)
  const [loadingPermisos, setLoadingPermisos] = useState(false)
  const [perfilError, setPerfilError] = useState(null)
  const [avisoAcceso, setAvisoAcceso] = useState(null)
  const mountedRef = useRef(false)
  const denegandoRef = useRef(false)

  const loadUsuario = async () => {
    const { data, error } = await getUsuario()
    if (data && !data.deleted_at && data.activo !== false && data.comercio_id != null) {
      return { usuario: data, missing: false, error: null }
    }
    if (data) return { usuario: null, missing: true, error: null }
    const code = error?.code || ''
    const texto = `${error?.message || ''} ${error?.details || ''}`
    const missing = code === 'PGRST116' || texto.includes('0 rows') || texto.includes('multiple (or no) rows')
    if (missing || !error) return { usuario: null, missing: true, error: null }
    return { usuario: null, missing: false, error }
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

  const aplicarPerfil = useCallback(async (sess) => {
    if (!sess) {
      setUsuario(null)
      setPermisosMap(null)
      setPerfilError(null)
      setLoadingPermisos(false)
      return
    }
    if (window.location.hash.includes('type=recovery')) {
      marcarRecuperacionClave()
    }
    let result = await loadUsuario()
    const appMeta = sess.user?.app_metadata
    if (result.missing && appMeta?.invited === true && appMeta?.comercio_id != null) {
      await syncUsuarioInvitado()
      result = await loadUsuario()
    }
    if (!mountedRef.current) return
    if (result.error) {
      setPerfilError(result.error)
      setUsuario(null)
      setPermisosMap(null)
      setLoadingPermisos(false)
      return
    }
    setPerfilError(null)
    if (!result.usuario) {
      if (!denegandoRef.current) {
        denegandoRef.current = true
        const texto = 'Tu cuenta no está habilitada para este negocio. Contactá al administrador.'
        setAvisoAcceso(texto)
        guardarAvisoAcceso(texto)
        await signOut()
        denegandoRef.current = false
      }
      if (mountedRef.current) {
        setUsuario(null)
        setPermisosMap(null)
        setLoadingPermisos(false)
      }
      return
    }
    setUsuario(result.usuario)
    await loadPermisos(result.usuario)
  }, [loadPermisos])

  const refreshPermisos = useCallback(async () => {
    const result = await loadUsuario()
    if (mountedRef.current && result.usuario) {
      setUsuario(result.usuario)
      await loadPermisos(result.usuario)
    }
  }, [loadPermisos])

  useEffect(() => {
    mountedRef.current = true
    if (window.location.hash.includes('type=recovery')) {
      marcarRecuperacionClave()
    }

    getSession().then(async ({ session: sess, error }) => {
      if (!mountedRef.current) return
      try {
        if (sess) {
          setSession(sess)
          setUser(sess.user)
          await aplicarPerfil(sess)
        } else if (error) {
          console.error('Error al obtener sesión:', error)
        }
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    })

    const { data: { subscription } } = onAuthStateChange(async (event, sess) => {
      if (!mountedRef.current) return

      if (event === 'PASSWORD_RECOVERY') {
        marcarRecuperacionClave()
      }

      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setUsuario(null)
        setPermisosMap(null)
        setPerfilError(null)
        setLoadingPermisos(false)
        setLoading(false)
      } else if (sess) {
        setSession(sess)
        setUser(sess.user)
        await aplicarPerfil(sess)
        if (mountedRef.current) setLoading(false)
      } else {
        setLoading(false)
      }
    })

    return () => {
      mountedRef.current = false
      if (subscription) subscription.unsubscribe()
    }
  }, [aplicarPerfil])

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

  /** Caja / venta rápida compartida: alcanza con ventas o ventas_rapidas. */
  const puedeModuloVentasORapidas = useCallback(
    () => puedeModulo('ventas') || puedeModulo('ventas_rapidas'),
    [puedeModulo]
  )

  const firstNavigatePath = useCallback(
    (excludePathname) => {
      const ex = excludePathname || ''
      // Ventas es la pantalla inicial del sistema para quienes tengan acceso.
      if (ex !== '/ventas' && puedeModulo('ventas')) {
        return '/ventas'
      }
      const puedeIrInicio =
        isAdmin ||
        (permisosMap &&
          !permisosMap.__dueno &&
          NAV_ORDER_PATHS.some(([codigo]) => permisosMap[codigo] === true))
      if (puedeIrInicio && ex !== '/inicio') {
        return '/inicio'
      }
      for (const [codigo, path] of NAV_ORDER_PATHS) {
        if (ex === path) continue
        if (puedeModulo(codigo)) return path
      }
      return '/'
    },
    [isAdmin, permisosMap, puedeModulo]
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
      perfilError,
      avisoAcceso,
      establecerAvisoAcceso: setAvisoAcceso,
      isAuthenticated: !!user,
      isAdmin,
      permisosMap,
      loadingPermisos,
      puedeModulo,
      puedeModuloVentasORapidas,
      firstNavigatePath,
      sinAccesoNingunModulo,
      refreshPermisos,
    }),
    [
      user,
      session,
      usuario,
      loading,
      perfilError,
      avisoAcceso,
      isAdmin,
      permisosMap,
      loadingPermisos,
      puedeModulo,
      puedeModuloVentasORapidas,
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
