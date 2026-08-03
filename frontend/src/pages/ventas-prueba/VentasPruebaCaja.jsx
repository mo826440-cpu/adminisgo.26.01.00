import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Alert, Button, Modal, Spinner } from '../../components/common'
import { useAuthContext } from '../../context/AuthContext'
import { useDateTime } from '../../context/DateTimeContext'
import { formatDateTime } from '../../utils/dateFormat'
import { useEstadoCaja } from '../../hooks/useEstadoCaja'
import { getVentas, getResumenVentasDelDia } from '../../services/ventas'
import VentasPruebaToolbar from '../../components/ventas-prueba/VentasPruebaToolbar'
import VpKpiGrid from '../../components/ventas-prueba/VpKpiGrid'
import '../../components/ventas-prueba/ventasPrueba.css'
import './VentasPruebaCaja.css'

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

function todayYmd() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function VentasPruebaCaja() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { timezone, dateFormat } = useDateTime()
  const {
    estadoCaja,
    loadingCaja,
    procesandoCaja,
    errorCaja,
    setErrorCaja,
    ejecutarAbrirCaja,
    ejecutarCerrarCaja,
  } = useEstadoCaja()

  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [ventasDia, setVentasDia] = useState([])
  const [resumenDia, setResumenDia] = useState({ cantidad: 0, total: 0 })
  const [loadingMovs, setLoadingMovs] = useState(true)

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

  const formatearFechaHora = (fecha) => {
    if (!fecha) return '-'
    return formatDateTime(fecha, 'DD/MM/YYYY HH:mm', timezone)
  }

  const loadMovimientos = useCallback(async () => {
    setLoadingMovs(true)
    const ymd = todayYmd()
    const [ventasRes, resumenRes] = await Promise.all([
      getVentas({ fechaDesde: ymd, fechaHasta: ymd }),
      getResumenVentasDelDia(),
    ])
    if (!ventasRes.error) setVentasDia(ventasRes.data || [])
    if (!resumenRes.error && resumenRes.data) setResumenDia(resumenRes.data)
    setLoadingMovs(false)
  }, [])

  useEffect(() => {
    loadMovimientos()
  }, [loadMovimientos, estadoCaja?.cajaAbierta])

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
      setError('Ningún importe puede ser negativo')
      return
    }
    if (efectivo === 0 && virtual === 0 && credito === 0 && otros === 0) {
      setError('Ingresá al menos un importe (efectivo y/o virtual)')
      return
    }
    const { error: err } = await ejecutarAbrirCaja(
      { efectivo, virtual, credito, otros },
      observacionesApertura,
    )
    if (err) {
      setError(err.message || 'Error al abrir caja')
      return
    }
    setShowAbrirCajaModal(false)
    resetApertura()
    setSuccessMessage('Caja abierta correctamente')
    await loadMovimientos()
  }

  const handleCerrarCaja = async () => {
    const { error: err } = await ejecutarCerrarCaja(observacionesCierre)
    if (err) {
      setError(err.message || 'Error al cerrar caja')
      return
    }
    setShowCerrarCajaModal(false)
    setObservacionesCierre('')
    setSuccessMessage('Caja cerrada correctamente')
    await loadMovimientos()
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

  const movimientos = useMemo(() => {
    const rows = []
    let saldo = 0
    if (estadoCaja?.cajaAbierta && estadoCaja.inicioCaja) {
      const importe = Number(estadoCaja.inicioCaja.importe || 0)
      saldo += importe
      rows.push({
        key: `apertura-${estadoCaja.inicioCaja.id}`,
        hora: estadoCaja.inicioCaja.fecha_hora,
        tipo: 'Apertura',
        tipoTone: 'apertura',
        descripcion: 'Apertura de caja',
        entrada: importe,
        salida: 0,
        saldo,
        usuario: estadoCaja.inicioCaja.usuarios?.nombre || user?.nombre || '—',
        link: null,
      })
    }

    const ventasOrdenadas = [...(ventasDia || [])].sort(
      (a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora),
    )
    for (const v of ventasOrdenadas) {
      if (String(v.estado || '').toLowerCase() === 'cancelada') continue
      const cobrado = Number(v.monto_pagado || 0)
      saldo += cobrado
      rows.push({
        key: `venta-${v.id}`,
        hora: v.fecha_hora,
        tipo: 'Venta',
        tipoTone: 'venta',
        descripcion: `Venta ${v.numero_ticket ? `#${v.numero_ticket}` : `V-${v.id}`} — ${v.clientes?.nombre || 'Cliente genérico'}`,
        entrada: cobrado,
        salida: 0,
        saldo,
        usuario: v.usuarios?.nombre || '—',
        link: `/ventas/${v.id}`,
      })
    }
    return rows
  }, [estadoCaja, ventasDia, user?.nombre])

  const totalCaja = Number(estadoCaja?.estadoActual?.importe || 0)
  const inicio = Number(estadoCaja?.inicioCaja?.importe || 0)

  const kpiItems = [
    {
      key: 'estado',
      label: 'Estado de caja',
      value: estadoCaja?.cajaAbierta ? 'Abierta' : 'Cerrada',
      subtext: estadoCaja?.cajaAbierta
        ? `Desde ${formatearFechaHora(estadoCaja.inicioCaja?.fecha_hora)}`
        : 'Sin apertura activa',
      icon: 'bi-briefcase',
      tone: estadoCaja?.cajaAbierta ? 'green' : 'neutral',
    },
    {
      key: 'inicio',
      label: 'Inicio de caja',
      value: formatearMoneda(inicio),
      subtext: estadoCaja?.inicioCaja?.desglose
        ? `Efectivo ${formatearMoneda(estadoCaja.inicioCaja.desglose.efectivo)}`
        : 'Efectivo',
      icon: 'bi-clock-history',
      tone: 'blue',
    },
    {
      key: 'ventas',
      label: 'Ventas del día',
      value: formatearMoneda(resumenDia.total || 0),
      subtext: `${resumenDia.cantidad || 0} ventas`,
      icon: 'bi-cart3',
      tone: 'purple',
    },
    {
      key: 'total',
      label: 'Total en caja',
      value: formatearMoneda(totalCaja),
      subtext: 'Calculado',
      icon: 'bi-safe2',
      tone: 'amber',
    },
    {
      key: 'diff',
      label: 'Diferencia',
      value: formatearMoneda(0),
      subtext: `Esperado: ${formatearMoneda(totalCaja)}`,
      icon: 'bi-sliders',
      tone: 'neutral',
    },
  ]

  const displayError = error || errorCaja

  return (
    <Layout>
      <div className="container vp-module vp-caja-page">
        <VentasPruebaToolbar showNuevaVenta />
        <div className="vp-caja-actions">
          <Button
            variant="primary"
            className="vp-btn-primary"
            onClick={() => setShowAbrirCajaModal(true)}
            disabled={estadoCaja?.cajaAbierta || procesandoCaja || loadingCaja}
          >
            <i className="bi bi-cash-register" aria-hidden /> Abrir caja
          </Button>
          <Button variant="outline" onClick={() => navigate('/ventas-rapidas/historial')}>
            <i className="bi bi-arrow-counterclockwise" aria-hidden /> Ver historial
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowCerrarCajaModal(true)}
            disabled={!estadoCaja?.cajaAbierta || procesandoCaja || loadingCaja}
          >
            <i className="bi bi-lock" aria-hidden /> Cerrar caja
          </Button>
        </div>

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
          <div className="vp-empty">
            <Spinner />
            <p>Cargando estado de caja…</p>
          </div>
        ) : (
          <VpKpiGrid items={kpiItems} />
        )}

        <div className="vp-panel">
          <div className="vp-section-head">
            <h3 className="vp-section-title">Movimientos del día</h3>
            <Link to="/ventas-rapidas/historial" className="vp-caja-link">
              Ver todos los movimientos <i className="bi bi-chevron-right" aria-hidden />
            </Link>
          </div>

          {loadingMovs ? (
            <div className="vp-empty">
              <Spinner size="sm" />
            </div>
          ) : movimientos.length === 0 ? (
            <div className="vp-empty">No hay movimientos registrados hoy.</div>
          ) : (
            <div className="vp-table-wrap">
              <table className="vp-table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Tipo</th>
                    <th>Descripción</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Saldo</th>
                    <th>Usuario</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m) => (
                    <tr key={m.key}>
                      <td>{formatearFechaHora(m.hora)}</td>
                      <td>
                        <span className={`vp-caja-tipo vp-caja-tipo--${m.tipoTone}`}>
                          <span className="vp-caja-tipo__dot" />
                          {m.tipo}
                        </span>
                      </td>
                      <td>{m.descripcion}</td>
                      <td className="vp-money--success">
                        {m.entrada > 0 ? formatearMoneda(m.entrada) : '—'}
                      </td>
                      <td className="vp-money--danger">
                        {m.salida > 0 ? formatearMoneda(m.salida) : '—'}
                      </td>
                      <td className="vp-money">{formatearMoneda(m.saldo)}</td>
                      <td>{m.usuario}</td>
                      <td>
                        {m.link ? (
                          <Link to={m.link} className="vp-caja-row-action" title="Ver detalle">
                            <i className="bi bi-file-earmark-text" />
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="vp-info-banner vp-caja-info">
          <i className="bi bi-info-circle-fill" aria-hidden />
          <div>
            <strong>Información importante</strong>
            <p>
              El saldo de la caja se calcula automáticamente en base a todos los movimientos
              registrados.
            </p>
          </div>
        </div>
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
              className="vp-btn-primary"
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
          <label className="form-label" htmlFor="vp-modal-apertura-fecha">
            Fecha y Hora (Automático)
          </label>
          <input
            id="vp-modal-apertura-fecha"
            type="text"
            className="form-control"
            value={formatDateTime(new Date().toISOString(), dateFormat, timezone)}
            disabled
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="vp-modal-apertura-usuario">
            Usuario (Automático)
          </label>
          <input
            id="vp-modal-apertura-usuario"
            type="text"
            className="form-control"
            value={user?.nombre || '-'}
            disabled
          />
        </div>
        {renderAperturaInput(
          'efectivo',
          'vp-modal-apertura-efectivo',
          'Caja efectivo ($)',
          aperturaEfectivo,
          setAperturaEfectivo,
        )}
        {renderAperturaInput(
          'virtual',
          'vp-modal-apertura-virtual',
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
              'vp-modal-apertura-credito',
              'Caja crédito ($)',
              aperturaCredito,
              setAperturaCredito,
            )}
            {renderAperturaInput(
              'otros',
              'vp-modal-apertura-otros',
              'Caja otros métodos ($) — cheque, otro',
              aperturaOtros,
              setAperturaOtros,
            )}
          </>
        ) : null}
        <div className="form-group">
          <label className="form-label" htmlFor="vp-modal-apertura-obs">
            Observaciones (opcional)
          </label>
          <textarea
            id="vp-modal-apertura-obs"
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
        {estadoCaja?.estadoActual?.desglose ? (
          <div className="vp-caja-cierre-desglose">
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
              <strong>Caja otros:</strong> {formatearMoneda(estadoCaja.estadoActual.desglose.otros)}
            </div>
            <div className="vp-caja-cierre-total">
              Total: {formatearMoneda(estadoCaja.estadoActual.importe)}
            </div>
          </div>
        ) : null}
        <div className="form-group">
          <label className="form-label" htmlFor="vp-modal-cierre-obs">
            Observaciones (opcional)
          </label>
          <textarea
            id="vp-modal-cierre-obs"
            className="form-control"
            rows="3"
            placeholder="Ingresá observaciones sobre el cierre de caja..."
            value={observacionesCierre}
            onChange={(e) => setObservacionesCierre(e.target.value)}
          />
        </div>
      </Modal>
    </Layout>
  )
}

export default VentasPruebaCaja
