// Página de Dashboard
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuthContext } from '../../context/AuthContext'
import { useDateTime } from '../../context/DateTimeContext'
import { Layout } from '../../components/layout'
import { Card, Spinner, Badge, Button } from '../../components/common'
import { usePWAInstall } from '../../hooks/usePWAInstall'
import { formatDateTime } from '../../utils/dateFormat'
import { getEstadoSuscripcion } from '../../services/planes'
import { getVentasPorRangoFechas } from '../../services/ventas'
import { getComprasPorRangoFechas } from '../../services/compras'
import { getProductos } from '../../services/productos'
import { getClientesPorRangoFechas } from '../../services/clientes'
import { TABLAS_CONFIG, TABLAS_IDS } from './chartConfig'
import './Dashboard.css'

const formatearMoneda = (valor) => {
  const num = parseFloat(valor)
  if (isNaN(num)) return '$0,00'
  return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getDefaultRango() {
  const hoy = new Date()
  const desde = new Date(hoy)
  desde.setDate(desde.getDate() - 6)
  return {
    desde: desde.toISOString().slice(0, 10),
    hasta: hoy.toISOString().slice(0, 10)
  }
}

function Dashboard() {
  const { user, loading } = useAuthContext()
  const { isInstallable, isInstalled, install } = usePWAInstall()
  const { currentDateTime, timezone, dateFormat } = useDateTime()
  const [suscripcion, setSuscripcion] = useState(null)
  const [loadingSuscripcion, setLoadingSuscripcion] = useState(true)
  const [chartData, setChartData] = useState([])
  const [loadingChart, setLoadingChart] = useState(true)

  // Estado del gráfico (valores por defecto según pedido)
  const [tabla, setTabla] = useState('ventas')
  const [fechaDesde, setFechaDesde] = useState(() => getDefaultRango().desde)
  const [fechaHasta, setFechaHasta] = useState(() => getDefaultRango().hasta)
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState(['unidades', 'total'])
  const [ejeX, setEjeX] = useState('fecha')
  const [rangoEjeX, setRangoEjeX] = useState(1)
  const [ejeY, setEjeY] = useState('total')
  const [rangoEjeY, setRangoEjeY] = useState(5000)

  const configTabla = TABLAS_CONFIG[tabla] || TABLAS_CONFIG.ventas
  const labelOptions = configTabla.labelOptions || []
  const axisOptions = configTabla.axisOptions || []
  const usaFechas = configTabla.usaFechas !== false

  // Sincronizar ejes/etiquetas al cambiar tabla (mantener solo opciones válidas)
  useEffect(() => {
    const axisIds = axisOptions.map((o) => o.id)
    if (axisIds.length && !axisIds.includes(ejeX)) setEjeX(axisIds[0])
    if (axisIds.length && !axisIds.includes(ejeY)) setEjeY(axisIds[axisIds.length > 1 ? 1 : 0])
    const labelIds = labelOptions.map((o) => o.id)
    setEtiquetasSeleccionadas((prev) => {
      const next = prev.filter((id) => labelIds.includes(id))
      return next.length ? next : labelIds.slice(0, 2)
    })
  }, [tabla])

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

  // Agregar por buckets de N días (rangoEjeX)
  const agregarPorFechas = useCallback(
    (porDia, rangoDias) => {
      const fechas = Object.keys(porDia).sort()
      if (fechas.length === 0) return []
      const buckets = []
      for (let i = 0; i < fechas.length; i += rangoDias) {
        const chunk = fechas.slice(i, i + rangoDias)
        const first = porDia[chunk[0]]
        const label =
          rangoDias === 1
            ? first.labelFecha
            : `${porDia[chunk[0]].labelFecha} - ${porDia[chunk[chunk.length - 1]].labelFecha}`
        const bucket = {
          key: chunk[0],
          labelFecha: label,
          total: 0,
          unidades: 0,
          cantidad: 0
        }
        chunk.forEach((k) => {
          const d = porDia[k]
          if (d) {
            bucket.total += d.total || 0
            bucket.unidades += d.unidades || 0
            bucket.cantidad += d.cantidad || 0
          }
        })
        buckets.push(bucket)
      }
      return buckets
    },
    []
  )

  const cargarGrafico = useCallback(async () => {
    if (!user) return
    setLoadingChart(true)
    try {
      const desde = new Date(fechaDesde)
      const hasta = new Date(fechaHasta)
      if (usaFechas && desde > hasta) {
        setChartData([])
        setLoadingChart(false)
        return
      }

      if (tabla === 'ventas') {
        const { data: lista } = await getVentasPorRangoFechas(desde, hasta)
        const ventas = lista || []
        const porDia = {}
        let d = new Date(desde)
        d.setHours(0, 0, 0, 0)
        const fin = new Date(hasta)
        fin.setHours(23, 59, 59, 999)
        while (d <= fin) {
          const key = d.toISOString().slice(0, 10)
          porDia[key] = {
            fecha: key,
            total: 0,
            unidades: 0,
            cantidad: 0,
            labelFecha: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
          }
          d.setDate(d.getDate() + 1)
        }
        ventas.forEach((v) => {
          const key =
            ejeX === 'fecha'
              ? new Date(v.fecha_hora).toISOString().slice(0, 10)
              : new Date(v.fecha_hora).toISOString().slice(0, 10)
          if (porDia[key]) {
            porDia[key].total += parseFloat(v.total) || 0
            porDia[key].unidades += parseFloat(v.unidades_totales) || 0
            porDia[key].cantidad += 1
          }
        })
        const rangoDias = Math.max(1, parseInt(rangoEjeX, 10) || 1)
        const buckets = agregarPorFechas(porDia, rangoDias)
        setChartData(buckets)
        return
      }

      if (tabla === 'compras') {
        const { data: lista } = await getComprasPorRangoFechas(desde, hasta)
        const compras = lista || []
        const porDia = {}
        let d = new Date(desde)
        d.setHours(0, 0, 0, 0)
        const fin = new Date(hasta)
        fin.setHours(23, 59, 59, 999)
        while (d <= fin) {
          const key = d.toISOString().slice(0, 10)
          porDia[key] = {
            fecha: key,
            total: 0,
            unidades: 0,
            cantidad: 0,
            labelFecha: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
          }
          d.setDate(d.getDate() + 1)
        }
        compras.forEach((c) => {
          const key = (c.fecha_orden || '').toString().slice(0, 10)
          if (porDia[key]) {
            porDia[key].total += parseFloat(c.total) || 0
            porDia[key].unidades += parseFloat(c.unidades_totales) || 0
            porDia[key].cantidad += 1
          }
        })
        const rangoDias = Math.max(1, parseInt(rangoEjeX, 10) || 1)
        const buckets = agregarPorFechas(porDia, rangoDias)
        setChartData(buckets)
        return
      }

      if (tabla === 'clientes') {
        const { data: lista } = await getClientesPorRangoFechas(desde, hasta)
        const clientes = lista || []
        const porDia = {}
        let d = new Date(desde)
        d.setHours(0, 0, 0, 0)
        const fin = new Date(hasta)
        fin.setHours(23, 59, 59, 999)
        while (d <= fin) {
          const key = d.toISOString().slice(0, 10)
          porDia[key] = {
            fecha: key,
            total: 0,
            unidades: 0,
            cantidad: 0,
            labelFecha: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
          }
          d.setDate(d.getDate() + 1)
        }
        clientes.forEach((c) => {
          const key = new Date(c.created_at).toISOString().slice(0, 10)
          if (porDia[key]) {
            porDia[key].cantidad += 1
          }
        })
        const rangoDias = Math.max(1, parseInt(rangoEjeX, 10) || 1)
        const buckets = agregarPorFechas(porDia, rangoDias)
        setChartData(buckets)
        return
      }

      if (tabla === 'productos') {
        const { data: productos } = await getProductos()
        const lista = productos || []
        const agruparPor = ejeX === 'marca' ? 'marca_id' : 'categoria_id'
        const grupos = {}
        lista.forEach((p) => {
          const key = p[agruparPor] || 'sin'
          const nombre =
            agruparPor === 'categoria_id'
              ? (p.categorias?.nombre || 'Sin categoría')
              : (p.marcas?.nombre || 'Sin marca')
          if (!grupos[key]) {
            grupos[key] = { key, labelFecha: nombre, total: 0, unidades: 0, cantidad: 0, stock: 0 }
          }
          grupos[key].cantidad += 1
          grupos[key].stock += parseFloat(p.stock_actual) || 0
        })
        setChartData(Object.values(grupos).sort((a, b) => (a.labelFecha || '').localeCompare(b.labelFecha || '')))
      }
    } catch (err) {
      console.error('Error al cargar gráfico:', err)
      setChartData([])
    } finally {
      setLoadingChart(false)
    }
  }, [
    user,
    tabla,
    fechaDesde,
    fechaHasta,
    ejeX,
    rangoEjeX,
    usaFechas,
    agregarPorFechas
  ])

  useEffect(() => {
    if (!loading && user) cargarGrafico()
  }, [user, loading, cargarGrafico])

  const handleAplicarFiltro = (e) => {
    e?.preventDefault()
    cargarGrafico()
  }

  const toggleEtiqueta = (id) => {
    setEtiquetasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // Valor a mostrar en el eje Y (altura de la barra)
  const getValorEjeY = (row) => {
    if (ejeY === 'total') return row.total || 0
    if (ejeY === 'unidades') return row.unidades || 0
    if (ejeY === 'cantidad') return row.cantidad || 0
    if (ejeY === 'stock') return row.stock != null ? row.stock : 0
    return row.total || 0
  }

  const maxValor = useMemo(() => Math.max(1, ...chartData.map(getValorEjeY)), [chartData, ejeY])
  const rangoYNum = parseFloat(rangoEjeY) || 5000
  const maxEjeY = useMemo(
    () => (ejeY === 'total' || ejeY === 'unidades' ? Math.ceil(maxValor / rangoYNum) * rangoYNum || rangoYNum : Math.ceil(maxValor)),
    [maxValor, rangoYNum, ejeY]
  )
  const pasosEjeY = useMemo(() => {
    const step = ejeY === 'total' || ejeY === 'unidades' ? rangoYNum : Math.max(1, Math.ceil(maxEjeY / 5))
    const n = Math.ceil(maxEjeY / step)
    return Array.from({ length: n + 1 }, (_, i) => i * step)
  }, [maxEjeY, rangoYNum, ejeY])

  const getNombrePlan = (tipo) => {
    const nombres = { gratis: 'Plan Gratuito', pago: 'Plan Pago', basico: 'Plan Pago', personalizado: 'Plan Personalizado' }
    return nombres[tipo] || tipo || 'Sin plan'
  }
  const getColorPlan = (tipo) => {
    const colores = { gratis: 'info', pago: 'primary', basico: 'primary', personalizado: 'warning' }
    return colores[tipo] || 'secondary'
  }

  const formatLabelValor = (row, id) => {
    if (id === 'total') return formatearMoneda(row.total)
    if (id === 'unidades') return Number(row.unidades || 0).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    if (id === 'cantidad') return String(row.cantidad || 0)
    if (id === 'stock') return String(row.stock != null ? row.stock : 0)
    return ''
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
            {!loadingSuscripcion && suscripcion?.plan && (
              <div style={{ marginTop: '0.5rem' }}>
                <Badge variant={getColorPlan(suscripcion.plan.tipo)}>📦 {getNombrePlan(suscripcion.plan.tipo)}</Badge>
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
              <Button onClick={install} variant="primary" className="install-pwa-btn">
                📱 Instalar App
              </Button>
            )}
            {isInstalled && <Badge variant="success">App instalada</Badge>}
          </div>
        </div>

        <Card title="Gráfico de columnas verticales" className="dashboard-card dashboard-chart-card">
          <div className="chart-config">
            <div className="chart-config-row">
              <label className="chart-config-label">Tabla a analizar:</label>
              <select
                className="chart-config-input chart-config-select"
                value={tabla}
                onChange={(e) => setTabla(e.target.value)}
                aria-label="Tabla a analizar"
              >
                {TABLAS_IDS.map((id) => (
                  <option key={id} value={id}>
                    {TABLAS_CONFIG[id].label}
                  </option>
                ))}
              </select>
            </div>

            {usaFechas && (
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
              </div>
            )}

            <div className="chart-config-row">
              <label className="chart-config-label">Información en etiquetas:</label>
              <div className="chart-config-checkboxes">
                {labelOptions.map((opt) => (
                  <label key={opt.id} className="chart-config-checkbox-label">
                    <input
                      type="checkbox"
                      checked={etiquetasSeleccionadas.includes(opt.id)}
                      onChange={() => toggleEtiqueta(opt.id)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="chart-config-row chart-config-ejes">
              <div className="chart-config-eje">
                <label className="chart-config-label">Eje (X):</label>
                <select
                  className="chart-config-input chart-config-select"
                  value={ejeX}
                  onChange={(e) => setEjeX(e.target.value)}
                  aria-label="Eje X"
                >
                  {axisOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {axisOptions.find((o) => o.id === ejeX)?.rangeType && (
                  <>
                    <label className="chart-config-label chart-config-rango-label">Rango eje (X):</label>
                    <input
                      type="number"
                      min="1"
                      step={axisOptions.find((o) => o.id === ejeX)?.rangeType === 'moneda' ? 1000 : 1}
                      value={rangoEjeX}
                      onChange={(e) => setRangoEjeX(parseFloat(e.target.value) || 1)}
                      className="chart-config-input chart-config-rango"
                      placeholder={axisOptions.find((o) => o.id === ejeX)?.rangePlaceholder}
                    />
                  </>
                )}
              </div>
              <div className="chart-config-eje">
                <label className="chart-config-label">Eje (Y):</label>
                <select
                  className="chart-config-input chart-config-select"
                  value={ejeY}
                  onChange={(e) => setEjeY(e.target.value)}
                  aria-label="Eje Y"
                >
                  {axisOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {axisOptions.find((o) => o.id === ejeY)?.rangeType && (
                  <>
                    <label className="chart-config-label chart-config-rango-label">Rango eje (Y):</label>
                    <input
                      type="number"
                      min="1"
                      step={axisOptions.find((o) => o.id === ejeY)?.rangeType === 'moneda' ? 1000 : 1}
                      value={rangoEjeY}
                      onChange={(e) => setRangoEjeY(parseFloat(e.target.value) || 5000)}
                      className="chart-config-input chart-config-rango"
                      placeholder={axisOptions.find((o) => o.id === ejeY)?.rangePlaceholder}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="chart-config-row">
              <Button type="button" variant="primary" size="sm" onClick={handleAplicarFiltro}>
                Aplicar
              </Button>
            </div>
          </div>

          {loadingChart ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <Spinner size="md" />
            </div>
          ) : (
            <div className="chart-vertical-wrap">
              <div className="chart-vertical-y-axis">
                <span className="chart-vertical-y-title">Eje (Y)</span>
                <div className="chart-vertical-y-ticks">
                  {[...pasosEjeY].reverse().map((v) => (
                    <span key={v} className="chart-vertical-y-tick">
                      {ejeY === 'total' || ejeY === 'unidades' ? (v === 0 ? '$-' : formatearMoneda(v)) : v}
                    </span>
                  ))}
                </div>
              </div>
              <div className="chart-vertical-content">
                <div className="chart-vertical-bars">
                  {chartData.map((row) => {
                    const valor = getValorEjeY(row)
                    const pct = maxEjeY ? (valor / maxEjeY) * 100 : 0
                    return (
                      <div key={row.key || row.labelFecha} className="chart-vertical-bar-wrap">
                        <div className="chart-vertical-bar-labels">
                          {etiquetasSeleccionadas.map((id) => (
                            <span key={id} className="chart-vertical-bar-label">
                              {formatLabelValor(row, id)}
                            </span>
                          ))}
                        </div>
                        <div
                          className="chart-vertical-bar"
                          style={{ height: `${pct}%` }}
                          title={`${row.labelFecha}: ${ejeY === 'total' ? formatearMoneda(valor) : valor}`}
                        />
                        <span className="chart-vertical-x-label">{row.labelFecha}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="chart-vertical-x-axis">
                  <span className="chart-vertical-x-title">Eje (X)</span>
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
