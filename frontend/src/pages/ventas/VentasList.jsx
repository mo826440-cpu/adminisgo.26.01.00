// Página de lista de ventas
import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Spinner, Alert, Badge, Modal, Pagination } from '../../components/common'
import { cancelVenta } from '../../services/ventas'
import { fetchVentasRegistros, VENTAS_REGISTROS_LIMIT, extraerOpcionesFiltroRegistros, encodeFiltroFechaRango } from '../../services/ventasListado'
import RegistrosVentasFiltro from '../../components/ventas/RegistrosVentasFiltro'
import {
  ventaEstaCancelada,
  getVentaEstadoDisplay,
  getVentaEstadoLabel,
  getVentaEstadoBadgeVariant,
  getVentaFechaDisplay,
} from '../../utils/ventaEstado'
import { useDateTime } from '../../context/DateTimeContext'
import { formatDateTime } from '../../utils/dateFormat'
import ActionsMenu from './ActionsMenu'
import './VentasList.css'
import '../../styles/registros-seccion.css'

function VentasList() {
  const location = useLocation()
  const navigate = useNavigate()
  const [ventas, setVentas] = useState([])
  const [totalVentas, setTotalVentas] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [ventaToCancel, setVentaToCancel] = useState(null)
  const [canceling, setCanceling] = useState(false)

  const [filtroTipoDraft, setFiltroTipoDraft] = useState('')
  const [filtroValorDraft, setFiltroValorDraft] = useState('')
  const [filtroFechaDesdeDraft, setFiltroFechaDesdeDraft] = useState('')
  const [filtroFechaHastaDraft, setFiltroFechaHastaDraft] = useState('')
  const [filtroActivo, setFiltroActivo] = useState({ tipo: '', valor: '' })
  const [opcionesFiltro, setOpcionesFiltro] = useState({
    clientes: [],
    metodosPago: [],
    estados: [],
  })

  const loadVentas = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, total, error: err } = await fetchVentasRegistros({
      page: currentPage,
      pageSize: VENTAS_REGISTROS_LIMIT,
      filtroTipo: filtroActivo.tipo,
      filtroValor: filtroActivo.valor,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    const rows = data || []
    const totalRows = total ?? 0
    setVentas(rows)
    setTotalVentas(totalRows)
    if (!filtroActivo.tipo && currentPage === 1) {
      setOpcionesFiltro(extraerOpcionesFiltroRegistros(rows, { modo: 'ventas' }))
    }
    setLoading(false)
  }, [filtroActivo, currentPage])

  useEffect(() => {
    loadVentas()
  }, [loadVentas])

  useEffect(() => {
    if (!location.state?.success) return
    setSuccessMessage(location.state.message || 'Operación realizada correctamente')
    navigate(location.pathname, { replace: true, state: {} })
    const timer = setTimeout(() => {
      setSuccessMessage(null)
    }, 5000)
    return () => clearTimeout(timer)
  }, [location.state, navigate, location.pathname])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F2') {
        e.preventDefault()
        navigate('/ventas/nueva')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  const handleTipoFiltroChange = (tipo) => {
    setFiltroTipoDraft(tipo)
    setFiltroValorDraft('')
    setFiltroFechaDesdeDraft('')
    setFiltroFechaHastaDraft('')
  }

  const aplicarFiltro = () => {
    if (!filtroTipoDraft) return
    setCurrentPage(1)
    if (filtroTipoDraft === 'fecha') {
      if (!filtroFechaDesdeDraft || !filtroFechaHastaDraft) return
      setFiltroActivo({
        tipo: 'fecha',
        valor: encodeFiltroFechaRango(filtroFechaDesdeDraft, filtroFechaHastaDraft),
      })
      return
    }
    if (!String(filtroValorDraft).trim()) return
    setFiltroActivo({ tipo: filtroTipoDraft, valor: filtroValorDraft })
  }

  const limpiarFiltro = () => {
    setFiltroTipoDraft('')
    setFiltroValorDraft('')
    setFiltroFechaDesdeDraft('')
    setFiltroFechaHastaDraft('')
    setCurrentPage(1)
    setFiltroActivo({ tipo: '', valor: '' })
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    await loadVentas()
  }

  const { timezone, dateFormat } = useDateTime()

  const formatearFecha = (fecha) => {
    return formatDateTime(fecha, dateFormat, timezone)
  }

  const formatearMoneda = (valor) => {
    const num = Number(valor || 0)
    return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatearDeuda = (venta) => {
    if (ventaEstaCancelada(venta)) return '-'
    const total = parseFloat(venta.total || 0)
    const pagado = parseFloat(venta.monto_pagado || 0)
    const deuda = Math.max(0, total - pagado)
    return deuda > 0.01 ? formatearMoneda(deuda) : '-'
  }

  const hayFiltroActivo = Boolean(filtroActivo.tipo && filtroActivo.valor)
  const totalPages = Math.max(1, Math.ceil(totalVentas / VENTAS_REGISTROS_LIMIT))
  const startIndex = totalVentas === 0 ? 0 : (currentPage - 1) * VENTAS_REGISTROS_LIMIT + 1
  const endIndex = Math.min(currentPage * VENTAS_REGISTROS_LIMIT, totalVentas)

  if (loading && ventas.length === 0) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando ventas...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" dismissible onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        <Card className="registros-panel">
          <div className="section-label">SECCIÓN</div>
          <h3 className="registros-seccion-titulo">REGISTROS DE VENTAS</h3>
          <p className="registros-aviso-filtro">
            Se muestran {VENTAS_REGISTROS_LIMIT} registros por página
            {hayFiltroActivo ? ' (con filtro aplicado)' : ''}. Usá la paginación para ver más
            registros o el filtro para buscar por fecha, cliente, método de pago o estado.
          </p>

          <RegistrosVentasFiltro
            idPrefix="ventas"
            tipoFiltro={filtroTipoDraft}
            valorFiltro={filtroValorDraft}
            fechaDesde={filtroFechaDesdeDraft}
            fechaHasta={filtroFechaHastaDraft}
            onTipoChange={handleTipoFiltroChange}
            onValorChange={setFiltroValorDraft}
            onFechaDesdeChange={setFiltroFechaDesdeDraft}
            onFechaHastaChange={setFiltroFechaHastaDraft}
            onAplicar={aplicarFiltro}
            onLimpiar={limpiarFiltro}
            opcionesFiltro={opcionesFiltro}
            aplicando={loading}
          />

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spinner />
            </div>
          ) : ventas.length === 0 ? (
            <div className="empty-state">
              {hayFiltroActivo ? (
                <p>No se encontraron ventas que coincidan con el filtro aplicado.</p>
              ) : (
                <>
                  <p>No hay ventas registradas aún.</p>
                  <Link to="/ventas/nueva">
                    <Button variant="primary">Crear primera venta</Button>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table table-sticky-header">
                  <thead>
                    <tr>
                      <th>FECHA</th>
                      <th>CLIENTE</th>
                      <th className="hide-mobile">PRECIO TOTAL</th>
                      <th className="hide-mobile">COBRADO</th>
                      <th className="hide-mobile">DEUDA</th>
                      <th>ESTADO</th>
                      <th>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map((venta) => {
                      const estadoKey = getVentaEstadoDisplay(venta)
                      const fechaDisplay = getVentaFechaDisplay(venta)

                      return (
                        <tr key={venta.id} className={ventaEstaCancelada(venta) ? 'venta-row--cancelada' : ''}>
                          <td>{formatearFecha(fechaDisplay)}</td>
                          <td>{venta.clientes?.nombre || 'Cliente genérico'}</td>
                          <td className="hide-mobile">{formatearMoneda(venta.total)}</td>
                          <td className="hide-mobile">{formatearMoneda(venta.monto_pagado)}</td>
                          <td className="hide-mobile">{formatearDeuda(venta)}</td>
                          <td>
                            <Badge variant={getVentaEstadoBadgeVariant(estadoKey)}>
                              {getVentaEstadoLabel(estadoKey)}
                            </Badge>
                          </td>
                          <td>
                            <div className="table-actions">
                              <ActionsMenu
                                ventaId={venta.id}
                                cancelada={ventaEstaCancelada(venta)}
                                onCancel={(ventaId) => {
                                  setVentaToCancel(ventaId)
                                  setShowCancelModal(true)
                                }}
                              />
                            </div>
                          </td>
                        </tr>
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

              <div className="table-info" style={{ marginTop: '1rem' }}>
                {totalVentas > 0
                  ? `Mostrando ${startIndex}-${endIndex} de ${totalVentas} ventas`
                  : 'Sin registros para mostrar'}
              </div>
            </>
          )}
        </Card>
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
            <Button
              variant="primary"
              onClick={handleCancel}
              loading={canceling}
              disabled={canceling}
            >
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

export default VentasList
