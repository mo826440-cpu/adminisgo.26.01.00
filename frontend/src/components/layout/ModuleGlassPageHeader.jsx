import { useEffect, useRef, useState } from 'react'
import InicioHeroUserActions from '../../pages/inicio/InicioHeroUserActions'
import KioscoAliensMark from './KioscoAliensMark'
import '../../pages/inicio/InicioApp.css'
import './ModuleGlassPageHeader.css'

/**
 * Encabezado glass de módulos.
 * Con la página en el tope se ve el banner completo. Al bajar pasa a barra
 * sticky compacta, pero solo si después de achicarse sigue habiendo scroll:
 * si el listado apenas supera la ventana, achicar el banner dejaba la página
 * más corta que la pantalla y el navegador devolvía el scroll arriba.
 * El banner usa el mismo alien y resplandor que el panel de Inicio.
 * `kicker` se conserva en la API; el rótulo visible es «Kiosco Aliens».
 *
 * El sticky va en el wrap `.container` (mismo ancho que el resto de pantallas);
 * el panel glass queda dentro del padding del container, alineado con las cards.
 */

/** Alto mínimo que conserva la barra ya compacta (logo + paddings). */
const COMPACT_BAR_MIN_PX = 64
/** Recorrido mínimo antes de compactar, para no reaccionar a un pixel. */
const ENTER_SCROLL_PX = 16
/** Solo se vuelve a expandir muy cerca del tope, para no oscilar. */
const EXIT_SCROLL_PX = 4
/** Scroll que tiene que quedar después de achicar el banner. */
const SCROLL_SLACK_PX = 48

function ModuleGlassPageHeader({
  kicker: _kicker = 'AdminisGo',
  title,
  subtitle,
  iconClass = 'bi-lightning-charge',
  toolbarEnd = null,
  density = 'regular',
  keepSubtitle = false,
}) {
  const slotRef = useRef(null)
  const compactRef = useRef(false)
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const slot = slotRef.current
    if (!slot) return undefined

    const root = document.documentElement
    root.classList.add('module-glass-scroll-stable')

    let frame = 0
    let exitLockedUntil = 0

    const evaluate = () => {
      const scroller = document.scrollingElement || root
      const y = window.scrollY || scroller.scrollTop || 0

      if (!compactRef.current) {
        const slotHeight = slot.getBoundingClientRect().height
        const shrink = Math.max(0, slotHeight - COMPACT_BAR_MIN_PX)
        const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
        const slackAfterShrink = maxScroll - shrink
        if (y > ENTER_SCROLL_PX && slackAfterShrink > SCROLL_SLACK_PX) {
          compactRef.current = true
          exitLockedUntil = performance.now() + 320
          setIsCompact(true)
        }
        return
      }

      if (performance.now() < exitLockedUntil) return
      if (y <= EXIT_SCROLL_PX) {
        compactRef.current = false
        setIsCompact(false)
      }
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(evaluate)
    }

    evaluate()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      root.classList.remove('module-glass-scroll-stable')
    }
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
    density === 'compact' ? 'module-glass-page-header--density-compact' : '',
    keepSubtitle ? 'module-glass-page-header--keep-sub' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={slotRef} className={wrapClassName}>
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
  )
}

export default ModuleGlassPageHeader
