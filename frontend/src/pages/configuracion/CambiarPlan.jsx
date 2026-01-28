// Página para Cambiar de Plan
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Alert, Spinner, Badge } from '../../components/common'
import { getPlanes } from '../../services/planes'
import { actualizarPlanComercio } from '../../services/comercio'
import { getEstadoSuscripcion } from '../../services/planes'
import { useAuthContext } from '../../context/AuthContext'
import './CambiarPlan.css'

function CambiarPlan() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuthContext()
  const [planes, setPlanes] = useState([])
  const [planActual, setPlanActual] = useState(null)
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

        // Cargar plan actual
        const { data: suscripcionData, error: suscripcionError } = await getEstadoSuscripcion()
        if (suscripcionError) {
          console.error('Error al obtener suscripción:', suscripcionError)
        } else if (suscripcionData?.plan) {
          setPlanActual(suscripcionData.plan)
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
  }, [authLoading, user])

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

  const handleCambiarPlan = async (planId, planNombre) => {
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
                          ${plan.precio_mensual?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-secondary" style={{ fontSize: '0.9rem' }}>
                          por mes
                        </div>
                        {plan.precio_anual && (
                          <div className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            o ${plan.precio_anual.toFixed(2)}/año
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
                        handleCambiarPlan(plan.id, plan.nombre)
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
                          ? 'Actualizando...' 
                          : 'Seleccionar Plan'
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
