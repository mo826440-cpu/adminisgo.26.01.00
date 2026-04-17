// Componente Sidebar de navegación
import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import './Sidebar.css'

function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { isAdmin, puedeModulo } = useAuthContext()
  const [referenciasOpen, setReferenciasOpen] = useState(true)

  const mostrarReferencias = useMemo(
    () =>
      puedeModulo('categorias') ||
      puedeModulo('marcas') ||
      puedeModulo('clientes') ||
      puedeModulo('proveedores') ||
      puedeModulo('productos'),
    [puedeModulo]
  )

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const toggleReferencias = () => {
    setReferenciasOpen(!referenciasOpen)
  }

  useEffect(() => {
    if (window.innerWidth <= 768 && isOpen) {
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <nav className="sidebar-nav">
        {puedeModulo('dashboard') && (
          <Link
            to="/dashboard"
            className={`sidebar-item ${isActive('/dashboard') ? 'active' : ''}`}
          >
            📊 Dashboard
          </Link>
        )}

        {mostrarReferencias && (
          <div className="sidebar-section">
            <button
              type="button"
              className={`sidebar-item sidebar-toggle ${referenciasOpen ? 'open' : ''}`}
              onClick={toggleReferencias}
            >
              📁 Referencias {referenciasOpen ? '▼' : '▶'}
            </button>
            {referenciasOpen && (
              <div className="sidebar-submenu">
                {puedeModulo('categorias') && (
                  <Link
                    to="/categorias"
                    className={`sidebar-subitem ${isActive('/categorias') ? 'active' : ''}`}
                  >
                    Categorías
                  </Link>
                )}
                {puedeModulo('marcas') && (
                  <Link to="/marcas" className={`sidebar-subitem ${isActive('/marcas') ? 'active' : ''}`}>
                    Marcas
                  </Link>
                )}
                {puedeModulo('clientes') && (
                  <Link
                    to="/clientes"
                    className={`sidebar-subitem ${isActive('/clientes') ? 'active' : ''}`}
                  >
                    Clientes
                  </Link>
                )}
                {puedeModulo('proveedores') && (
                  <Link
                    to="/proveedores"
                    className={`sidebar-subitem ${isActive('/proveedores') ? 'active' : ''}`}
                  >
                    Proveedores
                  </Link>
                )}
                {puedeModulo('productos') && (
                  <Link
                    to="/productos"
                    className={`sidebar-subitem ${isActive('/productos') ? 'active' : ''}`}
                  >
                    Productos
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {isAdmin && (
          <Link to="/usuarios" className={`sidebar-item ${isActive('/usuarios') ? 'active' : ''}`}>
            👥 Usuarios
          </Link>
        )}

        {puedeModulo('compras') && (
          <Link to="/compras" className={`sidebar-item ${isActive('/compras') ? 'active' : ''}`}>
            🛒 Compras
          </Link>
        )}

        {puedeModulo('ventas') && (
          <Link to="/ventas" className={`sidebar-item ${isActive('/ventas') ? 'active' : ''}`}>
            💰 Ventas
          </Link>
        )}

        {puedeModulo('ventas_rapidas') && (
          <Link
            to="/ventas-rapidas"
            className={`sidebar-item ${isActive('/ventas-rapidas') ? 'active' : ''}`}
          >
            ⚡ Ventas Rápidas
          </Link>
        )}

        {puedeModulo('reportes') && (
          <Link to="/reportes" className={`sidebar-item ${isActive('/reportes') ? 'active' : ''}`}>
            📈 Reportes
          </Link>
        )}

        {isAdmin && (
          <Link
            to="/otros-costos"
            className={`sidebar-item ${isActive('/otros-costos') ? 'active' : ''}`}
          >
            💸 Otros costos
          </Link>
        )}

        {isAdmin && (
          <Link
            to="/configuraciones"
            className={`sidebar-item ${isActive('/configuraciones') ? 'active' : ''}`}
          >
            ⚙️ Configuraciones
          </Link>
        )}

        {puedeModulo('mantenimiento') && (
          <Link
            to="/mantenimiento"
            className={`sidebar-item ${isActive('/mantenimiento') ? 'active' : ''}`}
          >
            🔧 Mantenimiento
          </Link>
        )}
      </nav>
    </aside>
  )
}

export default Sidebar
