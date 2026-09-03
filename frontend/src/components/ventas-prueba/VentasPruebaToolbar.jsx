import { useEffect, useLayoutEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../common'
import { useLayoutChrome } from '../layout/LayoutChromeContext'
import { useAuthContext } from '../../context/AuthContext'
import ConsultaProductoStockModal from './ConsultaProductoStockModal'
import './VentasPruebaToolbar.css'

const BASE = '/ventas'

/**
 * Toolbar del módulo Ventas (navegación a pantallas dedicadas).
 */
function VentasPruebaToolbar({
  showNuevaVenta = true,
  showClientes = true,
  extraEnd = null,
}) {
  const { setToolbarEndOverride } = useLayoutChrome()
  const { puedeModulo, puedeModuloVentasORapidas } = useAuthContext()
  const location = useLocation()
  const [consultaOpen, setConsultaOpen] = useState(false)
  const puedeHerramientas = !!puedeModuloVentasORapidas?.()
  const puedeVentas = puedeModulo('ventas')
  const puedeClientes = puedeModulo('clientes')

  const path = location.pathname
  const isCaja = path === `${BASE}/caja` || path.startsWith(`${BASE}/caja/`)
  const isRapida = path === `${BASE}/rapida` || path.startsWith(`${BASE}/rapida/`)
  const isDetallada =
    path === `${BASE}/nueva` || new RegExp(`^${BASE}/[^/]+/editar$`).test(path)

  useEffect(() => {
    const puedeMostrar = puedeHerramientas || puedeVentas
    if (!puedeMostrar) return undefined

    const handler = (e) => {
      if (e.key !== 'F4') return
      e.preventDefault()
      setConsultaOpen(true)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [puedeHerramientas, puedeVentas])

  useLayoutEffect(() => {
    const puedeMostrar = puedeHerramientas || puedeVentas
    if (!puedeMostrar) {
      setToolbarEndOverride(null)
      return undefined
    }

    const toolbar = (
      <div className="vp-toolbar">
        {puedeClientes && showClientes ? (
          <Link to="/clientes">
            <Button type="button" variant="outline" className="vp-toolbar__btn" title="Clientes">
              <i className="bi bi-people" aria-hidden />
              <span className="vp-toolbar__label">Clientes</span>
            </Button>
          </Link>
        ) : null}

        <Link to={`${BASE}/caja`}>
          <Button
            type="button"
            variant="outline"
            className={`vp-toolbar__btn${isCaja ? ' is-active' : ''}`}
            title="Gestión de caja"
          >
            <i className="bi bi-cash-stack" aria-hidden />
            <span className="vp-toolbar__label">Caja</span>
          </Button>
        </Link>

        <Link to={`${BASE}/rapida`}>
          <Button
            type="button"
            variant="outline"
            className={`vp-toolbar__btn${isRapida ? ' is-active' : ''}`}
            title="Venta rápida (F2)"
          >
            <i className="bi bi-lightning-charge" aria-hidden />
            <span className="vp-toolbar__label">Venta rápida</span>
          </Button>
        </Link>

        {showNuevaVenta && puedeVentas ? (
          <Link to={`${BASE}/nueva`}>
            <Button
              variant={isDetallada ? 'primary' : 'outline'}
              className={`vp-toolbar__btn${isDetallada ? ' is-active vp-toolbar__btn--primary' : ''}`}
              title="Venta detallada"
            >
              <i className="bi bi-plus-lg" aria-hidden />
              <span className="vp-toolbar__label">Nueva venta</span>
            </Button>
          </Link>
        ) : null}

        <Button
          type="button"
          variant="outline"
          className={`vp-toolbar__btn${consultaOpen ? ' is-active' : ''}`}
          title="Consultar stock y precio (F4)"
          onClick={() => setConsultaOpen(true)}
        >
          <i className="bi bi-upc-scan" aria-hidden />
          <span className="vp-toolbar__label">Consultar</span>
        </Button>

        {extraEnd}
      </div>
    )

    setToolbarEndOverride(toolbar)
    return () => setToolbarEndOverride(null)
  }, [
    puedeHerramientas,
    puedeVentas,
    puedeClientes,
    showNuevaVenta,
    showClientes,
    extraEnd,
    isCaja,
    isRapida,
    isDetallada,
    consultaOpen,
    setToolbarEndOverride,
  ])

  return (
    <ConsultaProductoStockModal isOpen={consultaOpen} onClose={() => setConsultaOpen(false)} />
  )
}

export default VentasPruebaToolbar
export { BASE as VENTAS_PRUEBA_BASE }
