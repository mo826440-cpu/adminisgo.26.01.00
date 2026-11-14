import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, Modal } from '../common'
import '../../pages/ventas/ActionsMenu.css'

const MENU_GAP = 4

function MovimientoAnularMenu({ detalle, confirmText, onAnular }) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const buttonRef = useRef(null)
  const dropdownRef = useRef(null)

  const updateMenuPosition = useCallback(() => {
    const btn = buttonRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const menuH = dropdownRef.current?.offsetHeight || 48
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < menuH + MENU_GAP && rect.top > spaceBelow
    if (openUp) {
      setMenuStyle({
        position: 'fixed',
        right: Math.max(8, window.innerWidth - rect.right),
        bottom: window.innerHeight - rect.top + MENU_GAP,
        top: 'auto',
        left: 'auto',
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
      zIndex: 6000,
    })
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined
    const handleClickOutside = (event) => {
      const inButton = buttonRef.current?.contains(event.target)
      const inDropdown = dropdownRef.current?.contains(event.target)
      if (!inButton && !inDropdown) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    updateMenuPosition()
    window.addEventListener('scroll', updateMenuPosition, true)
    window.addEventListener('resize', updateMenuPosition)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', updateMenuPosition, true)
      window.removeEventListener('resize', updateMenuPosition)
    }
  }, [isOpen, updateMenuPosition])

  const confirmar = async () => {
    setSaving(true)
    setError(null)
    try {
      await onAnular()
      setConfirmOpen(false)
    } catch (err) {
      setError(err?.message || 'No se pudo anular el movimiento.')
    } finally {
      setSaving(false)
    }
  }

  const dropdown =
    isOpen && menuStyle ? (
      <div ref={dropdownRef} className="actions-menu-dropdown" style={menuStyle} role="menu">
        <button
          type="button"
          className="actions-menu-item actions-menu-item-danger"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen(false)
            setError(null)
            setConfirmOpen(true)
          }}
        >
          <i className="bi bi-x-circle" aria-hidden />
          <span>Anular movimiento</span>
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
          title="Acciones del movimiento"
          aria-label={`Acciones de ${detalle || 'movimiento'}`}
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
      <Modal
        isOpen={confirmOpen}
        onClose={() => {
          if (saving) return
          setConfirmOpen(false)
        }}
        title="Anular movimiento"
        closeOnOverlayClick={!saving}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={saving}>
              Volver
            </Button>
            <Button variant="primary" onClick={confirmar} loading={saving} disabled={saving}>
              Anular
            </Button>
          </>
        }
      >
        <p style={{ marginTop: 0 }}>{confirmText}</p>
        {detalle ? (
          <p className="text-secondary" style={{ marginBottom: 0 }}>
            {detalle}
          </p>
        ) : null}
        {error ? (
          <p className="text-danger" style={{ marginBottom: 0 }}>
            {error}
          </p>
        ) : null}
      </Modal>
    </>
  )
}

export default MovimientoAnularMenu
