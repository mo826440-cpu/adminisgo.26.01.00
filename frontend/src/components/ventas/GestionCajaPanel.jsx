import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Modal } from '../common'
import { useAuthContext } from '../../context/AuthContext'
import { useDateTime } from '../../context/DateTimeContext'
import { formatDateTime } from '../../utils/dateFormat'
import './GestionCajaPanel.css'

function parsearMoneda(valor) {
  if (!valor || valor === '') return '0'
  const numStr = valor.toString().replace(/\$/g, '').replace(/\./g, '').replace(',', '.')
  const num = parseFloat(numStr) || 0
  return num.toString()
}

function formatearMoneda(valor) {
  const num = Number(valor || 0)
  return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatearNumeroMoneda(valor) {
  if (!valor || valor === '0' || valor === '' || valor === '0.00' || valor === '0.0') return '$0,00'
  let num
  if (typeof valor === 'string' && valor.includes('$')) {
    num = parseFloat(valor.replace(/\$/g, '').replace(/\./g, '').replace(',', '.')) || 0
  } else {
    const cleaned = valor.toString().replace(/[^\d,.-]/g, '').replace(',', '.')
    num = parseFloat(cleaned) || 0
  }
  if (isNaN(num) || num === 0) return '$0,00'
  return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Panel de gestión de caja (indicadores + modales abrir/cerrar).
 * @param {{ estadoCaja: object|null, procesandoCaja?: boolean, onAbrir: Function, onCerrar: Function, onError?: Function, userNombre?: string }} props
 */
function GestionCajaPanel({
  estadoCaja,
  procesandoCaja = false,
  onAbrir,
  onCerrar,
  onError,
}) {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { timezone, dateFormat } = useDateTime()

  const [showAbrirCajaModal, setShowAbrirCajaModal] = useState(false)
  const [showCerrarCajaModal, setShowCerrarCajaModal] = useState(false)
  const [aperturaEfectivo, setAperturaEfectivo] = useState('0')
  const [aperturaVirtual, setAperturaVirtual] = useState('0')
  const [aperturaCredito, setAperturaCredito] = useState('0')
  const [aperturaOtros, setAperturaOtros] = useState('0')
  const [aperturaEditandoCampo, setAperturaEditandoCampo] = useState(null)
  const [aperturaValorRaw, setAperturaValorRaw] = useState('')
  const [showVerMasApertura, setShowVerMasApertura] = useState(false)
  const [observacionesApertura, setObservacionesApertura] = useState('')
  const [observacionesCierre, setObservacionesCierre] = useState('')
  const [showMasCaja, setShowMasCaja] = useState(false)

  const formatearFechaHora = (fecha) => {
    if (!fecha) return '-'
    return formatDateTime(fecha, 'DD/MM/YYYY HH:mm', timezone)
  }

  const resetApertura = () => {
    setAperturaEfectivo('0')
    setAperturaVirtual('0')
    setAperturaCredito('0')
    setAperturaOtros('0')
    setAperturaEditandoCampo(null)
    setAperturaValorRaw('')
    setShowVerMasApertura(false)
    setObservacionesApertura('')
  }

  const handleAbrirCaja = async () => {
    const efectivoStr = aperturaEditandoCampo === 'efectivo' ? aperturaValorRaw : aperturaEfectivo
    const virtualStr = aperturaEditandoCampo === 'virtual' ? aperturaValorRaw : aperturaVirtual
    const creditoStr = aperturaEditandoCampo === 'credito' ? aperturaValorRaw : aperturaCredito
    const otrosStr = aperturaEditandoCampo === 'otros' ? aperturaValorRaw : aperturaOtros
    const efectivo = parseFloat(parsearMoneda(efectivoStr) || 0)
    const virtual = parseFloat(parsearMoneda(virtualStr) || 0)
    const credito = parseFloat(parsearMoneda(creditoStr) || 0)
    const otros = parseFloat(parsearMoneda(otrosStr) || 0)
    if (efectivo < 0 || virtual < 0 || credito < 0 || otros < 0) {
      onError?.('Ningún importe puede ser negativo')
      return
    }
    if (efectivo === 0 && virtual === 0 && credito === 0 && otros === 0) {
      onError?.('Ingresá al menos un importe (efectivo y/o virtual)')
      return
    }

    const { error } = await onAbrir({ efectivo, virtual, credito, otros }, observacionesApertura)
    if (error) {
      onError?.(error.message || 'Error al abrir caja')
      return
    }
    setShowAbrirCajaModal(false)
    resetApertura()
  }

  const handleCerrarCaja = async () => {
    const { error } = await onCerrar(observacionesCierre)
    if (error) {
      onError?.(error.message || 'Error al cerrar caja')
      return
    }
    setShowCerrarCajaModal(false)
    setObservacionesCierre('')
  }

  const renderAperturaInput = (campo, id, label, value, setValue) => (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        className="form-control"
        autoComplete="off"
        inputMode="decimal"
        value={
          aperturaEditandoCampo === campo
            ? aperturaValorRaw
            : value === '0'
              ? ''
              : formatearNumeroMoneda(value)
        }
        onFocus={() => {
          setAperturaEditandoCampo(campo)
          setAperturaValorRaw(value === '0' ? '' : value)
        }}
        onChange={(e) => {
          const valor = e.target.value
          if (/^[\d.,$]*$/.test(valor) || valor === '') setAperturaValorRaw(valor)
        }}
        onBlur={() => {
          const v = parsearMoneda(aperturaValorRaw) || '0'
          setValue(v)
          setAperturaEditandoCampo(null)
          setAperturaValorRaw('')
        }}
        placeholder="$0,00"
        autoFocus={campo === 'efectivo'}
      />
    </div>
  )

  return (
    <>
      <div className="ventas-rapidas-caja-section gestion-caja-panel">
        <Card>
          <div className="caja-header">
            <h2>Gestión de Caja</h2>
            <div className="caja-buttons">
              <Button
                variant="primary"
                onClick={() => setShowAbrirCajaModal(true)}
                disabled={estadoCaja?.cajaAbierta || procesandoCaja}
              >
                Abrir Caja
              </Button>
              <Button variant="outline" onClick={() => navigate('/ventas-rapidas/historial')}>
                Ver Historial
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowCerrarCajaModal(true)}
                disabled={!estadoCaja?.cajaAbierta || procesandoCaja}
              >
                Cerrar Caja
              </Button>
            </div>
          </div>

          <div className="caja-indicators">
            <div className="caja-indicator caja-indicator-inicio">
              <h3>Inicio de Caja</h3>
              {estadoCaja?.inicioCaja ? (
                <>
                  <div className="indicator-value">
                    {formatearMoneda(estadoCaja.inicioCaja.importe)}
                  </div>
                  {estadoCaja.inicioCaja.desglose && (
                    <div className="indicator-desglose">
                      Efectivo {formatearMoneda(estadoCaja.inicioCaja.desglose.efectivo)} · Virtual{' '}
                      {formatearMoneda(estadoCaja.inicioCaja.desglose.virtual)}
                      {(estadoCaja.inicioCaja.desglose.credito > 0 ||
                        estadoCaja.inicioCaja.desglose.otros > 0) && (
                        <>
                          {' '}
                          · Crédito {formatearMoneda(estadoCaja.inicioCaja.desglose.credito)} · Otros{' '}
                          {formatearMoneda(estadoCaja.inicioCaja.desglose.otros)}
                        </>
                      )}
                    </div>
                  )}
                  <div className="indicator-info">
                    Usuario: {estadoCaja.inicioCaja.usuarios?.nombre || user?.nombre || '-'}
                  </div>
                  <div className="indicator-info">
                    {formatearFechaHora(estadoCaja.inicioCaja.fecha_hora)}
                  </div>
                </>
              ) : (
                <div className="indicator-value">$0,00</div>
              )}
            </div>

            {estadoCaja?.estadoActual?.desglose ? (
              <>
                <div className="caja-indicator">
                  <h3>Caja efectivo</h3>
                  <div className="indicator-value">
                    {formatearMoneda(estadoCaja.estadoActual.desglose.efectivo)}
                  </div>
                </div>
                <div className="caja-indicator">
                  <h3>Caja virtual</h3>
                  <div className="indicator-value">
                    {formatearMoneda(estadoCaja.estadoActual.desglose.virtual)}
                  </div>
                </div>
                {showMasCaja ? (
                  <>
                    <div className="caja-indicator">
                      <h3>Caja crédito</h3>
                      <div className="indicator-value">
                        {formatearMoneda(estadoCaja.estadoActual.desglose.credito)}
                      </div>
                    </div>
                    <div className="caja-indicator">
                      <h3>Caja otros</h3>
                      <div className="indicator-value">
                        {formatearMoneda(estadoCaja.estadoActual.desglose.otros)}
                      </div>
                    </div>
                  </>
                ) : null}
                <div className="caja-indicators-ver-mas">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowMasCaja((v) => !v)}>
                    {showMasCaja ? 'Ocultar crédito y otros' : 'Ver crédito y otros'}
                  </Button>
                </div>
              </>
            ) : estadoCaja?.estadoActual ? (
              <div className="caja-indicator">
                <h3>Estado actual</h3>
                <div className="indicator-value">{formatearMoneda(estadoCaja.estadoActual.importe)}</div>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={showAbrirCajaModal}
        onClose={() => {
          setShowAbrirCajaModal(false)
          resetApertura()
        }}
        title="Abrir Caja"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowAbrirCajaModal(false)
                resetApertura()
              }}
              disabled={procesandoCaja}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleAbrirCaja}
              loading={procesandoCaja}
              disabled={procesandoCaja}
            >
              Abrir Caja
            </Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label" htmlFor="modal-apertura-fecha-hora">
            Fecha y Hora (Automático)
          </label>
          <input
            id="modal-apertura-fecha-hora"
            type="text"
            className="form-control"
            value={formatDateTime(new Date().toISOString(), dateFormat, timezone)}
            disabled
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="modal-apertura-usuario">
            Usuario (Automático)
          </label>
          <input
            id="modal-apertura-usuario"
            type="text"
            className="form-control"
            value={user?.nombre || '-'}
            disabled
          />
        </div>
        {renderAperturaInput(
          'efectivo',
          'modal-apertura-efectivo',
          'Caja efectivo ($)',
          aperturaEfectivo,
          setAperturaEfectivo,
        )}
        {renderAperturaInput(
          'virtual',
          'modal-apertura-virtual',
          'Caja virtual ($) — QR, transferencia, débito',
          aperturaVirtual,
          setAperturaVirtual,
        )}
        <div style={{ marginBottom: '0.75rem' }}>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowVerMasApertura((v) => !v)}>
            {showVerMasApertura ? 'Ocultar crédito y otros' : 'Ver crédito y otros'}
          </Button>
        </div>
        {showVerMasApertura ? (
          <>
            {renderAperturaInput(
              'credito',
              'modal-apertura-credito',
              'Caja crédito ($)',
              aperturaCredito,
              setAperturaCredito,
            )}
            {renderAperturaInput(
              'otros',
              'modal-apertura-otros',
              'Caja otros métodos ($) — cheque, otro',
              aperturaOtros,
              setAperturaOtros,
            )}
          </>
        ) : null}
        <div className="form-group">
          <label className="form-label" htmlFor="modal-apertura-observaciones">
            Observaciones (opcional)
          </label>
          <textarea
            id="modal-apertura-observaciones"
            className="form-control"
            rows="3"
            value={observacionesApertura}
            onChange={(e) => setObservacionesApertura(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        isOpen={showCerrarCajaModal}
        onClose={() => {
          setShowCerrarCajaModal(false)
          setObservacionesCierre('')
        }}
        title="Cerrar Caja"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowCerrarCajaModal(false)
                setObservacionesCierre('')
              }}
              disabled={procesandoCaja}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleCerrarCaja}
              loading={procesandoCaja}
              disabled={procesandoCaja}
            >
              Cerrar Caja
            </Button>
          </>
        }
      >
        <p style={{ marginBottom: '0.5rem' }}>¿Estás seguro de que deseas cerrar la caja?</p>
        {estadoCaja?.estadoActual?.desglose && (
          <div
            className="caja-cierre-desglose"
            style={{
              marginBottom: '1rem',
              padding: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.5rem 1.5rem',
                fontSize: '0.95rem',
              }}
            >
              <div>
                <strong>Caja efectivo:</strong>{' '}
                {formatearMoneda(estadoCaja.estadoActual.desglose.efectivo)}
              </div>
              <div>
                <strong>Caja virtual:</strong>{' '}
                {formatearMoneda(estadoCaja.estadoActual.desglose.virtual)}
              </div>
              <div>
                <strong>Caja crédito:</strong>{' '}
                {formatearMoneda(estadoCaja.estadoActual.desglose.credito)}
              </div>
              <div>
                <strong>Caja otros métodos:</strong>{' '}
                {formatearMoneda(estadoCaja.estadoActual.desglose.otros)}
              </div>
            </div>
            <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>
              Total: {formatearMoneda(estadoCaja.estadoActual.importe)}
            </div>
          </div>
        )}
        <div className="form-group">
          <label className="form-label" htmlFor="modal-cierre-observaciones">
            Observaciones (opcional)
          </label>
          <textarea
            id="modal-cierre-observaciones"
            className="form-control"
            rows="3"
            placeholder="Ingresá observaciones sobre el cierre de caja..."
            value={observacionesCierre}
            onChange={(e) => setObservacionesCierre(e.target.value)}
          />
        </div>
      </Modal>
    </>
  )
}

export default GestionCajaPanel
