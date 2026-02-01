// Componente Navbar
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { signOut } from '../../services/auth'
import { Button } from '../common'
import './Navbar.css'

function Navbar({ onToggleSidebar }) {
  const { user, isAuthenticated } = useAuthContext()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        console.error('Error al cerrar sesión:', error)
      }
      // Siempre redirigir a la landing; desde ahí el usuario puede iniciar sesión de nuevo.
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      navigate('/', { replace: true })
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <button 
          className="navbar-menu-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="navbar-menu">
          {user && (
            <div className="navbar-user">
              <span className="navbar-user-email">{user.email}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
              >
                Cerrar Sesión
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar

