// Página de detalle de venta
import { useEffect, useState, useRef, useMemo } from 'react'
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Spinner, Alert, Button, Badge } from '../../components/common'
import { getVentaById } from '../../services/ventas'
import { getComercio } from '../../services/comercio'
import { useDateTime } from '../../context/DateTimeContext'
import { formatDateTime, formatDate } from '../../utils/dateFormat'
import { useTicketPrintFormat } from '../../hooks/useTicketPrintFormat'
import ThermalPrintPreviewModal from '../../components/common/ThermalPrintPreviewModal'
import { buildVentaThermalPlainText } from '../../utils/thermalPlainReceipt'
import './VentaDetalle.css'

function VentaDetalle() {
  useTicketPrintFormat()
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const ticketPrintRef = useRef(null)
  const [thermalPreviewOpen, setThermalPreviewOpen] = useState(false)
  const { timezone, dateFormat } = useDateTime()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [venta, setVenta] = useState(null)
  const [comercio, setComercio] = useState(null)
  const [shouldPrint, setShouldPrint] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      const [ventaData, comercioData] = await Promise.all([
        getVentaById(id),
        getComercio()
      ])
      if (ventaData.error) {
        setError(ventaData.error.message || 'Error al cargar el detalle de la venta')
        setLoading(false)
        return
      }
      setVenta(ventaData.data)
      if (comercioData.data) {
        setComercio(comercioData.data)
      }
      setLoading(false)
    }
    load()
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
    if (loading || error || !venta) return
    const timer = setTimeout(() => setThermalPreviewOpen(true), 300)
    return () => clearTimeout(timer)
  }, [shouldPrint, loading, error, venta])

  // Formatear fecha usando la configuración del usuario
  const formatearFecha = (fecha) => {
    return formatDateTime(fecha, dateFormat, timezone)
  }

  const formatearMoneda = (valor) => {
    const num = Number(valor || 0)
    return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatearFechaCorta = (fecha) => {
    return formatDate(fecha, 'DD/MM/YYYY', timezone)
  }

  const formatearFechaHoraTicket = (fecha) => {
    return formatDateTime(fecha, 'DD/MM/YYYY HH:mm', timezone)
  }

  const estadoPago = (() => {
    const total = parseFloat(venta?.total || 0)
    const pagado = parseFloat(venta?.monto_pagado || 0)
    return total - pagado > 0.01 ? 'Debe' : 'Pagado'
  })()

  const ticketPlain = useMemo(() => {
    if (!venta) return ''
    return buildVentaThermalPlainText({
      venta,
      comercio,
      formatearMoneda,
      formatearFechaHoraTicket
    })
  }, [venta, comercio, timezone])

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando detalle...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1>Detalle de Venta</h1>
            <p className="text-secondary">Ticket: {venta?.numero_ticket || '-'}</p>
          </div>
          <Link to="/ventas">
            <Button variant="outline">← Volver a Ventas</Button>
          </Link>
        </div>

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!venta ? (
          <Card>
            <p>No se encontró la venta.</p>
          </Card>
        ) : (
          <>
            <Card className="venta-detalle-panel">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <div className="text-secondary text-small">Fecha</div>
                  <div><strong>{formatearFecha(venta.fecha_hora)}</strong></div>
                </div>
                <div>
                  <div className="text-secondary text-small">Facturación</div>
                  <div><strong>{venta.facturacion || '-'}</strong></div>
                </div>
                <div>
                  <div className="text-secondary text-small">Cliente</div>
                  <div><strong>{venta.clientes?.nombre || 'Cliente genérico'}</strong></div>
                </div>
                <div>
                  <div className="text-secondary text-small">Estado</div>
                  <div>
                    <Badge variant={estadoPago === 'Pagado' ? 'success' : 'warning'}>
                      {estadoPago}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-secondary text-small">Total</div>
                  <div><strong>{formatearMoneda(venta.total)}</strong></div>
                </div>
                <div>
                  <div className="text-secondary text-small">Pagado</div>
                  <div><strong>{formatearMoneda(venta.monto_pagado)}</strong></div>
                </div>
                <div>
                  <div className="text-secondary text-small">Deuda</div>
                  <div><strong>{formatearMoneda(venta.monto_deuda)}</strong></div>
                </div>
              </div>
            </Card>

            <Card title="Items" className="venta-detalle-panel" style={{ marginTop: '1.5rem' }}>
              {(venta.items || []).length === 0 ? (
                <p className="text-secondary">Sin items.</p>
              ) : (
                <div className="table-container">
                  <table className="table table-sticky-header">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Descuento</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {venta.items.map((it) => (
                        <tr key={it.id}>
                          <td>{it.productos?.nombre || '-'}</td>
                          <td>{it.cantidad}</td>
                          <td>{formatearMoneda(it.precio_unitario)}</td>
                          <td>{it.descuento || 0}%</td>
                          <td>{formatearMoneda(it.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card title="Pagos" className="venta-detalle-panel" style={{ marginTop: '1.5rem' }}>
              {(venta.pagos || []).length === 0 ? (
                <p className="text-secondary">Sin pagos registrados.</p>
              ) : (
                <div className="table-container">
                  <table className="table table-sticky-header">
                    <thead>
                      <tr>
                        <th>Método</th>
                        <th>Fecha</th>
                        <th>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {venta.pagos.map((p) => (
                        <tr key={p.id}>
                          <td>{p.metodo_pago}</td>
                          <td>{formatearFechaCorta(p.fecha_pago)}</td>
                          <td>{formatearMoneda(p.monto_pagado)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Ticket impresión: texto plano POS (solo ventas) — tolera drivers térmicos que ignoran tablas */}
            <div ref={ticketPrintRef} className="ticket-print ticket-print--thermal-pre" translate="no">
              <pre className="ticket-pre-body">{ticketPlain}</pre>
            </div>
          </>
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

export default VentaDetalle


