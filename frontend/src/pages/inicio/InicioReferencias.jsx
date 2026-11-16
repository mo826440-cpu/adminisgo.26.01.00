import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from '../../components/common'
import { useAuthContext } from '../../context/AuthContext'
import { buildReferenciasHubCards } from '../../utils/inicioNavCards'
import InicioHeroUserActions from './InicioHeroUserActions'
import KioscoAliensMark from '../../components/layout/KioscoAliensMark'
import './InicioApp.css'

function InicioReferencias() {
  const { loadingPermisos, puedeModulo } = useAuthContext()

  useEffect(() => {
    document.title = 'Alien’s Drnck’s · Referencias'
  }, [])

  const cards = useMemo(() => buildReferenciasHubCards(puedeModulo), [puedeModulo])

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
        <header className="inicio-app-hero inicio-app-hero--nav">
          <div className="inicio-app-hero__backdrop" aria-hidden>
            <div className="inicio-app-hero__alien">
              <KioscoAliensMark variant="header" className="inicio-app-hero__alien-mark" />
            </div>
          </div>
          <div className="inicio-app-hero__head">
            <div className="inicio-app-hero__identity">
              <div className="inicio-app-hero__shop" aria-hidden>
                <i className="bi bi-bookmark-star" />
              </div>
              <div className="inicio-app-hero__copy">
                <p className="inicio-app-hero__kicker">Kiosco Aliens</p>
                <h1 className="inicio-app-hero__title">Catálogos y tablas maestras</h1>
                <p className="inicio-app-hero__desc">Elegí una sección para abrir el listado correspondiente.</p>
              </div>
            </div>
            <InicioHeroUserActions />
          </div>
          <div className="inicio-app-hero__subnav">
            <Link to="/inicio" className="inicio-hub-back-link">
              <i className="bi bi-arrow-left" aria-hidden /> Volver al panel de navegación
            </Link>
          </div>
        </header>

        {cards.length === 0 ? (
          <p className="lh-empty-modules">No tenés permisos para ninguna opción de Referencias.</p>
        ) : (
          <nav className="lh-nav-grid inicio-app-nav" aria-label="Referencias">
            {cards.map((card) => (
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

export default InicioReferencias
