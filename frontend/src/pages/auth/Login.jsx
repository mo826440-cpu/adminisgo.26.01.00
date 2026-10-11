import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { signIn, signInWithGoogle } from '../../services/auth'
import { consumirAvisoAcceso, hayRecuperacionClave } from '../../utils/accesoSesion'
import AccesoShell from './AccesoShell'
import './AccesoShell.css'

function mensajeCredenciales(error) {
  const texto = (error?.message || '').toLowerCase()
  if (texto.includes('invalid') || texto.includes('credential')) {
    return 'Correo o contraseña incorrectos.'
  }
  if (texto.includes('not confirmed') || texto.includes('confirm')) {
    return 'Tenés que confirmar el correo antes de ingresar.'
  }
  if (texto.includes('provider') || texto.includes('google') || texto.includes('oauth')) {
    return 'No se pudo iniciar el acceso con Google. Revisá la configuración del proveedor o ingresá con tu correo.'
  }
  return 'No se pudo iniciar sesión. Intentá de nuevo.'
}

function IconoGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.61z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.16.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}

function Login() {
  const location = useLocation()
  const {
    isAuthenticated,
    usuario,
    loading: authLoading,
    loadingPermisos,
    perfilError,
    firstNavigatePath,
    avisoAcceso,
    establecerAvisoAcceso,
  } = useAuthContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(() => location.state?.errorAcceso || consumirAvisoAcceso())
  const [aviso, setAviso] = useState(location.state?.message || null)

  if (authLoading || loadingPermisos || (isAuthenticated && !usuario && !perfilError)) {
    return (
      <div className="acceso" style={{ display: 'grid', placeItems: 'center' }}>
        <p>Cargando...</p>
      </div>
    )
  }

  if (hayRecuperacionClave() || window.location.hash.includes('type=recovery')) {
    return <Navigate to="/reset-password" replace />
  }

  if (isAuthenticated && usuario) {
    const dest = firstNavigatePath('/')
    return <Navigate to={dest && dest !== '/' ? dest : '/ventas'} replace />
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError(null)
    establecerAvisoAcceso(null)
    const { error: oauthError } = await signInWithGoogle()
    if (oauthError) {
      setError(mensajeCredenciales(oauthError))
      setLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setAviso(null)
    establecerAvisoAcceso(null)
    const { error: signError } = await signIn(email.trim(), password)
    if (signError) {
      setError(mensajeCredenciales(signError))
      setLoading(false)
    }
  }

  const errorVisible = error || avisoAcceso
  const ocupado = loading && !errorVisible

  return (
    <AccesoShell>
      <h2>Bienvenido al equipo</h2>
      <p className="acceso__intro">Ingresá al sistema de Kiosco Alien’s</p>

      {aviso && (
        <p className="acceso__alerta acceso__alerta--ok" role="status">
          {aviso}
        </p>
      )}
      {errorVisible && (
        <p className="acceso__alerta acceso__alerta--error" role="alert">
          {errorVisible}
        </p>
      )}

      <button type="button" className="acceso__google" onClick={handleGoogle} disabled={ocupado}>
        <IconoGoogle />
        {ocupado ? 'Conectando...' : 'Continuar con Google'}
      </button>

      <div className="acceso__separa">o ingresá con tus datos</div>

      <form className="acceso__form" onSubmit={handleSubmit} aria-busy={ocupado}>
        <label className="acceso__campo">
          <span>Correo electrónico</span>
          <input
            className="acceso__input"
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={ocupado}
            placeholder="tu@correo.com"
          />
        </label>

        <div className="acceso__campo">
          <label className="acceso__label" htmlFor="acceso-clave">
            Contraseña
          </label>
          <div className="acceso__clave">
            <input
              id="acceso-clave"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={ocupado}
            />
            <button
              type="button"
              className="acceso__ojo"
              onClick={() => setShowPassword((valor) => !valor)}
              aria-pressed={showPassword}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              disabled={ocupado}
            >
              <i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'} aria-hidden="true" />
            </button>
          </div>
        </div>

        <button type="submit" className="acceso__ingresar" disabled={ocupado}>
          {ocupado ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <div className="acceso__links">
        <Link to="/auth/forgot-password">Olvidé mi contraseña</Link>
        <Link to="/auth/olvide-usuario">Olvidé mi usuario</Link>
      </div>
      <p className="acceso__ayuda">¿Necesitás acceso? Contactá al administrador</p>
    </AccesoShell>
  )
}

export default Login
