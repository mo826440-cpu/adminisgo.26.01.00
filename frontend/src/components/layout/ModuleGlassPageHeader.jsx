import { useEffect, useRef, useState } from 'react'
import InicioHeroUserActions from '../../pages/inicio/InicioHeroUserActions'
import KioscoAliensMark from './KioscoAliensMark'
import '../../pages/inicio/InicioApp.css'
import './ModuleGlassPageHeader.css'

/**
 * Encabezado glass compacto de módulos.
 * Estado inicial reducido; al hacer scroll pasa a barra sticky compacta.
 * El banner usa el mismo alien y resplandor que el panel de Inicio.
 * `kicker` se conserva en la API; el rótulo visible es «Kiosco Aliens».
 *
 * El sticky va en el wrap `.container` (mismo ancho que el resto de pantallas);
 * el panel glass queda dentro del padding del container, alineado con las cards.
 */
function ModuleGlassPageHeader({
  kicker: _kicker = 'AdminisGo',
  title,
  subtitle,
  iconClass = 'bi-lightning-charge',
  toolbarEnd = null,
}) {
  const sentinelRef = useRef(null)
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        const next = !entry.isIntersecting
        setIsCompact((prev) => (prev === next ? prev : next))
      },
      { threshold: 0, rootMargin: '0px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const wrapClassName = [
    'container',
    'layout-module-glass-header-wrap',
    'module-glass-page-header-sticky',
    isCompact ? 'module-glass-page-header-sticky--compact' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const headerClassName = [
    'module-glass-page-header',
    'inicio-app-hero',
    'inicio-app-hero--nav',
    isCompact ? 'module-glass-page-header--compact' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <div ref={sentinelRef} className="module-glass-page-header__sentinel" aria-hidden />
      <div className={wrapClassName}>
        <header className={headerClassName}>
          <div className="inicio-app-hero__backdrop" aria-hidden>
            <div className="inicio-app-hero__alien">
              <KioscoAliensMark variant="header" className="inicio-app-hero__alien-mark" />
            </div>
          </div>
          <div className="inicio-app-hero__head module-glass-page-header__body">
            <div className="inicio-app-hero__identity module-glass-page-header__left">
              <div className="inicio-app-hero__shop module-glass-page-header__logo" aria-hidden>
                <i className={`bi ${iconClass}`} />
              </div>
              <div className="inicio-app-hero__copy module-glass-page-header__titles">
                <p className="inicio-app-hero__kicker">Kiosco Aliens</p>
                <h1 className="inicio-app-hero__title module-glass-page-header__title">{title}</h1>
                {subtitle ? (
                  <p className="inicio-app-hero__desc module-glass-page-header__desc">{subtitle}</p>
                ) : null}
              </div>
            </div>

            <div className="module-glass-page-header__right">
              {toolbarEnd ? (
                <div className="module-glass-page-header__toolbar">{toolbarEnd}</div>
              ) : null}
              <div className="module-glass-page-header__user">
                <InicioHeroUserActions />
              </div>
            </div>
          </div>
        </header>
      </div>
    </>
  )
}

export default ModuleGlassPageHeader
