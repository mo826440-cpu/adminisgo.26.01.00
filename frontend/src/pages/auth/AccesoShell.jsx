import { useEffect } from 'react'

function AccesoShell({ children }) {
  useEffect(() => {
    const previo = document.title
    document.title = 'Alien’s · Kiosco/Bebidas'
    return () => {
      document.title = previo
    }
  }, [])

  return (
    <div className="acceso">
      <img
        className="acceso__arte"
        src="/acceso/fondo-aliens.png"
        alt=""
      />
      <header className="acceso__marca">
        <p className="acceso__logo">Alien’s</p>
        <p className="acceso__rubro">Kiosco/Bebidas</p>
        <h1 className="acceso__titular">Todo tu kiosco, bajo control</h1>
        <p className="acceso__bajada">Ventas, stock y caja en un solo lugar</p>
      </header>
      <main className="acceso__lado">
        <div className="acceso__card">{children}</div>
        <p className="acceso__firma">Tecnología AdminisGo</p>
      </main>
    </div>
  )
}

export default AccesoShell
