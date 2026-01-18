// Componente Layout principal
import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import './Layout.css'

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="layout">
      <Navbar onToggleSidebar={toggleSidebar} />
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

