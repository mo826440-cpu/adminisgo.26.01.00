import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Spinner } from '../../components/common'
import { useAuthContext } from '../../context/AuthContext'
import { buildInicioNavCards } from '../../utils/inicioNavCards'
import InicioHeroUserActions from './InicioHeroUserActions'
import KioscoAliensMark from '../../components/layout/KioscoAliensMark'
import './InicioApp.css'

function InicioHub() {
  const { loadingPermisos, sinAccesoNingunModulo, isAdmin, puedeModulo } = useAuthContext()

  useEffect(() => {
    document.title = 'Kiosco Aliens · Inicio'
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

        <header className="inicio-app-hero inicio-app-hero--nav">
          <div className="inicio-app-hero__alien" aria-hidden>
            <KioscoAliensMark className="inicio-app-hero__alien-mark" />
          </div>
          <div className="inicio-app-hero__head">
            <div className="inicio-app-hero__identity">
              <div className="inicio-app-hero__shop" aria-hidden>
                <i className="bi bi-shop" />
              </div>
              <div className="inicio-app-hero__copy">
                <p className="inicio-app-hero__kicker">Kiosco Aliens</p>
                <h1 className="inicio-app-hero__title">Panel de navegación</h1>
                <p className="inicio-app-hero__desc">Todo tu negocio, en un solo lugar.</p>
              </div>
            </div>
            <InicioHeroUserActions />
          </div>
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
