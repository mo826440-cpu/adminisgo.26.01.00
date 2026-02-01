// Página "Olvidé mi contraseña" - Solicitar enlace de recuperación
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { resetPassword } from '../../services/auth'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await resetPassword(email)

    if (error) {
      setError(error.message || 'Error al enviar el enlace')
      setLoading(false)
      return
    }

    setEnviado(true)
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
        <h1 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Recuperar contraseña</h1>
        <p style={{
          fontSize: 'var(--font-size-small)',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          Ingresá tu email y te enviamos un enlace para restablecer tu contraseña.
        </p>

        {enviado ? (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            Si ese email está registrado, vas a recibir un enlace para restablecer tu contraseña. Revisá tu bandeja de entrada y también la carpeta de spam.
          </div>
        ) : (
          <>
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Email</label>
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

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
          </>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/auth/login" style={{ fontSize: 'var(--font-size-small)' }}>
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
