// Página de Registro - Paso 1: Email y Contraseña
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp } from '../../services/auth'
import { useAuthContext } from '../../context/AuthContext'

function Register() {
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuthContext()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Si ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
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
    setSuccess(false)

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const { data, error: authError } = await signUp(
        formData.email, 
        formData.password
      )

      if (authError) {
        throw authError
      }

      setSuccess(true)
      setLoading(false)
    } catch (err) {
      setError(err.message || 'Error al registrar usuario')
      setLoading(false)
    }
  }

  if (success) {
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
          maxWidth: '450px',
          backgroundColor: 'var(--bg-primary)',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center'
        }}>
          <div className="alert alert-success" style={{ 
            backgroundColor: '#d4edda', 
            borderColor: '#c3e6cb',
            color: '#155724',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem'
          }}>
            <strong style={{ color: '#155724', display: 'block', marginBottom: '0.5rem' }}>✅ ¡Email enviado!</strong>
            <p style={{ marginTop: '0.5rem', marginBottom: '0.5rem', color: '#155724' }}>
              Hemos enviado un email de confirmación a <strong style={{ color: '#155724' }}>{formData.email}</strong>
            </p>
            <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: 'var(--font-size-small)', color: '#155724' }}>
              Por favor, revisa tu bandeja de entrada y haz clic en el enlace para confirmar tu cuenta.
            </p>
            <p style={{ marginTop: '1rem', marginBottom: 0, fontSize: 'var(--font-size-small)', color: '#155724' }}>
              Una vez confirmado el email, serás redirigido para elegir tu plan y completar el registro de tu comercio.
            </p>
          </div>
          
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #dee2e6' }}>
            <Link to="/auth/login" className="btn btn-outline btn-block">
              Volver al Inicio de Sesión
            </Link>
          </div>
        </div>
      </div>
    )
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
        maxWidth: '450px',
        backgroundColor: 'var(--bg-primary)',
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Crear Cuenta</h1>
        <p style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: 'var(--font-size-small)', color: 'var(--text-secondary)' }}>
          Paso 1 de 2: Confirma tu email
        </p>

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
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="tu@email.com"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: '0.25rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'} style={{ fontSize: '1.25rem' }} />
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">
              Confirmar Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Repite la contraseña"
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: '0.25rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <i className={showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'} style={{ fontSize: '1.25rem' }} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar Email de Confirmación'}
          </button>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid #dee2e6' }}>
          <p style={{ fontSize: 'var(--font-size-small)', marginBottom: '0.5rem' }}>
            ¿Ya tienes cuenta?
          </p>
          <Link to="/auth/login" className="btn btn-outline btn-block">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register
