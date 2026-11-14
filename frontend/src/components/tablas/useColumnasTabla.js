import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthContext } from '../../context/AuthContext'

/**
 * Preferencias de columnas en localStorage, por usuario, comercio y tabla.
 * Se conservan en este navegador. No hay fila en Supabase.
 * Una columna nueva, que no esté en la lista guardada, queda visible.
 */
function storageKey(comercioId, userId, tablaId) {
  return `adminisgo.columnas.${comercioId || 'sin-comercio'}.${userId || 'anon'}.${tablaId}`
}

function leerOcultas(key, idsValidos) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const lista = Array.isArray(parsed?.ocultas) ? parsed.ocultas : []
    const validos = new Set(idsValidos)
    return [...new Set(lista.map(String))].filter((id) => validos.has(id))
  } catch {
    return []
  }
}

function guardarOcultas(key, ocultas) {
  try {
    localStorage.setItem(key, JSON.stringify({ v: 1, ocultas }))
  } catch {
    /* quota o modo privado */
  }
}

export function useColumnasTabla(tablaId, definiciones) {
  const { usuario } = useAuthContext()
  const ids = definiciones.map((col) => col.id)
  const idsKey = ids.join('|')
  const key = storageKey(usuario?.comercio_id, usuario?.id, tablaId)
  const [ocultas, setOcultas] = useState(() => leerOcultas(key, ids))

  useEffect(() => {
    setOcultas(leerOcultas(key, idsKey.split('|')))
  }, [key, idsKey])

  const esVisible = useCallback(
    (id) => !ocultas.includes(id),
    [ocultas],
  )

  const aplicar = useCallback(
    (siguiente) => {
      const datos = definiciones.filter((col) => col.dato !== false).map((col) => col.id)
      const ocultasDatos = siguiente.filter((id) => datos.includes(id))
      if (datos.length > 0 && ocultasDatos.length >= datos.length) return
      setOcultas(siguiente)
      guardarOcultas(key, siguiente)
    },
    [definiciones, key],
  )

  const toggle = useCallback(
    (id) => {
      aplicar(ocultas.includes(id) ? ocultas.filter((item) => item !== id) : [...ocultas, id])
    },
    [aplicar, ocultas],
  )

  const mostrarTodas = useCallback(() => aplicar([]), [aplicar])

  const restablecer = useCallback(() => {
    try {
      localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
    setOcultas([])
  }, [key])

  const visibles = useMemo(
    () => definiciones.filter((col) => !ocultas.includes(col.id)),
    [definiciones, ocultas],
  )

  return { visibles, ocultas, esVisible, toggle, mostrarTodas, restablecer }
}
