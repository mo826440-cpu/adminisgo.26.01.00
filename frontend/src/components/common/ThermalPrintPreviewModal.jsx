/**
 * Vista previa del ticket antes de window.print().
 * Chrome suele mostrar el diálogo de impresión en miniatura tipo A4; aquí ves el formato POS real (80 mm o A4 según configuración).
 */
import { useEffect, useRef } from 'react'
import Modal from './Modal'
import Button from './Button'
import './ThermalPrintPreviewModal.css'

const STORAGE_KEY = 'formatoImpresion'

function getPrintFormat () {

  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return 'pos80'
  return localStorage.getItem(STORAGE_KEY) || 'pos80'
}

function ThermalPrintPreviewModal ({
  isOpen,
  onClose,
  sourceRef,
  ariaLabelTicket = 'Vista previa del ticket para impresora térmica'
}) {
  const shellRef = useRef(null)

  useEffect(() => {
    if (!isOpen || !shellRef.current) return
    const shell = shellRef.current
    shell.innerHTML = ''

    let cancelled = false
    const id = requestAnimationFrame(() => {
      const src = sourceRef?.current
      if (!src || cancelled) return
      shell.appendChild(src.cloneNode(true))
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(id)
      shell.innerHTML = ''
    }
  }, [isOpen, sourceRef])

  const fmt = isOpen ? getPrintFormat() : 'pos80'
  const frameClass =
    fmt === 'a4'
      ? 'thermal-preview-frame thermal-preview-frame--a4'
      : 'thermal-preview-frame thermal-preview-frame--pos'

  const title =
    fmt === 'a4'
      ? 'Vista previa — tamaño papel (A4)'
      : 'Vista previa — impresora térmica (~80 mm)'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant="default"
      showCloseButton
      closeOnOverlayClick
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={() => {
              onClose()
              requestAnimationFrame(() => {
                requestAnimationFrame(() => window.print())
              })
            }}
          >
            Ir a imprimir…
          </Button>
        </>
      }
    >
      <p className="thermal-preview-hint">
        {fmt === 'a4'
          ? 'Así quedará distribuido el contenido en una página ancha.'
          : 'Así se ve el rollo térmico. En «Imprimir…» Chromium a veces sigue miniaturizando en un rectángulo tipo A4; el resultado en la impresora POS depende del driver y del ancho configurado (~80 mm).'}
      </p>
      <div
        className="thermal-preview-gutter"
        role="region"
        aria-label={ariaLabelTicket}
      >
        <div className={frameClass}>
          <div
            ref={shellRef}
            className="thermal-preview-clone-shell"
          />
        </div>
      </div>
    </Modal>
  )
}

export default ThermalPrintPreviewModal
