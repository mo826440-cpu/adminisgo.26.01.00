// Ruta protegida por permiso de módulo (y autenticación). El dueño siempre pasa.
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'

/**
 * @param {React.ReactNode} children
 * @param {string | string[]} modulo - código(s) en app_modulos; basta con uno permitido
 */
function PermissionRoute({ children, modulo }) {
  const location = useLocation()
  const { isAuthenticated, loading, loadingPermisos, puedeModulo, firstNavigatePath } = useAuthContext()

  if (loading || loadingPermisos) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p>Cargando...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  const modulos = Array.isArray(modulo) ? modulo : [modulo]
  const ok = modulos.some((m) => puedeModulo(m))

  if (!ok) {
    const target = firstNavigatePath(location.pathname)
    return <Navigate to={target} replace />
  }

  return children
}

export default PermissionRoute
