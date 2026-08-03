// Componente Layout principal
import { useState, useMemo, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import ModuleGlassPageHeader from './ModuleGlassPageHeader'
import { getModuleChrome } from './moduleChromeMeta'
import { LayoutChromeProvider } from './LayoutChromeContext'
import '../../pages/LandingHome.css'
import './Layout.css'
import './appModuleGlassPanels.css'

const STORAGE_KEY = 'layoutSidebarOpen'
const STORAGE_COMPACT_KEY = 'layoutSidebarCompact'

function readInitialSidebarOpen() {
  if (typeof window === 'undefined') return false
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'true') return true
    if (saved === 'false') return false
  } catch {
    /* ignore */
  }
  return false
}

function readInitialSidebarCompact() {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_COMPACT_KEY) === 'true'
  } catch {
    /* ignore */
  }
  return false
}

function Layout({ children }) {
  const location = useLocation()
  const isHubFullscreen = location.pathname === '/inicio' || location.pathname.startsWith('/inicio/')
  const isModuleGlassNav = !isHubFullscreen

  const moduleChrome = useMemo(
    () => (isModuleGlassNav ? getModuleChrome(location.pathname) : null),
    [isModuleGlassNav, location.pathname],
  )
  const [sidebarOpen, setSidebarOpen] = useState(readInitialSidebarOpen)
  const [sidebarCompact, setSidebarCompact] = useState(readInitialSidebarCompact)
  const [toolbarEndOverride, setToolbarEndOverride] = useState(null)

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const toggleSidebarCompact = useCallback(() => {
    setSidebarCompact((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_COMPACT_KEY, String(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const closeSidebar = () => {
    setSidebarOpen(false)
    try {
      localStorage.setItem(STORAGE_KEY, 'false')
    } catch {
      /* ignore */
    }
  }

  // No limpiar el override aquí al cambiar de ruta: este effect corre después
  // del set del hijo (VentasSharedToolsHost / VentasPruebaToolbar) y borraba la toolbar.
  // Cada página limpia en el cleanup de su propio useEffect al desmontar.

  const setToolbarEndOverrideStable = useCallback((node) => {
    setToolbarEndOverride(node)
  }, [])

  const layoutChromeValue = useMemo(
    () => ({
      toggleSidebar,
      sidebarOpen,
      setToolbarEndOverride: setToolbarEndOverrideStable,
    }),
    [toggleSidebar, sidebarOpen, setToolbarEndOverrideStable],
  )

  const resolvedToolbarEnd = toolbarEndOverride ?? moduleChrome?.toolbarEnd ?? null

  const layoutClassName = [
    'layout',
    sidebarOpen ? 'layout--nav-open' : '',
    sidebarOpen && sidebarCompact ? 'layout--nav-compact' : '',
    isHubFullscreen ? 'layout--hub-fullscreen' : '',
    isModuleGlassNav ? 'layout--module-glass-nav' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <LayoutChromeProvider value={layoutChromeValue}>
      <div className={layoutClassName}>
        <Navbar
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />
        <div className="layout-body">
          <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={closeSidebar} />
          <Sidebar
            isOpen={sidebarOpen}
            onClose={closeSidebar}
            isCompact={sidebarCompact}
            onToggleCompact={toggleSidebarCompact}
          />
          <main className="layout-main layout-main--cosmic">
            <div className="layout-main-atmosphere" aria-hidden>
              <div className="lh-blob lh-blob--cyan" />
              <div className="lh-blob lh-blob--violet" />
              <div className="lh-blob lh-blob--emerald" />
              <div className="lh-grid-bg" />
            </div>
            <div className="layout-main__content">
              {moduleChrome ? (
                <ModuleGlassPageHeader
                  key={location.pathname}
                  kicker={moduleChrome.kicker}
                  title={moduleChrome.title}
                  subtitle={moduleChrome.subtitle}
                  iconClass={moduleChrome.icon}
                  toolbarEnd={resolvedToolbarEnd}
                />
              ) : null}
              {children}
            </div>
          </main>
        </div>
        {(isHubFullscreen || isModuleGlassNav) ? (
          <div className="layout-nav-chrome" role="toolbar" aria-label="Navegación principal">
            <button
              type="button"
              className="layout-nav-chrome__btn"
              onClick={toggleSidebar}
              aria-expanded={sidebarOpen}
              aria-label="Abrir o cerrar menú lateral"
              title="Mostrar u ocultar menú lateral"
            >
              <i className="bi bi-list" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </LayoutChromeProvider>
  )
}

export default Layout

