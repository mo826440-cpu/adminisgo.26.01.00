// Página de Dashboard
import { useState, useEffect, useMemo } from 'react'
import { useAuthContext } from '../../context/AuthContext'
import { useDateTime } from '../../context/DateTimeContext'
import { Layout } from '../../components/layout'
import { Card, Spinner, Badge, Button } from '../../components/common'
import { usePWAInstall } from '../../hooks/usePWAInstall'
import { formatDateTime } from '../../utils/dateFormat'
import { getEstadoSuscripcion } from '../../services/planes'
import { getVentasPorRangoFechas } from '../../services/ventas'
import './Dashboard.css'

const formatearMoneda = (valor) => {
  const num = parseFloat(valor)
  if (isNaN(num)) return '$0,00'
  return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Fechas por defecto: últimos 7 días
const getDefaultRango = () => {
  const hoy = new Date()
  const desde = new Date(hoy)
  desde.setDate(desde.getDate() - 6)
  return {
    desde: desde.toISOString().slice(0, 10),
    hasta: hoy.toISOString().slice(0, 10)
  }
}

const RANGO_EJE = 5000 // escala del eje X cada $5.000

function Dashboard() {
  const { user, loading } = useAuthContext()
  const { isInstallable, isInstalled, install } = usePWAInstall()
  const { currentDateTime, timezone, dateFormat } = useDateTime()
  const [suscripcion, setSuscripcion] = useState(null)
  const [loadingSuscripcion, setLoadingSuscripcion] = useState(true)
  const [chartData, setChartData] = useState([])
  const [loadingChart, setLoadingChart] = useState(true)
  const [fechaDesde, setFechaDesde] = useState(() => getDefaultRango().desde)
  const [fechaHasta, setFechaHasta] = useState(() => getDefaultRango().hasta)

  // Cargar estado de suscripción
  useEffect(() => {
    const cargarSuscripcion = async () => {
      if (!user) return
      setLoadingSuscripcion(true)
      try {
        const { data, error } = await getEstadoSuscripcion()
        if (error) console.error('Error al obtener suscripción:', error)
        else setSuscripcion(data)
      } catch (err) {
        console.error('Error al cargar suscripción:', err)
      } finally {
        setLoadingSuscripcion(false)
      }
    }
    if (!loading && user) cargarSuscripcion()
  }, [user, loading])

  // Cargar datos para gráfico según rango de fechas
  const cargarGrafico = async () => {
    if (!user) return
    setLoadingChart(true)
    try {
      const desde = new Date(fechaDesde)
      const hasta = new Date(fechaHasta)
      if (desde > hasta) {
        setChartData([])
        setLoadingChart(false)
        return
      }
      const { data: lista } = await getVentasPorRangoFechas(desde, hasta)
      const ventas = lista || []
      // Días en el rango (una fila por día)
      const porDia = {}
      const d = new Date(desde)
      d.setHours(0, 0, 0, 0)
      const fin = new Date(hasta)
      fin.setHours(23, 59, 59, 999)
      while (d <= fin) {
        const key = d.toISOString().slice(0, 10)
        const labelFecha = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        porDia[key] = { fecha: key, total: 0, unidades: 0, labelFecha }
        d.setDate(d.getDate() + 1)
      }
      ventas.forEach(v => {
        const key = new Date(v.fecha_hora).toISOString().slice(0, 10)
        if (porDia[key]) {
          porDia[key].total += parseFloat(v.total) || 0
          porDia[key].unidades += parseFloat(v.unidades_totales) || 0
        }
      })
      setChartData(Object.values(porDia).sort((a, b) => a.fecha.localeCompare(b.fecha)))
    } catch (err) {
      console.error('Error al cargar gráfico:', err)
    } finally {
      setLoadingChart(false)
    }
  }

  useEffect(() => {
    if (!loading && user) cargarGrafico()
  }, [user, loading])

  const handleAplicarFiltro = (e) => {
    e?.preventDefault()
    cargarGrafico()
  }

  const maxChartTotal = useMemo(() => Math.max(1, ...chartData.map(d => d.total)), [chartData])
  // Escala del eje X: múltiplos de RANGO_EJE (ej. $5.000, $10.000, ...)
  const maxEjeX = useMemo(() => Math.ceil(maxChartTotal / RANGO_EJE) * RANGO_EJE || RANGO_EJE, [maxChartTotal])
  const pasosEjeX = useMemo(() => {
    const n = Math.max(1, Math.floor(maxEjeX / RANGO_EJE))
    return Array.from({ length: n + 1 }, (_, i) => i * RANGO_EJE)
  }, [maxEjeX])

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

        {/* Gráfico de barras horizontales - Registro de ventas */}
        <Card title="Gráfico de barras horizontales" className="dashboard-card dashboard-chart-card">
          {/* Configuración: tabla, filtro por fechas, etiquetas */}
          <div className="chart-config">
            <div className="chart-config-row">
              <label className="chart-config-label">Tabla a analizar:</label>
              <input type="text" className="chart-config-input" value="Registro de ventas" readOnly />
            </div>
            <div className="chart-config-row chart-config-fechas">
              <div>
                <label className="chart-config-label">Filtrar desde:</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="chart-config-date"
                  aria-label="Fecha desde"
                />
              </div>
              <div>
                <label className="chart-config-label">Hasta:</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="chart-config-date"
                  aria-label="Fecha hasta"
                />
              </div>
              <Button type="button" variant="primary" size="sm" onClick={handleAplicarFiltro}>
                Aplicar
              </Button>
            </div>
            <div className="chart-config-row">
              <label className="chart-config-label">Información en etiquetas:</label>
              <input type="text" className="chart-config-input" value="Unidades, $Total" readOnly />
            </div>
            <div className="chart-config-row">
              <span className="chart-config-label">Eje (X): $Total — Rango: {formatearMoneda(RANGO_EJE)}</span>
              <span className="chart-config-label">Eje (Y): Fecha — 1 día</span>
            </div>
          </div>

          {loadingChart ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}><Spinner size="md" /></div>
          ) : (
            <div className="chart-horizontal-wrap">
              <div className="chart-horizontal-y-label">Eje (Y)</div>
              <div className="chart-horizontal-content">
                <div className="chart-horizontal-bars">
                  {chartData.map((d) => (
                    <div key={d.fecha} className="chart-horizontal-row">
                      <span className="chart-horizontal-date" title={d.labelFecha}>{d.labelFecha}</span>
                      <div className="chart-horizontal-bar-cell">
                        <div
                          className="chart-horizontal-bar"
                          style={{ width: `${(d.total / maxEjeX) * 100}%` }}
                          title={`${d.labelFecha}: ${formatearMoneda(d.total)} — ${d.unidades} un.`}
                        >
                          <span className="chart-horizontal-bar-label chart-horizontal-bar-label-total">
                            {formatearMoneda(d.total)}
                          </span>
                          <span className="chart-horizontal-bar-label chart-horizontal-bar-label-unidades">
                            {Number(d.unidades).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="chart-horizontal-x-axis">
                  <span className="chart-horizontal-x-label">Eje (X)</span>
                  <div className="chart-horizontal-x-ticks">
                    {pasosEjeX.map((v) => (
                      <span key={v} className="chart-horizontal-x-tick">
                        {v === 0 ? '$-' : formatearMoneda(v)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}

export default Dashboard
