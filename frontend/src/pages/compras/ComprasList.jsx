// Página de lista de compras
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Button, Spinner, Alert, Pagination, Modal } from '../../components/common'
import { getCompras, cancelarCompra, deudaEfectivaCompra } from '../../services/compras'
import { useDateTime } from '../../context/DateTimeContext'
import { formatDate } from '../../utils/dateFormat'
import ComprasActionsMenu from './ComprasActionsMenu'
import '../../components/ventas-prueba/ventasPrueba.css'
import '../../components/ventas-prueba/VentasPruebaToolbar.css'
import './ComprasList.css'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

function getDefaultFechaDesde() {
  const ahora = new Date()
  const desde = new Date(ahora)
  desde.setDate(desde.getDate() - 90)
  return desde.toISOString().split('T')[0]
}

function getDefaultFechaHasta() {
  return new Date().toISOString().split('T')[0]
}

function formatearMoneda(valor) {
  const num = Number(valor || 0)
  return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function compraEstaCancelada(compra) {
  return String(compra?.estado || '').toLowerCase() === 'cancelada'
}

function getCompraEstadoKey(compra) {
  if (compraEstaCancelada(compra)) return 'cancelado'
  if (deudaEfectivaCompra(compra) > 0.01) return 'pendiente'
  return 'pagado'
}

function labelEstadoCompra(estadoKey) {
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

function ComprasList() {
  const location = useLocation()
  const navigate = useNavigate()
  const { timezone, dateFormat } = useDateTime()

  const [compras, setCompras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const [filtroFechaDesde, setFiltroFechaDesde] = useState(getDefaultFechaDesde)
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(getDefaultFechaHasta)
  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('') // '', pagado, pendiente, cancelada

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [compraToCancel, setCompraToCancel] = useState(null)
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    loadCompras()

    if (location.state?.success) {
      setSuccessMessage(location.state.message || 'Operación realizada correctamente')
      navigate(location.pathname, { replace: true, state: {} })
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [location.state, navigate, location.pathname])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F2') {
        e.preventDefault()
        navigate('/compras/nueva')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  useEffect(() => {
    setCurrentPage(1)
  }, [filtroFechaDesde, filtroFechaHasta, filtroBusqueda, filtroEstado, pageSize])

  const limpiarFiltros = () => {
    setFiltroFechaDesde(getDefaultFechaDesde())
    setFiltroFechaHasta(getDefaultFechaHasta())
    setFiltroBusqueda('')
    setFiltroEstado('')
  }

  const loadCompras = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getCompras()

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setCompras(data || [])
    setLoading(false)
  }

  const filtrarPorFecha = useCallback(
    (lista) => {
      if (!filtroFechaDesde || !filtroFechaHasta) return lista
      const fechaDesde = new Date(filtroFechaDesde)
      fechaDesde.setHours(0, 0, 0, 0)
      const fechaHasta = new Date(filtroFechaHasta)
      fechaHasta.setHours(23, 59, 59, 999)
      return lista.filter((compra) => {
        const fechaCompra = new Date(compra.fecha_orden)
        return fechaCompra >= fechaDesde && fechaCompra <= fechaHasta
      })
    },
    [filtroFechaDesde, filtroFechaHasta],
  )

  const filtrarPorBusqueda = useCallback(
    (lista) => {
      if (!filtroBusqueda.trim()) return lista
      const termino = filtroBusqueda.toLowerCase()
      return lista.filter((compra) => {
        const proveedor = compra.proveedores?.nombre_razon_social?.toLowerCase() || ''
        const numero = compra.numero_orden?.toLowerCase() || ''
        return proveedor.includes(termino) || numero.includes(termino)
      })
    },
    [filtroBusqueda],
  )

  const filtrarPorEstado = useCallback(
    (lista) => {
      if (!filtroEstado) return lista
      return lista.filter((compra) => {
        const key = getCompraEstadoKey(compra)
        if (filtroEstado === 'cancelada') return key === 'cancelado'
        if (filtroEstado === 'pagado') return key === 'pagado'
        if (filtroEstado === 'pendiente') return key === 'pendiente'
        return true
      })
    },
    [filtroEstado],
  )

  const filteredCompras = useMemo(
    () => filtrarPorEstado(filtrarPorBusqueda(filtrarPorFecha(compras))),
    [compras, filtrarPorFecha, filtrarPorBusqueda, filtrarPorEstado],
  )

  const filtrosAplicados = Boolean(
    filtroBusqueda.trim() ||
      filtroEstado ||
      filtroFechaDesde !== getDefaultFechaDesde() ||
      filtroFechaHasta !== getDefaultFechaHasta(),
  )

  const totalItems = filteredCompras.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalItems)
  const paginatedCompras = filteredCompras.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  const handleCancel = async () => {
    if (!compraToCancel) return
    setCanceling(true)
    const { error: err } = await cancelarCompra(compraToCancel)
    if (err) {
      setError(err.message || 'Error al cancelar la compra')
      setCanceling(false)
      return
    }
    setCanceling(false)
    setShowCancelModal(false)
    setCompraToCancel(null)
    setSuccessMessage('Compra cancelada correctamente')
    await loadCompras()
  }

  const formatearFecha = (fecha) => {
    const formatoSoloFecha = dateFormat.split(' ')[0]
    return formatDate(fecha, formatoSoloFecha, timezone)
  }

  const formatearDeuda = (compra) => {
    if (compraEstaCancelada(compra)) return { text: '-', debt: false }
    const deuda = deudaEfectivaCompra(compra)
    if (deuda > 0.01) return { text: formatearMoneda(deuda), debt: true }
    return { text: formatearMoneda(0), debt: false }
  }

  return (
    <Layout>
      <div className="container vp-module cp-list-page">
        <div className="cp-list-toolbar">
          <div>
            <div className="section-label">SECCIÓN</div>
            <h3 className="cp-list-toolbar__title">REGISTROS DE COMPRAS</h3>
          </div>
          <Link to="/compras/nueva">
            <Button variant="primary" className="vp-btn-primary" size="sm">
              Nueva orden (F2)
            </Button>
          </Link>
        </div>

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

        <div className="vp-panel vp-list-filters">
          <div className="vp-list-filters__search">
            <i className="bi bi-search" aria-hidden />
            <input
              type="search"
              className="form-control"
              placeholder="Buscar por proveedor o nº de orden..."
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
            />
          </div>

          <div className="vp-list-filters__fields cp-list-filters__fields">
            <label className="vp-filter-field">
              <span>Desde</span>
              <input
                type="date"
                className="form-control"
                value={filtroFechaDesde}
                onChange={(e) => setFiltroFechaDesde(e.target.value)}
              />
            </label>
            <label className="vp-filter-field">
              <span>Hasta</span>
              <input
                type="date"
                className="form-control"
                value={filtroFechaHasta}
                onChange={(e) => setFiltroFechaHasta(e.target.value)}
                min={filtroFechaDesde}
              />
            </label>
            <label className="vp-filter-field">
              <span>Estado</span>
              <select
                className="form-control"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Con deuda</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </label>
          </div>

          <div className="vp-list-filters__actions">
            <Button type="button" variant="ghost" onClick={limpiarFiltros} disabled={loading}>
              Limpiar
            </Button>
          </div>
        </div>

        {filtrosAplicados ? (
          <p className="vp-list-filtros-activos" role="status">
            Filtros aplicados
            {filtroBusqueda.trim() ? ` · búsqueda “${filtroBusqueda.trim()}”` : ''}
            {filtroEstado ? ' · estado' : ''}.
          </p>
        ) : null}

        <div className="vp-panel vp-list-table-panel">
          {loading && compras.length === 0 ? (
            <div className="vp-empty">
              <Spinner />
              <p>Cargando compras…</p>
            </div>
          ) : paginatedCompras.length === 0 ? (
            <div className="vp-empty">
              <p>
                {compras.length === 0
                  ? 'No hay compras registradas aún.'
                  : 'No se encontraron compras con los filtros aplicados.'}
              </p>
              {compras.length === 0 ? (
                <Link to="/compras/nueva">
                  <Button variant="primary" className="vp-btn-primary">
                    Crear primera compra
                  </Button>
                </Link>
              ) : (
                <Button type="button" variant="outline" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="vp-table-wrap">
                <table className="vp-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Proveedor</th>
                      <th>Total</th>
                      <th className="hide-mobile">Pagado</th>
                      <th className="hide-mobile">Deuda</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCompras.map((compra) => {
                      const estadoKey = getCompraEstadoKey(compra)
                      const deuda = formatearDeuda(compra)
                      return (
                        <tr
                          key={compra.id}
                          className={compraEstaCancelada(compra) ? 'vp-row--cancelada' : ''}
                        >
                          <td>{formatearFecha(compra.fecha_orden)}</td>
                          <td>{compra.proveedores?.nombre_razon_social || '—'}</td>
                          <td className="vp-money">{formatearMoneda(compra.total)}</td>
                          <td className="hide-mobile">{formatearMoneda(compra.monto_pagado)}</td>
                          <td className={`hide-mobile${deuda.debt ? ' vp-money--warning' : ''}`}>
                            {deuda.text}
                          </td>
                          <td>
                            <span className={badgeClassEstado(estadoKey)}>
                              {labelEstadoCompra(estadoKey)}
                            </span>
                          </td>
                          <td>
                            <ComprasActionsMenu
                              compraId={compra.id}
                              cancelada={compraEstaCancelada(compra)}
                              onCancel={(compraId) => {
                                setCompraToCancel(compraId)
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
                  {totalItems > 0
                    ? `Mostrando ${startIndex} a ${endIndex} de ${totalItems} registros`
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
          setCompraToCancel(null)
        }}
        title="Cancelar compra"
        variant="danger"
        closeOnOverlayClick={false}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelModal(false)
                setCompraToCancel(null)
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
          ¿Seguro que querés cancelar esta compra? Quedará visible como <strong>Cancelada</strong>
          {'. '}
          Si ya había sido recibida, se revertirá el stock.
        </p>
      </Modal>
    </Layout>
  )
}

export default ComprasList
