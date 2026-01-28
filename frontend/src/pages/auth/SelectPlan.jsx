// Página de Selección de Plan - Paso 2: Elegir Plan
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPlanes, crearSolicitudPersonalizada } from '../../services/planes'
import { getComercio } from '../../services/comercio'
import { verificarConsentimientoActual } from '../../services/consentimientos'
import { useAuthContext } from '../../context/AuthContext'
import { Card, Button, Alert, Spinner, Input, TerminosYCondiciones } from '../../components/common'
import './SelectPlan.css'

function SelectPlan() {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuthContext()
  const [planes, setPlanes] = useState([])
  const [planSeleccionado, setPlanSeleccionado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingPlanes, setLoadingPlanes] = useState(true)
  const [verificandoComercio, setVerificandoComercio] = useState(true)
  const [error, setError] = useState(null)
  const [mostrarFormularioPersonalizado, setMostrarFormularioPersonalizado] = useState(false)
  const [formularioPersonalizado, setFormularioPersonalizado] = useState({
    nombre: '',
    email: user?.email || '',
    telefono: '',
    mensaje: ''
  })
  const [mostrarTerminos, setMostrarTerminos] = useState(false)
  const [terminosAceptados, setTerminosAceptados] = useState(false)
  const [verificandoConsentimiento, setVerificandoConsentimiento] = useState(true)

  // Formato argentino: 25000 → "25.000,00", 250000 → "250.000,00"
  const formatearPrecioARS = (n) => {
    if (n == null || isNaN(n)) return '0,00'
    const num = Number(n)
    // Formato: punto para miles, coma para decimales, siempre 2 decimales
    return num.toLocaleString('es-AR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2,
      useGrouping: true
    })
  }

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
        
        // Si no tiene comercio, continuar con la selección de plan
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

  // Si no está autenticado, redirigir al registro
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/register', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  // Cargar planes disponibles y verificar consentimiento
  useEffect(() => {
    const cargarPlanes = async () => {
      try {
        const { data, error } = await getPlanes()
        if (error) throw error
        
        // Filtrar solo los planes que queremos mostrar (gratis, pago, personalizado)
        const planesFiltrados = data?.filter(p => 
          ['gratis', 'basico', 'personalizado'].includes(p.nombre)
        ) || []
        
        setPlanes(planesFiltrados)
      } catch (err) {
        setError(err.message || 'Error al cargar planes')
      } finally {
        setLoadingPlanes(false)
      }
    }

    const verificarConsentimiento = async () => {
      if (!isAuthenticated) return
      
      setVerificandoConsentimiento(true)
      try {
        const { data: tieneConsentimiento } = await verificarConsentimientoActual()
        if (tieneConsentimiento) {
          setTerminosAceptados(true)
        }
        // No mostramos términos automáticamente aquí, solo cuando seleccionan plan de pago
      } catch (err) {
        console.error('Error al verificar consentimiento:', err)
        // En caso de error, permitir continuar pero mostrar términos cuando sea necesario
      } finally {
        setVerificandoConsentimiento(false)
      }
    }

    if (isAuthenticated) {
      cargarPlanes()
      verificarConsentimiento()
    }
  }, [isAuthenticated])

  // Si está cargando o verificando comercio/consentimiento, mostrar spinner
  if (authLoading || loadingPlanes || verificandoComercio || verificandoConsentimiento) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <Spinner size="lg" />
      </div>
    )
  }

  // Si no está autenticado, no mostrar (el useEffect redirigirá)
  if (!isAuthenticated) {
    return null
  }

  const handleSeleccionarPlan = (plan) => {
    if (plan.nombre === 'personalizado') {
      setMostrarFormularioPersonalizado(true)
      setPlanSeleccionado(plan)
    } else {
      setPlanSeleccionado(plan)
      setMostrarFormularioPersonalizado(false)
    }
  }

  const handleChangeFormulario = (e) => {
    setFormularioPersonalizado({
      ...formularioPersonalizado,
      [e.target.name]: e.target.value
    })
  }

  const handleEnviarSolicitudPersonalizada = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validaciones
    if (!formularioPersonalizado.nombre.trim()) {
      setError('El nombre es obligatorio')
      setLoading(false)
      return
    }

    if (!formularioPersonalizado.mensaje.trim()) {
      setError('El mensaje es obligatorio')
      setLoading(false)
      return
    }

    try {
      const { data, error: solicitudError } = await crearSolicitudPersonalizada(formularioPersonalizado)
      
      if (solicitudError) {
        throw solicitudError
      }

      // Redirigir con mensaje
      navigate('/auth/complete-registration', {
        state: {
          plan_id: planSeleccionado.id,
          plan_nombre: planSeleccionado.nombre,
          solicitud_enviada: true
        }
      })
    } catch (err) {
      setError(err.message || 'Error al enviar solicitud')
      setLoading(false)
    }
  }

  const handleTerminosAceptados = () => {
    setTerminosAceptados(true)
    setMostrarTerminos(false)
    // Después de aceptar términos, continuar con el flujo
    continuarConPlan()
  }

  const continuarConPlan = () => {
    // Para planes gratis y pago, continuar al siguiente paso
    navigate('/auth/complete-registration', {
      state: {
        plan_id: planSeleccionado.id,
        plan_nombre: planSeleccionado.nombre
      }
    })
  }

  const handleContinuar = () => {
    if (!planSeleccionado) {
      setError('Por favor, selecciona un plan')
      return
    }

    if (planSeleccionado.nombre === 'personalizado' && !mostrarFormularioPersonalizado) {
      setError('Por favor, completa el formulario de solicitud')
      return
    }

    // Si es plan personalizado, ya se maneja en handleEnviarSolicitudPersonalizada
    if (planSeleccionado.nombre === 'personalizado') {
      return
    }

    // Para plan de pago, verificar términos antes de continuar
    if (planSeleccionado.nombre === 'basico') {
      if (!terminosAceptados) {
        // Mostrar términos si aún no fueron aceptados
        setMostrarTerminos(true)
        return
      }
    }

    // Para plan gratis, continuar directamente (términos se mostrarán en CompleteRegistration)
    if (planSeleccionado.nombre === 'gratis') {
      continuarConPlan()
      return
    }

    // Si ya tiene términos aceptados, continuar
    continuarConPlan()
  }

  const planGratis = planes.find(p => p.nombre === 'gratis')
  const planPago = planes.find(p => p.nombre === 'basico')
  const planPersonalizado = planes.find(p => p.nombre === 'personalizado')

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-secondary)',
      padding: '2rem 1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1200px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Elige tu Plan</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-small)' }}>
            Paso 2 de 3: Selecciona el plan que mejor se adapte a tu negocio
          </p>
        </div>

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)} style={{ marginBottom: '2rem' }}>
            {error}
          </Alert>
        )}

        {mostrarFormularioPersonalizado ? (
          <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <Button
                variant="outline"
                onClick={() => {
                  setMostrarFormularioPersonalizado(false)
                  setPlanSeleccionado(null)
                }}
              >
                ← Volver
              </Button>
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Solicitud de Plan Personalizado</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Completa el formulario y nos pondremos en contacto contigo para coordinar una reunión y diseñar un plan a medida para tu negocio.
            </p>
            <form onSubmit={handleEnviarSolicitudPersonalizada}>
              <div style={{ marginBottom: '1rem' }}>
                <Input
                  label="Nombre Completo"
                  name="nombre"
                  value={formularioPersonalizado.nombre}
                  onChange={handleChangeFormulario}
                  required
                  disabled={loading}
                  fullWidth
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formularioPersonalizado.email}
                  onChange={handleChangeFormulario}
                  required
                  disabled={loading}
                  fullWidth
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <Input
                  label="Teléfono"
                  name="telefono"
                  value={formularioPersonalizado.telefono}
                  onChange={handleChangeFormulario}
                  disabled={loading}
                  fullWidth
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Mensaje</label>
                <textarea
                  name="mensaje"
                  className="form-control"
                  value={formularioPersonalizado.mensaje}
                  onChange={handleChangeFormulario}
                  required
                  disabled={loading}
                  rows={5}
                  placeholder="Cuéntanos sobre tu negocio y qué necesitas..."
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
                fullWidth
              >
                Enviar Solicitud y Continuar
              </Button>
            </form>
          </Card>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Plan Gratuito */}
            {planGratis && (
              <Card 
                className={`plan-card ${planSeleccionado?.id === planGratis.id ? 'selected' : ''}`}
                onClick={() => handleSeleccionarPlan(planGratis)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '0.5rem' }}>Plan Gratuito</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    $0
                  </div>
                  <ul style={{ textAlign: 'left', marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
                    <li>1 usuario</li>
                    <li>400 ventas mensuales</li>
                    <li>3 meses de prueba gratis</li>
                    <li>Después del período, solo lectura</li>
                  </ul>
                  <Button
                    variant={planSeleccionado?.id === planGratis.id ? 'primary' : 'outline'}
                    fullWidth
                  >
                    {planSeleccionado?.id === planGratis.id ? '✓ Seleccionado' : 'Seleccionar'}
                  </Button>
                </div>
              </Card>
            )}

            {/* Plan Pago */}
            {planPago && (
              <Card 
                className={`plan-card ${planSeleccionado?.id === planPago.id ? 'selected' : ''}`}
                onClick={() => handleSeleccionarPlan(planPago)}
                style={{ cursor: 'pointer', border: '2px solid var(--primary)' }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    backgroundColor: 'var(--primary)', 
                    color: 'white', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-small)',
                    marginBottom: '0.5rem',
                    display: 'inline-block'
                  }}>
                    MÁS POPULAR
                  </div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Plan Pago</h3>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                      ${formatearPrecioARS(planPago.precio_mensual)}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>/mes</span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-small)', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    o ${formatearPrecioARS(planPago.precio_anual)}/año
                  </div>
                  <ul style={{ textAlign: 'left', marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
                    <li>1 usuario principal</li>
                    <li>Hasta 10 usuarios adicionales</li>
                    <li>Ventas ilimitadas</li>
                    <li>Compras ilimitadas</li>
                    <li>Productos ilimitados</li>
                    <li>${formatearPrecioARS(planPago.precio_usuario_adicional)}/año por usuario extra</li>
                  </ul>
                  <Button
                    variant={planSeleccionado?.id === planPago.id ? 'primary' : 'outline'}
                    fullWidth
                  >
                    {planSeleccionado?.id === planPago.id ? '✓ Seleccionado' : 'Seleccionar'}
                  </Button>
                </div>
              </Card>
            )}

            {/* Plan Personalizado */}
            {planPersonalizado && (
              <Card 
                className={`plan-card ${planSeleccionado?.id === planPersonalizado.id ? 'selected' : ''}`}
                onClick={() => handleSeleccionarPlan(planPersonalizado)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '0.5rem' }}>Plan Personalizado</h3>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    A medida
                  </div>
                  <ul style={{ textAlign: 'left', marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
                    <li>Para negocios grandes</li>
                    <li>Usuarios ilimitados</li>
                    <li>Registros ilimitados</li>
                    <li>Reunión personalizada</li>
                    <li>Soporte prioritario</li>
                  </ul>
                  <Button
                    variant={planSeleccionado?.id === planPersonalizado.id ? 'primary' : 'outline'}
                    fullWidth
                  >
                    {planSeleccionado?.id === planPersonalizado.id ? '✓ Seleccionado' : 'Solicitar'}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {!mostrarFormularioPersonalizado && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Button
              variant="primary"
              size="lg"
              onClick={handleContinuar}
              disabled={!planSeleccionado || loading}
            >
              Continuar
            </Button>
            {planSeleccionado?.nombre === 'basico' && !terminosAceptados && (
              <p style={{ 
                marginTop: '1rem', 
                fontSize: 'var(--font-size-small)', 
                color: 'var(--text-secondary)' 
              }}>
                * Deberás aceptar los términos y condiciones antes de continuar
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal de Términos y Condiciones para planes de pago */}
      {planSeleccionado?.nombre === 'basico' && (
        <TerminosYCondiciones
          isOpen={mostrarTerminos}
          onClose={() => {
            // No permitir cerrar sin aceptar para planes de pago
            if (!terminosAceptados) {
              setError('Debes aceptar los términos y condiciones para continuar con el plan de pago')
            }
          }}
          onAccept={handleTerminosAceptados}
          required={true}
          showVersion={true}
        />
      )}
    </div>
  )
}

export default SelectPlan

