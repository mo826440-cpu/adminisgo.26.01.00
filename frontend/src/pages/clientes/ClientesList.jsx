// Página de lista de clientes — tabla refactorizada (estado de deuda, tooltips, exportación)
import { useState, useEffect, useCallback, useMemo, useRef, Fragment } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Spinner, Alert, Pagination, Modal } from '../../components/common'
import { getClientes } from '../../services/clientes'
import {
  getMapaDeudaPorClienteIds,
  getVentasConDeudaPorClienteId,
  getVentasMovimientosPorClienteId,
  registrarPagoClienteDistribuido,
} from '../../services/ventas'
import { formatMoneyAR } from '../reportes/reporteVentasUtils'
import {
  downloadClienteMovimientosPdf,
} from '../../utils/clienteMovimientosExport'
import GlassTooltip from '../../components/clientes/GlassTooltip'
import { getComercio } from '../../services/comercio'
import { useDateTime } from '../../context/DateTimeContext'
import { formatDateTime } from '../../utils/dateFormat'
import ThermalPrintPreviewModal from '../../components/common/ThermalPrintPreviewModal'
import TicketPrintBlock from '../../components/common/TicketPrintBlock'
import { useTicketPrintFormat } from '../../hooks/useTicketPrintFormat'
import { useTicketPrintConfig } from '../../context/TicketPrintContext'
import { buildClienteDeudasThermalPlainText } from '../../utils/thermalPlainReceipt'
import '../../styles/ticketThermalPrint.css'
import './ClientesList.css'
import './ClientesActionsMenu.css'
import ClientesActionsMenu from './ClientesActionsMenu'
import ClienteVentasActionsMenu from './ClienteVentasActionsMenu'
import { getVentaEstadoDisplay, ventaEstaCancelada } from '../../utils/ventaEstado'
import '../../styles/registros-seccion.css'

const ITEMS_PER_PAGE = 100

function datoOGuion(val) {
  const s = val != null && String(val).trim() !== '' ? String(val).trim() : null
  return s || '—'
}

function getVentaEstadoSublistLabel(venta) {
  const key = getVentaEstadoDisplay(venta)
  if (key === 'cancelado') return 'CANCELADA'
  if (key === 'pendiente') return 'PENDIENTE'
  return 'PAGADO'
}

function getVentaEstadoSublistClass(venta) {
  const key = getVentaEstadoDisplay(venta)
  if (key === 'cancelado') return 'clientes-venta-badge--cancelada'
  if (key === 'pendiente') return 'clientes-venta-badge--pendiente'
  return 'clientes-venta-badge--pagado'
}

