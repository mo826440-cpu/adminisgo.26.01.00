import { useEffect } from 'react'
import { useTicketPrintConfig } from '../context/TicketPrintContext'

/**
 * Sincroniza @page y data-attributes antes de imprimir tickets.
 * @deprecated Preferir useTicketPrintConfig() directamente.
 */
export function useTicketPrintFormat() {
  const { config, syncPrintDocument } = useTicketPrintConfig()

  useEffect(() => {
    syncPrintDocument()
  }, [config, syncPrintDocument])
}
