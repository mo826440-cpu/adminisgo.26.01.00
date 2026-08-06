import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/common'
import '../ventas/ActionsMenu.css'
import './ClientesActionsMenu.css'

const MENU_GAP = 4
const ITEM_HEIGHT = 48

function ClientesActionsMenu({
  clienteId,
  clienteNombre,
  debe = false,
  reporteLoading = false,
  ticketLoading = false,
  onRegistrarPago,
  onImprimirTicketDeudas,
  onExportPdfDeudas,
  onExportPdfTotal,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const buttonRef = useRef(null)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const menuItemCount = (debe ? 1 : 0) + 4

  const updateMenuPosition = useCallback(() => {
    const btn = buttonRef.current
    if (!btn) return

    const rect = btn.getBoundingClientRect()
    const measuredH = dropdownRef.current?.offsetHeight
    const menuH = measuredH > 0 ? measuredH : menuItemCount * ITEM_HEIGHT
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < menuH + MENU_GAP && rect.top > spaceBelow

    if (openUp) {
      setMenuStyle({
        position: 'fixed',
        right: Math.max(8, window.innerWidth - rect.right),
        bottom: window.innerHeight - rect.top + MENU_GAP,
        top: 'auto',
        left: 'auto',
        marginTop: 0,
        zIndex: 6000,
      })
      return
    }

    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + MENU_GAP,
      right: Math.max(8, window.innerWidth - rect.right),
      left: 'auto',
      bottom: 'auto',
      marginTop: 0,
      zIndex: 6000,
    })
  }, [menuItemCount])

  useEffect(() => {
    const handleClickOutside = (event) => {
      const inButton = buttonRef.current?.contains(event.target)
      const inDropdown = dropdownRef.current?.contains(event.target)
      if (!inButton && !inDropdown) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined
    updateMenuPosition()
    const onScrollOrResize = () => updateMenuPosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [isOpen, updateMenuPosition])

  const handleAction = (action, e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(false)
    if (action === 'pago' && onRegistrarPago) {
      onRegistrarPago()
    } else if (action === 'ticket-deudas' && onImprimirTicketDeudas) {
      onImprimirTicketDeudas()
    } else if (action === 'pdf-deudas' && onExportPdfDeudas) {
      onExportPdfDeudas()
    } else if (action === 'pdf-total' && onExportPdfTotal) {
      onExportPdfTotal()
    } else if (action === 'editar') {
      navigate(`/clientes/${clienteId}`)
    }
  }

  const dropdown =
    isOpen && menuStyle ? (
      <div
        ref={dropdownRef}
        className="actions-menu-dropdown clientes-actions-dropdown"
        style={menuStyle}
        role="menu"
      >
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
          onClick={(e) => handleAction('ticket-deudas', e)}
          disabled={ticketLoading || reporteLoading}
        >
          <i className="bi bi-printer" aria-hidden />
          <span>Imprimir ticket de deudas</span>
        </button>
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
    ) : null

  return (
    <>
      <div className="actions-menu-wrapper clientes-actions-menu" ref={buttonRef}>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen((prev) => !prev)
          }}
          className="actions-menu-button"
          title="Acciones"
          aria-label={`Acciones de ${clienteNombre}`}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <i className="bi bi-three-dots-vertical" aria-hidden />
        </Button>
      </div>
      {typeof document !== 'undefined' && dropdown ? createPortal(dropdown, document.body) : null}
    </>
  )
}

export default ClientesActionsMenu
