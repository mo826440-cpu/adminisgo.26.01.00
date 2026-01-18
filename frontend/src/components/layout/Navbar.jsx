// Componente Navbar
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { signOut } from '../../services/auth'
import { Button } from '../common'
import './Navbar.css'

function Navbar() {
  const { user, isAuthenticated } = useAuthContext()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/auth/login')
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
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

