// Componente Layout principal
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import './Layout.css'

function Layout({ children }) {
  return (
    <div className="layout">
      <Navbar />
      <div className="layout-body">
        <Sidebar />
        <main className="layout-main">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout

