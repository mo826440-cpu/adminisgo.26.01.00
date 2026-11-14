import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Modal } from '../../components/common'
import { formatMoneyAR } from '../reportes/reporteVentasUtils'

const METODOS = [
  ['efectivo', 'Efectivo'],
  ['transferencia', 'Transferencia'],
  ['qr', 'QR'],
  ['debito', 'Débito'],
  ['credito', 'Crédito'],
  ['cheque', 'Cheque'],
  ['otro', 'Otro'],
]

function parseMonto(value) {
  return Number(String(value || '').replace(/[^\d,.-]/g, '').replace(',', '.'))
}

function hoyLocal() {
  const ahora = new Date()
  const mes = String(ahora.getMonth() + 1).padStart(2, '0')
  const dia = String(ahora.getDate()).padStart(2, '0')
  return `${ahora.getFullYear()}-${mes}-${dia}`
}

function fechaPagoIso(ymd) {
  const ahora = new Date()
  const hora = String(ahora.getHours()).padStart(2, '0')
  const min = String(ahora.getMinutes()).padStart(2, '0')
  const base = ymd && ymd !== hoyLocal() ? `${ymd}T15:00:00` : `${ymd || hoyLocal()}T${hora}:${min}:00`
  const fecha = new Date(base)
  return Number.isFinite(fecha.getTime()) ? fecha.toISOString() : new Date().toISOString()
}

export function mensajePagoProveedor(pagoData) {
  const imputaciones = pagoData?.imputaciones || []
  const remanente = Number(pagoData?.remanente) || 0
  if (imputaciones.length === 0) {
    return { ok: false, text: 'Este proveedor no tiene saldo pendiente.' }
  }
  if (remanente > 0.009) {
    return {
      ok: true,
      text: `Pago registrado. Quedaron ${formatMoneyAR(remanente)} sin imputar porque superaban la deuda.`,
    }
  }
  return { ok: true, text: 'Pago registrado correctamente.' }
}

function RegistrarPagoProveedorModal({
  isOpen,
  onClose,
  proveedorNombre,
  deudaTotal,
  saving,
  error,
  onDismissError,
  onSubmit,
}) {
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState('efectivo')
  const [fecha, setFecha] = useState(hoyLocal)
  const [observaciones, setObservaciones] = useState('')
  const [localError, setLocalError] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    setMonto('')
    setMetodo('efectivo')
    setFecha(hoyLocal())
    setObservaciones('')
    setLocalError(null)
  }, [isOpen, proveedorNombre])

  const deuda = Math.max(0, Number(deudaTotal) || 0)
  const parsed = parseMonto(monto)
  const montoValido = Number.isFinite(parsed) && parsed > 0
  const aplicado = montoValido ? Math.min(parsed, deuda) : 0
  const saldoDespues = Math.max(0, Math.round((deuda - aplicado) * 100) / 100)
  const sucio = monto !== '' || observaciones !== '' || metodo !== 'efectivo' || fecha !== hoyLocal()

  const pedirCierre = () => {
    if (saving) return
    if (sucio && !window.confirm('Hay datos del pago sin guardar. ¿Cerrar y descartarlos?')) return
    onClose()
  }

  const handleConfirm = () => {
    if (saving) return
    if (deuda <= 0.009) {
      setLocalError('Este proveedor no tiene saldo pendiente. No se registran anticipos.')
      return
    }
    if (!montoValido) {
      setLocalError('Ingresá un monto válido mayor a 0.')
      return
    }
    setLocalError(null)
    onSubmit({
      monto: parsed,
      metodo_pago: metodo,
      observaciones: observaciones.trim() || null,
      fecha_pago: fechaPagoIso(fecha),
    })
  }

  const visibleError = localError || error
  const etiquetaBoton = useMemo(() => {
    if (!montoValido) return 'Registrar pago'
    return `Registrar pago de ${formatMoneyAR(parsed)}`
  }, [montoValido, parsed])

  return (
    <Modal
      isOpen={isOpen}
      onClose={pedirCierre}
      title={proveedorNombre ? `Registrar pago · ${proveedorNombre}` : 'Registrar pago'}
      className="prov-modal-pago"
      closeOnOverlayClick={!saving}
      footer={
        <>
          <Button variant="outline" onClick={pedirCierre} disabled={saving}>Cancelar</Button>
          <Button variant="primary" onClick={handleConfirm} loading={saving} disabled={saving || !montoValido || deuda <= 0.009}>
            {etiquetaBoton}
          </Button>
        </>
      }
    >
      <div className="prov-pago__saldo">
        <span>Saldo pendiente</span>
        <strong>{formatMoneyAR(deuda)}</strong>
      </div>
      {visibleError ? (
        <Alert variant="danger" dismissible onDismiss={() => {
          setLocalError(null)
          onDismissError?.()
        }}>
          {visibleError}
        </Alert>
      ) : null}
      <div className="form-row">
        <div className="form-col">
          <label className="form-label">
            Monto a pagar <span className="required">*</span>
            <input
              className="form-control"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="$0,00"
              inputMode="decimal"
              autoFocus
              disabled={saving}
            />
          </label>
          <button
            type="button"
            className="prov-pago__completo"
            disabled={saving || deuda <= 0.009}
            onClick={() => setMonto(String(deuda).replace('.', ','))}
          >
            Pagar saldo completo
          </button>
        </div>
        <div className="form-col">
          <label className="form-label">
            Fecha
            <input className="form-control" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} disabled={saving} />
          </label>
        </div>
        <div className="form-col">
          <label className="form-label">
            Método <span className="required">*</span>
            <select className="form-control" value={metodo} onChange={(e) => setMetodo(e.target.value)} disabled={saving}>
              {METODOS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <label className="form-label">
        Observaciones (opcional)
        <textarea className="form-control" rows="1" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} disabled={saving} />
      </label>
      <div className="prov-pago__despues">
        <span>Saldo después del pago</span>
        <strong>{formatMoneyAR(saldoDespues)}</strong>
      </div>
      {montoValido && parsed - deuda > 0.009 ? (
        <p className="prov-pago__nota">El excedente no queda a favor: solo se imputa hasta cubrir la deuda.</p>
      ) : null}
      <p className="prov-pago__nota">Se aplicará primero a las compras más antiguas.</p>
    </Modal>
  )
}

export default RegistrarPagoProveedorModal
