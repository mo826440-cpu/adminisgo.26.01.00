import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut, updatePassword } from '../../services/auth'
import { supabase } from '../../services/supabase'
import { limpiarRecuperacionClave, marcarRecuperacionClave } from '../../utils/accesoSesion'
import AccesoShell from './AccesoShell'
import './AccesoShell.css'

function leerErrorEnlace() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const search = new URLSearchParams(window.location.search)
  return {
    code: hash.get('error_code') || search.get('error_code') || '',
    error: hash.get('error') || search.get('error') || '',
  }
}

function CampoClave({ id, label, value, onChange, visible, onToggle, disabled }) {
  return (
    <div className="acceso__campo">
      <label className="acceso__label" htmlFor={id}>
        {label}
      </label>
      <div className="acceso__clave">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          value={value}
          onChange={onChange}
          required
          minLength={6}
          disabled={disabled}
        />
        <button
          type="button"
          className="acceso__ojo"
          onClick={onToggle}
          aria-pressed={visible}
          aria-label={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
          disabled={disabled}
        >
          <i className={visible ? 'bi bi-eye-slash' : 'bi bi-eye'} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [verConfirmacion, setVerConfirmacion] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const falloInicial = leerErrorEnlace()
  const enlaceInvalidoAlEntrar = Boolean(falloInicial.error || falloInicial.code)
  const [sesionValida, setSesionValida] = useState(enlaceInvalidoAlEntrar ? false : null)
  const [enlaceVencido, setEnlaceVencido] = useState(enlaceInvalidoAlEntrar)

  useEffect(() => {
    if (enlaceInvalidoAlEntrar) {
      limpiarRecuperacionClave()
      return undefined
    }
    marcarRecuperacionClave()

    let activo = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!activo) return
      if (event === 'PASSWORD_RECOVERY' || (session && event !== 'SIGNED_OUT')) {
        setSesionValida(true)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!activo) return
      if (session) setSesionValida(true)
    })

    const timer = window.setTimeout(() => {
      if (!activo) return
      setSesionValida((actual) => {
        if (actual == null) {
          limpiarRecuperacionClave()
          return false
        }
        return actual
      })
    }, 1500)

    return () => {
      activo = false
      subscription.unsubscribe()
      window.clearTimeout(timer)
    }
  }, [enlaceInvalidoAlEntrar])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    const { error: updateError } = await updatePassword(password)
    if (updateError) {
      const texto = (updateError.message || '').toLowerCase()
      if (texto.includes('provider') || texto.includes('identity') || texto.includes('oauth')) {
        setError('Esta cuenta entra con Google. Volvé al acceso y usá “Continuar con Google”.')
      } else if (texto.includes('expired') || texto.includes('invalid') || texto.includes('session')) {
        setEnlaceVencido(true)
        setSesionValida(false)
      } else {
        setError('No se pudo guardar la contraseña. Pedí un enlace nuevo.')
      }
      setLoading(false)
      return
    }
    limpiarRecuperacionClave()
    await signOut()
    navigate('/', {
      replace: true,
      state: { message: 'Contraseña actualizada. Ingresá con la nueva contraseña.' },
    })
  }

  if (sesionValida == null) {
    return (
      <AccesoShell>
        <h2>Nueva contraseña</h2>
        <p className="acceso__intro">Estamos comprobando el enlace...</p>
      </AccesoShell>
    )
  }

  if (!sesionValida || enlaceVencido) {
    return (
      <AccesoShell>
        <h2>Enlace no disponible</h2>
        <p className="acceso__alerta acceso__alerta--error" role="alert">
          El enlace es inválido o ya venció. Pedí uno nuevo desde “Olvidé mi contraseña”.
        </p>
        <Link className="acceso__ingresar" to="/auth/forgot-password">
          Pedir un enlace nuevo
        </Link>
        <p className="acceso__ayuda">
          <Link className="acceso__volver" to="/">
            Volver al acceso
          </Link>
        </p>
      </AccesoShell>
    )
  }

  return (
    <AccesoShell>
      <h2>Nueva contraseña</h2>
      <p className="acceso__intro">Elegí una contraseña de al menos 6 caracteres y confirmala.</p>
      {error && (
        <p className="acceso__alerta acceso__alerta--error" role="alert">
          {error}
        </p>
      )}
      <form className="acceso__form" onSubmit={handleSubmit} aria-busy={loading}>
        <CampoClave
          id="clave-nueva"
          label="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          visible={verClave}
          onToggle={() => setVerClave((valor) => !valor)}
          disabled={loading}
        />
        <CampoClave
          id="clave-confirmar"
          label="Confirmar contraseña"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          visible={verConfirmacion}
          onToggle={() => setVerConfirmacion((valor) => !valor)}
          disabled={loading}
        />
        <button type="submit" className="acceso__ingresar" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
      <p className="acceso__ayuda">
        <Link className="acceso__volver" to="/">
          Volver al acceso
        </Link>
      </p>
    </AccesoShell>
  )
}

export default ResetPassword
