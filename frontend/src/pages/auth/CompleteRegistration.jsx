// Página de Completar Registro - Paso 3: Datos del Comercio
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { crearComercioYUsuario, getComercio } from '../../services/comercio'
import { verificarConsentimientoActual } from '../../services/consentimientos'
import { useAuthContext } from '../../context/AuthContext'
import { Layout } from '../../components/layout'
import { Card, Button, Input, Alert, Spinner, TerminosYCondiciones } from '../../components/common'

function CompleteRegistration() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, loading: authLoading } = useAuthContext()
  const [formData, setFormData] = useState({
    nombre_comercio: '',
    nombre: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [planId, setPlanId] = useState(null)
  const [solicitudEnviada, setSolicitudEnviada] = useState(false)
  const [verificandoComercio, setVerificandoComercio] = useState(true)
  const [mostrarTerminos, setMostrarTerminos] = useState(false)
  const [terminosAceptados, setTerminosAceptados] = useState(false)
  const [verificandoConsentimiento, setVerificandoConsentimiento] = useState(true)

  // Verificar si el usuario ya tiene comercio (ya completó el registro)
  useEffect(() => {
    const verificarComercio = async () => {
      if (!isAuthenticated || authLoading) return

      try {
        const { data: comercio, error: errorComercio } = await getComercio()
        
        // Si el usuario ya tiene comercio, redirigir al dashboard
        if (comercio) {
          navigate('/dashboard', { replace: true })
          return
        }
        
        // Si no tiene comercio, continuar con el registro
        setVerificandoComercio(false)
      } catch (err) {
        // Si hay error (probablemente porque no tiene comercio), continuar
        console.error('Error al verificar comercio:', err)
        setVerificandoComercio(false)
      }
    }

    if (isAuthenticated && !authLoading) {
      verificarComercio()
    }
  }, [isAuthenticated, authLoading, navigate])

  // Obtener plan_id del state de navegación y verificar consentimiento
  useEffect(() => {
    // Solo verificar plan_id después de verificar que no tiene comercio
    if (!verificandoComercio) {
      if (location.state?.plan_id) {
        setPlanId(location.state.plan_id)
        if (location.state?.solicitud_enviada) {
          setSolicitudEnviada(true)
        }
        
        // Verificar si el usuario ya tiene consentimiento de términos
        verificarConsentimiento()
      } else {
        // Si no hay plan_id, redirigir a selección de plan (IMPORTANTE: no permitir acceso directo)
        console.warn('Acceso directo a CompleteRegistration sin plan_id. Redirigiendo a selección de plan.')
        navigate('/auth/select-plan', { replace: true })
      }
    }
  }, [location.state, navigate, verificandoComercio])

  const verificarConsentimiento = async () => {
    setVerificandoConsentimiento(true)
    try {
      const { data: tieneConsentimiento } = await verificarConsentimientoActual()
      if (tieneConsentimiento) {
        setTerminosAceptados(true)
        setMostrarTerminos(false)
      } else {
        // Si no tiene consentimiento, mostrar modal de términos
        setMostrarTerminos(true)
      }
    } catch (err) {
      console.error('Error al verificar consentimiento:', err)
      // En caso de error, mostrar términos por seguridad
      setMostrarTerminos(true)
    } finally {
      setVerificandoConsentimiento(false)
    }
  }

  // Si no está autenticado, redirigir al registro
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/register', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  // Si está cargando o verificando comercio/consentimiento, mostrar spinner
  if (authLoading || verificandoComercio || verificandoConsentimiento) {
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

  const handleTerminosAceptados = () => {
    setTerminosAceptados(true)
    setMostrarTerminos(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validar que los términos fueron aceptados
    if (!terminosAceptados) {
      setError('Debes aceptar los términos y condiciones antes de continuar')
      setMostrarTerminos(true)
      setLoading(false)
      return
    }

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

    // Validar que tenemos plan_id antes de continuar
    if (!planId) {
      setError('Debes seleccionar un plan primero. Redirigiendo...')
      setTimeout(() => {
        navigate('/auth/select-plan', { replace: true })
      }, 2000)
      setLoading(false)
      return
    }

    try {
      const { data, error: comercioError } = await crearComercioYUsuario({
        nombre_comercio: formData.nombre_comercio,
        nombre_usuario: formData.nombre,
        plan_id: planId
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
            Paso 3 de 3: Completa los datos de tu comercio
          </p>

          {solicitudEnviada && (
            <Alert variant="success" style={{ marginBottom: '1.5rem' }}>
              ✅ Tu solicitud de plan personalizado ha sido enviada. Nos pondremos en contacto contigo pronto.
            </Alert>
          )}

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
                disabled={loading || !terminosAceptados}
                fullWidth
              >
                Finalizar Registro
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Modal de Términos y Condiciones */}
      <TerminosYCondiciones
        isOpen={mostrarTerminos}
        onClose={() => {
          // No permitir cerrar sin aceptar
          if (!terminosAceptados) {
            setError('Debes aceptar los términos y condiciones para continuar')
          }
        }}
        onAccept={handleTerminosAceptados}
        required={true}
        showVersion={true}
      />
    </Layout>
  )
}

export default CompleteRegistration

