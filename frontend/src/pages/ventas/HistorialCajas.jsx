// Página de Historial de Cajas
import { Fragment, useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Spinner, Alert, Badge, Modal } from '../../components/common'
import { getHistorialCajas, deleteHistorialCaja, updateHistorialCaja } from '../../services/caja'
import { useDateTime } from '../../context/DateTimeContext'
import { formatDateTime } from '../../utils/dateFormat'
import { getComercio } from '../../services/comercio'
import { useTicketPrintFormat } from '../../hooks/useTicketPrintFormat'
import ThermalPrintPreviewModal from '../../components/common/ThermalPrintPreviewModal'
import './HistorialCajas.css'

function HistorialCajas() {
  useTicketPrintFormat()
  const location = useLocation()
  const navigate = useNavigate()
  const ticketPrintRef = useRef(null)
  const [thermalPreviewOpen, setThermalPreviewOpen] = useState(false)
  const { timezone, dateFormat } = useDateTime()
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [comercio, setComercio] = useState(null)
  const [shouldPrint, setShouldPrint] = useState(false)

  // Filtros
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Modales
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null)
  const [registroDetalle, setRegistroDetalle] = useState(null)
  const [editEfectivo, setEditEfectivo] = useState('0')
  const [editVirtual, setEditVirtual] = useState('0')
  const [editCredito, setEditCredito] = useState('0')
  const [editOtros, setEditOtros] = useState('0')
  const [editObservaciones, setEditObservaciones] = useState('')
  const [procesando, setProcesando] = useState(false)

  // Formatear moneda
  const formatearMoneda = (valor) => {
    const num = Number(valor || 0)
    return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Formatear fecha y hora
  const formatearFechaHora = (fecha) => {
    if (!fecha) return '-'
    return formatDateTime(fecha, 'DD/MM/YYYY HH:mm', timezone)
  }

  // Obtener desglose de un registro (registros antiguos sin columnas usan importe como efectivo)
  const getDesglose = (registro) => {
    if (!registro) return { efectivo: 0, virtual: 0, credito: 0, otros: 0 }
    const efectivo = parseFloat(registro.importe_efectivo ?? registro.importe ?? 0) || 0
    const virtual = parseFloat(registro.importe_virtual ?? 0) || 0
    const credito = parseFloat(registro.importe_credito ?? 0) || 0
    const otros = parseFloat(registro.importe_otros ?? 0) || 0
    return { efectivo, virtual, credito, otros }
  }

  // Texto del desglose para mostrar (ej. "Efectivo = $X - Virtual = $Y")
  const textoDesglose = (registro) => {
    const d = getDesglose(registro)
    const partes = []
    if (d.efectivo > 0) partes.push(`Efectivo = ${formatearMoneda(d.efectivo)}`)
    if (d.virtual > 0) partes.push(`Virtual (QR, transferencia, débito) = ${formatearMoneda(d.virtual)}`)
    if (d.credito > 0) partes.push(`Crédito = ${formatearMoneda(d.credito)}`)
    if (d.otros > 0) partes.push(`Otros = ${formatearMoneda(d.otros)}`)
    if (partes.length === 0) return formatearMoneda(registro?.importe ?? 0)
    return partes.join(' — ')
  }

  // Cargar historial
  const loadHistorial = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getHistorialCajas(fechaDesde || null, fechaHasta || null)
    if (err) {
      setError(err.message || 'Error al cargar historial')
    } else {
      setHistorial(data || [])
    }
    setLoading(false)
  }

  // Cargar comercio
  const loadComercio = async () => {
    const { data } = await getComercio()
    if (data) {
      setComercio(data)
    }
  }

  useEffect(() => {
    loadComercio()
    loadHistorial()
  }, [])

  useEffect(() => {
    if (location.state?.print) {
      setShouldPrint(true)
    }
  }, [location.state])

  const clearPrintIntent = () => {
    setThermalPreviewOpen(false)
    setShouldPrint(false)
    navigate({ pathname: location.pathname, search: location.search, hash: location.hash }, { replace: true, state: null })
  }

  useEffect(() => {
    if (!shouldPrint) return
    if (loading || error || !historial.length) return

    const timer = setTimeout(() => setThermalPreviewOpen(true), 300)

    return () => clearTimeout(timer)
  }, [shouldPrint, loading, error, historial])

  // Aplicar filtros
  const handleAplicarFiltros = () => {
    loadHistorial()
  }

  // Limpiar filtros
  const handleLimpiarFiltros = () => {
    setFechaDesde('')
    setFechaHasta('')
    setShowFilters(false)
    loadHistorial()
  }

  // Eliminar registro
  const handleDelete = async () => {
    if (!registroSeleccionado) return

    setProcesando(true)
    const { error: err } = await deleteHistorialCaja(registroSeleccionado.id)
    
    if (err) {
      setError(err.message || 'Error al eliminar registro')
      setProcesando(false)
      return
    }

    setShowDeleteModal(false)
    setRegistroSeleccionado(null)
    await loadHistorial()
    setProcesando(false)
  }

  // Editar registro (cargar desglose en los campos)
  const handleEdit = (registro) => {
    setRegistroSeleccionado(registro)
    const d = getDesglose(registro)
    setEditEfectivo(d.efectivo.toString())
    setEditVirtual(d.virtual.toString())
    setEditCredito(d.credito.toString())
    setEditOtros(d.otros.toString())
    setEditObservaciones(registro.observaciones || '')
    setShowEditModal(true)
  }

  // Guardar edición (enviar desglose por método de pago)
  const handleSaveEdit = async () => {
    if (!registroSeleccionado) return

    const efectivo = parseFloat(editEfectivo || 0) || 0
    const virtual = parseFloat(editVirtual || 0) || 0
    const credito = parseFloat(editCredito || 0) || 0
    const otros = parseFloat(editOtros || 0) || 0
    if (efectivo < 0 || virtual < 0 || credito < 0 || otros < 0) {
      setError('Ningún importe puede ser negativo')
      return
    }

    setProcesando(true)
    const { error: err } = await updateHistorialCaja(registroSeleccionado.id, {
      importe_efectivo: efectivo,
      importe_virtual: virtual,
      importe_credito: credito,
      importe_otros: otros,
      observaciones: editObservaciones
    })

    if (err) {
      setError(err.message || 'Error al actualizar registro')
      setProcesando(false)
      return
    }

    setShowEditModal(false)
    setRegistroSeleccionado(null)
    await loadHistorial()
    setProcesando(false)
  }

  // Calcular totales
  const calcularTotales = () => {
    const aperturas = historial.filter(h => h.tipo_operacion === 'apertura')
    const cierres = historial.filter(h => h.tipo_operacion === 'cierre')
    const totalAperturas = aperturas.reduce((sum, h) => sum + parseFloat(h.importe || 0), 0)
    const totalCierres = cierres.reduce((sum, h) => sum + parseFloat(h.importe || 0), 0)
    return { totalAperturas, totalCierres, diferencia: totalCierres - totalAperturas }
  }

  const totales = calcularTotales()

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Historial de Cajas</h1>
            <p className="text-secondary">Registro de aperturas y cierres de caja</p>
          </div>
          <Link to="/ventas-rapidas">
            <Button variant="outline">← Volver a Ventas Rápidas</Button>
          </Link>
        </div>

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filtros */}
        <Card style={{ marginBottom: '1.5rem' }}>
          <div className="filtros-header">
            <h3>Filtros</h3>
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button>
          </div>

          {showFilters && (
            <div className="filtros-content">
              <div className="form-row">
                <div className="form-col">
                  <label className="form-label">
                    Desde
                    <input
                      type="date"
                      className="form-control"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                    />
                  </label>
                </div>
                <div className="form-col">
                  <label className="form-label">
                    Hasta
                    <input
                      type="date"
                      className="form-control"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                    />
                  </label>
                </div>
                <div className="form-col" style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <Button variant="primary" onClick={handleAplicarFiltros}>
                    Aplicar
                  </Button>
                  <Button variant="outline" onClick={handleLimpiarFiltros}>
                    Limpiar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Tabla de Historial */}
        <Card>
          <div className="historial-header">
            <h2>Historial de Cajas</h2>
            <Link to="/ventas-rapidas/historial" state={{ print: true }}>
              <Button variant="primary">
                <i className="bi bi-printer" /> Imprimir Historial Filtrado
              </Button>
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spinner />
            </div>
          ) : historial.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              No hay registros en el historial
            </p>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha y Hora</th>
                      <th>Responsable</th>
                      <th>Estado</th>
                      <th>Importe</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((registro) => (
                      <tr key={registro.id}>
                        <td>{formatearFechaHora(registro.fecha_hora)}</td>
                        <td>{registro.usuarios?.nombre || '-'}</td>
                        <td>
                          <Badge variant={registro.tipo_operacion === 'apertura' ? 'success' : 'danger'}>
                            {registro.tipo_operacion === 'apertura' ? 'Inicio' : 'Cierre'}
                          </Badge>
                        </td>
                        <td>{formatearMoneda(registro.importe)}</td>
                        <td>
                          <div className="table-actions">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setRegistroDetalle(registro)
                                setShowDetalleModal(true)
                              }}
                              title="Ver detalle del importe"
                            >
                              <i className="bi bi-list-ul" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(registro)}
                              title="Editar"
                            >
                              <i className="bi bi-pencil" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setRegistroSeleccionado(registro)
                                setShowDeleteModal(true)
                              }}
                              title="Eliminar"
                            >
                              <i className="bi bi-trash" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        Total Aperturas:
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{formatearMoneda(totales.totalAperturas)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        Total Cierres:
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{formatearMoneda(totales.totalCierres)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        Diferencia:
                      </td>
                      <td style={{ fontWeight: 'bold', color: totales.diferencia >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {formatearMoneda(totales.diferencia)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </Card>

        {/* Vista previa del ticket para impresión */}
        {historial.length > 0 && (
          <div ref={ticketPrintRef} className="ticket-print" translate="no">
            <table className="ticket-sheet ticket-sheet--nombre" role="presentation">
              <colgroup>
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <td className="tk-full">
                    <div className="nombre-comercio">{comercio?.nombre || 'Comercio'}</div>
                  </td>
                </tr>
                {comercio?.direccion && (
                  <tr className="datos-extra-row">
                    <td className="tk-full datos-comercio">{comercio.direccion}</td>
                  </tr>
                )}
                {comercio?.telefono && (
                  <tr className="datos-extra-row">
                    <td className="tk-full datos-comercio">Tel: {comercio.telefono}</td>
                  </tr>
                )}
                {comercio?.cuit_rut && (
                  <tr className="datos-extra-row">
                    <td className="tk-full datos-comercio">CUIT: {comercio.cuit_rut}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <table className="ticket-sheet" role="presentation">
              <colgroup>
                <col className="col-label" />
                <col className="col-value" />
              </colgroup>
              <tbody>
                <tr>
                  <td colSpan={2} className="tk-full tk-bold section-title">
                    Historial de Cajas
                  </td>
                </tr>
                {fechaDesde && (
                  <tr>
                    <td className="tk-l">Desde:</td>
                    <td className="tk-r">{formatearFechaHora(fechaDesde)}</td>
                  </tr>
                )}
                {fechaHasta && (
                  <tr>
                    <td className="tk-l">Hasta:</td>
                    <td className="tk-r">{formatearFechaHora(fechaHasta)}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <table className="ticket-sheet" role="presentation">
              <colgroup>
                <col className="col-label" />
                <col className="col-value" />
              </colgroup>
              <tbody>
                {historial.map((registro) => (
                  <Fragment key={registro.id}>
                    <tr className="linea-producto">
                      <td className="tk-l" colSpan={2}>
                        {(registro.tipo_operacion === 'apertura' ? 'Apertura' : 'Cierre')}
                        {' '}
                        - {registro.usuarios?.nombre || '-'}
                      </td>
                    </tr>
                    <tr className="detalle-importe">
                      <td className="tk-l">{formatearFechaHora(registro.fecha_hora)}</td>
                      <td className="tk-r">{formatearMoneda(registro.importe)}</td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>

            <table className="ticket-sheet" role="presentation">
              <colgroup>
                <col className="col-label" />
                <col className="col-value" />
              </colgroup>
              <tbody>
                <tr>
                  <td className="tk-l">Total Aperturas:</td>
                  <td className="tk-r">{formatearMoneda(totales.totalAperturas)}</td>
                </tr>
                <tr>
                  <td className="tk-l">Total Cierres:</td>
                  <td className="tk-r">{formatearMoneda(totales.totalCierres)}</td>
                </tr>
                <tr className="total-final-row">
                  <td className="tk-l">Diferencia:</td>
                  <td className="tk-r">{formatearMoneda(totales.diferencia)}</td>
                </tr>
              </tbody>
            </table>

            <table className="ticket-sheet ticket-sheet--footer" role="presentation">
              <colgroup>
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <td className="tk-full">¡Gracias por su compra!</td>
                </tr>
                {comercio?.email && (
                  <tr className="mail-fila">
                    <td className="tk-full">{comercio.email}</td>
                  </tr>
                )}
                <tr className="leyenda-fila">
                  <td className="tk-full">Conserve este ticket</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Eliminar */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setRegistroSeleccionado(null)
          }}
          title="Eliminar Registro"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setRegistroSeleccionado(null)
                }}
                disabled={procesando}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={procesando}
                disabled={procesando}
              >
                Eliminar
              </Button>
            </>
          }
        >
          <p>¿Estás seguro de que deseas eliminar este registro?</p>
        </Modal>

        {/* Modal Editar */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setRegistroSeleccionado(null)
          }}
          title="Editar Registro"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false)
                  setRegistroSeleccionado(null)
                }}
                disabled={procesando}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveEdit}
                loading={procesando}
                disabled={procesando}
              >
                Guardar
              </Button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Caja efectivo ($)</label>
            <input
              type="number"
              className="form-control"
              step="0.01"
              min="0"
              value={editEfectivo}
              onChange={(e) => setEditEfectivo(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Caja virtual ($) — QR, transferencia, débito</label>
            <input
              type="number"
              className="form-control"
              step="0.01"
              min="0"
              value={editVirtual}
              onChange={(e) => setEditVirtual(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Caja crédito ($)</label>
            <input
              type="number"
              className="form-control"
              step="0.01"
              min="0"
              value={editCredito}
              onChange={(e) => setEditCredito(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Caja otros métodos ($)</label>
            <input
              type="number"
              className="form-control"
              step="0.01"
              min="0"
              value={editOtros}
              onChange={(e) => setEditOtros(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea
              className="form-control"
              rows="3"
              value={editObservaciones}
              onChange={(e) => setEditObservaciones(e.target.value)}
            />
          </div>
        </Modal>

        {/* Modal Ver detalle del importe */}
        <Modal
          isOpen={showDetalleModal}
          onClose={() => {
            setShowDetalleModal(false)
            setRegistroDetalle(null)
          }}
          title="Detalle del importe"
        >
          {registroDetalle && (() => {
            const d = getDesglose(registroDetalle)
            const lineas = []
            if (d.efectivo > 0) lineas.push({ label: 'Efectivo', value: formatearMoneda(d.efectivo) })
            if (d.virtual > 0) lineas.push({ label: 'Virtual (QR, transferencia, débito)', value: formatearMoneda(d.virtual) })
            if (d.credito > 0) lineas.push({ label: 'Crédito', value: formatearMoneda(d.credito) })
            if (d.otros > 0) lineas.push({ label: 'Otros', value: formatearMoneda(d.otros) })
            return (
              <>
                <p style={{ marginBottom: '1rem' }}>
                  {registroDetalle.tipo_operacion === 'apertura' ? 'Inicio' : 'Cierre'} — {formatearFechaHora(registroDetalle.fecha_hora)}
                </p>
                <div className="detalle-importe-lineas" style={{ fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--text-primary)' }}>
                  {lineas.length > 0 ? lineas.map((l, i) => (
                    <div key={i}>{l.label} = {l.value}</div>
                  )) : (
                    <div>Total: {formatearMoneda(registroDetalle.importe)}</div>
                  )}
                </div>
                <p style={{ marginTop: '1rem', fontWeight: 600 }}>
                  Total: {formatearMoneda(registroDetalle.importe)}
                </p>
              </>
            )
          })()}
        </Modal>

        <ThermalPrintPreviewModal
          isOpen={thermalPreviewOpen}
          onClose={clearPrintIntent}
          sourceRef={ticketPrintRef}
        />
      </div>
    </Layout>
  )
}

export default HistorialCajas

