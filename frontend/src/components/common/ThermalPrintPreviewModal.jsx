/**
 * Vista previa del ticket antes de window.print().
 */
import { useEffect, useRef } from 'react'
import Modal from './Modal'
import Button from './Button'
import { useTicketPrintConfig } from '../../context/TicketPrintContext'
import { getTicketAnchoMm } from '../../constants/ticketPrintConfig'
import './ThermalPrintPreviewModal.css'

function ThermalPrintPreviewModal ({
  isOpen,
  onClose,
  sourceRef,
  ariaLabelTicket = 'Vista previa del ticket para impresora térmica'
}) {
  const shellRef = useRef(null)
  const { config } = useTicketPrintConfig()
  const anchoMm = getTicketAnchoMm(config)

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
  }, [isOpen, sourceRef, config.ancho])

  const title = `Vista previa — impresora térmica (${anchoMm} mm)`

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
        Así se verá el rollo térmico según tu configuración ({anchoMm} mm, {config.ancho === 'pos58' ? 32 : 42}{' '}
        columnas). En el diálogo de impresión del navegador el resultado final depende del driver POS.
      </p>
      <div
        className="thermal-preview-gutter"
        role="region"
        aria-label={ariaLabelTicket}
      >
        <div
          className="thermal-preview-frame thermal-preview-frame--pos"
          data-ticket-ancho={config.ancho}
          style={{ maxWidth: `${anchoMm}mm` }}
        >
          <div ref={shellRef} className="thermal-preview-clone-shell" />
        </div>
      </div>
    </Modal>
  )
}

export default ThermalPrintPreviewModal
