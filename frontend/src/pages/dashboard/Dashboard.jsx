// Página de Dashboard
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { useDateTime } from '../../context/DateTimeContext'
import { Layout } from '../../components/layout'
import { Card, Spinner, Badge, Button } from '../../components/common'
import { usePWAInstall } from '../../hooks/usePWAInstall'
import { formatDateTime } from '../../utils/dateFormat'
import { getEstadoSuscripcion } from '../../services/planes'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const { user, loading } = useAuthContext()
  const { isInstallable, isInstalled, install } = usePWAInstall()
  const { currentDateTime, timezone, dateFormat } = useDateTime()
  const [suscripcion, setSuscripcion] = useState(null)
  const [loadingSuscripcion, setLoadingSuscripcion] = useState(true)

  // Cargar estado de suscripción
  useEffect(() => {
    const cargarSuscripcion = async () => {
      if (!user) return
      
      setLoadingSuscripcion(true)
      try {
        const { data, error } = await getEstadoSuscripcion()
        if (error) {
          console.error('Error al obtener suscripción:', error)
        } else {
          setSuscripcion(data)
        }
      } catch (err) {
        console.error('Error al cargar suscripción:', err)
      } finally {
        setLoadingSuscripcion(false)
      }
    }

    if (!loading && user) {
      cargarSuscripcion()
    }
  }, [user, loading])

  // Función para obtener el nombre del plan en español
  const getNombrePlan = (tipo) => {
    const nombres = {
      'gratis': 'Plan Gratuito',
      'pago': 'Plan Pago',
      'basico': 'Plan Pago',
      'personalizado': 'Plan Personalizado'
    }
    return nombres[tipo] || tipo || 'Sin plan'
  }

  // Función para obtener el color del badge según el plan
  const getColorPlan = (tipo) => {
    const colores = {
      'gratis': 'info',
      'pago': 'primary',
      'basico': 'primary',
      'personalizado': 'warning'
    }
    return colores[tipo] || 'secondary'
  }

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
            <div className="dashboard-clock">
              <span className="clock-label">Fecha y Hora:</span>
              <span className="clock-time">{formatDateTime(currentDateTime, dateFormat, timezone)}</span>
            </div>
            {/* Mostrar plan actual */}
            {!loadingSuscripcion && suscripcion?.plan && (
              <div style={{ marginTop: '0.5rem' }}>
                <Badge variant={getColorPlan(suscripcion.plan.tipo)}>
                  📦 {getNombrePlan(suscripcion.plan.tipo)}
                </Badge>
                {suscripcion.periodo_gratis?.activo && suscripcion.periodo_gratis.dias_restantes !== null && (
                  <Badge variant="success" style={{ marginLeft: '0.5rem' }}>
                    ⏰ Período gratis: {suscripcion.periodo_gratis.dias_restantes} días restantes
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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

          {/* Card de información del plan */}
          {!loadingSuscripcion && suscripcion?.plan && (
            <Card title="Tu Plan Actual" className="dashboard-card">
              <div style={{ marginBottom: '1rem' }}>
                <Badge variant={getColorPlan(suscripcion.plan.tipo)} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                  {getNombrePlan(suscripcion.plan.tipo)}
                </Badge>
              </div>
              
              {suscripcion.plan.tipo === 'gratis' && (
                <div style={{ marginBottom: '1rem' }}>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/configuracion/cambiar-plan')}
                    fullWidth
                  >
                    ⬆️ Actualizar a Plan Pago
                  </Button>
                </div>
              )}
              
              {suscripcion.ventas && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong>Ventas este mes:</strong> {suscripcion.ventas.actuales}
                  {!suscripcion.ventas.ilimitado && suscripcion.ventas.limite && (
                    <span className="text-secondary"> / {suscripcion.ventas.limite}</span>
                  )}
                  {suscripcion.ventas.ilimitado && (
                    <Badge variant="success" style={{ marginLeft: '0.5rem' }}>Ilimitadas</Badge>
                  )}
                </div>
              )}

              {suscripcion.usuarios && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong>Usuarios:</strong> {suscripcion.usuarios.actuales}
                  {!suscripcion.usuarios.ilimitado && suscripcion.usuarios.limite && (
                    <span className="text-secondary"> / {suscripcion.usuarios.limite}</span>
                  )}
                  {suscripcion.usuarios.ilimitado && (
                    <Badge variant="success" style={{ marginLeft: '0.5rem' }}>Ilimitados</Badge>
                  )}
                </div>
              )}

              {suscripcion.periodo_gratis?.activo && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    ⏰ <strong>Período gratis activo</strong>
                  </p>
                  {suscripcion.periodo_gratis.dias_restantes !== null && (
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {suscripcion.periodo_gratis.dias_restantes} días restantes
                    </p>
                  )}
                </div>
              )}
            </Card>
          )}

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