function ClientesList() {
  useTicketPrintFormat()
  const { config: printConfig } = useTicketPrintConfig()
  const location = useLocation()
  const navigate = useNavigate()
  const { timezone } = useDateTime()
  const [clientes, setClientes] = useState([])
  const [mapaDeuda, setMapaDeuda] = useState(() => new Map())
  const [loading, setLoading] = useState(true)
  const [loadingDeudas, setLoadingDeudas] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [successMessage, setSuccessMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [reporteLoadingId, setReporteLoadingId] = useState(null)
  const [pdfModal, setPdfModal] = useState(null)
  const [pdfModoFecha, setPdfModoFecha] = useState('todo')
  const [pdfFechaDesde, setPdfFechaDesde] = useState('')
  const [pdfFechaHasta, setPdfFechaHasta] = useState('')
  const [pdfGenerando, setPdfGenerando] = useState(false)
  const [pdfError, setPdfError] = useState(null)
  const [expandedClienteIds, setExpandedClienteIds] = useState(() => new Set())
  const [ventasPorCliente, setVentasPorCliente] = useState(() => new Map())
  const [ventasLoadingIds, setVentasLoadingIds] = useState(() => new Set())

  // Pago cliente (distribuido FIFO)
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [pagoCliente, setPagoCliente] = useState(null)
  const [pagoMonto, setPagoMonto] = useState('')
  const [pagoMetodo, setPagoMetodo] = useState('efectivo')
  const [pagoObs, setPagoObs] = useState('')
  const [pagoSaving, setPagoSaving] = useState(false)
  const [pagoError, setPagoError] = useState(null)

  // Impresión ticket de deudas
  const ticketRef = useRef(null)
  const [printOpen, setPrintOpen] = useState(false)
  const [printCliente, setPrintCliente] = useState(null)
  const [printComercio, setPrintComercio] = useState(null)
  const [printVentasDeuda, setPrintVentasDeuda] = useState([])
  const [printPagoInfo, setPrintPagoInfo] = useState(null)
  const [ticketLoadingId, setTicketLoadingId] = useState(null)

  const formatearMoneda = (valor) => {
    const num = Number(valor || 0)
    return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatearFechaHoraTicket = (fechaIso) => {
    if (!fechaIso) return '—'
    return formatDateTime(fechaIso, 'DD/MM/YYYY HH:mm', timezone)
  }

  const loadClientes = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getClientes()

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setClientes(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadClientes()
    }, 0)
    return () => window.clearTimeout(t)
  }, [loadClientes])

  useEffect(() => {
    if (!location.state?.success) return undefined
    const t0 = window.setTimeout(() => {
      setSuccessMessage(location.state.message || 'Operación realizada correctamente')
      navigate(location.pathname, { replace: true, state: {} })
    }, 0)
    const t1 = window.setTimeout(() => {
      setSuccessMessage(null)
    }, 5000)
    return () => {
      window.clearTimeout(t0)
      window.clearTimeout(t1)
    }
  }, [location.state, navigate, location.pathname])

  useEffect(() => {
    let cancelled = false
    const t = window.setTimeout(() => {
      if (!clientes.length) {
        if (!cancelled) {
          setMapaDeuda(new Map())
          setLoadingDeudas(false)
        }
        return
      }
      setLoadingDeudas(true)
      void (async () => {
        const ids = clientes.map((c) => c.id)
        const map = await getMapaDeudaPorClienteIds(ids)
        if (!cancelled) {
          setMapaDeuda(map)
          setLoadingDeudas(false)
        }
      })()
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [clientes])

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefono?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalItems = filteredClientes.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedClientes = filteredClientes.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleExpandVentas = async (clienteId) => {
    const id = Number(clienteId)
    if (expandedClienteIds.has(id)) {
      setExpandedClienteIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      return
    }

    setExpandedClienteIds((prev) => new Set(prev).add(id))

    if (ventasPorCliente.has(id)) return

    setVentasLoadingIds((prev) => new Set(prev).add(id))
    const { data, error: err } = await getVentasMovimientosPorClienteId(id)
    setVentasLoadingIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })

    if (err) {
      setError(err.message || 'No se pudieron cargar las ventas del cliente.')
      setExpandedClienteIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      return
    }

    setVentasPorCliente((prev) => new Map(prev).set(id, data || []))
  }

  const openPdfModal = (cliente, tipo) => {
    setPdfError(null)
    setPdfModal({ cliente, tipo })
    setPdfModoFecha('todo')
    setPdfFechaDesde('')
    setPdfFechaHasta('')
  }

  const closePdfModal = () => {
    if (pdfGenerando) return
    setPdfModal(null)
    setPdfError(null)
  }

  const generarPdfHistorial = async () => {
    if (!pdfModal?.cliente) return
    setPdfError(null)

    const usarRango = pdfModoFecha === 'rango'
    if (usarRango && !pdfFechaDesde && !pdfFechaHasta) {
      setPdfError('Indicá al menos una fecha (desde o hasta) para filtrar.')
      return
    }
    if (usarRango && pdfFechaDesde && pdfFechaHasta && pdfFechaDesde > pdfFechaHasta) {
      setPdfError('La fecha «Desde» no puede ser posterior a «Hasta».')
      return
    }

    setPdfGenerando(true)
    setReporteLoadingId(pdfModal.cliente.id)
    const { data, error: err } = await getVentasMovimientosPorClienteId(pdfModal.cliente.id)
    setReporteLoadingId(null)
    setPdfGenerando(false)

    if (err) {
      setPdfError(err.message || 'No se pudo obtener el historial de ventas del cliente.')
      return
    }

    downloadClienteMovimientosPdf(pdfModal.cliente.nombre, data || [], {
      tipo: pdfModal.tipo,
      fechaDesde: usarRango ? pdfFechaDesde || undefined : undefined,
      fechaHasta: usarRango ? pdfFechaHasta || undefined : undefined,
    })
    closePdfModal()
  }

  const openPagoModal = (cliente) => {
    setPagoError(null)
    setPagoCliente(cliente)
    setPagoMonto('')
    setPagoMetodo('efectivo')
    setPagoObs('')
    setShowPagoModal(true)
  }

  const closePagoModal = () => {
    if (pagoSaving) return
    setShowPagoModal(false)
    setPagoCliente(null)
    setPagoError(null)
  }

  const prepararImpresionDeudas = async (cliente, options = {}) => {
    if (!cliente?.id) return
    setTicketLoadingId(cliente.id)
    setError(null)
    try {
      const [comercioRes, ventasRes] = await Promise.all([
        getComercio(),
        getVentasConDeudaPorClienteId(cliente.id),
      ])
      if (comercioRes?.error) {
        setError(comercioRes.error.message || 'No se pudo cargar el comercio.')
        return
      }
      if (ventasRes?.error) {
        setError(ventasRes.error.message || 'No se pudieron cargar las deudas del cliente.')
        return
      }
      setPrintCliente(cliente)
      setPrintComercio(comercioRes.data || null)
      setPrintVentasDeuda(ventasRes.data || [])
      setPrintPagoInfo(
        options.pagoInfo && Number.isFinite(Number(options.pagoInfo.montoPagado))
          ? {
              montoPagado: Number(options.pagoInfo.montoPagado),
              deudaRestante: Math.max(0, Number(options.pagoInfo.deudaRestante) || 0),
            }
          : null,
      )
      setPrintOpen(true)
    } catch (err) {
      setError(err?.message || 'No se pudo preparar el ticket de deudas.')
    } finally {
      setTicketLoadingId(null)
    }
  }

  const handleRegistrarPago = async () => {
    if (!pagoCliente) return
    setPagoError(null)

    const monto = Number(String(pagoMonto || '').replace(/[^\d,.-]/g, '').replace(',', '.'))
    if (!Number.isFinite(monto) || monto <= 0) {
      setPagoError('Ingresá un monto válido mayor a 0.')
      return
    }

    setPagoSaving(true)
    const { data: pagoData, error: err } = await registrarPagoClienteDistribuido({
      clienteId: pagoCliente.id,
      monto,
      metodo_pago: pagoMetodo,
      observaciones: pagoObs?.trim() || null,
    })
    if (err) {
      setPagoError(err.message || 'No se pudo registrar el pago.')
      setPagoSaving(false)
      return
    }

    // Refrescar mapa de deuda (para cambiar DEBE/AL DÍA)
    const ids = clientes.map((c) => c.id)
    const map = await getMapaDeudaPorClienteIds(ids)
    setMapaDeuda(map)

    const imputado = (pagoData?.imputaciones || []).reduce(
      (sum, it) => sum + (Number(it.monto) || 0),
      0,
    )
    const montoPagadoEfectivo = imputado > 0.009 ? imputado : monto
    const deudaRestante = map.get(Number(pagoCliente.id)) || 0

    setPagoSaving(false)
    setShowPagoModal(false)

    await prepararImpresionDeudas(pagoCliente, {
      pagoInfo: {
        montoPagado: montoPagadoEfectivo,
        deudaRestante,
      },
    })
  }

  const ticketDeudasPlain = useMemo(() => {
    if (!printCliente) return ''
    return buildClienteDeudasThermalPlainText({
      comercio: printComercio,
      cliente: printCliente,
      ventasConDeuda: printVentasDeuda,
      formatearMoneda,
      formatearFechaHoraTicket,
      printConfig,
      pagoInfo: printPagoInfo,
    })
  }, [printCliente, printComercio, printVentasDeuda, printPagoInfo, printConfig, timezone])

  const deudaTotalPagoCliente = useMemo(() => {
    const cid = Number(pagoCliente?.id)
    if (!Number.isFinite(cid) || cid <= 0) return 0
    return mapaDeuda.get(cid) || 0
  }, [pagoCliente, mapaDeuda])

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando clientes...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        {successMessage && (
          <Alert variant="success" dismissible onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card>
          <div className="section-label">SECCIÓN</div>
          <h3 className="registros-seccion-titulo">REGISTROS DE CLIENTES</h3>
          <div className="table-controls">
            <input
              type="text"
              className="form-control clientes-search-input"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
            {totalItems > 0 && (
              <div className="table-info">
                Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems} clientes
                {loadingDeudas && (
                  <span className="clientes-deuda-loading" aria-live="polite">
                    {' '}
                    · Sincronizando saldos…
                  </span>
                )}
              </div>
            )}
          </div>

          {filteredClientes.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                {searchTerm
                  ? 'No se encontraron clientes con ese criterio de búsqueda.'
                  : 'No hay clientes registrados aún.'}
              </p>
              {!searchTerm && (
                <Link to="/clientes/nuevo">
                  <Button variant="primary" style={{ marginTop: '1rem' }}>
                    Crear primer cliente
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="table-container clientes-table-wrap">
                <table className="table table-sticky-header clientes-table-futurist">
                  <colgroup>
                    <col className="clientes-col-expand" />
                    <col className="clientes-col-nombre" />
                    <col className="clientes-col-estado" />
                    <col className="clientes-col-acciones" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="clientes-th-expand" aria-label="Expandir ventas" />
                      <th>Nombre</th>
                      <th className="clientes-th-estado">Estado</th>
                      <th className="clientes-th-acciones">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClientes.map((cliente) => {
                      const clienteId = Number(cliente.id)
                      const isExpanded = expandedClienteIds.has(clienteId)
                      const ventasCliente = ventasPorCliente.get(clienteId) || []
                      const ventasLoading = ventasLoadingIds.has(clienteId)
                      const saldoDeuda = mapaDeuda.get(clienteId) || 0
                      const debe = saldoDeuda > 0.009
                      const tooltipNombre = (
                        <>
                          <p className="glass-tooltip__title">Datos de contacto</p>
                          <div className="glass-tooltip__row">
                            <span className="glass-tooltip__label">Email</span>
                            <span className="glass-tooltip__value">{datoOGuion(cliente.email)}</span>
                          </div>
                          <div className="glass-tooltip__row">
                            <span className="glass-tooltip__label">Teléfono</span>
                            <span className="glass-tooltip__value">{datoOGuion(cliente.telefono)}</span>
                          </div>
                          <div className="glass-tooltip__row">
                            <span className="glass-tooltip__label">Dirección</span>
                            <span className="glass-tooltip__value">{datoOGuion(cliente.direccion)}</span>
                          </div>
                        </>
                      )
                      const tooltipDeuda = (
                        <>
                          <p className="glass-tooltip__title">Saldo pendiente</p>
                          <p className="glass-tooltip__deuda-monto">{formatMoneyAR(saldoDeuda)}</p>
                          <p className="glass-tooltip__value" style={{ marginTop: '0.35rem', fontSize: '0.75rem' }}>
                            Suma de deudas en ventas asociadas a este cliente.
                          </p>
                        </>
                      )
                      return (
                        <Fragment key={cliente.id}>
                          <tr className={isExpanded ? 'cliente-row--expanded' : ''}>
                            <td className="clientes-td-expand">
                              <button
                                type="button"
                                className="clientes-expand-btn"
                                onClick={() => toggleExpandVentas(cliente.id)}
                                aria-expanded={isExpanded}
                                aria-label={
                                  isExpanded
                                    ? `Ocultar ventas de ${cliente.nombre}`
                                    : `Ver ventas de ${cliente.nombre}`
                                }
                                title={isExpanded ? 'Ocultar ventas' : 'Ver ventas'}
                              >
                                <i
                                  className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`}
                                  aria-hidden
                                />
                              </button>
                            </td>
                            <td className="clientes-td-nombre">
                              <GlassTooltip content={tooltipNombre}>
                                <span className="clientes-table__nombre-text">{cliente.nombre}</span>
                              </GlassTooltip>
                            </td>
                            <td className="clientes-td-estado">
                              {debe ? (
                                <GlassTooltip content={tooltipDeuda}>
                                  <span className="clientes-badge clientes-badge--debe" tabIndex={0}>
                                    DEBE
                                  </span>
                                </GlassTooltip>
                              ) : (
                                <span className="clientes-badge clientes-badge--al-dia">AL DÍA</span>
                              )}
                            </td>
                            <td className="clientes-td-acciones">
                              <ClientesActionsMenu
                                clienteId={cliente.id}
                                clienteNombre={cliente.nombre}
                                debe={debe}
                                reporteLoading={reporteLoadingId === cliente.id}
                                ticketLoading={ticketLoadingId === cliente.id}
                                onRegistrarPago={() => openPagoModal(cliente)}
                                onImprimirTicketDeudas={() => prepararImpresionDeudas(cliente)}
                                onExportPdfDeudas={() => openPdfModal(cliente, 'deudas')}
                                onExportPdfTotal={() => openPdfModal(cliente, 'total')}
                              />
                            </td>
                          </tr>
                          {isExpanded ? (
                            <tr className="cliente-ventas-row">
                              <td colSpan={4}>
                                <div className="cliente-ventas-panel">
                                  {ventasLoading ? (
                                    <div className="cliente-ventas-loading">
                                      <Spinner size="sm" />
                                      <span>Cargando ventas…</span>
                                    </div>
                                  ) : ventasCliente.length === 0 ? (
                                    <p className="cliente-ventas-empty">
                                      No hay ventas registradas para este cliente.
                                    </p>
                                  ) : (
                                    <div className="cliente-ventas-scroll">
                                      <table className="table cliente-ventas-table">
                                        <thead>
                                          <tr>
                                            <th className="cliente-ventas-th-total">Precio total</th>
                                            <th className="cliente-ventas-th-estado">Estado</th>
                                            <th className="cliente-ventas-th-acciones">Acciones</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {ventasCliente.map((venta) => (
                                            <tr key={venta.id}>
                                              <td className="cliente-ventas-td-total">
                                                {formatMoneyAR(venta.total)}
                                              </td>
                                              <td className="cliente-ventas-td-estado">
                                                <span
                                                  className={`clientes-venta-badge ${getVentaEstadoSublistClass(venta)}`}
                                                >
                                                  {getVentaEstadoSublistLabel(venta)}
                                                </span>
                                              </td>
                                              <td className="cliente-ventas-td-acciones">
                                                <ClienteVentasActionsMenu
                                                  ventaId={venta.id}
                                                  cancelada={ventaEstaCancelada(venta)}
                                                />
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </Card>
      </div>

      {/* Modal exportar PDF historial */}
      <Modal
        isOpen={Boolean(pdfModal)}
        onClose={closePdfModal}
        title={
          pdfModal?.tipo === 'deudas'
            ? `PDF ventas con deuda — ${pdfModal?.cliente?.nombre || ''}`
            : `PDF historial total — ${pdfModal?.cliente?.nombre || ''}`
        }
        closeOnOverlayClick={!pdfGenerando}
        footer={
          <>
            <Button variant="outline" onClick={closePdfModal} disabled={pdfGenerando}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={generarPdfHistorial}
              loading={pdfGenerando}
              disabled={pdfGenerando}
            >
              Generar PDF
            </Button>
          </>
        }
      >
        <p className="cliente-pdf-modal__hint">
          Elegí si querés todo el historial o un rango de fechas. El PDF incluirá el total de deuda
          de las ventas listadas.
        </p>

        {pdfError ? (
          <Alert variant="danger" dismissible onDismiss={() => setPdfError(null)}>
            {pdfError}
          </Alert>
        ) : null}

        <fieldset className="cliente-pdf-modal__modo">
          <legend className="cliente-pdf-modal__legend">Alcance del reporte</legend>
          <label className="cliente-pdf-modal__radio">
            <input
              type="radio"
              name="pdfModoFecha"
              value="todo"
              checked={pdfModoFecha === 'todo'}
              onChange={() => setPdfModoFecha('todo')}
              disabled={pdfGenerando}
            />
            <span>Todo el historial</span>
          </label>
          <label className="cliente-pdf-modal__radio">
            <input
              type="radio"
              name="pdfModoFecha"
              value="rango"
              checked={pdfModoFecha === 'rango'}
              onChange={() => setPdfModoFecha('rango')}
              disabled={pdfGenerando}
            />
            <span>Filtrar por fechas</span>
          </label>
        </fieldset>

        {pdfModoFecha === 'rango' ? (
          <div className="form-row cliente-pdf-modal__fechas">
            <div className="form-col">
              <label className="form-label">
                Desde
                <input
                  type="date"
                  className="form-control"
                  value={pdfFechaDesde}
                  onChange={(e) => setPdfFechaDesde(e.target.value)}
                  disabled={pdfGenerando}
                />
              </label>
            </div>
            <div className="form-col">
              <label className="form-label">
                Hasta
                <input
                  type="date"
                  className="form-control"
                  value={pdfFechaHasta}
                  onChange={(e) => setPdfFechaHasta(e.target.value)}
                  disabled={pdfGenerando}
                />
              </label>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Modal registrar pago */}
      <Modal
        isOpen={showPagoModal}
        onClose={closePagoModal}
        title={pagoCliente ? `Registrar pago — ${pagoCliente.nombre}` : 'Registrar pago'}
        closeOnOverlayClick={!pagoSaving}
        footer={
          <>
            <Button variant="outline" onClick={closePagoModal} disabled={pagoSaving}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleRegistrarPago} loading={pagoSaving} disabled={pagoSaving}>
              Registrar pago
            </Button>
          </>
        }
      >
        {pagoCliente ? (
          <p className="text-secondary" style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>
            <strong>Deuda total:</strong> {formatMoneyAR(deudaTotalPagoCliente)}
          </p>
        ) : null}

        {pagoError ? (
          <Alert variant="danger" dismissible onDismiss={() => setPagoError(null)}>
            {pagoError}
          </Alert>
        ) : null}

        <div className="form-row">
          <div className="form-col">
            <label className="form-label">
              Monto abonado
              <input
                className="form-control"
                value={pagoMonto}
                onChange={(e) => setPagoMonto(e.target.value)}
                placeholder="$0,00"
                inputMode="decimal"
                autoFocus
                disabled={pagoSaving}
              />
            </label>
          </div>
          <div className="form-col">
            <label className="form-label">
              Método
              <select
                className="form-control"
                value={pagoMetodo}
                onChange={(e) => setPagoMetodo(e.target.value)}
                disabled={pagoSaving}
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="qr">QR</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
                <option value="cheque">Cheque</option>
                <option value="otro">Otro</option>
              </select>
            </label>
          </div>
        </div>
        <div className="form-row">
          <div className="form-col form-col-full">
            <label className="form-label">
              Observaciones (opcional)
              <textarea
                className="form-control"
                rows="2"
                value={pagoObs}
                onChange={(e) => setPagoObs(e.target.value)}
                disabled={pagoSaving}
              />
            </label>
          </div>
        </div>
        <p className="text-secondary" style={{ margin: '0.5rem 0 0', fontSize: '0.82rem' }}>
          El monto se descuenta automáticamente desde las deudas más antiguas a las más recientes.
        </p>
      </Modal>

      {/* Host ticket (se clona dentro del modal de impresión) */}
      <div className="ticket-print-host" aria-hidden="true">
        <TicketPrintBlock innerRef={ticketRef} plainText={ticketDeudasPlain} />
      </div>

      <ThermalPrintPreviewModal
        isOpen={printOpen}
        onClose={() => {
          setPrintOpen(false)
          setPrintPagoInfo(null)
        }}
        sourceRef={ticketRef}
        ariaLabelTicket={
          printPagoInfo
            ? 'Vista previa del comprobante de pago del cliente'
            : 'Vista previa del ticket de deudas del cliente'
        }
      />
    </Layout>
  )
}

export default ClientesList
