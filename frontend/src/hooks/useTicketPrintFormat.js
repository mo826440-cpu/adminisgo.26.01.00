import { useEffect } from 'react'

const STORAGE_KEY = 'formatoImpresion'
const STYLE_ID = 'ticket-print-page-rules'

function syncTicketPrintFormat() {
  const fmt = localStorage.getItem(STORAGE_KEY) || 'pos80'
  document.documentElement.dataset.printFormat = fmt

  let el = document.getElementById(STYLE_ID)
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent =
    fmt === 'a4'
      ? '@media print { @page { size: A4 portrait; margin: 12mm; } }'
      : '@media print { @page { size: 80mm auto; margin: 0; } }'
}

/**
 * En la configuración (`formatoImpresion`): POS 80mm vs A4.
 * Actualiza `@page` y `data-print-format` para que coincida antes de imprimir.
 */
export function useTicketPrintFormat() {
  useEffect(() => {
    syncTicketPrintFormat()
    const onBeforePrint = () => syncTicketPrintFormat()
    window.addEventListener('beforeprint', onBeforePrint)
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint)
      const el = document.getElementById(STYLE_ID)
      if (el) el.remove()
      delete document.documentElement.dataset.printFormat
    }
  }, [])
}
