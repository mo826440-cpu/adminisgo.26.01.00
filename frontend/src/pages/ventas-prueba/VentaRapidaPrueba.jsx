import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Alert } from '../../components/common'
import { useEstadoCaja } from '../../hooks/useEstadoCaja'
import VentasPruebaToolbar, { VENTAS_PRUEBA_BASE } from '../../components/ventas-prueba/VentasPruebaToolbar'
import VentaRapidaPruebaForm from './VentaRapidaPruebaForm'
import '../../components/ventas-prueba/ventasPrueba.css'
import './VentaRapidaPrueba.css'

function VentaRapidaPrueba() {
  const navigate = useNavigate()
  const formRef = useRef(null)
  const { estadoCaja, loadingCaja, loadEstadoCaja } = useEstadoCaja()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const handleSuccess = useCallback(async () => {
    await loadEstadoCaja()
    navigate(VENTAS_PRUEBA_BASE, {
      state: { success: true, message: 'Venta rápida registrada correctamente' },
    })
  }, [loadEstadoCaja, navigate])

  const handleCancel = useCallback(() => {
    formRef.current?.limpiar?.()
    navigate(VENTAS_PRUEBA_BASE)
  }, [navigate])

  return (
    <Layout>
      <div className="container vp-module vp-rapida-page">
        <VentasPruebaToolbar showNuevaVenta showClientes />

        {error ? (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        ) : null}
        {successMessage ? (
          <Alert variant="success" dismissible onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        ) : null}

        <VentaRapidaPruebaForm
          ref={formRef}
          estadoCaja={loadingCaja ? null : estadoCaja}
          onSuccess={handleSuccess}
          onError={setError}
          onSuccessMessage={setSuccessMessage}
          onCancel={handleCancel}
        />
      </div>
    </Layout>
  )
}

export default VentaRapidaPrueba
