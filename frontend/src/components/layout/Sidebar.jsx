// Componente Sidebar de navegación
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Sidebar.css'

function Sidebar() {
  const location = useLocation()
  const [referenciasOpen, setReferenciasOpen] = useState(true)

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const toggleReferencias = () => {
    setReferenciasOpen(!referenciasOpen)
  }

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <Link 
          to="/dashboard" 
          className={`sidebar-item ${isActive('/dashboard') ? 'active' : ''}`}
        >
          📊 Dashboard
        </Link>

        <div className="sidebar-section">
          <button 
            className={`sidebar-item sidebar-toggle ${referenciasOpen ? 'open' : ''}`}
            onClick={toggleReferencias}
          >
            📁 Referencias {referenciasOpen ? '▼' : '▶'}
          </button>
          {referenciasOpen && (
            <div className="sidebar-submenu">
              <Link 
                to="/categorias" 
                className={`sidebar-subitem ${isActive('/categorias') ? 'active' : ''}`}
              >
                Categorías
              </Link>
              <Link 
                to="/marcas" 
                className={`sidebar-subitem ${isActive('/marcas') ? 'active' : ''}`}
              >
                Marcas
              </Link>
              <Link 
                to="/clientes" 
                className={`sidebar-subitem ${isActive('/clientes') ? 'active' : ''}`}
              >
                Clientes
              </Link>
              <Link 
                to="/proveedores" 
                className={`sidebar-subitem ${isActive('/proveedores') ? 'active' : ''}`}
              >
                Proveedores
              </Link>
              <Link 
                to="/productos" 
                className={`sidebar-subitem ${isActive('/productos') ? 'active' : ''}`}
              >
                Productos
              </Link>
            </div>
          )}
        </div>

        <Link 
          to="/usuarios" 
          className={`sidebar-item ${isActive('/usuarios') ? 'active' : ''}`}
        >
          👥 Usuarios
        </Link>

        <Link 
          to="/compras" 
          className={`sidebar-item ${isActive('/compras') ? 'active' : ''}`}
        >
          🛒 Compras
        </Link>

        <Link 
          to="/ventas" 
          className={`sidebar-item ${isActive('/ventas') ? 'active' : ''}`}
        >
          💰 Ventas
        </Link>

        <Link 
          to="/reportes" 
          className={`sidebar-item ${isActive('/reportes') ? 'active' : ''}`}
        >
          📈 Reportes
        </Link>

        <Link 
          to="/configuraciones" 
          className={`sidebar-item ${isActive('/configuraciones') ? 'active' : ''}`}
        >
          ⚙️ Configuraciones
        </Link>

        <Link 
          to="/mantenimiento" 
          className={`sidebar-item ${isActive('/mantenimiento') ? 'active' : ''}`}
        >
          🔧 Mantenimiento
        </Link>
      </nav>
    </aside>
  )
}

export default Sidebar

