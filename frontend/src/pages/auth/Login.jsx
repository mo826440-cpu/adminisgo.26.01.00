// Página de Login
import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { signIn } from '../../services/auth'
import { getComercio } from '../../services/comercio'
import { useAuthContext } from '../../context/AuthContext'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loading: authLoading } = useAuthContext()
  const mensajeExito = location.state?.message
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Si ya está autenticado, verificar si tiene comercio y redirigir apropiadamente
  useEffect(() => {
    const verificarYRedirigir = async () => {
      if (!authLoading && isAuthenticated) {
        try {
          const { data: comercio, error } = await getComercio()
          
          if (comercio) {
            // Tiene comercio, redirigir al dashboard
            navigate('/dashboard', { replace: true })
          } else {
            // No tiene comercio, redirigir a selección de plan
            navigate('/auth/select-plan', { replace: true })
          }
        } catch (err) {
          // Error al verificar, redirigir a selección de plan
          console.error('Error al verificar comercio:', err)
          navigate('/auth/select-plan', { replace: true })
        }
      }
    }

    verificarYRedirigir()
  }, [isAuthenticated, authLoading, navigate])

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p>Cargando...</p>
      </div>
    )
  }

  // Si ya está autenticado, no mostrar el formulario (el useEffect redirigirá)
  if (isAuthenticated) {
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await signIn(email, password)

    if (error) {
      setError(error.message || 'Error al iniciar sesión')
      setLoading(false)
      return
    }

    // Verificar si tiene comercio antes de redirigir
    try {
      const { data: comercio, error: comercioError } = await getComercio()
      
      // Log para depuración
      console.log('[Login] Verificando comercio después de login:', { comercio, error: comercioError })
      
      if (comercio) {
        // Tiene comercio, redirigir al dashboard
        console.log('[Login] Usuario tiene comercio, redirigiendo a dashboard')
        navigate('/dashboard', { replace: true })
      } else {
        // No tiene comercio, redirigir a selección de plan
        console.log('[Login] Usuario NO tiene comercio, redirigiendo a select-plan')
        navigate('/auth/select-plan', { replace: true })
      }
    } catch (err) {
      // Error al verificar, redirigir a selección de plan
      console.error('[Login] Excepción al verificar comercio:', err)
      navigate('/auth/select-plan', { replace: true })
    }
    
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-secondary)',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'var(--bg-primary)',
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Iniciar Sesión</h1>

        {mensajeExito && (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            {mensajeExito}
          </div>
        )}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">
              Email
            </label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="tu@email.com"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">
              Contraseña
            </label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/auth/forgot-password" style={{ fontSize: 'var(--font-size-small)' }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid #dee2e6' }}>
          <p style={{ fontSize: 'var(--font-size-small)', marginBottom: '0.5rem' }}>
            ¿No tienes cuenta?
          </p>
          <Link to="/auth/register" className="btn btn-outline btn-block">
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login

