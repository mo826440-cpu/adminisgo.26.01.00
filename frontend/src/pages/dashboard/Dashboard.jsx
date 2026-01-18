// Página de Dashboard
import { Link } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { Layout } from '../../components/layout'
import { Card, Spinner, Badge, Button } from '../../components/common'
import { usePWAInstall } from '../../hooks/usePWAInstall'
import './Dashboard.css'

function Dashboard() {
  const { user, loading } = useAuthContext()
  const { isInstallable, isInstalled, install } = usePWAInstall()

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando...</p>
        </div>
      </Layout>
    )
  }

  // Datos temporales (placeholder - se conectarán con la API después)
  const stats = [
    { title: 'Ventas de hoy', value: '$0', label: '0 ventas', variant: 'primary' },
    { title: 'Productos', value: '0', label: '0 activos', variant: 'info' },
    { title: 'Clientes', value: '0', label: '0 registrados', variant: 'success' },
    { title: 'Stock bajo', value: '0', label: 'Productos', variant: 'warning' }
  ]

  return (
    <Layout>
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p className="text-secondary">Bienvenido, {user?.email}</p>
          </div>
          {isInstallable && !isInstalled && (
            <Button 
              onClick={install}
              variant="primary"
              className="install-pwa-btn"
            >
              📱 Instalar App
            </Button>
          )}
          {isInstalled && (
            <Badge variant="success">App instalada</Badge>
          )}
        </div>

        {/* KPIs / Estadísticas */}
        <div className="dashboard-stats">
          {stats.map((stat, index) => (
            <Card key={index} className="stat-card" hoverable>
              <div className="stat-content">
                <div className="stat-label">{stat.title}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-sublabel">{stat.label}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Resumen rápido */}
        <div className="dashboard-grid">
          <Card title="Resumen del día" className="dashboard-card">
            <p>No hay ventas registradas hoy.</p>
            <p className="text-secondary text-small">
              Las estadísticas se actualizarán cuando comiences a usar la aplicación.
            </p>
          </Card>

          <Card title="Accesos rápidos" className="dashboard-card">
            <div className="quick-links">
              <Link to="/productos" className="quick-link">
                📦 Productos
              </Link>
              <Link to="/ventas" className="quick-link">
                💰 Punto de Venta
              </Link>
              <Link to="/clientes" className="quick-link">
                👥 Clientes
              </Link>
              <Link to="/compras" className="quick-link">
                🛒 Compras
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard
