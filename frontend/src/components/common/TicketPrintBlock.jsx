import { useMemo } from 'react'
import { useTicketPrintConfig } from '../../context/TicketPrintContext'

/**
 * Bloque reutilizable para tickets en texto plano (<pre>) con config de impresora.
 */
export default function TicketPrintBlock({ plainText, innerRef, className = '' }) {
  const { config, ticketHtml } = useTicketPrintConfig()
  const html = useMemo(() => ticketHtml(plainText), [plainText, ticketHtml, config])

  return (
    <div
      ref={innerRef}
      className={`ticket-print ticket-print--thermal-pre ${className}`.trim()}
      data-ticket-ancho={config.ancho}
      data-ticket-fuente={config.tipoFuente}
      data-ticket-peso={config.pesoFuente}
      translate="no"
    >
      <pre className="ticket-pre-body" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
