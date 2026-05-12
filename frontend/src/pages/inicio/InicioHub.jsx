import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Spinner } from '../../components/common'
import { useAuthContext } from '../../context/AuthContext'
import { buildInicioNavCards } from '../../utils/inicioNavCards'
import InicioHeroUserActions from './InicioHeroUserActions'
import './InicioApp.css'

function InicioHub() {
  const { loadingPermisos, sinAccesoNingunModulo, isAdmin, puedeModulo } = useAuthContext()

  useEffect(() => {
    document.title = 'AdminisGo · Inicio'
  }, [])

  const navCards = useMemo(() => buildInicioNavCards(puedeModulo, isAdmin), [puedeModulo, isAdmin])

  if (loadingPermisos) {
    return (
      <div className="inicio-hub-page lh-root">
        <div className="inicio-app-loading">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="inicio-hub-page lh-root">
      <div className="inicio-hub-page__inner">
        {sinAccesoNingunModulo && (
          <div className="lh-sin-acceso">
            <Alert variant="warning">
              <strong>No tenés acceso a ningún módulo del sistema.</strong> Pedile al dueño de tu comercio que
              habilite al menos un permiso para tu rol en <strong>Usuarios → Permisos por rol</strong>.
            </Alert>
          </div>
        )}

        <header className="inicio-app-hero lh-glass-panel">
          <div className="inicio-app-hero__head">
            <div className="lh-brand-row">
              <div className="lh-logo-slot" aria-hidden>
                <i className="bi bi-shop" />
              </div>
              <div>
                <p className="lh-brand-kicker">AdminisGo</p>
                <h1 className="lh-brand-title inicio-app-hero__title">Panel de navegación</h1>
              </div>
            </div>
            <InicioHeroUserActions />
          </div>
          <p className="inicio-app-hero__desc">
            Elegí un módulo para continuar. El menú lateral se abre con el botón <strong className="inicio-hub-kbd">☰</strong>{' '}
            arriba a la izquierda. En el resto del sistema, usá <strong>Panel de inicio</strong> en la barra superior para
            volver aquí.
          </p>
        </header>

        {sinAccesoNingunModulo ? null : navCards.length === 0 ? (
          <p className="lh-empty-modules">No hay módulos disponibles con tu usuario actual.</p>
        ) : (
          <nav className="lh-nav-grid inicio-app-nav" aria-label="Módulos del sistema">
            {navCards.map((card) => (
              <Link key={card.key} to={card.to} className="lh-card">
                <span className={`lh-card-icon lh-card-icon--${card.tone}`}>
                  <i className={`bi ${card.icon}`} aria-hidden />
                </span>
                <span className="lh-card-title">{card.title}</span>
                <span className="lh-card-sub">{card.subtitle}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}

export default InicioHub
