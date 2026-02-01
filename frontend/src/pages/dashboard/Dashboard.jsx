// Página de Dashboard
import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { useDateTime } from '../../context/DateTimeContext'
import { Layout } from '../../components/layout'
import { Card, Spinner, Badge, Button } from '../../components/common'
import { usePWAInstall } from '../../hooks/usePWAInstall'
import { formatDateTime } from '../../utils/dateFormat'
import { getEstadoSuscripcion } from '../../services/planes'
import { getResumenVentasDelDia, getVentasUltimosDias } from '../../services/ventas'
import { getProductos } from '../../services/productos'
import { getClientes } from '../../services/clientes'
import './Dashboard.css'

const formatearMoneda = (valor) => {
  const num = parseFloat(valor)
  if (isNaN(num)) return '$0,00'
  return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function Dashboard() {
  const navigate = useNavigate()
  const { user, loading } = useAuthContext()
  const { isInstallable, isInstalled, install } = usePWAInstall()
  const { currentDateTime, timezone, dateFormat } = useDateTime()
  const [suscripcion, setSuscripcion] = useState(null)
  const [loadingSuscripcion, setLoadingSuscripcion] = useState(true)
  const [kpis, setKpis] = useState({
    ventasHoyCantidad: 0,
    ventasHoyTotal: 0,
    productosTotal: 0,
    stockBajo: 0,
    clientesTotal: 0
  })
  const [chartData, setChartData] = useState([])
  const [loadingKpis, setLoadingKpis] = useState(true)

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

  // Cargar KPIs y datos para gráfico
  useEffect(() => {
    const cargarKpis = async () => {
      if (!user) return
      setLoadingKpis(true)
      try {
        const [resVentasDia, resVentas7, resProductos, resClientes] = await Promise.all([
          getResumenVentasDelDia(),
          getVentasUltimosDias(7),
          getProductos(),
          getClientes()
        ])
        const ventasDia = resVentasDia.data || { cantidad: 0, total: 0 }
        const ventas7 = resVentas7.data || []
        const productos = resProductos.data || []
        const clientes = resClientes.data || []

        setKpis({
          ventasHoyCantidad: ventasDia.cantidad,
          ventasHoyTotal: ventasDia.total,
          productosTotal: productos.length,
          stockBajo: productos.filter(p => (p.stock_minimo ?? 0) > 0 && (parseFloat(p.stock_actual) ?? 0) < (p.stock_minimo ?? 0)).length,
          clientesTotal: clientes.length
        })

        // Agrupar ventas por día (últimos 7 días, fecha local)
        const porDia = {}
        const hoy = new Date()
        for (let i = 6; i >= 0; i--) {
          const d = new Date(hoy)
          d.setDate(d.getDate() - i)
          const key = d.toISOString().slice(0, 10)
          porDia[key] = { fecha: key, total: 0, label: d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }) }
        }
        ventas7.forEach(v => {
          const key = new Date(v.fecha_hora).toISOString().slice(0, 10)
          if (porDia[key]) {
            porDia[key].total += parseFloat(v.total) || 0
          }
        })
        setChartData(Object.values(porDia).sort((a, b) => a.fecha.localeCompare(b.fecha)))
      } catch (err) {
        console.error('Error al cargar KPIs:', err)
      } finally {
        setLoadingKpis(false)
      }
    }
    if (!loading && user) cargarKpis()
  }, [user, loading])

  const maxChartTotal = useMemo(() => Math.max(1, ...chartData.map(d => d.total)), [chartData])

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

  const stats = [
    { title: 'Ventas de hoy', value: loadingKpis ? '...' : formatearMoneda(kpis.ventasHoyTotal), label: `${kpis.ventasHoyCantidad} ventas`, variant: 'primary' },
    { title: 'Productos', value: loadingKpis ? '...' : String(kpis.productosTotal), label: 'activos', variant: 'info' },
    { title: 'Clientes', value: loadingKpis ? '...' : String(kpis.clientesTotal), label: 'registrados', variant: 'success' },
    { title: 'Stock bajo', value: loadingKpis ? '...' : String(kpis.stockBajo), label: 'productos', variant: 'warning' }
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

        {/* Gráfico ventas últimos 7 días */}
        <Card title="Ventas últimos 7 días" className="dashboard-card dashboard-chart-card">
          {loadingKpis ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}><Spinner size="md" /></div>
          ) : (
            <div className="dashboard-chart">
              {chartData.map((d) => (
                <div key={d.fecha} className="dashboard-chart-bar-wrap">
                  <div
                    className="dashboard-chart-bar"
                    style={{ height: `${(d.total / maxChartTotal) * 100}%` }}
                    title={`${d.label}: ${formatearMoneda(d.total)}`}
                  />
                  <span className="dashboard-chart-label">{d.label}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Resumen rápido */}
        <div className="dashboard-grid">
          <Card title="Resumen del día" className="dashboard-card">
            {loadingKpis ? (
              <Spinner size="md" />
            ) : (
              <>
                <p>
                  <strong>{kpis.ventasHoyCantidad}</strong> {kpis.ventasHoyCantidad === 1 ? 'venta' : 'ventas'} hoy por un total de <strong>{formatearMoneda(kpis.ventasHoyTotal)}</strong>.
                </p>
                {kpis.ventasHoyCantidad === 0 && (
                  <p className="text-secondary text-small">
                    Las estadísticas se actualizarán cuando registres ventas.
                  </p>
                )}
              </>
            )}
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
