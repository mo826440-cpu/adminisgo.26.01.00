// Página de detalle de venta
import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Spinner, Alert, Badge, Button } from '../../components/common'
import { getVentaById } from '../../services/ventas'
import { getComercio } from '../../services/comercio'
import { useDateTime } from '../../context/DateTimeContext'
import { formatDateTime } from '../../utils/dateFormat'
import {
  getVentaEstadoDisplay,
  getVentaEstadoLabel,
  getVentaEstadoBadgeVariant,
  getVentaFechaDisplay,
  ventaEstaCancelada,
} from '../../utils/ventaEstado'
import { useTicketPrintFormat } from '../../hooks/useTicketPrintFormat'
import { useTicketPrintConfig } from '../../context/TicketPrintContext'
import ThermalPrintPreviewModal from '../../components/common/ThermalPrintPreviewModal'
import TicketPrintBlock from '../../components/common/TicketPrintBlock'
import { buildVentaThermalPlainText } from '../../utils/thermalPlainReceipt'
import './VentaDetalle.css'

function VentaDetalle() {
  useTicketPrintFormat()
  const { config: printConfig } = useTicketPrintConfig()
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
      const [ventaData, comercioData] = await Promise.all([getVentaById(id), getComercio()])
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

  const formatearFecha = (fecha) => formatDateTime(fecha, dateFormat, timezone)

  const formatearMoneda = (valor) => {
    const num = Number(valor || 0)
    return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatearFechaHoraTicket = (fecha) => formatDateTime(fecha, 'DD/MM/YYYY HH:mm', timezone)

  const estadoKey = venta ? getVentaEstadoDisplay(venta) : 'pagado'
  const total = parseFloat(venta?.total || 0)
  const pagado = parseFloat(venta?.monto_pagado || 0)
  const deuda = ventaEstaCancelada(venta) ? 0 : Math.max(0, total - pagado)

  const ticketPlain = useMemo(() => {
    if (!venta) return ''
    return buildVentaThermalPlainText({
      venta,
      comercio,
      formatearMoneda,
      formatearFechaHoraTicket,
      printConfig,
    })
  }, [venta, comercio, timezone, printConfig])

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
        <div className="venta-detalle-header">
          <div>
            <div className="section-label">VENTAS</div>
            <h1 className="venta-detalle-title">Detalle de venta</h1>
            {venta?.numero_ticket ? (
              <p className="text-secondary text-small">Ticket: {venta.numero_ticket}</p>
            ) : null}
          </div>
          <div className="venta-detalle-header-actions">
            <Link to="/ventas">
              <Button variant="outline" title="Volver al listado">
                <i className="bi bi-arrow-left" /> Volver
              </Button>
            </Link>
            {venta ? (
              <Button variant="primary" onClick={() => setThermalPreviewOpen(true)} title="Imprimir ticket">
                <i className="bi bi-printer" /> Imprimir
              </Button>
            ) : null}
          </div>
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
          <Card className="venta-detalle-panel venta-detalle-spec">
            <dl className="venta-detalle-dl">
              <div className="venta-detalle-dl__row">
                <dt>Fecha</dt>
                <dd>{formatearFecha(getVentaFechaDisplay(venta))}</dd>
              </div>
              <div className="venta-detalle-dl__row">
                <dt>Usuario</dt>
                <dd>{venta.usuarios?.nombre || '—'}</dd>
              </div>
              <div className="venta-detalle-dl__row">
                <dt>Cliente</dt>
                <dd>{venta.clientes?.nombre || 'Cliente genérico'}</dd>
              </div>
              <div className="venta-detalle-dl__row">
                <dt>Estado</dt>
                <dd>
                  <Badge variant={getVentaEstadoBadgeVariant(estadoKey)}>
                    {getVentaEstadoLabel(estadoKey)}
                  </Badge>
                </dd>
              </div>
            </dl>

            <div className="venta-detalle-block">
              <h3 className="venta-detalle-block__title">Productos</h3>
              {(venta.items || []).length === 0 ? (
                <p className="text-secondary">Sin productos registrados.</p>
              ) : (
                <ul className="venta-detalle-productos">
                  {venta.items.map((it) => (
                    <li key={it.id} className="venta-detalle-producto">
                      <strong>{it.productos?.nombre || 'Producto'}</strong>
                      <span>
                        {it.cantidad} u. × {formatearMoneda(it.precio_unitario)} ={' '}
                        <strong>{formatearMoneda(it.subtotal)}</strong>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="venta-detalle-block">
              <div className="venta-detalle-dl__row venta-detalle-dl__row--total">
                <dt>Precio total</dt>
                <dd>{formatearMoneda(venta.total)}</dd>
              </div>
            </div>

            <div className="venta-detalle-block">
              <h3 className="venta-detalle-block__title">Formas de pago</h3>
              {(venta.pagos || []).length === 0 ? (
                <p className="text-secondary">Sin pagos registrados.</p>
              ) : (
                <ul className="venta-detalle-pagos">
                  {venta.pagos.map((p) => (
                    <li key={p.id}>
                      <span>{p.metodo_pago}</span>
                      <strong>{formatearMoneda(p.monto_pagado)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <dl className="venta-detalle-dl venta-detalle-dl--totales">
              <div className="venta-detalle-dl__row">
                <dt>Total pagado</dt>
                <dd>{formatearMoneda(pagado)}</dd>
              </div>
              <div className="venta-detalle-dl__row">
                <dt>Total deuda</dt>
                <dd>{deuda > 0.01 ? formatearMoneda(deuda) : '-'}</dd>
              </div>
            </dl>
          </Card>
        )}
      </div>

      {venta ? (
        <div className="ticket-print-host" aria-hidden="true">
          <TicketPrintBlock innerRef={ticketPrintRef} plainText={ticketPlain} />
        </div>
      ) : null}

      <ThermalPrintPreviewModal
        isOpen={thermalPreviewOpen}
        onClose={clearPrintIntent}
        sourceRef={ticketPrintRef}
      />
    </Layout>
  )
}

export default VentaDetalle
