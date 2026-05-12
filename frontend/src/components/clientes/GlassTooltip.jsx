import { useRef, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './GlassTooltip.css'

const GAP = 10
const VIEW_MARGIN = 10
const ESTIMATE_H = 132
const PANEL_MAX_W = 320

/**
 * Tooltip flotante estilo glassmorphism (sin `title` nativo).
 * Colocación `auto`: si no hay espacio arriba, abre hacia abajo.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children — nodo ancla (un solo elemento o texto envuelto)
 * @param {import('react').ReactNode} props.content
 * @param {'auto'|'top'|'bottom'} [props.placement]
 * @param {boolean} [props.anchorInteractive] — cursor help
 */
function GlassTooltip({ children, content, placement = 'auto', anchorInteractive = true }) {
  const anchorRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ left: 0, top: null, bottom: null, place: 'bottom' })

  const updatePosition = useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const spaceAbove = rect.top
    const spaceBelow = window.innerHeight - rect.bottom
    let place = placement
    if (placement === 'auto') {
      place =
        spaceAbove >= ESTIMATE_H + GAP + VIEW_MARGIN || spaceAbove > spaceBelow ? 'top' : 'bottom'
    }
    const centerX = rect.left + rect.width / 2
    const halfW = Math.min(PANEL_MAX_W, window.innerWidth - 2 * VIEW_MARGIN) / 2
    const left = Math.min(
      window.innerWidth - VIEW_MARGIN - halfW * 2,
      Math.max(VIEW_MARGIN, centerX - halfW)
    )
    if (place === 'top') {
      setCoords({
        left,
        top: null,
        bottom: window.innerHeight - rect.top + GAP,
        place: 'top',
      })
    } else {
      setCoords({
        left,
        top: rect.bottom + GAP,
        bottom: null,
        place: 'bottom',
      })
    }
  }, [placement])

  const handleEnter = () => {
    updatePosition()
    setOpen(true)
  }

  const handleLeave = () => {
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const fn = () => updatePosition()
    window.addEventListener('scroll', fn, true)
    window.addEventListener('resize', fn)
    return () => {
      window.removeEventListener('scroll', fn, true)
      window.removeEventListener('resize', fn)
    }
  }, [open, updatePosition])

  const panel = open && (
    <div
      className={`glass-tooltip__panel ${open ? 'glass-tooltip__panel--open' : ''}`}
      data-placement={coords.place}
      style={{
        left: coords.left,
        top: coords.top ?? undefined,
        bottom: coords.bottom ?? undefined,
        maxWidth: PANEL_MAX_W,
      }}
      role="tooltip"
    >
      {content}
    </div>
  )

  return (
    <>
      <span
        ref={anchorRef}
        className={`glass-tooltip__anchor ${anchorInteractive ? 'glass-tooltip__anchor--interactive' : ''}`}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
      >
        {children}
      </span>
      {typeof document !== 'undefined' && createPortal(panel, document.body)}
    </>
  )
}

export default GlassTooltip
