// Página para Cambiar de Plan
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Alert, Spinner, Badge } from '../../components/common'
import { getPlanes } from '../../services/planes'
import { actualizarPlanComercio, getComercio } from '../../services/comercio'
import { getEstadoSuscripcion } from '../../services/planes'
import { crearPreferenciaPago } from '../../services/mercadopago'
import { useAuthContext } from '../../context/AuthContext'
import './CambiarPlan.css'

function CambiarPlan() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading } = useAuthContext()
  const [planes, setPlanes] = useState([])
  const [planActual, setPlanActual] = useState(null)
  const [comercio, setComercio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true)
      try {
        // Cargar planes disponibles
        const { data: planesData, error: planesError } = await getPlanes()
        if (planesError) throw planesError

        // Filtrar solo los planes que queremos mostrar
        const planesFiltrados = planesData?.filter(p => 
          ['gratis', 'basico', 'personalizado'].includes(p.nombre)
        ) || []
        
        setPlanes(planesFiltrados)

        // Cargar comercio
        const { data: comercioData, error: comercioError } = await getComercio()
        if (comercioError) {
          console.error('Error al obtener comercio:', comercioError)
        } else {
          setComercio(comercioData)
        }

        // Cargar plan actual
        const { data: suscripcionData, error: suscripcionError } = await getEstadoSuscripcion()
        if (suscripcionError) {
          console.error('Error al obtener suscripción:', suscripcionError)
        } else if (suscripcionData?.plan) {
          setPlanActual(suscripcionData.plan)
        }

        // Verificar si viene de retorno de pago
        const status = searchParams.get('status')
        const payment_id = searchParams.get('payment_id')
        if (status === 'approved' && payment_id) {
          setSuccessMessage('¡Pago aprobado! Tu plan ha sido actualizado exitosamente.')
          // Recargar datos después de pago exitoso
          setTimeout(() => {
            window.location.href = '/configuracion/cambiar-plan'
          }, 3000)
        } else if (status === 'rejected') {
          setError('El pago fue rechazado. Por favor, intenta nuevamente.')
        } else if (status === 'pending') {
          setError('El pago está pendiente. Te notificaremos cuando se apruebe.')
        }
      } catch (err) {
        setError(err.message || 'Error al cargar los planes')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && user) {
      cargarDatos()
    }
  }, [authLoading, user, searchParams])

  const getNombrePlan = (tipo) => {
    const nombres = {
      'gratis': 'Plan Gratuito',
      'pago': 'Plan Pago',
      'basico': 'Plan Pago',
      'personalizado': 'Plan Personalizado'
    }
    return nombres[tipo] || tipo || 'Sin plan'
  }

  const getColorPlan = (tipo) => {
    const colores = {
      'gratis': 'info',
      'pago': 'primary',
      'basico': 'primary',
      'personalizado': 'warning'
    }
    return colores[tipo] || 'secondary'
  }

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

  const handleCambiarPlan = async (planId, planNombre, planData) => {
    // Si es plan gratis, actualizar directamente sin pago
    if (planNombre === 'gratis') {
      if (!window.confirm(`¿Estás seguro de que deseas cambiar a ${getNombrePlan(planNombre)}?`)) {
        return
      }

      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      try {
        const { data, error: updateError } = await actualizarPlanComercio(planId)
        
        if (updateError) throw updateError

        setSuccessMessage(`Plan actualizado exitosamente a ${getNombrePlan(planNombre)}`)
        
        // Recargar plan actual
        const { data: suscripcionData } = await getEstadoSuscripcion()
        if (suscripcionData?.plan) {
          setPlanActual(suscripcionData.plan)
        }

        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      } catch (err) {
        setError(err.message || 'Error al actualizar el plan')
      } finally {
        setSaving(false)
      }
      return
    }

    // Si es plan de pago, crear preferencia de Mercado Pago
    if (!comercio || !comercio.id) {
      setError('No se pudo obtener la información del comercio')
      return
    }

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Determinar monto y tipo de pago
      const monto = planData.precio_mensual || 0
      const tipoPago = 'mensual' // Por ahora solo mensual, luego se puede agregar anual

      // Crear preferencia de pago
      const { data: preferenciaData, error: preferenciaError } = await crearPreferenciaPago({
        planId: planId,
        planNombre: planNombre,
        monto: monto,
        tipoPago: tipoPago,
        comercioId: comercio.id,
        emailUsuario: user?.email
      })

      if (preferenciaError) throw preferenciaError

      // Usar sandbox_init_point si está disponible (modo test), sino usar init_point
      const checkoutUrl = preferenciaData?.sandboxInitPoint || preferenciaData?.initPoint
      
      if (checkoutUrl) {
        // Redirigir a Mercado Pago Checkout
        window.location.href = checkoutUrl
      } else {
        throw new Error('No se pudo obtener la URL de pago')
      }
    } catch (err) {
      console.error('Error al crear preferencia de pago:', err)
      setError(err.message || 'Error al procesar el pago. Por favor, intenta nuevamente.')
      setSaving(false)
    }
  }

  if (loading || authLoading) {
    return (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando planes...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container" style={{ padding: '2rem 0', maxWidth: '900px', margin: '0 auto' }}>
        <Card>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>Cambiar Plan</h1>
            <p className="text-secondary">
              Selecciona el plan que mejor se adapte a las necesidades de tu negocio.
            </p>
          </div>

          {planActual && (
            <Alert variant="info" style={{ marginBottom: '1.5rem' }}>
              <strong>Plan actual:</strong> {getNombrePlan(planActual.tipo)}
            </Alert>
          )}

          {error && (
            <Alert variant="danger" dismissible onDismiss={() => setError(null)} style={{ marginBottom: '1.5rem' }}>
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success" style={{ marginBottom: '1.5rem' }}>
              {successMessage}
            </Alert>
          )}

          <div className="planes-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '1.5rem',
            marginTop: '2rem'
          }}>
            {planes.map((plan) => {
              const esPlanActual = planActual && planActual.id === plan.id
              const esGratis = plan.nombre === 'gratis'
              const esPersonalizado = plan.nombre === 'personalizado'

              return (
                <Card 
                  key={plan.id} 
                  className={`plan-card ${esPlanActual ? 'plan-actual' : ''}`}
                  style={{
                    border: esPlanActual ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    position: 'relative'
                  }}
                >
                  {esPlanActual && (
                    <Badge variant="success" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                      Plan Actual
                    </Badge>
                  )}

                  <div style={{ marginBottom: '1rem' }}>
                    <h2 style={{ marginBottom: '0.5rem' }}>{getNombrePlan(plan.tipo_plan || plan.nombre)}</h2>
                    {plan.descripcion && (
                      <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
                        {plan.descripcion}
                      </p>
                    )}
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    {esGratis ? (
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        Gratis
                      </div>
                    ) : esPersonalizado ? (
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                        Contactar
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                          ${formatearPrecioARS(plan.precio_mensual)}
                        </div>
                        <div className="text-secondary" style={{ fontSize: '0.9rem' }}>
                          por mes
                        </div>
                        {plan.precio_anual != null && plan.precio_anual !== '' && (
                          <div className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            o ${formatearPrecioARS(plan.precio_anual)}/año
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {plan.limite_usuarios !== null && (
                        <li style={{ marginBottom: '0.5rem' }}>
                          👥 {plan.limite_usuarios} usuario{plan.limite_usuarios > 1 ? 's' : ''}
                        </li>
                      )}
                      {plan.limite_usuarios === null && (
                        <li style={{ marginBottom: '0.5rem' }}>
                          👥 Usuarios ilimitados
                        </li>
                      )}
                      {plan.limite_ventas_mensuales !== null && (
                        <li style={{ marginBottom: '0.5rem' }}>
                          💰 {plan.limite_ventas_mensuales} ventas/mes
                        </li>
                      )}
                      {plan.limite_ventas_mensuales === null && (
                        <li style={{ marginBottom: '0.5rem' }}>
                          💰 Ventas ilimitadas
                        </li>
                      )}
                      {plan.limite_productos !== null && (
                        <li style={{ marginBottom: '0.5rem' }}>
                          📦 {plan.limite_productos} productos
                        </li>
                      )}
                      {plan.limite_productos === null && (
                        <li style={{ marginBottom: '0.5rem' }}>
                          📦 Productos ilimitados
                        </li>
                      )}
                      {plan.periodo_gratis_meses && (
                        <li style={{ marginBottom: '0.5rem' }}>
                          ⏰ {plan.periodo_gratis_meses} meses gratis
                        </li>
                      )}
                    </ul>
                  </div>

                  <Button
                    variant={esPlanActual ? 'outline' : 'primary'}
                    onClick={() => {
                      if (esPersonalizado) {
                        navigate('/configuracion')
                        alert('Para solicitar un plan personalizado, por favor contacta con nuestro equipo de ventas.')
                      } else if (!esPlanActual) {
                        handleCambiarPlan(plan.id, plan.nombre, plan)
                      }
                    }}
                    disabled={esPlanActual || saving}
                    fullWidth
                  >
                    {esPlanActual 
                      ? 'Plan Actual' 
                      : esPersonalizado 
                        ? 'Contactar' 
                        : saving 
                          ? (esGratis ? 'Actualizando...' : 'Redirigiendo a Mercado Pago...')
                          : esGratis
                            ? 'Seleccionar Plan'
                            : 'Pagar con Mercado Pago'
                    }
                  </Button>
                </Card>
              )
            })}
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Volver al Dashboard
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  )
}

export default CambiarPlan
