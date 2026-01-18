// Página de lista de clientes
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Spinner, Alert, Badge, Pagination } from '../../components/common'
import { getClientes } from '../../services/clientes'
import './ClientesList.css'

const ITEMS_PER_PAGE = 100

function ClientesList() {
  const location = useLocation()
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [successMessage, setSuccessMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadClientes()
    
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

  const loadClientes = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getClientes()
    
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    
    setClientes(data || [])
    setLoading(false)
  }

  // Filtrar clientes por búsqueda
  const filteredClientes = clientes.filter(cliente => 
    cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefono?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calcular paginación
  const totalItems = filteredClientes.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedClientes = filteredClientes.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    // Scroll al inicio de la tabla
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando clientes...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Clientes</h1>
            <p className="text-secondary">Gestiona tu base de clientes</p>
          </div>
          <Link to="/clientes/nuevo">
            <Button variant="primary">
              + Nuevo Cliente
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
          <div className="table-controls">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '400px' }}
            />
            {totalItems > 0 && (
              <div className="table-info">
                Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems} clientes
              </div>
            )}
          </div>

          {filteredClientes.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                {searchTerm ? 'No se encontraron clientes con ese criterio de búsqueda.' : 'No hay clientes registrados aún.'}
              </p>
              {!searchTerm && (
                <Link to="/clientes/nuevo">
                  <Button variant="primary" style={{ marginTop: '1rem' }}>
                    Crear primer cliente
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table table-sticky-header">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                      <th>Dirección</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClientes.map(cliente => (
                      <tr key={cliente.id}>
                        <td>{cliente.nombre}</td>
                        <td>{cliente.email || '-'}</td>
                        <td>{cliente.telefono || '-'}</td>
                        <td>{cliente.direccion || '-'}</td>
                        <td>
                          <Badge variant={cliente.activo ? 'success' : 'secondary'}>
                            {cliente.activo ? 'ACTIVO' : 'INACTIVO'}
                          </Badge>
                        </td>
                        <td>
                          <Link to={`/clientes/${cliente.id}`}>
                            <Button variant="ghost" size="sm">Editar</Button>
                          </Link>
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
    </Layout>
  )
}

export default ClientesList
