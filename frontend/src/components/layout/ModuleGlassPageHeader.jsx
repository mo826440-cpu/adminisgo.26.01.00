import { useEffect, useRef, useState } from 'react'
import InicioHeroUserActions from '../../pages/inicio/InicioHeroUserActions'
import '../../pages/inicio/InicioApp.css'
import './ModuleGlassPageHeader.css'

/**
 * Encabezado glass compacto de módulos.
 * Estado inicial reducido; al hacer scroll pasa a barra sticky compacta.
 * `kicker` se conserva en la API por compatibilidad pero ya no se muestra.
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
    'lh-glass-panel',
    isCompact ? 'module-glass-page-header--compact' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <div ref={sentinelRef} className="module-glass-page-header__sentinel" aria-hidden />
      <div className={wrapClassName}>
        <header className={headerClassName}>
          <div className="module-glass-page-header__body">
            <div className="module-glass-page-header__left">
              <div className="lh-logo-slot module-glass-page-header__logo" aria-hidden>
                <i className={`bi ${iconClass}`} />
              </div>
              <div className="module-glass-page-header__titles">
                <h1 className="lh-brand-title inicio-app-hero__title module-glass-page-header__title">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="inicio-app-hero__desc module-glass-page-header__desc">{subtitle}</p>
                ) : null}
              </div>
            </div>

            <div className="module-glass-page-header__right">
              <div className="module-glass-page-header__user">
                <InicioHeroUserActions />
              </div>
              {toolbarEnd ? (
                <div className="module-glass-page-header__toolbar">{toolbarEnd}</div>
              ) : null}
            </div>
          </div>
        </header>
      </div>
    </>
  )
}

export default ModuleGlassPageHeader
