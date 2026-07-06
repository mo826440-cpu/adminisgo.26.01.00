import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/common'
import '../ventas/ActionsMenu.css'

function CategoriasActionsMenu({
  categoriaId,
  productosCount = 0,
  onVerDetalles,
  onExportarPdf,
}) {
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
    e.stopPropagation()
    setIsOpen(false)
    if (action === 'detalles' && onVerDetalles) {
      onVerDetalles()
    } else if (action === 'editar') {
      navigate(`/categorias/${categoriaId}`)
    } else if (action === 'pdf' && onExportarPdf) {
      onExportarPdf()
    }
  }

  return (
    <div className="actions-menu-wrapper categorias-actions-menu" ref={menuRef}>
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
        aria-label="Abrir menú de acciones"
        aria-expanded={isOpen}
      >
        <i className="bi bi-three-dots-vertical" aria-hidden />
      </Button>
      {isOpen && (
        <div className="actions-menu-dropdown">
          <button
            type="button"
            className="actions-menu-item"
            onClick={(e) => handleAction('detalles', e)}
          >
            <i className="bi bi-info-circle" aria-hidden />
            <span>Ver detalles</span>
          </button>
          <button
            type="button"
            className="actions-menu-item"
            onClick={(e) => handleAction('editar', e)}
          >
            <i className="bi bi-pencil" aria-hidden />
            <span>Editar</span>
          </button>
          <button
            type="button"
            className="actions-menu-item"
            onClick={(e) => handleAction('pdf', e)}
            disabled={productosCount === 0}
          >
            <i className="bi bi-file-earmark-pdf" aria-hidden />
            <span>Lista de precios PDF</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default CategoriasActionsMenu
