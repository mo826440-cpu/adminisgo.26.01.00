import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthContext } from './AuthContext'
import { getConfigImpresoras, saveConfigImpresoras } from '../services/configImpresoras'
import {
  DEFAULT_TICKET_PRINT_CONFIG,
  getTicketColsFromConfig,
  mergeTicketPrintConfig,
  readTicketPrintConfigFromStorage,
  writeTicketPrintConfigToStorage,
  getTicketBoldLinePrefixes,
} from '../constants/ticketPrintConfig'
import { thermalPlainTextToHtml } from '../utils/thermalPlainReceipt'

const TicketPrintContext = createContext(null)

const STYLE_ID = 'ticket-print-page-rules'

function syncPrintDocument(config) {
  const cfg = mergeTicketPrintConfig(config)
  if (typeof document === 'undefined') return cfg

  document.documentElement.dataset.printFormat = cfg.ancho
  document.documentElement.dataset.ticketFuente = cfg.tipoFuente
  document.documentElement.dataset.ticketPeso = cfg.pesoFuente

  let el = document.getElementById(STYLE_ID)
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ID
    document.head.appendChild(el)
  }
  const pageSize = cfg.ancho === 'pos58' ? '58mm' : '80mm'
  el.textContent = `@media print { @page { size: ${pageSize} auto; margin: 0; } }`
  return cfg
}

export function TicketPrintProvider({ children }) {
  const { user } = useAuthContext()
  const [config, setConfig] = useState(() => readTicketPrintConfigFromStorage())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    syncPrintDocument(config)
    writeTicketPrintConfigToStorage(config)
  }, [config])

  useEffect(() => {
    const onBeforePrint = () => syncPrintDocument(config)
    window.addEventListener('beforeprint', onBeforePrint)
    return () => window.removeEventListener('beforeprint', onBeforePrint)
  }, [config])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const { data, error } = await getConfigImpresoras()
      if (!cancelled && !error && data) {
        setConfig(data)
      }
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const cols = useMemo(() => getTicketColsFromConfig(config), [config])

  const ticketHtml = useCallback(
    (plainText) => {
      const text = String(plainText ?? '')
      if (config.pesoFuente !== 'bold') {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
      }
      return thermalPlainTextToHtml(text, {
        boldLinePrefixes: getTicketBoldLinePrefixes(),
        boldFirstNonEmptyLine: true,
      })
    },
    [config.pesoFuente]
  )

  const updateConfig = useCallback((partial) => {
    setConfig((prev) => mergeTicketPrintConfig({ ...prev, ...partial }))
  }, [])

  const persistConfig = useCallback(async (partial) => {
    const merged = mergeTicketPrintConfig({ ...config, ...partial })
    setConfig(merged)
    writeTicketPrintConfigToStorage(merged)
    const { data, error } = await saveConfigImpresoras(merged)
    if (error) return { data: null, error }
    if (data) setConfig(data)
    return { data: data || merged, error: null }
  }, [config])

  const value = useMemo(
    () => ({
      config,
      cols,
      loading,
      updateConfig,
      persistConfig,
      ticketHtml,
      syncPrintDocument: () => syncPrintDocument(config),
    }),
    [config, cols, loading, updateConfig, persistConfig, ticketHtml]
  )

  return <TicketPrintContext.Provider value={value}>{children}</TicketPrintContext.Provider>
}

export function useTicketPrintConfig() {
  const ctx = useContext(TicketPrintContext)
  if (!ctx) {
    const fallback = readTicketPrintConfigFromStorage()
    return {
      config: fallback,
      cols: getTicketColsFromConfig(fallback),
      loading: false,
      updateConfig: () => {},
      persistConfig: async () => ({ data: fallback, error: null }),
      ticketHtml: (t) => String(t ?? ''),
      syncPrintDocument: () => syncPrintDocument(fallback),
    }
  }
  return ctx
}

/** @deprecated Usar useTicketPrintConfig */
export function useTicketPrintFormatLegacy() {
  useTicketPrintConfig()
}

export { DEFAULT_TICKET_PRINT_CONFIG }
