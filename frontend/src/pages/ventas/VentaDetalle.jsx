// Página de detalle de venta
import { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Spinner, Alert, Button, Badge } from '../../components/common'
import { getVentaById } from '../../services/ventas'
import { getComercio } from '../../services/comercio'
import './VentaDetalle.css'

function VentaDetalle() {
  const { id } = useParams()
  const location = useLocation()
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

  useEffect(() => {
    if (!shouldPrint) return
    if (loading || error || !venta) return
    const timer = setTimeout(() => {
      window.print()
    }, 300)
    return () => clearTimeout(timer)
  }, [shouldPrint, loading, error, venta])

  const formatearFecha = (fecha) => {
    if (!fecha) return '-'
    const date = new Date(fecha)
    return date.toLocaleString('es-AR')
  }

  const formatearMoneda = (valor) => {
    const num = Number(valor || 0)
    return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatearFechaCorta = (fecha) => {
    if (!fecha) return '-'
    const d = new Date(fecha)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const formatearFechaHoraTicket = (fecha) => {
    if (!fecha) return '-'
    const d = new Date(fecha)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const estadoPago = (() => {
    const total = parseFloat(venta?.total || 0)
    const pagado = parseFloat(venta?.monto_pagado || 0)
    return total - pagado > 0.01 ? 'Debe' : 'Pagado'
  })()

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
            <Card>
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

            <Card title="Items" style={{ marginTop: '1.5rem' }}>
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

            <Card title="Pagos" style={{ marginTop: '1.5rem' }}>
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

            {/* Vista previa del ticket para impresión */}
            <div className="ticket-print">
              {/* Encabezado del ticket */}
              <div className="ticket-header">
                <div className="nombre-comercio">{comercio?.nombre || 'Comercio'}</div>
                <div className="datos-comercio">
                  {comercio?.direccion && <div>{comercio.direccion}</div>}
                  {comercio?.telefono && <div>Tel: {comercio.telefono}</div>}
                  {comercio?.cuit_rut && <div>CUIT: {comercio.cuit_rut}</div>}
                </div>
              </div>

              {/* Información de la venta */}
              <div className="ticket-info">
                <div className="ticket-row">
                  <span className="label">Ticket N°:</span>
                  <span>{venta?.numero_ticket || '-'}</span>
                </div>
                <div className="ticket-row">
                  <span className="label">Fecha:</span>
                  <span>{formatearFechaHoraTicket(venta?.fecha_hora)}</span>
                </div>
                {venta?.facturacion && (
                  <div className="ticket-row">
                    <span className="label">Factura:</span>
                    <span>{venta.facturacion}</span>
                  </div>
                )}
                {venta?.clientes?.nombre && (
                  <div className="ticket-row">
                    <span className="label">Cliente:</span>
                    <span>{venta.clientes.nombre}</span>
                  </div>
                )}
              </div>

              {/* Items del ticket */}
              <div className="ticket-items">
                {(venta?.items || []).map((it) => (
                  <div key={it.id} className="ticket-item">
                    <div className="item-nombre">{it.productos?.nombre || '-'}</div>
                    <div className="item-detalle">
                      <span>{it.cantidad} x {formatearMoneda(it.precio_unitario)}</span>
                      {it.descuento > 0 && <span>-{it.descuento}%</span>}
                      <span>{formatearMoneda(it.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="ticket-totales">
                <div className="ticket-total-row">
                  <span>Subtotal:</span>
                  <span>{formatearMoneda(venta?.total)}</span>
                </div>
                {venta?.monto_deuda > 0 && (
                  <div className="ticket-total-row">
                    <span>Pagado:</span>
                    <span>{formatearMoneda(venta?.monto_pagado)}</span>
                  </div>
                )}
                {venta?.monto_deuda > 0 && (
                  <div className="ticket-total-row">
                    <span>Saldo:</span>
                    <span>{formatearMoneda(venta?.monto_deuda)}</span>
                  </div>
                )}
                <div className="ticket-total-row total-final">
                  <span>TOTAL:</span>
                  <span>{formatearMoneda(venta?.total)}</span>
                </div>
              </div>

              {/* Métodos de pago */}
              {(venta?.pagos || []).length > 0 && (
                <div className="ticket-pagos">
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Formas de Pago:</div>
                  {venta.pagos.map((p) => (
                    <div key={p.id} className="ticket-pago-item">
                      <span>{p.metodo_pago}</span>
                      <span>{formatearMoneda(p.monto_pagado)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pie del ticket */}
              <div className="ticket-footer">
                <div>¡Gracias por su compra!</div>
                {comercio?.email && <div>{comercio.email}</div>}
                <div className="leyenda">Conserve este ticket</div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

export default VentaDetalle


