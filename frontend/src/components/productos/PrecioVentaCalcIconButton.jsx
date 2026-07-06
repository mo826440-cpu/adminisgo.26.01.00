import { useState } from 'react'
import PrecioVentaCalculadoraModal from './PrecioVentaCalculadoraModal'
import './PrecioVentaCalculadora.css'

function PrecioVentaCalcIconButton({
  producto,
  onApply,
  saving = false,
  disabled = false,
  title = 'Calcular precio de venta',
}) {
  const [open, setOpen] = useState(false)

  const handleApply = async (precioVenta) => {
    const ok = await onApply?.(precioVenta)
    if (ok !== false) setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        className="precio-calc-trigger"
        onClick={() => setOpen(true)}
        disabled={disabled || saving}
        title={title}
        aria-label={`${title}: ${producto?.nombre ?? 'producto'}`}
      >
        <i className="bi bi-calculator" aria-hidden />
      </button>
      <PrecioVentaCalculadoraModal
        isOpen={open}
        onClose={() => {
          if (saving) return
          setOpen(false)
        }}
        onApply={handleApply}
        saving={saving}
        precioCompraInitial={producto?.precio_compra}
        precioVentaInitial={producto?.precio_venta}
        intro={
          producto?.nombre ? (
            <>
              Producto: <strong>{producto.nombre}</strong>
            </>
          ) : null
        }
      />
    </>
  )
}

export default PrecioVentaCalcIconButton
