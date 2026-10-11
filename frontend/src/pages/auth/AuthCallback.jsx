import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { hayRecuperacionClave } from '../../utils/accesoSesion'
import './AccesoShell.css'

function textoDeError(errorCode, errorParam) {
  const cancelado = errorCode === 'access_denied' || errorParam === 'access_denied'
  if (cancelado) return 'Cancelaste el ingreso con Google.'
  const vencido = errorCode === 'otp_expired' || errorCode === 'email_link_expired'
  if (vencido) return 'El enlace venció o ya no es válido. Pedí uno nuevo si lo necesitás.'
  return 'No se pudo completar el acceso. Intentá de nuevo o contactá al administrador.'
}

function AuthCallback() {
  const [searchParams] = useSearchParams()
  const { isAuthenticated, usuario, loading: authLoading, loadingPermisos, firstNavigatePath } = useAuthContext()
  const errorCode = searchParams.get('error_code') || ''
  const errorParam = searchParams.get('error') || ''

  if (errorParam || errorCode) {
    return <Navigate to="/" replace state={{ errorAcceso: textoDeError(errorCode, errorParam) }} />
  }

  if (hayRecuperacionClave() || window.location.hash.includes('type=recovery')) {
    return <Navigate to="/reset-password" replace />
  }

  if (authLoading || loadingPermisos || (isAuthenticated && !usuario)) {
    return (
      <div className="acceso" style={{ display: 'grid', placeItems: 'center', background: '#f4f2ef' }}>
        <p>Comprobando el acceso...</p>
      </div>
    )
  }

  if (isAuthenticated && usuario) {
    const dest = firstNavigatePath('/')
    return <Navigate to={dest && dest !== '/' ? dest : '/ventas'} replace />
  }

  return <Navigate to="/" replace />
}

export default AuthCallback
