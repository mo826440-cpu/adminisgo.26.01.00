import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { signOut } from '../../services/auth'

/** Estado de sesión y menú de cuenta dentro del encabezado del panel. */
function InicioHeroUserActions() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const onDoc = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleLogout = async () => {
    setOpen(false)
    await signOut()
    navigate('/', { replace: true })
  }

  const signedIn = Boolean(user)

  return (
    <div className="inicio-app-hero__user-actions" ref={rootRef}>
      {signedIn ? (
        <span className="inicio-app-hero__sync">
          <span className="inicio-app-hero__sync-dot" aria-hidden />
          Sincronizado
        </span>
      ) : null}
      {signedIn ? <span className="inicio-app-hero__user-divider" aria-hidden /> : null}
      <div className={`inicio-app-hero__user-menu-wrap${open ? ' is-open' : ''}`}>
        <button
          type="button"
          className="inicio-app-hero__user-chip"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="menu"
          title={user?.email || undefined}
        >
          <span className="inicio-app-hero__user-avatar" aria-hidden>
            <i className="bi bi-person-fill" />
          </span>
          <span className="inicio-app-hero__user-email">{user?.email || '—'}</span>
          <i className="bi bi-chevron-down inicio-app-hero__user-chev" aria-hidden />
        </button>
        {open ? (
          <div className="inicio-app-hero__user-menu" role="menu">
            <button
              type="button"
              className="inicio-app-hero__user-menu-item"
              role="menuitem"
              onClick={() => void handleLogout()}
            >
              <i className="bi bi-box-arrow-right" aria-hidden />
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default InicioHeroUserActions
