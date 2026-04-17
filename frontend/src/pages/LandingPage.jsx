// Landing Page - Página de Inicio
import { useEffect, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { getComercio } from '../services/comercio'
import { signOut } from '../services/auth'
import { Spinner, Alert, Button } from '../components/common'
import './LandingPage.css'

function LandingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    isAuthenticated,
    loading: authLoading,
    loadingPermisos,
    firstNavigatePath,
    sinAccesoNingunModulo,
  } = useAuthContext()
  const [verificandoComercio, setVerificandoComercio] = useState(false)

  useEffect(() => {
    // Si hay errores de autenticación en la URL, redirigir a /auth/callback para manejarlos
    const errorParam = searchParams.get('error')
    const errorCode = searchParams.get('error_code')
    
    if (errorParam || errorCode) {
      // Construir URL con todos los parámetros de error
      const params = new URLSearchParams()
      if (errorParam) params.set('error', errorParam)
      if (errorCode) params.set('error_code', errorCode)
      const errorDescription = searchParams.get('error_description')
      if (errorDescription) params.set('error_description', errorDescription)
      const email = searchParams.get('email')
      if (email) params.set('email', email)
      
      navigate(`/auth/callback?${params.toString()}`, { replace: true })
      return
    }

    const verificarYRedirigir = async () => {
      // Si está cargando la autenticación, esperar
      if (authLoading || loadingPermisos) return

      // Solo redirigir automáticamente si está autenticado Y tiene comercio
      // Si está autenticado pero NO tiene comercio, mostrar la landing page
      // (el usuario puede continuar con el registro desde ahí)
      if (isAuthenticated) {
        setVerificandoComercio(true)
        try {
          const { data: comercio } = await getComercio()
          
          if (comercio) {
            const dest = firstNavigatePath('/')
            if (dest !== '/') {
              navigate(dest, { replace: true })
            }
          }
          // Si no tiene comercio, NO redirigir - mostrar la landing page
        } catch (err) {
          // Error al verificar, no redirigir - mostrar la landing page
          console.error('Error al verificar comercio:', err)
        } finally {
          setVerificandoComercio(false)
        }
      }
    }

    verificarYRedirigir()
  }, [isAuthenticated, authLoading, loadingPermisos, navigate, searchParams, firstNavigatePath])

  // Mostrar spinner mientras verifica (incluye permisos para no mostrar CTA incorrecta)
  if (authLoading || verificandoComercio || (isAuthenticated && loadingPermisos)) {
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

  // Si está autenticado y tiene comercio, el useEffect ya redirigió
  // Si está autenticado pero no tiene comercio, mostrar la landing page
  // con opciones para continuar el registro

  const handleCerrarSesionSinAcceso = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="landing-page">
      {sinAccesoNingunModulo && (
        <div className="landing-container landing-sin-acceso-wrap">
          <Alert variant="warning" className="landing-sin-acceso-alert">
            <strong>No tenés acceso a ningún módulo del sistema.</strong> Pedile al dueño de tu comercio que habilite
            al menos un permiso para tu rol en <strong>Usuarios → Permisos por rol</strong>. Si cerrás sesión podés
            volver a intentar cuando esté resuelto.
          </Alert>
        </div>
      )}

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-container">
          <div className="landing-hero-content">
            <h1 className="landing-title">
              Adminis Go
            </h1>
            <p className="landing-subtitle">
              Sistema integral de gestión para tu comercio
            </p>
            <p className="landing-description">
              Gestiona ventas, inventario, compras y clientes desde una sola plataforma.
              Simple, rápido y accesible desde cualquier dispositivo.
            </p>
            <div className="landing-cta">
              {isAuthenticated ? (
                sinAccesoNingunModulo ? (
                  <Button type="button" variant="outline" size="lg" onClick={() => void handleCerrarSesionSinAcceso()}>
                    Cerrar sesión
                  </Button>
                ) : (
                  <Link to="/auth/select-plan" className="btn btn-primary btn-lg">
                    Continuar con el Registro
                  </Link>
                )
              ) : (
                <>
                  <Link to="/auth/register" className="btn btn-primary btn-lg">
                    Comenzar Gratis
                  </Link>
                  <Link to="/auth/login" className="btn btn-outline btn-lg">
                    Iniciar Sesión
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <div className="landing-container">
          <h2 className="landing-section-title">Todo lo que necesitas para gestionar tu negocio</h2>
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-icon">💰</div>
              <h3>Punto de Venta (POS)</h3>
              <p>Procesa ventas rápidamente con nuestro sistema de punto de venta intuitivo y eficiente.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">📦</div>
              <h3>Gestión de Inventario</h3>
              <p>Controla tu stock en tiempo real, recibe alertas de productos con stock bajo.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">🛒</div>
              <h3>Gestión de Compras</h3>
              <p>Administra tus órdenes de compra, proveedores y pagos de manera organizada.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">👥</div>
              <h3>CRM de Clientes</h3>
              <p>Mantén un registro completo de tus clientes y su historial de compras.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">📊</div>
              <h3>Reportes y Analytics</h3>
              <p>Visualiza el rendimiento de tu negocio con reportes detallados y métricas clave.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">📱</div>
              <h3>Multiplataforma</h3>
              <p>Accede desde cualquier dispositivo. Funciona en web, móvil y como app instalable (PWA).</p>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="landing-plans">
        <div className="landing-container">
          <h2 className="landing-section-title">Elige el plan que mejor se adapte a tu negocio</h2>
          <div className="landing-plans-grid">
            <div className="landing-plan-card">
              <h3>Plan Gratuito</h3>
              <div className="landing-plan-price">$0<span>/mes</span></div>
              <ul className="landing-plan-features">
                <li>✓ 1 usuario</li>
                <li>✓ 400 ventas mensuales</li>
                <li>✓ 3 meses de prueba gratis</li>
                <li>✓ Funciones básicas</li>
              </ul>
              {isAuthenticated ? (
                <Link to="/auth/select-plan" className="btn btn-outline btn-block">
                  Continuar Registro
                </Link>
              ) : (
                <Link to="/auth/register" className="btn btn-outline btn-block">
                  Comenzar Gratis
                </Link>
              )}
            </div>
            <div className="landing-plan-card landing-plan-featured">
              <div className="landing-plan-badge">Más Popular</div>
              <h3>Plan Pago</h3>
              <div className="landing-plan-price">$25.000,00<span>/mes</span></div>
              <div className="landing-plan-price-alt">o $250.000,00/año</div>
              <ul className="landing-plan-features">
                <li>✓ 1 usuario principal</li>
                <li>✓ Hasta 10 usuarios adicionales</li>
                <li>✓ Ventas ilimitadas</li>
                <li>✓ Compras ilimitadas</li>
                <li>✓ Productos ilimitados</li>
                <li>✓ Soporte prioritario</li>
              </ul>
              {isAuthenticated ? (
                <Link to="/auth/select-plan" className="btn btn-primary btn-block">
                  Continuar Registro
                </Link>
              ) : (
                <Link to="/auth/register" className="btn btn-primary btn-block">
                  Comenzar Ahora
                </Link>
              )}
            </div>
            <div className="landing-plan-card">
              <h3>Plan Personalizado</h3>
              <div className="landing-plan-price">A medida</div>
              <ul className="landing-plan-features">
                <li>✓ Para negocios grandes</li>
                <li>✓ Usuarios ilimitados</li>
                <li>✓ Registros ilimitados</li>
                <li>✓ Reunión personalizada</li>
                <li>✓ Soporte dedicado</li>
              </ul>
              {isAuthenticated ? (
                <Link to="/auth/select-plan" className="btn btn-outline btn-block">
                  Continuar Registro
                </Link>
              ) : (
                <Link to="/auth/register" className="btn btn-outline btn-block">
                  Solicitar Información
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta-section">
        <div className="landing-container">
          <h2>¿Listo para comenzar?</h2>
          <p>Únete a cientos de comercios que ya están gestionando su negocio con Adminis Go</p>
          <div className="landing-cta">
            {isAuthenticated ? (
              <Link to="/auth/select-plan" className="btn btn-primary btn-lg">
                Continuar con el Registro
              </Link>
            ) : (
              <>
                <Link to="/auth/register" className="btn btn-primary btn-lg">
                  Crear Cuenta Gratis
                </Link>
                <Link to="/auth/login" className="btn btn-outline btn-lg">
                  Ya tengo cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-links">
            <Link to="/terminos">Términos y Condiciones</Link>
            <span className="landing-footer-sep">·</span>
            <Link to="/privacidad">Política de Privacidad</Link>
          </div>
          <p>&copy; 2026 Adminis Go. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

