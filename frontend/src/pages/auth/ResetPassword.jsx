// Página para establecer nueva contraseña (llegás acá desde el enlace del email)
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { updatePassword } from '../../services/auth'
import { supabase } from '../../services/supabase'

function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sesionValida, setSesionValida] = useState(null)

  // Al montar, Supabase ya procesa el hash de la URL (access_token, type=recovery).
  // Verificamos si hay sesión de recuperación.
  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSesionValida(true)
      } else {
        setSesionValida(false)
      }
    }
    verificarSesion()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmarPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)

    if (error) {
      setError(error.message || 'Error al actualizar la contraseña')
      return
    }

    navigate('/auth/login', {
      replace: true,
      state: { message: 'Contraseña actualizada. Iniciá sesión con tu nueva contraseña.' }
    })
  }

  // Cargando o sin sesión (enlace inválido o expirado)
  if (sesionValida === null) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-secondary)',
        padding: '1rem'
      }}>
        <p>Cargando...</p>
      </div>
    )
  }

  if (sesionValida === false) {
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
          <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
            El enlace es inválido o expiró. Solicitá uno nuevo desde "¿Olvidaste tu contraseña?" en el login.
          </div>
          <Link to="/auth/login" className="btn btn-primary btn-block">
            Ir al inicio de sesión
          </Link>
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
        maxWidth: '400px',
        backgroundColor: 'var(--bg-primary)',
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <h1 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Nueva contraseña</h1>
        <p style={{
          fontSize: 'var(--font-size-small)',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          Ingresá tu nueva contraseña (mínimo 6 caracteres).
        </p>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Nueva contraseña</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Confirmar contraseña</label>
            <input
              type="password"
              className="form-control"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/auth/login" style={{ fontSize: 'var(--font-size-small)' }}>
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
