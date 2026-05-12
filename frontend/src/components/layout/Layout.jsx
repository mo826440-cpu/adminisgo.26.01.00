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

function Layout({ children }) {
  const location = useLocation()
  const isHubFullscreen = location.pathname === '/inicio' || location.pathname.startsWith('/inicio/')
  const isModuleGlassNav = !isHubFullscreen

  const moduleChrome = useMemo(
    () => (isModuleGlassNav ? getModuleChrome(location.pathname) : null),
    [isModuleGlassNav, location.pathname],
  )
  const [sidebarOpen, setSidebarOpen] = useState(readInitialSidebarOpen)

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

  const closeSidebar = () => {
    setSidebarOpen(false)
    try {
      localStorage.setItem(STORAGE_KEY, 'false')
    } catch {
      /* ignore */
    }
  }

  const layoutChromeValue = useMemo(
    () => ({ toggleSidebar, sidebarOpen }),
    [toggleSidebar, sidebarOpen],
  )

  const layoutClassName = [
    'layout',
    sidebarOpen ? 'layout--nav-open' : '',
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
          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
          <main className="layout-main layout-main--cosmic">
            <div className="layout-main-atmosphere" aria-hidden>
              <div className="lh-blob lh-blob--cyan" />
              <div className="lh-blob lh-blob--violet" />
              <div className="lh-blob lh-blob--emerald" />
              <div className="lh-grid-bg" />
            </div>
            <div className="layout-main__content">
              {moduleChrome ? (
                <div className="container layout-module-glass-header-wrap">
                  <ModuleGlassPageHeader
                    kicker={moduleChrome.kicker}
                    title={moduleChrome.title}
                    subtitle={moduleChrome.subtitle}
                    iconClass={moduleChrome.icon}
                    toolbarEnd={moduleChrome.toolbarEnd}
                  />
                </div>
              ) : null}
              {children}
            </div>
          </main>
        </div>
        {isHubFullscreen ? (
          <button
            type="button"
            className="hub-sidebar-fab"
            onClick={toggleSidebar}
            aria-expanded={sidebarOpen}
            aria-label="Abrir o cerrar menú lateral"
          >
            <i className="bi bi-list" aria-hidden />
          </button>
        ) : null}
      </div>
    </LayoutChromeProvider>
  )
}

export default Layout

