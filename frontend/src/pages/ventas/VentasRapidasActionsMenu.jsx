// Menú de acciones (tres puntos) para tabla de ventas rápidas — mismo patrón que ActionsMenu (ventas)
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/common'
import './ActionsMenu.css'

function VentasRapidasActionsMenu({ ventaRapidaId, onDelete }) {
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
        navigate(`/ventas-rapidas/${ventaRapidaId}`)
        break
      case 'imprimir':
        navigate(`/ventas-rapidas/${ventaRapidaId}`, { state: { print: true } })
        break
      case 'eliminar':
        if (onDelete) onDelete()
        break
      default:
        break
    }
  }

  return (
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
        title="Acciones"
      >
        <i className="bi bi-three-dots-vertical" />
      </Button>

      {isOpen && (
        <div className="actions-menu-dropdown">
          <button
            type="button"
            className="actions-menu-item"
            onClick={(e) => handleAction('ver', e)}
          >
            <i className="bi bi-eye" />
            <span>Ver detalle</span>
          </button>
          <button
            type="button"
            className="actions-menu-item"
            onClick={(e) => handleAction('imprimir', e)}
          >
            <i className="bi bi-printer" />
            <span>Imprimir</span>
          </button>
          <button
            type="button"
            className="actions-menu-item actions-menu-item-danger"
            onClick={(e) => handleAction('eliminar', e)}
          >
            <i className="bi bi-trash" />
            <span>Eliminar</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default VentasRapidasActionsMenu
