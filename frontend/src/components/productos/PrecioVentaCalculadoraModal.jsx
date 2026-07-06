import { useCallback, useState } from 'react'
import { Button, Modal } from '../common'
import PrecioVentaCalculadoraForm from './PrecioVentaCalculadoraForm'
import './PrecioVentaCalculadora.css'

function PrecioVentaCalculadoraModal({
  isOpen,
  onClose,
  onApply,
  title = 'Calcular precio de venta',
  intro,
  precioCompraInitial,
  precioVentaInitial,
  porcentajeInitial,
  saving = false,
  applyLabel = 'Aplicar cambio',
}) {
  const [calcState, setCalcState] = useState({ precioVenta: NaN, valid: false })

  const handleChange = useCallback((payload) => {
    setCalcState({ precioVenta: payload.precioVenta, valid: payload.valid })
  }, [])

  const handleApply = () => {
    if (!calcState.valid || saving) return
    onApply?.(calcState.precioVenta)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      closeOnOverlayClick={!saving}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar cambio
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            loading={saving}
            disabled={saving || !calcState.valid}
          >
            {applyLabel}
          </Button>
        </>
      }
    >
      <PrecioVentaCalculadoraForm
        key={isOpen ? `${precioCompraInitial}-${precioVentaInitial}` : 'closed'}
        idPrefix="precio-calc-modal"
        intro={intro}
        precioCompraInitial={precioCompraInitial}
        precioVentaInitial={precioVentaInitial}
        porcentajeInitial={porcentajeInitial}
        onChange={handleChange}
      />
    </Modal>
  )
}

export default PrecioVentaCalculadoraModal
