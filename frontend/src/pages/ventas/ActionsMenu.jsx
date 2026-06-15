// Componente de menú de acciones para tabla de ventas
import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../../components/common'
import './ActionsMenu.css'

function ActionsMenu({ ventaId, cancelada = false, onCancel }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleAction = (action, e) => {
    e.preventDefault()
    setIsOpen(false)

    switch (action) {
      case 'ver':
        navigate(`/ventas/${ventaId}`)
        break
      case 'editar':
        if (!cancelada) navigate(`/ventas/${ventaId}/editar`)
        break
      case 'imprimir':
        navigate(`/ventas/${ventaId}`, { state: { print: true } })
        break
      case 'cancelar':
        if (!cancelada && onCancel) onCancel(ventaId)
        break
      default:
        break
    }
  }

  return (
    <div className="ventas-acciones-inline">
      <Link
        to={`/ventas/${ventaId}/editar`}
        className={`ventas-accion-btn ventas-accion-btn--editar${cancelada ? ' ventas-accion-btn--disabled' : ''}`}
        title={cancelada ? 'No se puede editar una venta cancelada' : 'Editar venta'}
        aria-label="Editar venta"
        onClick={(e) => {
          if (cancelada) e.preventDefault()
        }}
      >
        <i className="bi bi-pencil-square" />
      </Link>
      <Link
        to={`/ventas/${ventaId}`}
        className="ventas-accion-btn ventas-accion-btn--ver"
        title="Ver detalle"
        aria-label="Ver detalle"
      >
        <i className="bi bi-eye" />
      </Link>
      <div className="actions-menu-wrapper" ref={menuRef}>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          className="actions-menu-button"
          title="Más acciones"
        >
          <i className="bi bi-three-dots-vertical" />
        </Button>

        {isOpen ? (
          <div className="actions-menu-dropdown">
            <button className="actions-menu-item" onClick={(e) => handleAction('imprimir', e)}>
              <i className="bi bi-printer" />
              <span>Imprimir</span>
            </button>
            {!cancelada ? (
              <button
                className="actions-menu-item actions-menu-item-danger"
                onClick={(e) => handleAction('cancelar', e)}
              >
                <i className="bi bi-x-circle" />
                <span>Cancelar venta</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default ActionsMenu
