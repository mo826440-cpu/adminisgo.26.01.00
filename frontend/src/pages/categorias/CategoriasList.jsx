// Página de lista de categorías
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Spinner, Alert, Badge, Pagination } from '../../components/common'
import { getCategorias } from '../../services/categorias'
import './CategoriasList.css'

const ITEMS_PER_PAGE = 100

function CategoriasList() {
  const location = useLocation()
  const navigate = useNavigate()
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [successMessage, setSuccessMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadCategorias()
    
    if (location.state?.success) {
      setSuccessMessage(location.state.message || 'Operación realizada correctamente')
      navigate(location.pathname, { replace: true, state: {} })
      
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [location.state, navigate, location.pathname])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const loadCategorias = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getCategorias()
    
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    
    setCategorias(data || [])
    setLoading(false)
  }

  const filteredCategorias = categorias.filter(categoria => 
    categoria.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    categoria.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalItems = filteredCategorias.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedCategorias = filteredCategorias.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando categorías...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Categorías</h1>
            <p className="text-secondary">Gestiona las categorías de productos</p>
          </div>
          <Link to="/categorias/nuevo">
            <Button variant="primary">
              + Nueva Categoría
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
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '400px' }}
            />
            {totalItems > 0 && (
              <div className="table-info">
                Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems} categorías
              </div>
            )}
          </div>

          {filteredCategorias.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                {searchTerm ? 'No se encontraron categorías con ese criterio de búsqueda.' : 'No hay categorías registradas aún.'}
              </p>
              {!searchTerm && (
                <Link to="/categorias/nuevo">
                  <Button variant="primary" style={{ marginTop: '1rem' }}>
                    Crear primera categoría
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
                      <th>Descripción</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCategorias.map(categoria => (
                      <tr key={categoria.id}>
                        <td><strong>{categoria.nombre}</strong></td>
                        <td>{categoria.descripcion || '-'}</td>
                        <td>
                          <Badge variant={categoria.activo ? 'success' : 'secondary'}>
                            {categoria.activo ? 'ACTIVA' : 'INACTIVA'}
                          </Badge>
                        </td>
                        <td>
                          <Link to={`/categorias/${categoria.id}`}>
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

export default CategoriasList

