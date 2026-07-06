import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/common'
import '../ventas/ActionsMenu.css'
import './ClientesActionsMenu.css'

function ClientesActionsMenu({
  clienteId,
  clienteNombre,
  debe = false,
  reporteLoading = false,
  onRegistrarPago,
  onExportPdfDeudas,
  onExportPdfTotal,
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
    if (action === 'pago' && onRegistrarPago) {
      onRegistrarPago()
    } else if (action === 'pdf-deudas' && onExportPdfDeudas) {
      onExportPdfDeudas()
    } else if (action === 'pdf-total' && onExportPdfTotal) {
      onExportPdfTotal()
    } else if (action === 'editar') {
      navigate(`/clientes/${clienteId}`)
    }
  }

  return (
    <div className="actions-menu-wrapper clientes-actions-menu" ref={menuRef}>
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
        aria-label={`Acciones de ${clienteNombre}`}
        aria-expanded={isOpen}
      >
        <i className="bi bi-three-dots-vertical" aria-hidden />
      </Button>
      {isOpen && (
        <div className="actions-menu-dropdown">
          {debe ? (
            <button
              type="button"
              className="actions-menu-item"
              onClick={(e) => handleAction('pago', e)}
            >
              <i className="bi bi-cash-coin" aria-hidden />
              <span>Registrar pago</span>
            </button>
          ) : null}
          <button
            type="button"
            className="actions-menu-item"
            onClick={(e) => handleAction('pdf-deudas', e)}
            disabled={reporteLoading}
          >
            <i className="bi bi-file-earmark-pdf" aria-hidden />
            <span>PDF ventas con deuda</span>
          </button>
          <button
            type="button"
            className="actions-menu-item"
            onClick={(e) => handleAction('pdf-total', e)}
            disabled={reporteLoading}
          >
            <i className="bi bi-file-earmark-pdf" aria-hidden />
            <span>PDF historial total</span>
          </button>
          <button type="button" className="actions-menu-item" onClick={(e) => handleAction('editar', e)}>
            <i className="bi bi-pencil" aria-hidden />
            <span>Editar</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default ClientesActionsMenu
