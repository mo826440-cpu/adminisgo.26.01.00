import { useState, useCallback, useEffect } from 'react'
import { abrirCaja, cerrarCaja, obtenerEstadoCaja } from '../services/caja'

export function useEstadoCaja({ autoLoad = true } = {}) {
  const [estadoCaja, setEstadoCaja] = useState(null)
  const [loadingCaja, setLoadingCaja] = useState(true)
  const [procesandoCaja, setProcesandoCaja] = useState(false)
  const [errorCaja, setErrorCaja] = useState(null)

  const loadEstadoCaja = useCallback(async () => {
    setLoadingCaja(true)
    const { data, error: err } = await obtenerEstadoCaja()
    if (err) {
      setErrorCaja(err.message || 'Error al cargar estado de caja')
    } else {
      setEstadoCaja(data)
      setErrorCaja(null)
    }
    setLoadingCaja(false)
    return { data, error: err }
  }, [])

  useEffect(() => {
    if (autoLoad) loadEstadoCaja()
  }, [autoLoad, loadEstadoCaja])

  const ejecutarAbrirCaja = useCallback(
    async (desglose, observaciones) => {
      setProcesandoCaja(true)
      setErrorCaja(null)
      const { error: err } = await abrirCaja(desglose, observaciones)
      if (err) {
        setErrorCaja(err.message || 'Error al abrir caja')
        setProcesandoCaja(false)
        return { error: err }
      }
      await loadEstadoCaja()
      setProcesandoCaja(false)
      return { error: null }
    },
    [loadEstadoCaja],
  )

  const ejecutarCerrarCaja = useCallback(
    async (observaciones) => {
      setProcesandoCaja(true)
      setErrorCaja(null)
      const { error: err } = await cerrarCaja(observaciones)
      if (err) {
        setErrorCaja(err.message || 'Error al cerrar caja')
        setProcesandoCaja(false)
        return { error: err }
      }
      await loadEstadoCaja()
      setProcesandoCaja(false)
      return { error: null }
    },
    [loadEstadoCaja],
  )

  return {
    estadoCaja,
    loadingCaja,
    procesandoCaja,
    errorCaja,
    setErrorCaja,
    loadEstadoCaja,
    ejecutarAbrirCaja,
    ejecutarCerrarCaja,
  }
}
