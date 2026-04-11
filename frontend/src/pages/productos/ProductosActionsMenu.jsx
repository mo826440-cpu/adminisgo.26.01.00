// Menú de acciones (tres puntos) — mismo patrón que ventas/ActionsMenu
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/common'
import '../ventas/ActionsMenu.css'

function ProductosActionsMenu({ producto, onDelete }) {
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
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleAction = (action, e) => {
    e.preventDefault()
    setIsOpen(false)
    if (action === 'editar') {
      navigate(`/productos/${producto.id}`)
    } else if (action === 'eliminar' && onDelete) {
      onDelete(producto)
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
            onClick={(e) => handleAction('editar', e)}
          >
            <i className="bi bi-pencil" />
            <span>Editar</span>
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

export default ProductosActionsMenu
