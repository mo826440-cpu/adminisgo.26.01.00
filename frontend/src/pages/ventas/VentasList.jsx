// Página de lista de ventas
import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Spinner, Alert, Badge, Pagination, Modal } from '../../components/common'
import { getVentas, deleteVenta } from '../../services/ventas'
import './VentasList.css'

const ITEMS_PER_PAGE = 100

function VentasList() {
  const location = useLocation()
  const navigate = useNavigate()
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [ventaToDelete, setVentaToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [showActions, setShowActions] = useState(false)
  
  // Estados de filtros
  const [filtroFecha, setFiltroFecha] = useState('mes_actual') // Por defecto mes actual
  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [tipoFiltroBusqueda, setTipoFiltroBusqueda] = useState('cliente') // cliente, facturacion, codigo_barras, codigo_interno
  const [filtroEstadoPago, setFiltroEstadoPago] = useState('todas') // todas, pagadas, con_deuda

  useEffect(() => {
    loadVentas()
    
    if (location.state?.success) {
      setSuccessMessage(location.state.message || 'Operación realizada correctamente')
      navigate(location.pathname, { replace: true, state: {} })
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [location.state, navigate, location.pathname])

  // Atajo teclado: F2 -> nueva venta
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

  useEffect(() => {
    setCurrentPage(1)
  }, [filtroFecha, filtroBusqueda, tipoFiltroBusqueda, filtroEstadoPago])

  const loadVentas = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getVentas()
    
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    
    setVentas(data || [])
    setLoading(false)
  }

  // Filtrar ventas por fecha (mes actual por defecto)
  const filtrarPorFecha = useCallback((ventas) => {
    if (filtroFecha === 'mes_actual') {
      const ahora = new Date()
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
      return ventas.filter(venta => {
        const fechaVenta = new Date(venta.fecha_hora)
        return fechaVenta >= inicioMes
      })
    }
    // TODO: Implementar otros filtros de fecha (semana, mes anterior, rango personalizado)
    return ventas
  }, [filtroFecha])

  // Filtrar ventas por búsqueda
  const filtrarPorBusqueda = useCallback((ventas) => {
    if (!filtroBusqueda.trim()) return ventas
    
    const termino = filtroBusqueda.toLowerCase()
    
    return ventas.filter(venta => {
      switch (tipoFiltroBusqueda) {
        case 'cliente':
          return venta.clientes?.nombre?.toLowerCase().includes(termino)
        case 'facturacion':
          return venta.facturacion?.toLowerCase().includes(termino)
        case 'codigo_barras':
        case 'codigo_interno':
          // Estos filtros requieren buscar en los productos de los items
          // Por ahora, retornamos todas las ventas
          // TODO: Implementar búsqueda en productos
          return true
        default:
          return true
      }
    })
  }, [filtroBusqueda, tipoFiltroBusqueda])

  // Filtrar ventas por estado de pago
  const filtrarPorEstadoPago = useCallback((ventas) => {
    if (filtroEstadoPago === 'todas') return ventas
    
    return ventas.filter(venta => {
      const montoPagado = parseFloat(venta.monto_pagado || 0)
      const total = parseFloat(venta.total || 0)
      const tieneDeuda = total - montoPagado > 0.01 // Tolerancia para errores de redondeo
      
      if (filtroEstadoPago === 'pagadas') {
        return !tieneDeuda
      }
      if (filtroEstadoPago === 'con_deuda') {
        return tieneDeuda
      }
      return true
    })
  }, [filtroEstadoPago])

  // Aplicar todos los filtros
  const filteredVentas = filtrarPorEstadoPago(
    filtrarPorBusqueda(
      filtrarPorFecha(ventas)
    )
  )

  // Calcular indicadores
  const indicadores = {
    totales: filteredVentas.length,
    cobradas: filteredVentas.filter(v => {
      const montoPagado = parseFloat(v.monto_pagado || 0)
      const total = parseFloat(v.total || 0)
      return total - montoPagado <= 0.01
    }).length,
    conDeuda: filteredVentas.filter(v => {
      const montoPagado = parseFloat(v.monto_pagado || 0)
      const total = parseFloat(v.total || 0)
      return total - montoPagado > 0.01
    }).length
  }

  // Calcular paginación
  const totalItems = filteredVentas.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedVentas = filteredVentas.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async () => {
    if (!ventaToDelete) return
    setDeleting(true)
    const { error: err } = await deleteVenta(ventaToDelete)
    if (err) {
      setError(err.message || 'Error al eliminar la venta')
      setDeleting(false)
      return
    }
    setDeleting(false)
    setShowDeleteModal(false)
    setVentaToDelete(null)
    await loadVentas()
  }

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '-'
    const date = new Date(fecha)
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Formatear moneda
  const formatearMoneda = (valor) => {
    const num = Number(valor || 0)
    return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Obtener estado de pago
  const obtenerEstadoPago = (venta) => {
    const montoPagado = parseFloat(venta.monto_pagado || 0)
    const total = parseFloat(venta.total || 0)
    const tieneDeuda = total - montoPagado > 0.01
    return tieneDeuda ? 'debe' : 'pagado'
  }

  if (loading) {
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
        {/* Indicadores */}
        <div className="ventas-indicadores">
          <div className="indicadores-header">
            <div>
              <div className="section-label">SECCIÓN</div>
              <h3>INDICADORES</h3>
            </div>
            <div className="filtro-fecha-indicadores">
              <select 
                value={filtroFecha} 
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="form-control"
              >
                <option value="mes_actual">(POR DEFECTO, MES ACTUAL)</option>
                {/* TODO: Agregar más opciones de fecha */}
              </select>
            </div>
          </div>
          <div className="indicadores-grid">
            <Card className="indicador-card indicador-verde">
              <div className="indicador-label">Nº VENTAS TOTALES</div>
              <div className="indicador-valor">{indicadores.totales}</div>
            </Card>
            <Card className="indicador-card indicador-verde">
              <div className="indicador-label">Nº VENTAS COBRADAS</div>
              <div className="indicador-valor">{indicadores.cobradas}</div>
            </Card>
            <Card className="indicador-card indicador-verde">
              <div className="indicador-label">Nº VENTAS CON DEUDA</div>
              <div className="indicador-valor">{indicadores.conDeuda}</div>
            </Card>
          </div>
        </div>

        {/* Acciones y Filtros */}
        <div className="ventas-acciones">
          <div className="acciones-header">
            <div>
              <div className="section-label">SECCIÓN</div>
              <h3>ACCIONES</h3>
            </div>
            <div className="acciones-header-buttons">
              <Link to="/ventas/nueva">
                <Button variant="primary" size="sm">
                  Cargar nueva venta (F2)
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowActions(!showActions)}
              >
                {showActions ? 'Ocultar filtros' : 'Mostrar filtros'}
              </Button>
            </div>
          </div>
          {showActions && (
            <div className="acciones-content">
              <div className="filtro-fecha-registros">
                <label>FILTRO DE REGISTROS POR FECHA:</label>
                <select 
                  value={filtroFecha} 
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className="form-control"
                >
                  <option value="mes_actual">(POR DEFECTO, MES ACTUAL)</option>
                </select>
              </div>
              
              <div className="filtros-adicionales">
                <div className="filtro-busqueda">
                  <label>FILTRO DE REGISTROS POR:</label>
                  <div className="filtro-tipo">
                    <select 
                      value={tipoFiltroBusqueda} 
                      onChange={(e) => setTipoFiltroBusqueda(e.target.value)}
                      className="form-control"
                    >
                      <option value="cliente">NOMBRE CLIENTE</option>
                      <option value="facturacion">FACTURACIÓN</option>
                      <option value="codigo_barras">CÓD. BARRAS</option>
                      <option value="codigo_interno">CÓD. INTERNO</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar..."
                    value={filtroBusqueda}
                    onChange={(e) => setFiltroBusqueda(e.target.value)}
                  />
                </div>
                
                <div className="filtro-estado-pago">
                  <label>FILTRO DE REGISTROS POR:</label>
                  <select 
                    value={filtroEstadoPago} 
                    onChange={(e) => setFiltroEstadoPago(e.target.value)}
                    className="form-control"
                  >
                    <option value="todas">TODAS LAS VENTAS</option>
                    <option value="pagadas">VENTAS PAGAS</option>
                    <option value="con_deuda">VENTAS QUE FALTAN PAGAR</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

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

        {/* Tabla de Registros */}
        <Card className="registros-panel">
          <div className="section-label">SECCIÓN</div>
          <h3>TABLA DE REGISTROS</h3>
          {paginatedVentas.length === 0 ? (
            <div className="empty-state">
              {ventas.length === 0 ? (
                <>
                  <p>No hay ventas registradas aún.</p>
                  <Link to="/ventas/nueva">
                    <Button variant="primary">Crear primera venta</Button>
                  </Link>
                </>
              ) : (
                <p>No se encontraron ventas que coincidan con los filtros aplicados</p>
              )}
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table table-sticky-header">
                  <thead>
                    <tr>
                      <th>FECHA</th>
                      <th>FACTURACIÓN</th>
                      <th>CLIENTE</th>
                      <th>UNIDADES</th>
                      <th>$TOTAL</th>
                      <th>$ PAGADO</th>
                      <th>$ DEUDA</th>
                      <th>ESTADO</th>
                      <th>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedVentas.map((venta) => {
                      const estadoPago = obtenerEstadoPago(venta)
                      const montoPagado = parseFloat(venta.monto_pagado || 0)
                      const total = parseFloat(venta.total || 0)
                      const deuda = Math.max(0, total - montoPagado)
                      
                      return (
                        <tr key={venta.id}>
                          <td>{formatearFecha(venta.fecha_hora)}</td>
                          <td>{venta.facturacion || '-'}</td>
                          <td>{venta.clientes?.nombre || 'Cliente genérico'}</td>
                          <td>{venta.unidades_totales || 0}</td>
                          <td>{formatearMoneda(venta.total)}</td>
                          <td>{formatearMoneda(venta.monto_pagado)}</td>
                          <td>{formatearMoneda(deuda)}</td>
                          <td>
                            <Badge variant={estadoPago === 'pagado' ? 'success' : 'warning'}>
                              {estadoPago === 'pagado' ? 'Pagado' : 'Debe'}
                            </Badge>
                          </td>
                          <td>
                            <div className="table-actions">
                              <ActionsMenu
                                ventaId={venta.id}
                                onDelete={(id) => {
                                  setVentaToDelete(id)
                                  setShowDeleteModal(true)
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
              
              {totalItems > 0 && (
                <div className="table-info" style={{ marginTop: '1rem' }}>
                  Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems} ventas
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setVentaToDelete(null)
        }}
        title="Eliminar venta"
        variant="danger"
        closeOnOverlayClick={false}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setVentaToDelete(null)
              }}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              loading={deleting}
              disabled={deleting}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <p>¿Seguro que querés eliminar esta venta? Esta acción restaura el stock.</p>
      </Modal>
    </Layout>
  )
}

export default VentasList

