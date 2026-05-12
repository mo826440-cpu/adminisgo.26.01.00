import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { signOut } from '../../services/auth'

/** Email y cerrar sesión para integrar dentro de la tarjeta del panel (hub). */
function InicioHeroUserActions() {
  const { user } = useAuthContext()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="inicio-app-hero__user-actions">
      <span className="inicio-app-hero__user-email" title={user?.email || ''}>
        {user?.email || '—'}
      </span>
      <button type="button" className="inicio-app-hero__user-logout" onClick={() => void handleLogout()}>
        Cerrar sesión
      </button>
    </div>
  )
}

export default InicioHeroUserActions
