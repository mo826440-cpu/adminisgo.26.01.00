// Ruta solo para usuarios con rol dueño (admin)
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading, loadingPermisos } = useAuthContext()

  if (loading || loadingPermisos) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p>Cargando...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default AdminRoute
