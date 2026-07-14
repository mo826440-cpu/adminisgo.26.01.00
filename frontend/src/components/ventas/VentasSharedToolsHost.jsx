import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Spinner } from '../common'
import { useLayoutChrome } from '../layout/LayoutChromeContext'
import { useAuthContext } from '../../context/AuthContext'
import { useEstadoCaja } from '../../hooks/useEstadoCaja'
import GestionCajaPanel from './GestionCajaPanel'
import FormularioVentaRapidaPanel from './FormularioVentaRapidaPanel'
import './VentasSharedToolsHost.css'

/**
 * Íconos de chrome + paneles de caja y venta rápida (compartidos por /ventas y /ventas-rapidas).
 *
 * @param {{
 *   showNuevaVenta?: boolean,
 *   enableFormHotkeyF2?: boolean,
 *   onVentaRapidaSuccess?: (payload: { venta: object, eraEdicion: boolean }) => void | Promise<void>,
 * }} props
 */
const VentasSharedToolsHost = forwardRef(function VentasSharedToolsHost(
  {
    showNuevaVenta = false,
    enableFormHotkeyF2 = false,
    onVentaRapidaSuccess,
  },
  ref,
) {
  const { setToolbarEndOverride } = useLayoutChrome()
  const { puedeModulo, puedeModuloVentasORapidas } = useAuthContext()
  const puedeHerramientas = !!puedeModuloVentasORapidas?.()
  const puedeVentas = puedeModulo('ventas')

  const {
    estadoCaja,
    loadingCaja,
    procesandoCaja,
    errorCaja,
    setErrorCaja,
    loadEstadoCaja,
    ejecutarAbrirCaja,
    ejecutarCerrarCaja,
  } = useEstadoCaja({ autoLoad: puedeHerramientas })

  const formRef = useRef(null)
  const pendingEditIdRef = useRef(null)
  const [panelCajaAbierto, setPanelCajaAbierto] = useState(false)
  const [panelFormAbierto, setPanelFormAbierto] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const reportError = useCallback((message) => {
    if (message == null) {
      setError(null)
      return
    }
    setError(message)
    setSuccessMessage(null)
  }, [])

  const reportSuccess = useCallback((message) => {
    if (message == null) {
      setSuccessMessage(null)
      return
    }
    setSuccessMessage(message)
    setError(null)
  }, [])

  const abrirFormulario = useCallback(() => {
    setPanelFormAbierto(true)
    setPanelCajaAbierto(false)
    setTimeout(() => formRef.current?.focusForm?.(), 100)
  }, [])

  const iniciarEdicion = useCallback((ventaId) => {
    setPanelCajaAbierto(false)
    setPanelFormAbierto((abierto) => {
      if (abierto) {
        // Formulario ya montado: editar de inmediato
        queueMicrotask(() => formRef.current?.iniciarEdicion?.(ventaId))
        return true
      }
      pendingEditIdRef.current = ventaId
      return true
    })
  }, [])

  useEffect(() => {
    if (!panelFormAbierto) return undefined
    const id = pendingEditIdRef.current
    if (id == null) {
      const t = setTimeout(() => formRef.current?.focusForm?.(), 100)
      return () => clearTimeout(t)
    }
    pendingEditIdRef.current = null
    const t = setTimeout(() => {
      formRef.current?.iniciarEdicion?.(id)
    }, 0)
    return () => clearTimeout(t)
  }, [panelFormAbierto])

  useImperativeHandle(
    ref,
    () => ({
      iniciarEdicion,
      abrirFormulario,
      abrirPanelCaja: () => {
        setPanelCajaAbierto(true)
        setPanelFormAbierto(false)
      },
      refrescarCaja: loadEstadoCaja,
    }),
    [iniciarEdicion, abrirFormulario, loadEstadoCaja],
  )

  useEffect(() => {
    if (!enableFormHotkeyF2 || !puedeHerramientas) return undefined
    const handler = (e) => {
      if (e.key !== 'F2') return
      e.preventDefault()
      setPanelFormAbierto((v) => {
        const next = !v
        if (next) {
          setPanelCajaAbierto(false)
          setTimeout(() => formRef.current?.focusForm?.(), 100)
        }
        return next
      })
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enableFormHotkeyF2, puedeHerramientas])

  useEffect(() => {
    if (!puedeHerramientas) {
      setToolbarEndOverride(null)
      return undefined
    }

    const toolbar = (
      <div className="ventas-shared-tools-toolbar">
        <Button
          type="button"
          variant="outline"
          className={panelCajaAbierto ? 'ventas-shared-tools-toolbar__btn is-active' : 'ventas-shared-tools-toolbar__btn'}
          aria-pressed={panelCajaAbierto}
          aria-label={panelCajaAbierto ? 'Ocultar gestión de caja' : 'Mostrar gestión de caja'}
          title="Gestión de caja"
          onClick={() => {
            setPanelCajaAbierto((v) => {
              const next = !v
              if (next) setPanelFormAbierto(false)
              return next
            })
          }}
        >
          <i className="bi bi-cash-stack" aria-hidden />
          <span className="ventas-shared-tools-toolbar__label">Caja</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className={panelFormAbierto ? 'ventas-shared-tools-toolbar__btn is-active' : 'ventas-shared-tools-toolbar__btn'}
          aria-pressed={panelFormAbierto}
          aria-label={panelFormAbierto ? 'Ocultar venta rápida' : 'Mostrar venta rápida'}
          title="Venta rápida"
          onClick={() => {
            setPanelFormAbierto((v) => {
              const next = !v
              if (next) {
                setPanelCajaAbierto(false)
                setTimeout(() => formRef.current?.focusForm?.(), 100)
              }
              return next
            })
          }}
        >
          <i className="bi bi-lightning-charge" aria-hidden />
          <span className="ventas-shared-tools-toolbar__label">Venta rápida</span>
        </Button>
        {showNuevaVenta && puedeVentas ? (
          <Link to="/ventas/nueva">
            <Button variant="primary">+ Nueva venta</Button>
          </Link>
        ) : null}
      </div>
    )

    setToolbarEndOverride(toolbar)
    return () => setToolbarEndOverride(null)
  }, [
    puedeHerramientas,
    panelCajaAbierto,
    panelFormAbierto,
    showNuevaVenta,
    puedeVentas,
    setToolbarEndOverride,
  ])

  const handleAbrirCaja = useCallback(
    async (desglose, observaciones) => {
      const result = await ejecutarAbrirCaja(desglose, observaciones)
      if (result.error) {
        reportError(result.error.message || 'Error al abrir caja')
        return result
      }
      reportSuccess('Caja abierta correctamente')
      return result
    },
    [ejecutarAbrirCaja, reportError, reportSuccess],
  )

  const handleCerrarCaja = useCallback(
    async (observaciones) => {
      const result = await ejecutarCerrarCaja(observaciones)
      if (result.error) {
        reportError(result.error.message || 'Error al cerrar caja')
        return result
      }
      reportSuccess('Caja cerrada correctamente')
      return result
    },
    [ejecutarCerrarCaja, reportError, reportSuccess],
  )

  const handleFormSuccess = useCallback(
    async (payload) => {
      await loadEstadoCaja()
      await onVentaRapidaSuccess?.(payload)
    },
    [loadEstadoCaja, onVentaRapidaSuccess],
  )

  if (!puedeHerramientas) return null

  const displayError = error || errorCaja

  return (
    <div className="ventas-shared-tools-host">
      {displayError ? (
        <Alert
          variant="danger"
          dismissible
          onDismiss={() => {
            setError(null)
            setErrorCaja?.(null)
          }}
        >
          {displayError}
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert variant="success" dismissible onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      ) : null}

      {loadingCaja && !estadoCaja ? (
        <div className="ventas-shared-tools-host__loading">
          <Spinner size="sm" />
          <span>Cargando estado de caja…</span>
        </div>
      ) : null}

      {panelCajaAbierto ? (
        <GestionCajaPanel
          estadoCaja={estadoCaja}
          procesandoCaja={procesandoCaja}
          onAbrir={handleAbrirCaja}
          onCerrar={handleCerrarCaja}
          onError={reportError}
        />
      ) : null}

      {panelFormAbierto ? (
        <FormularioVentaRapidaPanel
          ref={formRef}
          estadoCaja={estadoCaja}
          onSuccess={handleFormSuccess}
          onError={reportError}
          onSuccessMessage={reportSuccess}
        />
      ) : null}
    </div>
  )
})

export default VentasSharedToolsHost
