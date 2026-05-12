// Landing pública (visitantes / registro incompleto) — la navegación por módulos está en /inicio dentro del sistema
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
  const [tieneComercio, setTieneComercio] = useState(null)

  useEffect(() => {
    document.title = 'AdminisGo · Inicio'
  }, [])

  useEffect(() => {
    const errorParam = searchParams.get('error')
    const errorCode = searchParams.get('error_code')

    if (errorParam || errorCode) {
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
      if (authLoading || loadingPermisos) return

      if (isAuthenticated) {
        setVerificandoComercio(true)
        try {
          const { data: comercio } = await getComercio()
          setTieneComercio(!!comercio)

          if (comercio) {
            const dest = firstNavigatePath('/')
            if (dest !== '/') {
              navigate(dest, { replace: true })
            }
          }
        } catch (err) {
          console.error('Error al verificar comercio:', err)
          setTieneComercio(false)
        } finally {
          setVerificandoComercio(false)
        }
      } else {
        setTieneComercio(null)
      }
    }

    verificarYRedirigir()
  }, [isAuthenticated, authLoading, loadingPermisos, navigate, searchParams, firstNavigatePath])

  const handleCerrarSesionSinAcceso = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  if (authLoading || verificandoComercio || (isAuthenticated && loadingPermisos)) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <Spinner size="lg" />
      </div>
    )
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
          <div className="landing-cta" style={{ justifyContent: 'center', marginTop: '1rem' }}>
            <Button type="button" variant="outline" size="lg" onClick={() => void handleCerrarSesionSinAcceso()}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      )}

      <section className="landing-hero">
        <div className="landing-container">
          <div className="landing-hero-content">
            <h1 className="landing-title">AdminisGo</h1>
            <p className="landing-subtitle">Sistema integral de gestión para tu comercio</p>
            <p className="landing-description">
              Gestión de ventas, inventario, compras y clientes en una sola plataforma. Simple, rápido y desde cualquier
              dispositivo.
            </p>
            <div className="landing-cta">
              {isAuthenticated ? (
                tieneComercio === false && !sinAccesoNingunModulo ? (
                  <Link to="/auth/select-plan" className="btn btn-primary btn-lg">
                    Continuar con el registro
                  </Link>
                ) : null
              ) : (
                <>
                  <Link to="/auth/register" className="btn btn-primary btn-lg">
                    Comenzar gratis
                  </Link>
                  <Link to="/auth/login" className="btn btn-outline btn-lg">
                    Iniciar sesión
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-container">
          <h2 className="landing-section-title">Funciones principales</h2>
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-icon">💰</div>
              <h3>Punto de venta</h3>
              <p>Ventas rápidas con POS y cobros con varios medios de pago.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">📦</div>
              <h3>Inventario</h3>
              <p>Productos, stock y alertas para no quedarte sin mercadería.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">🛒</div>
              <h3>Compras</h3>
              <p>Órdenes a proveedores y seguimiento de pagos.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">👥</div>
              <h3>Clientes</h3>
              <p>Base de clientes y seguimiento comercial.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">📊</div>
              <h3>Reportes</h3>
              <p>Indicadores para decidir con datos.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">📱</div>
              <h3>En la nube</h3>
              <p>Acceso web responsive; podés instalarla como PWA.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-cta-section">
        <div className="landing-container">
          <h2>¿Listo para comenzar?</h2>
          <p>Creá tu cuenta o ingresá para abrir el panel de navegación en AdminisGo.</p>
          <div className="landing-cta">
            {!isAuthenticated ? (
              <>
                <Link to="/auth/register" className="btn btn-primary btn-lg">
                  Crear cuenta
                </Link>
                <Link to="/auth/login" className="btn btn-outline btn-lg">
                  Ya tengo cuenta
                </Link>
              </>
            ) : tieneComercio === false && !sinAccesoNingunModulo ? (
              <Link to="/auth/select-plan" className="btn btn-primary btn-lg">
                Completar datos del comercio
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-links">
            <Link to="/terminos">Términos y Condiciones</Link>
            <span className="landing-footer-sep">·</span>
            <Link to="/privacidad">Política de Privacidad</Link>
          </div>
          <p>© {new Date().getFullYear()} AdminisGo. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
