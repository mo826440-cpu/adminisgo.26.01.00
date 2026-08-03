import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Button, Spinner, Alert, Modal, Pagination } from '../../components/common'
import { cancelVenta, getVentas } from '../../services/ventas'
import { fetchVentasRegistros } from '../../services/ventasListado'
import { getClientes } from '../../services/clientes'
import { getFormasPago } from '../../services/formasPago'
import {
  ventaEstaCancelada,
  getVentaEstadoDisplay,
  getVentaFechaDisplay,
} from '../../utils/ventaEstado'
import { useDateTime } from '../../context/DateTimeContext'
import { formatDateTime } from '../../utils/dateFormat'
import VentasPruebaToolbar, { VENTAS_PRUEBA_BASE } from '../../components/ventas-prueba/VentasPruebaToolbar'
import VpKpiGrid from '../../components/ventas-prueba/VpKpiGrid'
import ActionsMenuPrueba from './ActionsMenuPrueba'
import '../../components/ventas-prueba/ventasPrueba.css'
import './VentasPruebaList.css'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

const FILTROS_VACIOS = {
  fechaDesde: '',
  fechaHasta: '',
  clienteId: '',
  estado: '',
  metodoPago: '',
  busqueda: '',
}

function todayYmd() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatearMoneda(valor) {
  const num = Number(valor || 0)
  return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function labelEstadoPrueba(estadoKey) {
  if (estadoKey === 'pagado') return 'PAGADO'
  if (estadoKey === 'pendiente') return 'CON DEUDA'
  if (estadoKey === 'cancelado') return 'CANCELADA'
  return String(estadoKey || '').toUpperCase()
}

function badgeClassEstado(estadoKey) {
  if (estadoKey === 'pagado') return 'vp-badge vp-badge--pagado'
  if (estadoKey === 'pendiente') return 'vp-badge vp-badge--deuda'
  return 'vp-badge vp-badge--cancelada'
}

function hayFiltrosActivos(filtros) {
  return Boolean(
    filtros.fechaDesde ||
      filtros.fechaHasta ||
      filtros.clienteId ||
      filtros.estado ||
      filtros.metodoPago ||
      filtros.busqueda,
  )
}

function VentasPruebaList() {
  const location = useLocation()
  const navigate = useNavigate()
  const { timezone, dateFormat } = useDateTime()

  const [ventas, setVentas] = useState([])
  const [totalVentas, setTotalVentas] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [loading, setLoading] = useState(true)
  const [aplicandoFiltro, setAplicandoFiltro] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [ventaToCancel, setVentaToCancel] = useState(null)
  const [canceling, setCanceling] = useState(false)

  const [busquedaDraft, setBusquedaDraft] = useState('')
  const [fechaDraft, setFechaDraft] = useState('')
  const [clienteDraft, setClienteDraft] = useState('')
  const [estadoDraft, setEstadoDraft] = useState('')
  const [metodoDraft, setMetodoDraft] = useState('')

  const [filtrosActivos, setFiltrosActivos] = useState({ ...FILTROS_VACIOS })
  const [opcionesFiltro, setOpcionesFiltro] = useState({
    clientes: [],
    metodosPago: [],
  })
  const [kpis, setKpis] = useState({
    cantidad: 0,
    total: 0,
    cobrado: 0,
    deudaMonto: 0,
    deudaCantidad: 0,
  })

  const loadOpcionesFiltro = useCallback(async () => {
    const [clientesRes, formasRes] = await Promise.all([getClientes(), getFormasPago()])
    const clientes = [{ value: '__generico__', label: 'Cliente genérico' }]
    for (const c of clientesRes.data || []) {
      if (c?.id == null) continue
      clientes.push({
        value: String(c.id),
        label: c.nombre || `Cliente #${c.id}`,
      })
    }
    clientes.sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }))

    const metodosMap = new Map()
    for (const f of formasRes.data || []) {
      const codigo = String(f.codigo || f.nombre || '').trim()
      if (!codigo) continue
      const label = f.nombre || codigo.charAt(0).toUpperCase() + codigo.slice(1)
      if (!metodosMap.has(codigo)) metodosMap.set(codigo, label)
    }
    for (const [codigo, label] of [
      ['efectivo', 'Efectivo'],
      ['transferencia', 'Transferencia'],
      ['qr', 'QR'],
      ['debito', 'Débito'],
      ['credito', 'Crédito'],
      ['pendiente', 'Pendiente'],
    ]) {
      if (!metodosMap.has(codigo)) metodosMap.set(codigo, label)
    }

    setOpcionesFiltro({
      clientes,
      metodosPago: Array.from(metodosMap.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })),
    })
  }, [])

  const loadKpis = useCallback(async () => {
    const ymd = todayYmd()
    const { data, error: err } = await getVentas({ fechaDesde: ymd, fechaHasta: ymd })
    if (err || !data) return
    let total = 0
    let cobrado = 0
    let deudaMonto = 0
    let deudaCantidad = 0
    let cantidad = 0
    for (const v of data) {
      if (ventaEstaCancelada(v)) continue
      cantidad += 1
      const t = parseFloat(v.total || 0)
      const p = parseFloat(v.monto_pagado || 0)
      const d = Math.max(0, t - p)
      total += t
      cobrado += p
      if (d > 0.01) {
        deudaMonto += d
        deudaCantidad += 1
      }
    }
    setKpis({ cantidad, total, cobrado, deudaMonto, deudaCantidad })
  }, [])

  const loadVentas = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, total, error: err } = await fetchVentasRegistros({
      page: currentPage,
      pageSize,
      filtros: filtrosActivos,
    })

    if (err) {
      setError(err.message || 'Error al cargar ventas')
      setLoading(false)
      setAplicandoFiltro(false)
      return
    }

    setVentas(data || [])
    setTotalVentas(total ?? 0)
    setLoading(false)
    setAplicandoFiltro(false)
  }, [filtrosActivos, currentPage, pageSize])

  useEffect(() => {
    loadVentas()
  }, [loadVentas])

  useEffect(() => {
    loadKpis()
    loadOpcionesFiltro()
  }, [loadKpis, loadOpcionesFiltro])

  useEffect(() => {
    if (!location.state?.success) return
    setSuccessMessage(location.state.message || 'Operación realizada correctamente')
    navigate(location.pathname, { replace: true, state: {} })
    const timer = setTimeout(() => setSuccessMessage(null), 5000)
    return () => clearTimeout(timer)
  }, [location.state, navigate, location.pathname])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F2') {
        e.preventDefault()
        navigate(`${VENTAS_PRUEBA_BASE}/rapida`)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  const aplicarFiltros = () => {
    setAplicandoFiltro(true)
    setCurrentPage(1)
    setFiltrosActivos({
      fechaDesde: fechaDraft,
      fechaHasta: fechaDraft,
      clienteId: clienteDraft,
      estado: estadoDraft,
      metodoPago: metodoDraft,
      busqueda: busquedaDraft.trim(),
    })
  }

  const limpiarFiltros = () => {
    setBusquedaDraft('')
    setFechaDraft('')
    setClienteDraft('')
    setEstadoDraft('')
    setMetodoDraft('')
    setCurrentPage(1)
    setAplicandoFiltro(true)
    setFiltrosActivos({ ...FILTROS_VACIOS })
  }

  const handleCancel = async () => {
    if (!ventaToCancel) return
    setCanceling(true)
    const { error: err } = await cancelVenta(ventaToCancel)
    if (err) {
      setError(err.message || 'Error al cancelar la venta')
      setCanceling(false)
      return
    }
    setCanceling(false)
    setShowCancelModal(false)
    setVentaToCancel(null)
    setSuccessMessage('Venta cancelada correctamente')
    await Promise.all([loadVentas(), loadKpis()])
  }

  const formatearFecha = (fecha) => formatDateTime(fecha, dateFormat, timezone)

  const formatearDeuda = (venta) => {
    if (ventaEstaCancelada(venta)) return { text: '-', debt: false }
    const total = parseFloat(venta.total || 0)
    const pagado = parseFloat(venta.monto_pagado || 0)
    const deuda = Math.max(0, total - pagado)
    if (deuda > 0.01) return { text: formatearMoneda(deuda), debt: true }
    return { text: formatearMoneda(0), debt: false }
  }

  const filtrosAplicados = hayFiltrosActivos(filtrosActivos)
  const totalPages = Math.max(1, Math.ceil(totalVentas / pageSize))
  const startIndex = totalVentas === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalVentas)

  const kpiItems = useMemo(() => {
    const pct = kpis.total > 0 ? Math.round((kpis.cobrado / kpis.total) * 100) : 0
    const promedio = kpis.cantidad > 0 ? kpis.total / kpis.cantidad : 0
    const hoyLabel = formatDateTime(new Date().toISOString(), 'DD/MM/YYYY', timezone)
    return [
      {
        key: 'dia',
        label: 'Ventas del día',
        value: formatearMoneda(kpis.total),
        subtext: `${kpis.cantidad} ventas`,
        icon: 'bi-cart3',
        tone: 'blue',
      },
      {
        key: 'cobrado',
        label: 'Total cobrado',
        value: formatearMoneda(kpis.cobrado),
        subtext: `${pct}% del total`,
        icon: 'bi-cash-stack',
        tone: 'green',
      },
      {
        key: 'deuda',
        label: 'Total con deuda',
        value: formatearMoneda(kpis.deudaMonto),
        subtext: `${kpis.deudaCantidad} ventas`,
        icon: 'bi-credit-card',
        tone: 'purple',
      },
      {
        key: 'general',
        label: 'Total general',
        value: formatearMoneda(kpis.total),
        subtext: `Hoy ${hoyLabel}`,
        icon: 'bi-wallet2',
        tone: 'amber',
      },
      {
        key: 'ticket',
        label: 'Ticket promedio',
        value: formatearMoneda(promedio),
        subtext: 'Por venta',
        icon: 'bi-receipt',
        tone: 'neutral',
      },
    ]
  }, [kpis, timezone])

  return (
    <Layout>
      <div className="container vp-module vp-list-page">
        <VentasPruebaToolbar showNuevaVenta showClientes />

        {error ? (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        ) : null}

        {successMessage ? (
          <Alert variant="success" dismissible onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        ) : null}

        <VpKpiGrid items={kpiItems} />

        <div className="vp-panel vp-list-filters">
          <div className="vp-list-filters__search">
            <i className="bi bi-search" aria-hidden />
            <input
              type="search"
              className="form-control"
              placeholder="Buscar por cliente o comprobante..."
              value={busquedaDraft}
              onChange={(e) => setBusquedaDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  aplicarFiltros()
                }
              }}
            />
          </div>

          <div className="vp-list-filters__fields">
            <label className="vp-filter-field">
              <span>Fecha</span>
              <input
                type="date"
                className="form-control"
                value={fechaDraft}
                onChange={(e) => setFechaDraft(e.target.value)}
              />
            </label>

            <label className="vp-filter-field">
              <span>Cliente</span>
              <select
                className="form-control"
                value={clienteDraft}
                onChange={(e) => setClienteDraft(e.target.value)}
              >
                <option value="">Todos</option>
                {opcionesFiltro.clientes.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="vp-filter-field">
              <span>Estado</span>
              <select
                className="form-control"
                value={estadoDraft}
                onChange={(e) => setEstadoDraft(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Con deuda</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </label>

            <label className="vp-filter-field">
              <span>Método de pago</span>
              <select
                className="form-control"
                value={metodoDraft}
                onChange={(e) => setMetodoDraft(e.target.value)}
              >
                <option value="">Todos</option>
                {opcionesFiltro.metodosPago.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="vp-list-filters__actions">
            <Button type="button" variant="ghost" onClick={limpiarFiltros} disabled={loading}>
              Limpiar
            </Button>
            <Button
              type="button"
              variant="primary"
              className="vp-btn-primary"
              onClick={aplicarFiltros}
              loading={aplicandoFiltro && loading}
              disabled={loading && !aplicandoFiltro}
            >
              Aplicar
            </Button>
          </div>
        </div>

        {filtrosAplicados ? (
          <p className="vp-list-filtros-activos" role="status">
            Filtros aplicados
            {filtrosActivos.busqueda ? ` · búsqueda “${filtrosActivos.busqueda}”` : ''}
            {filtrosActivos.fechaDesde ? ` · fecha ${filtrosActivos.fechaDesde}` : ''}
            {filtrosActivos.clienteId ? ' · cliente' : ''}
            {filtrosActivos.estado ? ' · estado' : ''}
            {filtrosActivos.metodoPago ? ' · método' : ''}.
          </p>
        ) : null}

        <div className="vp-panel vp-list-table-panel">
          {loading && ventas.length === 0 ? (
            <div className="vp-empty">
              <Spinner />
              <p>Cargando ventas…</p>
            </div>
          ) : ventas.length === 0 ? (
            <div className="vp-empty">
              <p>
                {filtrosAplicados
                  ? 'No se encontraron ventas con los filtros aplicados.'
                  : 'No hay ventas para mostrar.'}
              </p>
              {filtrosAplicados ? (
                <Button type="button" variant="outline" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Button>
              ) : (
                <Link to={`${VENTAS_PRUEBA_BASE}/nueva`}>
                  <Button variant="primary" className="vp-btn-primary">
                    Crear primera venta
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="vp-table-wrap">
                <table className="vp-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Total</th>
                      <th className="hide-mobile">Cobrado</th>
                      <th className="hide-mobile">Deuda</th>
                      <th className="hide-mobile">Método</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map((venta) => {
                      const estadoKey = getVentaEstadoDisplay(venta)
                      const fechaDisplay = getVentaFechaDisplay(venta)
                      const deuda = formatearDeuda(venta)
                      return (
                        <tr
                          key={venta.id}
                          className={ventaEstaCancelada(venta) ? 'vp-row--cancelada' : ''}
                        >
                          <td>{formatearFecha(fechaDisplay)}</td>
                          <td>{venta.clientes?.nombre || 'Cliente genérico'}</td>
                          <td className="vp-money">{formatearMoneda(venta.total)}</td>
                          <td className="hide-mobile">{formatearMoneda(venta.monto_pagado)}</td>
                          <td className={`hide-mobile${deuda.debt ? ' vp-money--warning' : ''}`}>
                            {deuda.text}
                          </td>
                          <td className="hide-mobile">{venta.metodo_pago || '—'}</td>
                          <td>
                            <span className={badgeClassEstado(estadoKey)}>
                              {labelEstadoPrueba(estadoKey)}
                            </span>
                          </td>
                          <td>
                            <ActionsMenuPrueba
                              ventaId={venta.id}
                              cancelada={ventaEstaCancelada(venta)}
                              onCancel={(ventaId) => {
                                setVentaToCancel(ventaId)
                                setShowCancelModal(true)
                              }}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="vp-list-footer">
                <div className="vp-list-footer__info">
                  {totalVentas > 0
                    ? `Mostrando ${startIndex} a ${endIndex} de ${totalVentas} registros`
                    : 'Sin registros'}
                </div>

                {totalPages > 1 ? (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                      setCurrentPage(page)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  />
                ) : (
                  <div />
                )}

                <label className="vp-list-footer__pagesize">
                  <span>Registros por página:</span>
                  <select
                    className="form-control"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false)
          setVentaToCancel(null)
        }}
        title="Cancelar venta"
        variant="danger"
        closeOnOverlayClick={false}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelModal(false)
                setVentaToCancel(null)
              }}
              disabled={canceling}
            >
              Volver
            </Button>
            <Button variant="primary" onClick={handleCancel} loading={canceling} disabled={canceling}>
              Confirmar cancelación
            </Button>
          </>
        }
      >
        <p>
          ¿Seguro que querés cancelar esta venta? Quedará visible como <strong>Cancelada</strong>, se
          restaurará el stock y no afectará balances ni reportes financieros.
        </p>
      </Modal>
    </Layout>
  )
}

export default VentasPruebaList
