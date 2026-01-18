// Página de Completar Registro - Paso 2: Datos del Comercio
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { crearComercioYUsuario } from '../../services/comercio'
import { useAuthContext } from '../../context/AuthContext'
import { Layout } from '../../components/layout'
import { Card, Button, Input, Alert, Spinner } from '../../components/common'

function CompleteRegistration() {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuthContext()
  const [formData, setFormData] = useState({
    nombre_comercio: '',
    nombre: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Si no está autenticado, redirigir al registro
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/register', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  // Si está cargando, mostrar spinner
  if (authLoading) {
    return (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando...</p>
        </div>
      </Layout>
    )
  }

  // Si no está autenticado, no mostrar (el useEffect redirigirá)
  if (!isAuthenticated) {
    return null
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validaciones
    if (!formData.nombre_comercio.trim()) {
      setError('El nombre del comercio es obligatorio')
      setLoading(false)
      return
    }

    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio')
      setLoading(false)
      return
    }

    try {
      const { data, error: comercioError } = await crearComercioYUsuario({
        nombre_comercio: formData.nombre_comercio,
        nombre_usuario: formData.nombre,
        plan_id: 1 // Plan gratis por defecto
      })

      if (comercioError) {
        throw comercioError
      }

      // Redirigir al login después de crear exitosamente
      navigate('/auth/login', { 
        replace: true,
        state: { message: 'Registro completado exitosamente. Por favor, inicia sesión.' }
      })
    } catch (err) {
      setError(err.message || 'Error al completar el registro')
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container" style={{ padding: '2rem 0', maxWidth: '600px', margin: '0 auto' }}>
        <Card>
          <h1 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Completar Registro</h1>
          <p style={{ marginBottom: '2rem', textAlign: 'center', fontSize: 'var(--font-size-small)', color: 'var(--text-secondary)' }}>
            Paso 2 de 2: Completa los datos de tu comercio
          </p>

          {error && (
            <Alert variant="danger" dismissible onDismiss={() => setError(null)} style={{ marginBottom: '1.5rem' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <Input
                label="Nombre del Comercio"
                name="nombre_comercio"
                value={formData.nombre_comercio}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Ej: Mi Tienda"
                fullWidth
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <Input
                label="Tu Nombre Completo"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Ej: Juan Pérez"
                fullWidth
              />
            </div>

            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: 'var(--font-size-small)', margin: 0, color: 'var(--text-secondary)' }}>
                <strong>Email registrado:</strong> {user?.email}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
                fullWidth
              >
                Finalizar Registro
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  )
}

export default CompleteRegistration

