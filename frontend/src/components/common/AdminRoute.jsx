// Ruta solo para usuarios con rol dueño (admin)
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading, loadingPermisos, usuario, perfilError } = useAuthContext()

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

  if (perfilError) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1.5rem' }}>
        <p>No se pudo verificar el acceso. Recargá la página.</p>
      </div>
    )
  }

  if (!isAuthenticated || !usuario) {
    return <Navigate to="/" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default AdminRoute
