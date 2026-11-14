import { useEffect, useRef, useState } from 'react'
import './BarraScrollTabla.css'

function BarraScrollTabla({ children, className = '', firma = '' }) {
  const topRef = useRef(null)
  const bodyRef = useRef(null)
  const [overflow, setOverflow] = useState(false)
  const [ancho, setAncho] = useState(0)

  useEffect(() => {
    const body = bodyRef.current
    const top = topRef.current
    if (!body || !top) return undefined

    let frame = 0
    let origen = null

    const medir = () => {
      const tabla = body.querySelector('table')
      const w = tabla ? tabla.scrollWidth : body.scrollWidth
      setAncho(w)
      const sobra = w > body.clientWidth + 1
      setOverflow(sobra)
      if (sobra && top.scrollLeft !== body.scrollLeft) top.scrollLeft = body.scrollLeft
    }

    const sync = (from, to) => {
      if (origen === to) return
      if (from.scrollLeft === to.scrollLeft) return
      origen = from
      to.scrollLeft = from.scrollLeft
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        origen = null
      })
    }

    const onBody = () => sync(body, top)
    const onTop = () => sync(top, body)

    medir()
    const observer = new ResizeObserver(medir)
    observer.observe(body)
    const tabla = body.querySelector('table')
    if (tabla) observer.observe(tabla)
    body.addEventListener('scroll', onBody, { passive: true })
    top.addEventListener('scroll', onTop, { passive: true })
    window.addEventListener('resize', medir)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      body.removeEventListener('scroll', onBody)
      top.removeEventListener('scroll', onTop)
      window.removeEventListener('resize', medir)
    }
  }, [firma])

  return (
    <div className="prov-tabla-scroll">
      <div
        ref={topRef}
        className={`prov-tabla-scroll__top${overflow ? '' : ' is-off'}`}
        aria-hidden="true"
      >
        <div className="prov-tabla-scroll__ancho" style={{ width: ancho }} />
      </div>
      <div
        ref={bodyRef}
        className={className}
        tabIndex={overflow ? 0 : undefined}
        aria-label={overflow ? 'Tabla con desplazamiento horizontal' : undefined}
      >
        {children}
      </div>
    </div>
  )
}

export default BarraScrollTabla
