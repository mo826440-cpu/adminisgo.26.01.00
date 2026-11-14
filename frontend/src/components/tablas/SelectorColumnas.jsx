import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './SelectorColumnas.css'

function SelectorColumnas({ columnas, ocultas, onToggle, onMostrarTodas, onRestablecer }) {
  const [abierto, setAbierto] = useState(false)
  const [estilo, setEstilo] = useState(null)
  const botonRef = useRef(null)
  const menuRef = useRef(null)
  const tituloId = useId()

  useEffect(() => {
    if (!abierto) return undefined
    const colocar = () => {
      const rect = botonRef.current?.getBoundingClientRect()
      if (!rect) return
      const margen = 12
      const ancho = Math.min(280, window.innerWidth - margen * 2)
      const alinearDerecha = rect.right > window.innerWidth / 2
      let left = alinearDerecha ? rect.right - ancho : rect.left
      left = Math.max(margen, Math.min(left, window.innerWidth - ancho - margen))
      const espacioAbajo = window.innerHeight - rect.bottom - margen
      const espacioArriba = rect.top - margen
      const abrirArriba = espacioAbajo < 220 && espacioArriba > espacioAbajo
      const espacio = abrirArriba ? espacioArriba : espacioAbajo
      setEstilo({
        position: 'fixed',
        left,
        width: ancho,
        maxHeight: Math.max(96, espacio - 6),
        zIndex: 6000,
        ...(abrirArriba
          ? { bottom: window.innerHeight - rect.top + 6 }
          : { top: rect.bottom + 6 }),
      })
    }
    colocar()
    const cerrarFuera = (event) => {
      if (botonRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return
      setAbierto(false)
    }
    const cerrarTecla = (event) => {
      if (event.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', cerrarFuera)
    document.addEventListener('keydown', cerrarTecla)
    window.addEventListener('resize', colocar)
    window.addEventListener('scroll', colocar, true)
    return () => {
      document.removeEventListener('mousedown', cerrarFuera)
      document.removeEventListener('keydown', cerrarTecla)
      window.removeEventListener('resize', colocar)
      window.removeEventListener('scroll', colocar, true)
    }
  }, [abierto])

  const menu = abierto && estilo ? (
    <div ref={menuRef} className="selector-columnas__menu" style={estilo} role="dialog" aria-labelledby={tituloId}>
      <p id={tituloId} className="selector-columnas__titulo">Columnas</p>
      <ul className="selector-columnas__lista">
        {columnas.map((col) => {
          const visible = !ocultas.includes(col.id)
          return (
            <li key={col.id}>
              <label className="selector-columnas__item">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={() => onToggle(col.id)}
                />
                <span>{col.label}</span>
              </label>
            </li>
          )
        })}
      </ul>
      <div className="selector-columnas__acciones">
        <button type="button" className="selector-columnas__link" onClick={onMostrarTodas}>
          Mostrar todas
        </button>
        <button type="button" className="selector-columnas__link" onClick={onRestablecer}>
          Restablecer columnas
        </button>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        className="selector-columnas__boton"
        aria-expanded={abierto}
        aria-haspopup="dialog"
        onClick={() => setAbierto((prev) => !prev)}
      >
        <i className="bi bi-layout-three-columns" aria-hidden />
        Columnas
      </button>
      {typeof document !== 'undefined' && menu ? createPortal(menu, document.body) : null}
    </>
  )
}

export default SelectorColumnas
