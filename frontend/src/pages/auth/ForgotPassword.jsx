import { useState } from 'react'
import { Link } from 'react-router-dom'
import { resetPassword } from '../../services/auth'
import AccesoShell from './AccesoShell'
import './AccesoShell.css'

function esFalloDeRed(error) {
  const texto = (error?.message || '').toLowerCase()
  return (
    texto.includes('rate') ||
    texto.includes('too many') ||
    texto.includes('network') ||
    texto.includes('fetch') ||
    texto.includes('failed to fetch')
  )
}

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const { error: resetError } = await resetPassword(email.trim())
    if (resetError && esFalloDeRed(resetError)) {
      setError('No se pudo enviar el correo en este momento. Intentá más tarde.')
      setLoading(false)
      return
    }
    setEnviado(true)
    setLoading(false)
  }

  return (
    <AccesoShell>
      <h2>Recuperar contraseña</h2>
      <p className="acceso__intro">
        Si el correo está registrado, vas a recibir un enlace para elegir una contraseña nueva.
      </p>

      {enviado ? (
        <p className="acceso__alerta acceso__alerta--ok" role="status">
          Si ese correo está registrado, vas a recibir un enlace para restablecer la contraseña.
          Revisá la bandeja de entrada y el spam. Si tu cuenta entra solo con Google, usá
          “Continuar con Google” en el acceso.
        </p>
      ) : (
        <form className="acceso__form" onSubmit={handleSubmit} aria-busy={loading}>
          {error && (
            <p className="acceso__alerta acceso__alerta--error" role="alert">
              {error}
            </p>
          )}
          <label className="acceso__campo">
            <span>Correo electrónico</span>
            <input
              className="acceso__input"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="tu@correo.com"
            />
          </label>
          <button type="submit" className="acceso__ingresar" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
          <p className="acceso__nota">
            Si tu cuenta entra solo con Google, no hace falta una contraseña: volvé al acceso y
            usá “Continuar con Google”.
          </p>
        </form>
      )}

      <p className="acceso__ayuda">
        <Link className="acceso__volver" to="/">
          Volver al acceso
        </Link>
      </p>
    </AccesoShell>
  )
}

export default ForgotPassword
