import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../../components/common'
import '../ventas/ActionsMenu.css'

const MENU_GAP = 4

function ProveedoresActionsMenu({
  proveedorNombre,
  onVerDetalles,
  onVerCompras,
  onEditar,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const buttonRef = useRef(null)
  const dropdownRef = useRef(null)

  const updateMenuPosition = useCallback(() => {
    const btn = buttonRef.current
    const menu = dropdownRef.current
    if (!btn || !menu) return
    const margen = 8
    const rect = btn.getBoundingClientRect()
    const menuW = Math.min(menu.scrollWidth || 220, window.innerWidth - margen * 2)
    const menuH = menu.offsetHeight || 160
    const spaceBelow = window.innerHeight - rect.bottom - margen
    const spaceAbove = rect.top - margen
    const openUp = spaceBelow < menuH + MENU_GAP && spaceAbove > spaceBelow
    let left = rect.right - menuW
    left = Math.max(margen, Math.min(left, window.innerWidth - menuW - margen))
    const maxHeight = Math.max(96, (openUp ? spaceAbove : spaceBelow) - MENU_GAP)
    const top = openUp
      ? Math.max(margen, rect.top - Math.min(menuH, maxHeight) - MENU_GAP)
      : Math.min(rect.bottom + MENU_GAP, window.innerHeight - margen - Math.min(menuH, maxHeight))
    setMenuStyle({
      position: 'fixed',
      left,
      top,
      right: 'auto',
      bottom: 'auto',
      width: menuW,
      maxHeight,
      overflowY: 'auto',
      zIndex: 6000,
      visibility: 'visible',
    })
  }, [])

  useLayoutEffect(() => {
    if (!isOpen) return undefined
    updateMenuPosition()
    return undefined
  }, [isOpen, updateMenuPosition])

  useEffect(() => {
    if (!isOpen) return undefined
    const handleClickOutside = (event) => {
      if (buttonRef.current?.contains(event.target) || dropdownRef.current?.contains(event.target)) return
      setIsOpen(false)
    }
    const handleKey = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    window.addEventListener('scroll', updateMenuPosition, true)
    window.addEventListener('resize', updateMenuPosition)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
      window.removeEventListener('scroll', updateMenuPosition, true)
      window.removeEventListener('resize', updateMenuPosition)
    }
  }, [isOpen, updateMenuPosition])

  const elegir = (accion, event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsOpen(false)
    if (accion === 'detalle') onVerDetalles?.()
    if (accion === 'cuenta') onVerCompras?.()
    if (accion === 'editar') onEditar?.()
  }

  const dropdown = isOpen ? (
    <div
      ref={dropdownRef}
      className="actions-menu-dropdown prov-actions-dropdown"
      style={menuStyle || {
        position: 'fixed',
        left: 8,
        top: 8,
        right: 'auto',
        width: 'max-content',
        visibility: 'hidden',
      }}
      role="menu"
    >
      <button type="button" className="actions-menu-item" role="menuitem" onClick={(e) => elegir('detalle', e)}>
        <i className="bi bi-eye" aria-hidden />
        <span>Ver detalle</span>
      </button>
      <button type="button" className="actions-menu-item" role="menuitem" onClick={(e) => elegir('cuenta', e)}>
        <i className="bi bi-journal-text" aria-hidden />
        <span>Ver cuenta corriente</span>
      </button>
      <button type="button" className="actions-menu-item" role="menuitem" onClick={(e) => elegir('editar', e)}>
        <i className="bi bi-pencil" aria-hidden />
        <span>Editar proveedor</span>
      </button>
    </div>
  ) : null

  return (
    <>
      <div className="actions-menu-wrapper" ref={buttonRef}>
        <Button
          variant="ghost"
          size="sm"
          className="actions-menu-button"
          title="Más acciones"
          aria-label={`Más acciones de ${proveedorNombre || 'proveedor'}`}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen((prev) => !prev)
          }}
        >
          <i className="bi bi-three-dots-vertical" aria-hidden />
        </Button>
      </div>
      {typeof document !== 'undefined' && dropdown ? createPortal(dropdown, document.body) : null}
    </>
  )
}

export default ProveedoresActionsMenu
