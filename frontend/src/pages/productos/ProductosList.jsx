// Página de lista de productos
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Spinner, Alert, Badge, Pagination, Modal } from '../../components/common'
import { getProductos, deleteProducto } from '../../services/productos'
import './ProductosList.css'

const ITEMS_PER_PAGE = 100

function ProductosList() {
  const location = useLocation()
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [successMessage, setSuccessMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productoToDelete, setProductoToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadProductos()
    
    // Verificar si hay un mensaje de éxito en el estado de la navegación
    if (location.state?.success) {
      setSuccessMessage(location.state.message || 'Operación realizada correctamente')
      // Limpiar el estado de navegación para que no se muestre el mensaje al refrescar
      navigate(location.pathname, { replace: true, state: {} })
      
      // Ocultar el mensaje después de 5 segundos
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [location.state, navigate, location.pathname])

  // Resetear a página 1 cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const loadProductos = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getProductos()
    
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    
    setProductos(data || [])
    setLoading(false)
  }

  // Filtrar productos por búsqueda
  const filteredProductos = productos.filter(producto => 
    producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.codigo_barras?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calcular paginación
  const totalItems = filteredProductos.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProductos = filteredProductos.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    // Scroll al inicio de la tabla
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteClick = (producto) => {
    setProductoToDelete(producto)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!productoToDelete) return
    setDeleting(true)
    setError(null)
    
    const { error: err } = await deleteProducto(productoToDelete.id)
    
    if (err) {
      setError(err.message || 'Error al eliminar el producto')
      setDeleting(false)
      return
    }
    
    setDeleting(false)
    setShowDeleteModal(false)
    setProductoToDelete(null)
    await loadProductos()
    setSuccessMessage('Producto eliminado correctamente')
  }

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando productos...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Productos</h1>
            <p className="text-secondary">Gestiona tu catálogo de productos</p>
          </div>
          <Link to="/productos/nuevo">
            <Button variant="primary">
              + Nuevo Producto
            </Button>
          </Link>
        </div>

        {successMessage && (
          <Alert variant="success" dismissible onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card>
          <div className="productos-filters">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre o código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '400px' }}
            />
            {totalItems > 0 && (
              <div className="table-info">
                Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems} productos
              </div>
            )}
          </div>

          {filteredProductos.length === 0 ? (
            <div className="empty-state">
              {productos.length === 0 ? (
                <>
                  <p>No hay productos registrados aún.</p>
                  <Link to="/productos/nuevo">
                    <Button variant="primary">Crear primer producto</Button>
                  </Link>
                </>
              ) : (
                <p>No se encontraron productos que coincidan con "{searchTerm}"</p>
              )}
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table table-sticky-header">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Código</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Categoría</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProductos.map((producto) => (
                      <tr key={producto.id}>
                        <td>
                          <strong>{producto.nombre}</strong>
                          {producto.descripcion && (
                            <div className="text-secondary text-small">
                              {producto.descripcion}
                            </div>
                          )}
                        </td>
                        <td>{producto.codigo_barras || '-'}</td>
                        <td>${producto.precio_venta?.toFixed(2) || '0.00'}</td>
                        <td>
                          <Badge 
                            variant={producto.stock_actual <= (producto.stock_minimo || 0) ? 'warning' : 'success'}
                          >
                            {producto.stock_actual || 0}
                          </Badge>
                        </td>
                        <td>{producto.categorias?.nombre || '-'}</td>
                        <td>
                          <Badge variant={producto.activo ? 'success' : 'secondary'}>
                            {producto.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td>
                          <div className="table-actions">
                            <Link to={`/productos/${producto.id}`} className="btn-link">
                              Editar
                            </Link>
                            <button
                              className="btn-link btn-link-danger"
                              onClick={() => handleDeleteClick(producto)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
            </>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setProductoToDelete(null)
        }}
        title="Eliminar producto"
        variant="danger"
        closeOnOverlayClick={false}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setProductoToDelete(null)
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
        <p>¿Estás seguro de que deseas eliminar el producto <strong>"{productoToDelete?.nombre}"</strong>?</p>
        <p style={{ marginTop: '0.5rem', fontSize: 'var(--font-size-small)', color: 'var(--text-secondary)' }}>
          Esta acción desactivará el producto (soft delete). No se perderán los datos históricos de ventas.
        </p>
      </Modal>
    </Layout>
  )
}

export default ProductosList
