// Página de detalle de venta rápida
import { Fragment, useState, useEffect, useRef } from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Spinner, Alert, Badge } from '../../components/common'
import ThermalPrintPreviewModal from '../../components/common/ThermalPrintPreviewModal'
import { getVentaRapidaById } from '../../services/ventasRapidas'
import { getComercio } from '../../services/comercio'
import { useDateTime } from '../../context/DateTimeContext'
import { formatDateTime, formatDate } from '../../utils/dateFormat'
import { useTicketPrintFormat } from '../../hooks/useTicketPrintFormat'
import './VentaRapidaDetalle.css'

function VentaRapidaDetalle() {
  useTicketPrintFormat()
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const ticketPrintRef = useRef(null)
  const [thermalPreviewOpen, setThermalPreviewOpen] = useState(false)
  const { timezone, dateFormat } = useDateTime()
  const [ventaRapida, setVentaRapida] = useState(null)
  const [comercio, setComercio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shouldPrint, setShouldPrint] = useState(false)

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

  const formatearFechaHoraTicket = (fecha) => {
    if (!fecha) return '-'
    return formatDateTime(fecha, 'DD/MM/YYYY HH:mm', timezone)
  }

  const formatearFechaCorta = (fecha) => {
    if (!fecha) return '-'
    return formatDate(fecha, 'DD/MM/YYYY', timezone)
  }

  useEffect(() => {
    const loadVentaRapida = async () => {
      setLoading(true)
      setError(null)
      const [ventaData, comercioData] = await Promise.all([
        getVentaRapidaById(id),
        getComercio()
      ])
      
      if (ventaData.error) {
        setError(ventaData.error.message || 'Error al cargar la venta rápida')
        setLoading(false)
        return
      }
      
      setVentaRapida(ventaData.data)
      if (comercioData.data) {
        setComercio(comercioData.data)
      }
      setLoading(false)
    }

    loadVentaRapida()
  }, [id])

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
    if (loading || error || !ventaRapida || !comercio) return
    const timer = setTimeout(() => setThermalPreviewOpen(true), 300)
    return () => clearTimeout(timer)
  }, [shouldPrint, loading, error, ventaRapida, comercio])

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando venta rápida...</p>
        </div>
      </Layout>
    )
  }

  if (error || !ventaRapida) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Alert variant="danger">{error || 'Venta rápida no encontrada'}</Alert>
          <Link to="/ventas-rapidas">
            <Button variant="outline" style={{ marginTop: '1rem' }}>
              Volver a Ventas Rápidas
            </Button>
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Detalle de Venta Rápida</h1>
            <p className="text-secondary">
              Ticket: {ventaRapida.ventas?.numero_ticket || '-'}
            </p>
          </div>
          <Link to="/ventas-rapidas">
            <Button variant="outline">← Volver a Ventas Rápidas</Button>
          </Link>
        </div>

        <div className="venta-rapida-detalle-grid">
          <Card>
            <h3>Información General</h3>
            <div className="detalle-info">
              <div className="detalle-row">
                <span className="detalle-label">Fecha y Hora:</span>
                <span className="detalle-value">{formatearFechaHora(ventaRapida.fecha_hora)}</span>
              </div>
              {ventaRapida.clientes && (
                <div className="detalle-row">
                  <span className="detalle-label">Cliente:</span>
                  <span className="detalle-value">{ventaRapida.clientes.nombre}</span>
                </div>
              )}
              <div className="detalle-row">
                <span className="detalle-label">Usuario:</span>
                <span className="detalle-value">{ventaRapida.usuarios?.nombre || '-'}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Método de Pago:</span>
                <span className="detalle-value">{ventaRapida.metodo_pago}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Estado:</span>
                <span className="detalle-value">
                  <Badge variant={ventaRapida.estado === 'PAGADO' ? 'success' : 'warning'}>
                    {ventaRapida.estado}
                  </Badge>
                </span>
              </div>
              {ventaRapida.observaciones && (
                <div className="detalle-row">
                  <span className="detalle-label">Observaciones:</span>
                  <span className="detalle-value">{ventaRapida.observaciones}</span>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h3>Totales</h3>
            <div className="detalle-info">
              <div className="detalle-row">
                <span className="detalle-label">Total:</span>
                <span className="detalle-value">{formatearMoneda(ventaRapida.total)}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Monto Pagado:</span>
                <span className="detalle-value">{formatearMoneda(ventaRapida.monto_pagado)}</span>
              </div>
              {ventaRapida.estado === 'DEBE' && (
                <div className="detalle-row">
                  <span className="detalle-label">Deuda:</span>
                  <span className="detalle-value" style={{ color: 'var(--color-danger)' }}>
                    {formatearMoneda(ventaRapida.total - ventaRapida.monto_pagado)}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {ventaRapida.ventas && (
          <Card style={{ marginTop: '1.5rem' }}>
            <h3>Venta Asociada</h3>
            <div className="detalle-info">
              <div className="detalle-row">
                <span className="detalle-label">Número de Ticket:</span>
                <span className="detalle-value">{ventaRapida.ventas.numero_ticket}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Total Venta:</span>
                <span className="detalle-value">{formatearMoneda(ventaRapida.ventas.total)}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Monto Pagado:</span>
                <span className="detalle-value">{formatearMoneda(ventaRapida.ventas.monto_pagado)}</span>
              </div>
              {ventaRapida.ventas.monto_deuda > 0 && (
                <div className="detalle-row">
                  <span className="detalle-label">Deuda:</span>
                  <span className="detalle-value" style={{ color: 'var(--color-danger)' }}>
                    {formatearMoneda(ventaRapida.ventas.monto_deuda)}
                  </span>
                </div>
              )}
              <div className="detalle-row" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <Link to={`/ventas/${ventaRapida.ventas.id}`}>
                  <Button variant="primary">Ver Detalle Completo de la Venta</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Vista previa del ticket para impresión */}
        {ventaRapida && comercio && (
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
                    <td className="tk-full datos-comercio">
                      Teléfono:&nbsp;
                      {comercio.telefono}
                    </td>
                  </tr>
                )}
                {comercio?.cuit_rut && (
                  <tr className="datos-extra-row">
                    <td className="tk-full datos-comercio">
                      CUIT:&nbsp;
                      {comercio.cuit_rut}
                    </td>
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
                  <td className="tk-l">Boleto N°:</td>
                  <td className="tk-r">{ventaRapida?.ventas?.numero_ticket || '-'}</td>
                </tr>
                <tr>
                  <td className="tk-l">Fecha:</td>
                  <td className="tk-r">{formatearFechaHoraTicket(ventaRapida?.fecha_hora)}</td>
                </tr>
                {ventaRapida?.clientes?.nombre && (
                  <tr>
                    <td className="tk-l">Cliente:</td>
                    <td className="tk-r">{ventaRapida.clientes.nombre}</td>
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
                  <td className="tk-l">Total parcial:</td>
                  <td className="tk-r">{formatearMoneda(ventaRapida?.total)}</td>
                </tr>
                {ventaRapida?.monto_pagado > 0 && (
                  <tr>
                    <td className="tk-l">Pagado:</td>
                    <td className="tk-r">{formatearMoneda(ventaRapida?.monto_pagado)}</td>
                  </tr>
                )}
                {ventaRapida?.estado === 'DEBE' && ventaRapida?.total - ventaRapida?.monto_pagado > 0.01 && (
                  <tr>
                    <td className="tk-l">Saldo:</td>
                    <td className="tk-r">{formatearMoneda(ventaRapida.total - ventaRapida.monto_pagado)}</td>
                  </tr>
                )}
                <tr className="total-final-row">
                  <td className="tk-l">TOTAL:</td>
                  <td className="tk-r">{formatearMoneda(ventaRapida?.total)}</td>
                </tr>
              </tbody>
            </table>

            {ventaRapida?.metodo_pago && (
              <table className="ticket-sheet" role="presentation">
                <colgroup>
                  <col className="col-label" />
                  <col className="col-value" />
                </colgroup>
                <tbody>
                  <tr className="pagosh-titulo">
                    <td colSpan={2} className="tk-full">
                      Formas de Pago:
                    </td>
                  </tr>
                  <tr className="pagosh-fila">
                    <td className="tk-l">{ventaRapida.metodo_pago}</td>
                    <td className="tk-r">{formatearMoneda(ventaRapida.monto_pagado)}</td>
                  </tr>
                </tbody>
              </table>
            )}

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
                <tr className="mail-fila">
                  <td className="tk-full">
                    Este ticket no es una factura ni tiene validez fiscal.
                    <br />
                    Solo es un comprobante de venta.
                  </td>
                </tr>
                <tr className="leyenda-fila">
                  <td className="tk-full">Conserve este ticket</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ThermalPrintPreviewModal
        isOpen={thermalPreviewOpen}
        onClose={clearPrintIntent}
        sourceRef={ticketPrintRef}
      />
    </Layout>
  )
}

export default VentaRapidaDetalle

