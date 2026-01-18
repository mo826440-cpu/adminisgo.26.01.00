// Página de lista de marcas
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Spinner, Alert, Badge, Pagination } from '../../components/common'
import { getMarcas } from '../../services/marcas'
import './MarcasList.css'

const ITEMS_PER_PAGE = 100

function MarcasList() {
  const location = useLocation()
  const navigate = useNavigate()
  const [marcas, setMarcas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [successMessage, setSuccessMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadMarcas()
    
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

  const loadMarcas = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getMarcas()
    
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    
    setMarcas(data || [])
    setLoading(false)
  }

  const filteredMarcas = marcas.filter(marca => 
    marca.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    marca.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalItems = filteredMarcas.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedMarcas = filteredMarcas.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando marcas...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Marcas</h1>
            <p className="text-secondary">Gestiona las marcas de productos</p>
          </div>
          <Link to="/marcas/nuevo">
            <Button variant="primary">
              + Nueva Marca
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
                Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems} marcas
              </div>
            )}
          </div>

          {filteredMarcas.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                {searchTerm ? 'No se encontraron marcas con ese criterio de búsqueda.' : 'No hay marcas registradas aún.'}
              </p>
              {!searchTerm && (
                <Link to="/marcas/nuevo">
                  <Button variant="primary" style={{ marginTop: '1rem' }}>
                    Crear primera marca
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
                    {paginatedMarcas.map(marca => (
                      <tr key={marca.id}>
                        <td><strong>{marca.nombre}</strong></td>
                        <td>{marca.descripcion || '-'}</td>
                        <td>
                          <Badge variant={marca.activo ? 'success' : 'secondary'}>
                            {marca.activo ? 'ACTIVA' : 'INACTIVA'}
                          </Badge>
                        </td>
                        <td>
                          <Link to={`/marcas/${marca.id}`}>
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

export default MarcasList

