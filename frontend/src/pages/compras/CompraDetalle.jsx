// Página de detalle de compra
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Spinner, Alert, Badge, Modal } from '../../components/common'
import { getCompraById, deleteCompra, recibirCompra } from '../../services/compras'
import { getComercio } from '../../services/comercio'
import { useDateTime } from '../../context/DateTimeContext'
import { formatDate, formatDateTime } from '../../utils/dateFormat'
import './CompraDetalle.css'

function CompraDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { dateFormat, timezone } = useDateTime()

  const [compra, setCompra] = useState(null)
  const [comercio, setComercio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [receiving, setReceiving] = useState(false)
  const [cantidadesRecibidas, setCantidadesRecibidas] = useState({})
  const [shouldPrint, setShouldPrint] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      const [compraData, comercioData] = await Promise.all([
        getCompraById(id),
        getComercio()
      ])
      
      if (compraData.error) {
        setError(compraData.error.message || 'Error al cargar el detalle de la compra')
        setLoading(false)
        return
      }
      
      if (compraData.data) {
        setCompra(compraData.data)
        // Inicializar cantidades recibidas con las que ya tienen (si las hay)
        const cantidadesIniciales = {}
        if (compraData.data.items) {
          compraData.data.items.forEach(item => {
            cantidadesIniciales[item.id] = item.cantidad_recibida || item.cantidad_solicitada || 0
          })
        }
        setCantidadesRecibidas(cantidadesIniciales)
      }
      
      if (comercioData.data) {
        setComercio(comercioData.data)
      }
      
      setLoading(false)
    }
    load()
  }, [id])

  // Manejar impresión
  useEffect(() => {
    if (location.state?.print) {
      setShouldPrint(true)
    }
  }, [location.state])

  // Imprimir cuando los datos estén cargados
  useEffect(() => {
    if (!shouldPrint) return
    if (loading || error || !compra) return

    // Pequeño delay para asegurar que el DOM esté listo
    const timer = setTimeout(() => {
      window.print()
    }, 100)

    return () => clearTimeout(timer)
  }, [shouldPrint, loading, error, compra])

  const loadCompra = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getCompraById(id)
    
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    
    if (data) {
      setCompra(data)
      // Inicializar cantidades recibidas con las que ya tienen (si las hay)
      const cantidadesIniciales = {}
      if (data.items) {
        data.items.forEach(item => {
          cantidadesIniciales[item.id] = item.cantidad_recibida || item.cantidad_solicitada || 0
        })
      }
      setCantidadesRecibidas(cantidadesIniciales)
    }
    setLoading(false)
  }

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '-'
    const formatoSoloFecha = dateFormat.split(' ')[0]
    return formatDate(fecha, formatoSoloFecha, timezone)
  }

  // Formatear fecha y hora para ticket
  const formatearFechaHoraTicket = (fecha) => {
    if (!fecha) return '-'
    return formatDateTime(fecha, 'DD/MM/YYYY HH:mm', timezone)
  }

  // Formatear moneda
  const formatearMoneda = (valor) => {
    const num = Number(valor || 0)
    return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Obtener variant del badge según estado
  const obtenerVariantEstado = (estado) => {
    switch (estado) {
      case 'recibida':
        return 'success'
      case 'cancelada':
        return 'danger'
      case 'pendiente':
      default:
        return 'warning'
    }
  }

  // Obtener texto del estado
  const obtenerTextoEstado = (estado) => {
    switch (estado) {
      case 'recibida':
        return 'Recibida'
      case 'cancelada':
        return 'Cancelada'
      case 'pendiente':
      default:
        return 'Pendiente'
    }
  }

  // Eliminar compra
  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    const { error: err } = await deleteCompra(id)
    
    if (err) {
      setError(err.message)
      setDeleting(false)
      return
    }
    
    navigate('/compras', {
      state: {
        success: true,
        message: 'Compra eliminada correctamente'
      }
    })
  }

  // Recibir compra
  const handleReceive = async () => {
    setReceiving(true)
    setError(null)

    try {
      // Preparar items recibidos
      const itemsRecibidos = compra.items.map(item => ({
        id: item.id,
        producto_id: item.producto_id,
        cantidad_recibida: parseFloat(cantidadesRecibidas[item.id] || 0)
      }))

      const { error: err } = await recibirCompra(id, itemsRecibidos)
      
      if (err) {
        setError(err.message)
        setReceiving(false)
        return
      }
      
      setShowReceiveModal(false)
      navigate('/compras', {
        state: {
          success: true,
          message: 'Compra marcada como recibida y stock actualizado correctamente'
        }
      })
    } catch (err) {
      setError(err.message || 'Error al recibir la compra')
      setReceiving(false)
    }
  }

  // Manejar cambio de cantidad recibida
  const handleCantidadRecibidaChange = (itemId, value) => {
    setCantidadesRecibidas(prev => ({
      ...prev,
      [itemId]: value
    }))
  }

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando compra...</p>
        </div>
      </Layout>
    )
  }

  if (error && !compra) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem' }}>
          <Alert variant="danger">{error}</Alert>
          <Link to="/compras">
            <Button variant="outline" style={{ marginTop: '1rem' }}>
              Volver a Compras
            </Button>
          </Link>
        </div>
      </Layout>
    )
  }

  if (!compra) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Compra no encontrada</p>
          <Link to="/compras">
            <Button variant="outline" style={{ marginTop: '1rem' }}>
              Volver a Compras
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
            <h1>Detalle de Orden de Compra</h1>
            <p className="text-secondary">
              Número de orden: {compra.numero_orden || '-'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/compras">
              <Button variant="outline">← Volver a Compras</Button>
            </Link>
            {compra.estado === 'pendiente' && (
              <>
                <Link to={`/compras/${id}/editar`}>
                  <Button variant="primary">Editar</Button>
                </Link>
                <Button 
                  variant="success" 
                  onClick={() => setShowReceiveModal(true)}
                >
                  Recibir Compra
                </Button>
              </>
            )}
            <Button 
              variant="danger" 
              onClick={() => setShowDeleteModal(true)}
            >
              Eliminar
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className="compra-detalle-grid">
          {/* Información principal */}
          <Card>
            <h3>Información General</h3>
            <div className="detalle-info">
              <div className="detalle-row">
                <span className="detalle-label">Número de Orden:</span>
                <span className="detalle-value">{compra.numero_orden || '-'}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Proveedor:</span>
                <span className="detalle-value">{compra.proveedores?.nombre_razon_social || '-'}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Fecha de Orden:</span>
                <span className="detalle-value">{formatearFecha(compra.fecha_orden)}</span>
              </div>
              {compra.fecha_recepcion && (
                <div className="detalle-row">
                  <span className="detalle-label">Fecha de Recepción:</span>
                  <span className="detalle-value">{formatearFecha(compra.fecha_recepcion)}</span>
                </div>
              )}
              <div className="detalle-row">
                <span className="detalle-label">Estado:</span>
                <span className="detalle-value">
                  <Badge variant={obtenerVariantEstado(compra.estado)}>
                    {obtenerTextoEstado(compra.estado)}
                  </Badge>
                </span>
              </div>
              {compra.observaciones && (
                <div className="detalle-row">
                  <span className="detalle-label">Observaciones:</span>
                  <span className="detalle-value">{compra.observaciones}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Totales */}
          <Card>
            <h3>Totales</h3>
            <div className="detalle-info">
              <div className="detalle-row">
                <span className="detalle-label">Subtotal:</span>
                <span className="detalle-value">{formatearMoneda(compra.subtotal)}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Descuento:</span>
                <span className="detalle-value">{formatearMoneda(compra.descuento)}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Impuestos:</span>
                <span className="detalle-value">{formatearMoneda(compra.impuestos)}</span>
              </div>
              <div className="detalle-row total-row">
                <span className="detalle-label">Total:</span>
                <span className="detalle-value">{formatearMoneda(compra.total)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Items de la compra */}
        <Card style={{ marginTop: '1.5rem' }}>
          <h3>Productos</h3>
          {compra.items && compra.items.length > 0 ? (
            <div className="items-table-container">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad Solicitada</th>
                    <th>Cantidad Recibida</th>
                    <th>Precio Unitario</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {compra.items.map(item => (
                    <tr key={item.id}>
                      <td>{item.productos?.nombre || '-'}</td>
                      <td>{item.cantidad_solicitada || 0}</td>
                      <td>
                        {compra.estado === 'recibida' 
                          ? (item.cantidad_recibida || 0)
                          : '-'
                        }
                      </td>
                      <td>{formatearMoneda(item.precio_unitario)}</td>
                      <td>{formatearMoneda(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No hay productos en esta compra</p>
          )}
        </Card>

        {/* Modal de Eliminar */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Eliminar Compra"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={deleting}
                disabled={deleting}
              >
                Eliminar
              </Button>
            </>
          }
        >
          <p>¿Estás seguro de que deseas eliminar esta orden de compra?</p>
          <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
            Esta acción no se puede deshacer.
          </p>
        </Modal>

        {/* Modal de Recibir Compra */}
        <Modal
          isOpen={showReceiveModal}
          onClose={() => setShowReceiveModal(false)}
          title="Recibir Compra"
          closeOnOverlayClick={false}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setShowReceiveModal(false)}
                disabled={receiving}
              >
                Cancelar
              </Button>
              <Button
                variant="success"
                onClick={handleReceive}
                loading={receiving}
                disabled={receiving}
              >
                Confirmar Recepción
              </Button>
            </>
          }
        >
          <p>Indica las cantidades recibidas para cada producto. Esto actualizará el stock automáticamente.</p>
          
          {compra.items && compra.items.length > 0 && (
            <div className="receive-items-table" style={{ marginTop: '1rem' }}>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Solicitado</th>
                    <th>Cantidad Recibida</th>
                  </tr>
                </thead>
                <tbody>
                  {compra.items.map(item => (
                    <tr key={item.id}>
                      <td>{item.productos?.nombre || '-'}</td>
                      <td>{item.cantidad_solicitada || 0}</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={item.cantidad_solicitada || 0}
                          value={cantidadesRecibidas[item.id] || item.cantidad_solicitada || 0}
                          onChange={(e) => handleCantidadRecibidaChange(item.id, e.target.value)}
                          className="form-control"
                          style={{ width: '100px' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>

        {/* Vista previa del ticket para impresión */}
        {compra && (
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

            {/* Información de la compra */}
            <div className="ticket-info">
              <div className="ticket-row">
                <span className="label">Orden N°:</span>
                <span>{compra.numero_orden || '-'}</span>
              </div>
              <div className="ticket-row">
                <span className="label">Fecha:</span>
                <span>{formatearFechaHoraTicket(compra.fecha_orden)}</span>
              </div>
              {compra.proveedores?.nombre_razon_social && (
                <div className="ticket-row">
                  <span className="label">Proveedor:</span>
                  <span>{compra.proveedores.nombre_razon_social}</span>
                </div>
              )}
              <div className="ticket-row">
                <span className="label">Estado:</span>
                <span>{obtenerTextoEstado(compra.estado)}</span>
              </div>
            </div>

            {/* Items del ticket */}
            <div className="ticket-items">
              {(compra.items || []).map((it) => {
                const precioConDescuento = it.precio_unitario * (1 - (it.descuento || 0) / 100)
                const precioFinal = precioConDescuento * (1 + (it.impuesto || 0) / 100)
                return (
                  <div key={it.id} className="ticket-item">
                    <div className="item-nombre">{it.productos?.nombre || '-'}</div>
                    <div className="item-detalle">
                      <span>{it.cantidad_solicitada} x {formatearMoneda(it.precio_unitario)}</span>
                      {it.descuento > 0 && <span>-{it.descuento}%</span>}
                      {it.impuesto > 0 && <span>+{it.impuesto}%</span>}
                      <span>{formatearMoneda(it.subtotal)}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Totales */}
            <div className="ticket-totales">
              <div className="ticket-total-row">
                <span>Subtotal Base:</span>
                <span>{formatearMoneda(compra.subtotal)}</span>
              </div>
              {compra.descuento > 0 && (
                <div className="ticket-total-row">
                  <span>Descuentos:</span>
                  <span>{formatearMoneda(compra.descuento)}</span>
                </div>
              )}
              {compra.impuestos > 0 && (
                <div className="ticket-total-row">
                  <span>Impuestos:</span>
                  <span>{formatearMoneda(compra.impuestos)}</span>
                </div>
              )}
              {compra.monto_pagado > 0 && (
                <div className="ticket-total-row">
                  <span>Pagado:</span>
                  <span>{formatearMoneda(compra.monto_pagado)}</span>
                </div>
              )}
              {compra.monto_deuda > 0 && (
                <div className="ticket-total-row">
                  <span>Deuda:</span>
                  <span>{formatearMoneda(compra.monto_deuda)}</span>
                </div>
              )}
              <div className="ticket-total-row total-final">
                <span>TOTAL:</span>
                <span>{formatearMoneda(compra.total)}</span>
              </div>
            </div>

            {/* Métodos de pago */}
            {(compra.pagos || []).length > 0 && (
              <div className="ticket-pagos">
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Formas de Pago:</div>
                {compra.pagos.map((p) => (
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
        )}
      </div>
    </Layout>
  )
}

export default CompraDetalle

