// Página de lista de compras
import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Spinner, Alert, Badge, Pagination, Modal } from '../../components/common'
import { getCompras, deleteCompra } from '../../services/compras'
import { useDateTime } from '../../context/DateTimeContext'
import { formatDate } from '../../utils/dateFormat'
import './ComprasList.css'

const ITEMS_PER_PAGE = 100

function ComprasList() {
  const location = useLocation()
  const navigate = useNavigate()
  const [compras, setCompras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [compraToDelete, setCompraToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [showActions, setShowActions] = useState(false)
  
  // Estado para el texto del botón de filtros
  const [textoBotonFiltros, setTextoBotonFiltros] = useState('Mostrar filtros')
  
  // Sincronizar texto con showActions
  useEffect(() => {
    setTextoBotonFiltros(showActions ? 'Ocultar filtros' : 'Mostrar filtros')
  }, [showActions])
  
  // Estados de filtros (por defecto: últimos 90 días, igual que ventas)
  const getDefaultFechaDesde = () => {
    const ahora = new Date()
    const desde = new Date(ahora)
    desde.setDate(desde.getDate() - 90)
    return desde.toISOString().split('T')[0]
  }
  const getDefaultFechaHasta = () => {
    const ahora = new Date()
    return ahora.toISOString().split('T')[0]
  }
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(getDefaultFechaDesde())
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(getDefaultFechaHasta())
  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [tipoFiltroBusqueda, setTipoFiltroBusqueda] = useState('proveedor') // proveedor, numero_orden
  const [filtroEstadoPago, setFiltroEstadoPago] = useState('todas') // todas, pagadas, con_deuda
  const [filtroEstado, setFiltroEstado] = useState('todas') // todas, pendiente, recibida, cancelada (RECIBO)

  useEffect(() => {
    loadCompras()
    
    if (location.state?.success) {
      setSuccessMessage(location.state.message || 'Operación realizada correctamente')
      navigate(location.pathname, { replace: true, state: {} })
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [location.state, navigate, location.pathname])

  // Atajo teclado: F2 -> nueva compra
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F2') {
        e.preventDefault()
        navigate('/compras/nueva')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  useEffect(() => {
    setCurrentPage(1)
  }, [filtroFechaDesde, filtroFechaHasta, filtroBusqueda, tipoFiltroBusqueda, filtroEstadoPago, filtroEstado])

  // Función para limpiar todos los filtros y volver a valores por defecto
  const limpiarFiltros = () => {
    setFiltroFechaDesde(getDefaultFechaDesde())
    setFiltroFechaHasta(getDefaultFechaHasta())
    setFiltroBusqueda('')
    setTipoFiltroBusqueda('proveedor')
    setFiltroEstadoPago('todas')
    setFiltroEstado('todas')
  }

  const loadCompras = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getCompras()
    
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    
    setCompras(data || [])
    setLoading(false)
  }

  // Filtrar compras por rango de fechas
  const filtrarPorFecha = useCallback((compras) => {
    if (!filtroFechaDesde || !filtroFechaHasta) return compras
    
    const fechaDesde = new Date(filtroFechaDesde)
    fechaDesde.setHours(0, 0, 0, 0) // Inicio del día
    const fechaHasta = new Date(filtroFechaHasta)
    fechaHasta.setHours(23, 59, 59, 999) // Fin del día
    
    return compras.filter(compra => {
      const fechaCompra = new Date(compra.fecha_orden)
      return fechaCompra >= fechaDesde && fechaCompra <= fechaHasta
    })
  }, [filtroFechaDesde, filtroFechaHasta])

  // Filtrar compras por búsqueda
  const filtrarPorBusqueda = useCallback((compras) => {
    if (!filtroBusqueda.trim()) return compras
    
    const termino = filtroBusqueda.toLowerCase()
    
    return compras.filter(compra => {
      switch (tipoFiltroBusqueda) {
        case 'proveedor':
          return compra.proveedores?.nombre_razon_social?.toLowerCase().includes(termino)
        case 'numero_orden':
          return compra.numero_orden?.toLowerCase().includes(termino)
        default:
          return true
      }
    })
  }, [filtroBusqueda, tipoFiltroBusqueda])

  // Filtrar compras por estado de pago (pagado / debe)
  const filtrarPorEstadoPago = useCallback((compras) => {
    if (filtroEstadoPago === 'todas') return compras
    
    return compras.filter(compra => {
      const montoPagado = parseFloat(compra.monto_pagado || 0)
      const total = parseFloat(compra.total || 0)
      const tieneDeuda = total - montoPagado > 0.01
      if (filtroEstadoPago === 'pagadas') return !tieneDeuda
      if (filtroEstadoPago === 'con_deuda') return tieneDeuda
      return true
    })
  }, [filtroEstadoPago])

  // Filtrar compras por estado de recibo (recibida / pendiente)
  const filtrarPorEstado = useCallback((compras) => {
    if (filtroEstado === 'todas') return compras
    return compras.filter(compra => compra.estado === filtroEstado)
  }, [filtroEstado])

  // Aplicar todos los filtros
  const filteredCompras = filtrarPorEstado(
    filtrarPorEstadoPago(
      filtrarPorBusqueda(
        filtrarPorFecha(compras)
      )
    )
  )

  // Calcular indicadores (similares a ventas: totales, pagadas, con deuda)
  const indicadores = {
    totales: filteredCompras.length,
    pagadas: filteredCompras.filter(c => {
      const montoPagado = parseFloat(c.monto_pagado || 0)
      const total = parseFloat(c.total || 0)
      return total - montoPagado <= 0.01
    }).length,
    conDeuda: filteredCompras.filter(c => {
      const montoPagado = parseFloat(c.monto_pagado || 0)
      const total = parseFloat(c.total || 0)
      return total - montoPagado > 0.01
    }).length
  }

  // Calcular paginación
  const totalItems = filteredCompras.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedCompras = filteredCompras.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async () => {
    if (!compraToDelete) return
    setDeleting(true)
    const { error: err } = await deleteCompra(compraToDelete)
    if (err) {
      setError(err.message || 'Error al eliminar la compra')
      setDeleting(false)
      return
    }
    setDeleting(false)
    setShowDeleteModal(false)
    setCompraToDelete(null)
    await loadCompras()
  }

  // Obtener configuración de fecha/hora
  const { timezone, dateFormat } = useDateTime()
  
  // Formatear fecha usando la configuración del usuario (solo fecha, sin hora)
  const formatearFecha = (fecha) => {
    // Extraer solo la parte de fecha del formato
    const formatoSoloFecha = dateFormat.split(' ')[0] // Tomar solo la parte de fecha (antes del espacio)
    return formatDate(fecha, formatoSoloFecha, timezone)
  }

  // Formatear moneda
  const formatearMoneda = (valor) => {
    const num = Number(valor || 0)
    return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Obtener variante de badge según estado
  const obtenerVariantEstado = (estado) => {
    switch (estado) {
      case 'recibida':
        return 'success'
      case 'pendiente':
        return 'warning'
      case 'cancelada':
        return 'danger'
      default:
        return 'info'
    }
  }

  // Obtener texto del estado
  const obtenerTextoEstado = (estado) => {
    switch (estado) {
      case 'recibida':
        return 'Recibida'
      case 'pendiente':
        return 'Pendiente'
      case 'cancelada':
        return 'Cancelada'
      default:
        return estado
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando compras...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        {/* Indicadores */}
        <div className="compras-indicadores">
          <div className="indicadores-header">
            <div>
              <div className="section-label">SECCIÓN</div>
              <h3>INDICADORES</h3>
            </div>
          </div>
          <div className="indicadores-grid">
            <Card className="indicador-card indicador-verde">
              <div className="indicador-label">Nº COMPRAS TOTALES</div>
              <div className="indicador-valor">{indicadores.totales}</div>
            </Card>
            <Card className="indicador-card indicador-verde">
              <div className="indicador-label">Nº COMPRAS PAGAS</div>
              <div className="indicador-valor">{indicadores.pagadas}</div>
            </Card>
            <Card className="indicador-card indicador-verde">
              <div className="indicador-label">Nº COMPRAS CON DEUDA</div>
              <div className="indicador-valor">{indicadores.conDeuda}</div>
            </Card>
          </div>
        </div>

        {/* Acciones y Filtros */}
        <div className="compras-acciones">
          <div className="acciones-header">
            <div>
              <div className="section-label">SECCIÓN</div>
              <h3>ACCIONES</h3>
            </div>
          </div>
          <div className="acciones-buttons">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowActions(prev => !prev)}
            >
              {textoBotonFiltros}
            </Button>
            <Link to="/compras/nueva">
              <Button variant="primary" size="sm">
                Nueva orden de compra (F2)
              </Button>
            </Link>
          </div>
          {showActions && (
            <div className="acciones-content">
              <div className="filtros-header-actions">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={limpiarFiltros}
                >
                  🗑️ Limpiar Filtros
                </Button>
              </div>
              <div className="filtro-fecha-registros">
                <label>FILTRO DE REGISTROS POR FECHA:</label>
                <div className="filtro-fecha-rango">
                  <div className="filtro-fecha-item">
                    <label htmlFor="fecha-desde">Desde:</label>
                    <input
                      type="date"
                      id="fecha-desde"
                      value={filtroFechaDesde}
                      onChange={(e) => setFiltroFechaDesde(e.target.value)}
                      className="form-control"
                    />
                  </div>
                  <div className="filtro-fecha-item">
                    <label htmlFor="fecha-hasta">Hasta:</label>
                    <input
                      type="date"
                      id="fecha-hasta"
                      value={filtroFechaHasta}
                      onChange={(e) => setFiltroFechaHasta(e.target.value)}
                      className="form-control"
                      min={filtroFechaDesde}
                    />
                  </div>
                </div>
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
                      <option value="proveedor">NOMBRE PROVEEDOR</option>
                      <option value="numero_orden">NÚMERO ORDEN</option>
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
                    <option value="todas">TODAS LAS COMPRAS</option>
                    <option value="pagadas">COMPRAS PAGAS</option>
                    <option value="con_deuda">COMPRAS QUE FALTAN PAGAR</option>
                  </select>
                </div>
                
                <div className="filtro-estado">
                  <label>FILTRO POR RECIBO:</label>
                  <select 
                    value={filtroEstado} 
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="form-control"
                  >
                    <option value="todas">TODOS</option>
                    <option value="pendiente">PENDIENTE</option>
                    <option value="recibida">RECIBIDA</option>
                    <option value="cancelada">CANCELADA</option>
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
          {paginatedCompras.length === 0 ? (
            <div className="empty-state">
              {compras.length === 0 ? (
                <>
                  <p>No hay compras registradas aún.</p>
                  <Link to="/compras/nueva">
                    <Button variant="primary">Crear primera compra</Button>
                  </Link>
                </>
              ) : (
                <p>No se encontraron compras que coincidan con los filtros aplicados</p>
              )}
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table table-sticky-header">
                  <thead>
                    <tr>
                      <th>FECHA</th>
                      <th className="hide-mobile">FACTURACIÓN / Nº ORDEN</th>
                      <th>PROVEEDOR</th>
                      <th className="hide-mobile">UNIDADES</th>
                      <th className="hide-mobile">$TOTAL</th>
                      <th className="hide-mobile">$PAGADO</th>
                      <th className="hide-mobile">$DEUDA</th>
                      <th>ESTADO</th>
                      <th>RECIBO</th>
                      <th>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCompras.map((compra) => {
                      const montoPagado = parseFloat(compra.monto_pagado || 0)
                      const total = parseFloat(compra.total || 0)
                      const deuda = compra.monto_deuda != null ? parseFloat(compra.monto_deuda) : Math.max(0, total - montoPagado)
                      const estadoPago = total <= 0 || montoPagado >= total ? 'pagado' : 'debe'
                      return (
                        <tr key={compra.id}>
                          <td>{formatearFecha(compra.fecha_orden)}</td>
                          <td className="hide-mobile">{compra.numero_orden || '-'}</td>
                          <td>{compra.proveedores?.nombre_razon_social || '-'}</td>
                          <td className="hide-mobile">{compra.unidades_totales ?? 0}</td>
                          <td className="hide-mobile">{formatearMoneda(compra.total)}</td>
                          <td className="hide-mobile">{formatearMoneda(compra.monto_pagado)}</td>
                          <td className="hide-mobile">{formatearMoneda(deuda)}</td>
                          <td>
                            <Badge variant={estadoPago === 'pagado' ? 'success' : 'warning'}>
                              {estadoPago === 'pagado' ? 'Pagado' : 'Debe'}
                            </Badge>
                          </td>
                          <td>
                            <Badge variant={obtenerVariantEstado(compra.estado)}>
                              {obtenerTextoEstado(compra.estado)}
                            </Badge>
                          </td>
                          <td>
                            <div className="table-actions">
                              <Link to={`/compras/${compra.id}`}>
                                <Button variant="ghost" size="sm" title="Ver detalle">
                                  <i className="bi bi-eye" />
                                </Button>
                              </Link>
                              <Link to={`/compras/${compra.id}/editar`}>
                                <Button variant="ghost" size="sm" title="Editar">
                                  <i className="bi bi-pencil" />
                                </Button>
                              </Link>
                              <Link to={`/compras/${compra.id}`} state={{ print: true }}>
                                <Button variant="ghost" size="sm" title="Imprimir">
                                  <i className="bi bi-printer" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Eliminar"
                                onClick={() => {
                                  setCompraToDelete(compra.id)
                                  setShowDeleteModal(true)
                                }}
                              >
                                <i className="bi bi-trash" />
                              </Button>
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
                  Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems} compras
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
          setCompraToDelete(null)
        }}
        title="Eliminar compra"
        variant="danger"
        closeOnOverlayClick={false}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setCompraToDelete(null)
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
        <p>¿Seguro que querés eliminar esta compra? Esta acción no se puede deshacer.</p>
      </Modal>
    </Layout>
  )
}

export default ComprasList

