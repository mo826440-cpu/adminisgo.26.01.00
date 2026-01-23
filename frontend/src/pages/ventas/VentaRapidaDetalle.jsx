// Página de detalle de venta rápida
import { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Spinner, Alert, Badge } from '../../components/common'
import { getVentaRapidaById } from '../../services/ventasRapidas'
import { getComercio } from '../../services/comercio'
import { useDateTime } from '../../context/DateTimeContext'
import { formatDateTime, formatDate } from '../../utils/dateFormat'
import './VentaRapidaDetalle.css'

function VentaRapidaDetalle() {
  const { id } = useParams()
  const location = useLocation()
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

  useEffect(() => {
    if (!shouldPrint) return
    if (loading || error || !ventaRapida || !comercio) return
    const timer = setTimeout(() => {
      window.print()
    }, 300)
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
          <div className="ticket-print">
            {/* Encabezado del ticket */}
            <div className="ticket-header">
              <div className="nombre-comercio">{comercio?.nombre || 'Comercio'}</div>
              <div className="datos-comercio">
                {comercio?.direccion && <div>{comercio.direccion}</div>}
                {comercio?.telefono && <div>Teléfono: {comercio.telefono}</div>}
                {comercio?.cuit_rut && <div>CUIT: {comercio.cuit_rut}</div>}
              </div>
            </div>

            {/* Información de la venta */}
            <div className="ticket-info">
              <div className="ticket-row">
                <span className="label">Boleto N°:</span>
                <span>{ventaRapida?.ventas?.numero_ticket || '-'}</span>
              </div>
              <div className="ticket-row">
                <span className="label">Fecha:</span>
                <span>{formatearFechaHoraTicket(ventaRapida?.fecha_hora)}</span>
              </div>
              {ventaRapida?.clientes?.nombre && (
                <div className="ticket-row">
                  <span className="label">Cliente:</span>
                  <span>{ventaRapida.clientes.nombre}</span>
                </div>
              )}
            </div>

            {/* Totales */}
            <div className="ticket-totales">
              <div className="ticket-total-row">
                <span>Total parcial:</span>
                <span>{formatearMoneda(ventaRapida?.total)}</span>
              </div>
              {ventaRapida?.monto_pagado > 0 && (
                <div className="ticket-total-row">
                  <span>Pagado:</span>
                  <span>{formatearMoneda(ventaRapida?.monto_pagado)}</span>
                </div>
              )}
              {ventaRapida?.estado === 'DEBE' && ventaRapida?.total - ventaRapida?.monto_pagado > 0.01 && (
                <div className="ticket-total-row">
                  <span>Saldo:</span>
                  <span>{formatearMoneda(ventaRapida.total - ventaRapida.monto_pagado)}</span>
                </div>
              )}
              <div className="ticket-total-row total-final">
                <span>TOTAL:</span>
                <span>{formatearMoneda(ventaRapida?.total)}</span>
              </div>
            </div>

            {/* Métodos de pago */}
            {ventaRapida?.metodo_pago && (
              <div className="ticket-pagos">
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Formas de Pago:</div>
                <div className="ticket-pago-item">
                  <span>{ventaRapida.metodo_pago}</span>
                  <span>{formatearMoneda(ventaRapida.monto_pagado)}</span>
                </div>
              </div>
            )}

            {/* Pie del ticket */}
            <div className="ticket-footer">
              <div>¡Gracias por su compra!</div>
              {comercio?.email && <div>{comercio.email}</div>}
              <div className="leyenda" style={{ marginTop: '0.5rem', fontSize: '7px' }}>
                Este ticket no es una factura ni tiene validez fiscal.
                <br />
                Solo es un comprobante de venta.
              </div>
              <div className="leyenda" style={{ marginTop: '0.5rem' }}>
                Conserve este ticket
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default VentaRapidaDetalle

