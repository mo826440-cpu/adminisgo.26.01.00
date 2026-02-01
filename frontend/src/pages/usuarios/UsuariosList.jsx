// Página de lista de usuarios del comercio (solo admin/dueño)
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Spinner, Alert, Badge, Pagination } from '../../components/common'
import { getUsuariosDelComercio } from '../../services/usuarios'
import './UsuariosList.css'

const ITEMS_PER_PAGE = 50

function UsuariosList() {
  const location = useLocation()
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [successMessage, setSuccessMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadUsuarios()

    if (location.state?.success) {
      setSuccessMessage(location.state.message || 'Invitación enviada correctamente.')
      navigate(location.pathname, { replace: true, state: {} })
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [location.state, navigate, location.pathname])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const loadUsuarios = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getUsuariosDelComercio()

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    setUsuarios(data || [])
    setLoading(false)
  }

  const filtered = usuarios.filter(
    (u) =>
      u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.rol_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando usuarios...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container usuarios-list-container">
        <div className="page-header">
          <div>
            <h1>Usuarios</h1>
            <p className="text-secondary">Usuarios de tu comercio</p>
          </div>
          <Link to="/usuarios/nuevo">
            <Button variant="primary">+ Invitar usuario</Button>
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
              placeholder="Buscar por nombre, email, teléfono o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '400px' }}
            />
            {filtered.length > 0 && (
              <div className="table-info">
                Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} de {filtered.length} usuarios
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                {searchTerm ? 'No se encontraron usuarios con ese criterio.' : 'No hay otros usuarios además de ti.'}
              </p>
              {!searchTerm && (
                <Link to="/usuarios/nuevo">
                  <Button variant="primary" style={{ marginTop: '1rem' }}>
                    Invitar primer usuario
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
                      <th>Rol</th>
                      <th>Celular</th>
                      <th>Dirección</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((u) => (
                      <tr key={u.id}>
                        <td>{u.nombre}</td>
                        <td>{u.email || '-'}</td>
                        <td>
                          <Badge variant="secondary">{u.rol_nombre || '-'}</Badge>
                        </td>
                        <td>{u.telefono || '-'}</td>
                        <td>{u.direccion || '-'}</td>
                        <td>
                          <Badge variant={u.activo ? 'success' : 'secondary'}>
                            {u.activo ? 'ACTIVO' : 'INACTIVO'}
                          </Badge>
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
                  onPageChange={(p) => setCurrentPage(p)}
                />
              )}
            </>
          )}
        </Card>
      </div>
    </Layout>
  )
}

export default UsuariosList
