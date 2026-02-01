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
      // Si está en la app instalada (PWA): ir a login. Si está en el navegador: ir a landing.
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        (window.navigator.standalone === true)
      navigate(isStandalone ? '/auth/login' : '/', { replace: true })
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        (window.navigator.standalone === true)
      navigate(isStandalone ? '/auth/login' : '/', { replace: true })
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

