import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/common'
import '../ventas/ActionsMenu.css'

const MENU_GAP = 4
const ITEM_HEIGHT = 48

function ProveedoresActionsMenu({ proveedorId, proveedorNombre, onVerDetalles }) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const buttonRef = useRef(null)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const menuItemCount = 2

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
      if (!inButton && !inDropdown) setIsOpen(false)
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
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
    if (action === 'detalles' && onVerDetalles) {
      onVerDetalles()
    } else if (action === 'editar') {
      navigate(`/proveedores/${proveedorId}`)
    }
  }

  const dropdown =
    isOpen && menuStyle ? (
      <div ref={dropdownRef} className="actions-menu-dropdown" style={menuStyle} role="menu">
        <button
          type="button"
          className="actions-menu-item"
          onClick={(e) => handleAction('detalles', e)}
        >
          <i className="bi bi-eye" aria-hidden />
          <span>Ver detalle</span>
        </button>
        <button
          type="button"
          className="actions-menu-item"
          onClick={(e) => handleAction('editar', e)}
        >
          <i className="bi bi-pencil" aria-hidden />
          <span>Editar</span>
        </button>
      </div>
    ) : null

  return (
    <>
      <div className="actions-menu-wrapper" ref={buttonRef}>
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
          aria-label={`Acciones de ${proveedorNombre || 'proveedor'}`}
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

export default ProveedoresActionsMenu
