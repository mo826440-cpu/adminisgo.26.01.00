import { createContext, useContext } from 'react'

const LayoutChromeContext = createContext(null)

export function LayoutChromeProvider({ children, value }) {
  return <LayoutChromeContext.Provider value={value}>{children}</LayoutChromeContext.Provider>
}

/** Acciones del layout (menú lateral, toolbar del header de módulo, etc.). */
export function useLayoutChrome() {
  const ctx = useContext(LayoutChromeContext)
  if (!ctx) {
    throw new Error('useLayoutChrome debe usarse dentro de Layout')
  }
  return ctx
}
