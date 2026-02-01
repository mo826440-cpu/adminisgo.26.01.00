// Página de Dashboard
import { useState, useEffect, useMemo } from 'react'
import { useAuthContext } from '../../context/AuthContext'
import { useDateTime } from '../../context/DateTimeContext'
import { Layout } from '../../components/layout'
import { Card, Spinner, Badge, Button } from '../../components/common'
import { usePWAInstall } from '../../hooks/usePWAInstall'
import { formatDateTime } from '../../utils/dateFormat'
import { getEstadoSuscripcion } from '../../services/planes'
import { getVentasUltimosDias } from '../../services/ventas'
import './Dashboard.css'

const formatearMoneda = (valor) => {
  const num = parseFloat(valor)
  if (isNaN(num)) return '$0,00'
  return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function Dashboard() {
  const { user, loading } = useAuthContext()
  const { isInstallable, isInstalled, install } = usePWAInstall()
  const { currentDateTime, timezone, dateFormat } = useDateTime()
  const [suscripcion, setSuscripcion] = useState(null)
  const [loadingSuscripcion, setLoadingSuscripcion] = useState(true)
  const [chartData, setChartData] = useState([])
  const [loadingChart, setLoadingChart] = useState(true)

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

  // Cargar datos para gráfico (últimos 7 días)
  useEffect(() => {
    const cargarGrafico = async () => {
      if (!user) return
      setLoadingChart(true)
      try {
        const { data: ventas7 } = await getVentasUltimosDias(7)
        const lista = ventas7 || []
        const porDia = {}
        const hoy = new Date()
        for (let i = 6; i >= 0; i--) {
          const d = new Date(hoy)
          d.setDate(d.getDate() - i)
          const key = d.toISOString().slice(0, 10)
          porDia[key] = { fecha: key, total: 0, label: d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }) }
        }
        lista.forEach(v => {
          const key = new Date(v.fecha_hora).toISOString().slice(0, 10)
          if (porDia[key]) {
            porDia[key].total += parseFloat(v.total) || 0
          }
        })
        setChartData(Object.values(porDia).sort((a, b) => a.fecha.localeCompare(b.fecha)))
      } catch (err) {
        console.error('Error al cargar gráfico:', err)
      } finally {
        setLoadingChart(false)
      }
    }
    if (!loading && user) cargarGrafico()
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

        {/* Gráfico ventas últimos 7 días */}
        <Card title="Ventas últimos 7 días" className="dashboard-card dashboard-chart-card">
          {loadingChart ? (
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
      </div>
    </Layout>
  )
}

export default Dashboard
