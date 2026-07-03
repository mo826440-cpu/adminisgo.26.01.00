import InicioHeroUserActions from '../../pages/inicio/InicioHeroUserActions'
import '../../pages/inicio/InicioApp.css'
import './ModuleGlassPageHeader.css'

/**
 * Encabezado tipo tarjeta glass del panel de navegación, para módulos (prueba en Ventas rápidas).
 */
function ModuleGlassPageHeader({
  kicker = 'AdminisGo',
  title,
  subtitle,
  iconClass = 'bi-lightning-charge',
  toolbarEnd = null,
}) {
  return (
    <header className="module-glass-page-header inicio-app-hero lh-glass-panel">
      <div className="inicio-app-hero__head module-glass-page-header__head">
        <div className="module-glass-page-header__leftCluster">
          <div className="lh-brand-row module-glass-page-header__brand">
            <div className="lh-logo-slot" aria-hidden>
              <i className={`bi ${iconClass}`} />
            </div>
            <div>
              <p className="lh-brand-kicker">{kicker}</p>
              <h1 className="lh-brand-title inicio-app-hero__title">{title}</h1>
            </div>
          </div>
        </div>
        <InicioHeroUserActions />
      </div>
      {(subtitle || toolbarEnd) && (
        <div className="module-glass-page-header__foot">
          {subtitle ? (
            <p className="inicio-app-hero__desc module-glass-page-header__desc">{subtitle}</p>
          ) : (
            <span className="module-glass-page-header__desc-spacer" aria-hidden />
          )}
          {toolbarEnd ? <div className="module-glass-page-header__toolbar">{toolbarEnd}</div> : null}
        </div>
      )}
    </header>
  )
}

export default ModuleGlassPageHeader
