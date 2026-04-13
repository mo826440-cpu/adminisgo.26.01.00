// Componente Layout principal
import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import './Layout.css'

const STORAGE_KEY = 'layoutSidebarOpen'

function readInitialSidebarOpen() {
  if (typeof window === 'undefined') return true
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'true') return true
    if (saved === 'false') return false
  } catch {
    /* ignore */
  }
  return window.innerWidth > 768
}

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(readInitialSidebarOpen)

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
    try {
      localStorage.setItem(STORAGE_KEY, 'false')
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={`layout ${sidebarOpen ? 'layout--nav-open' : ''}`}>
      <Navbar
        onToggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
      />
      <div className="layout-body">
        <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={closeSidebar} />
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <main className="layout-main">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout

