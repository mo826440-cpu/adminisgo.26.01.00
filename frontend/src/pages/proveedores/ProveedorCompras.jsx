import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Alert, Button, Card, Spinner } from '../../components/common'
import { useLayoutChrome } from '../../components/layout/LayoutChromeContext'
import { useAuthContext } from '../../context/AuthContext'
import SelectorColumnas from '../../components/tablas/SelectorColumnas'
import BarraScrollTabla from '../../components/tablas/BarraScrollTabla'
import { useColumnasTabla } from '../../components/tablas/useColumnasTabla'
import { useDateTime } from '../../context/DateTimeContext'
import { getProveedor } from '../../services/proveedores'
import {
  anularPagosCompra,
  cancelarCompra,
  deudaEfectivaCompra,
  getComprasPorProveedorId,
  registrarPagoProveedorDistribuido,
} from '../../services/compras'
import { formatMoneyAR } from '../reportes/reporteVentasUtils'
import {
  addMonths,
  armarFilasMes,
  calcularTotalesCuentaCorriente,
  currentYearMonth,
  esPagoReal,
  formatMonthLabel,
  montoAnuladoDeMovimiento,
  getEstadoCuenta,
  initialsFromNombre,
  listarMesesDisponibles,
  padCuentaNumero,
  parseYearMonthKey,
  yearMonthKey,
} from '../../utils/clienteCuentaCorriente'
import { formatDateTime } from '../../utils/dateFormat'
import { readProveedoresListState } from './proveedoresListState'
import MovimientoAnularMenu from '../../components/cuenta/MovimientoAnularMenu'
import RegistrarPagoProveedorModal, { mensajePagoProveedor } from './RegistrarPagoProveedorModal'
import '../../components/ventas-prueba/VentasPruebaToolbar.css'
import '../clientes/ClientesList.css'
import '../clientes/ClienteCuentaCorriente.css'
import './ProveedorCompras.css'

const COLUMNAS_CUENTA = [
  { id: 'fecha', label: 'Fecha' },
  { id: 'movimiento', label: 'Movimiento' },
  { id: 'comprobante', label: 'Comprobante' },
  { id: 'compra', label: 'Compra' },
  { id: 'pago', label: 'Pago' },
  { id: 'saldo', label: 'Saldo' },
  { id: 'resto', label: 'Pendiente de la orden' },
  { id: 'anulado', label: 'Monto anulado' },
  { id: 'acciones', label: 'Acciones', dato: false },
]

function textoMovimiento(m) {
  if (m.esSaldoAnterior) return 'Saldo inicial'
  if (m.tipo === 'pago') return 'Pago'
  if (m.tipo === 'compra') return 'Compra'
  return m.detalle || '—'
}

function textoComprobante(m) {
  if (m.esSaldoAnterior) return '—'
  if (m.tipo === 'pago') return m.numeroRecibo || '—'
  return m.numeroOrden || '—'
}

const DEUDA_EPS = 0.009

function CuentaChrome({ nombre, periodo }) {
  const { setHeaderOverride } = useLayoutChrome()

  useLayoutEffect(() => {
    const limpio = String(nombre || '').trim()
    if (!limpio) {
      setHeaderOverride(null)
      return undefined
    }
    setHeaderOverride({
      subtitle: periodo ? `${limpio} · ${periodo}` : limpio,
      keepSubtitle: true,
    })
    return () => setHeaderOverride(null)
  }, [nombre, periodo, setHeaderOverride])

  return null
}

function ComprasShortcut({ visible }) {
  const { setToolbarEndOverride } = useLayoutChrome()

  useLayoutEffect(() => {
    if (!visible) {
      setToolbarEndOverride(null)
      return undefined
    }
    setToolbarEndOverride(
      <div className="vp-toolbar">
        <Link to="/compras">
          <Button type="button" variant="outline" className="vp-toolbar__btn" title="Compras">
            <i className="bi bi-cart3" aria-hidden />
            <span className="vp-toolbar__label">Ver compras generales</span>
          </Button>
        </Link>
      </div>,
    )
    return () => setToolbarEndOverride(null)
  }, [setToolbarEndOverride, visible])

  return null
}

function ordenCancelada(compra) {
  return String(compra?.estado || '').toLowerCase() === 'cancelada'
}

function fechaOrdenIso(fecha) {
  const match = String(fecha || '').match(/^(\d{4}-\d{2}-\d{2})/)
  if (!match) return null
  return `${match[1]}T12:00:00`
}

function formatearFechaOrden(fecha) {
  const match = String(fecha || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return '—'
  return `${match[3]}/${match[2]}/${match[1]}`
}

const METODO_LABEL = {
  efectivo: 'efectivo',
  transferencia: 'transferencia',
  qr: 'QR',
  debito: 'débito',
  credito: 'crédito',
  cheque: 'cheque',
  otro: 'otro',
}

/** Igual que la cuenta del cliente: solo el pago hecho en el momento queda en la fila de la orden. */
function pagoVaEnLaOrden(fechaOrden, fechaPago) {
  const orden = new Date(fechaOrdenIso(fechaOrden) || 0).getTime()
  const pago = new Date(fechaPago || 0).getTime()
  if (!Number.isFinite(orden) || !Number.isFinite(pago)) return false
  return Math.abs(pago - orden) <= 2 * 60 * 1000
}

function metodoPagoLabel(codigo) {
  const key = String(codigo || '').toLowerCase()
  return METODO_LABEL[key] || key || 'pago'
}

function reciboPago(pago) {
  return `#P-${padCuentaNumero(pago?.id)}`
}

function detallePagoSaldo(pagos) {
  const first = pagos[0]
  const recibo = pagos.length === 1 ? reciboPago(first) : null
  const obs = String(first?.observaciones || '').trim()
  const metodo = metodoPagoLabel(first?.metodo_pago)
  let base = 'Pago de saldo pendiente'
  if (recibo) base = `${base} · Recibo ${recibo}`
  else if (metodo) base = `${base} · ${metodo}`
  if (obs) base = `${base} · ${obs}`
  return base
}

function buildMovimientos(compras) {
  const raw = []
  const pagosPosteriores = []

  for (const compra of compras || []) {
    const cancelada = ordenCancelada(compra)
    const total = Number(compra.total) || 0
    const numero = String(compra.numero_orden || '').trim()
    const pagos = (compra.compra_pagos || []).filter(esPagoReal)
    const vigentes = pagos.filter((pago) => !pago.anulado_at)
    const anulados = pagos.filter((pago) => pago.anulado_at)
    const enLaOrden = vigentes.filter((pago) => pagoVaEnLaOrden(compra.fecha_orden, pago.fecha_pago))
    const posteriores = vigentes.filter((pago) => !pagoVaEnLaOrden(compra.fecha_orden, pago.fecha_pago))
    const sumaFilas = pagos.reduce((sum, pago) => sum + (Number(pago.monto_pagado) || 0), 0)
    const soloEnCabecera = Math.max(0, (Number(compra.monto_pagado) || 0) - sumaFilas)
    const pagadoEnLaOrden =
      enLaOrden.reduce((sum, pago) => sum + (Number(pago.monto_pagado) || 0), 0) +
      (cancelada ? 0 : soloEnCabecera)
    const pagadoVigente =
      vigentes.reduce((sum, pago) => sum + (Number(pago.monto_pagado) || 0), 0) +
      (cancelada ? 0 : soloEnCabecera)

    raw.push({
      id: `compra-${compra.id}`,
      tipo: 'compra',
      fecha: fechaOrdenIso(compra.fecha_orden),
      fechaOrden: compra.fecha_orden,
      compraId: compra.id,
      cargo: total,
      pago: pagadoEnLaOrden,
      resto: Math.max(0, Math.round((total - pagadoVigente) * 100) / 100),
      deudaActual: cancelada ? 0 : deudaEfectivaCompra(compra),
      anulado: cancelada,
      numeroOrden: numero,
      detalle: numero ? `Compra ${numero}` : 'Compra',
    })

    for (const pago of posteriores) {
      pagosPosteriores.push({ pago, compra, anulado: cancelada })
    }
    for (const pago of anulados) {
      pagosPosteriores.push({ pago, compra, anulado: true })
    }
  }

  const grupos = new Map()
  for (const item of pagosPosteriores) {
    const pago = item.pago
    const instante = new Date(pago.fecha_pago || 0).getTime()
    const marca = Number.isFinite(instante) ? new Date(instante).toISOString() : 'sin-fecha'
    const key = `${marca}|${String(pago.metodo_pago || '')}|${String(pago.observaciones || '')}|${item.anulado ? '1' : '0'}`
    if (!grupos.has(key)) grupos.set(key, [])
    grupos.get(key).push(item)
  }

  for (const grupo of grupos.values()) {
    const first = grupo[0]
    const pagos = grupo.map((item) => item.pago)
    const monto = pagos.reduce((sum, pago) => sum + (Number(pago.monto_pagado) || 0), 0)
    const unico = pagos.length === 1
    raw.push({
      id: `pago-${pagos.map((pago) => pago.id).join('-')}`,
      tipo: 'pago',
      fecha: first.pago.fecha_pago || fechaOrdenIso(first.compra.fecha_orden),
      fechaOrden: null,
      compraId: unico ? first.compra.id : null,
      pagoIds: pagos.map((pago) => pago.id).filter((pagoId) => pagoId != null),
      cargo: 0,
      pago: monto,
      resto: 0,
      deudaActual: 0,
      anulado: Boolean(first.anulado),
      numeroOrden: unico ? String(first.compra.numero_orden || '').trim() : '',
      numeroRecibo: unico ? reciboPago(first.pago) : null,
      detalle: detallePagoSaldo(pagos),
      metodo: first.pago.metodo_pago || '',
      observaciones: first.pago.observaciones || '',
    })
  }

  raw.sort((a, b) => {
    const ta = new Date(a.fecha || 0).getTime()
    const tb = new Date(b.fecha || 0).getTime()
    const fechaA = Number.isFinite(ta) ? ta : 0
    const fechaB = Number.isFinite(tb) ? tb : 0
    if (fechaA !== fechaB) return fechaA - fechaB
    if (a.tipo !== b.tipo) return a.tipo === 'compra' ? -1 : 1
    return String(a.id).localeCompare(String(b.id))
  })

  let saldo = 0
  return raw.map((movimiento) => {
    if (!movimiento.anulado) {
      saldo += (Number(movimiento.cargo) || 0) - (Number(movimiento.pago) || 0)
    }
    return {
      ...movimiento,
      saldo,
      montoAnulado: montoAnuladoDeMovimiento(movimiento),
    }
  })
}

function dashOMonto(valor, className) {
  const n = Number(valor) || 0
  if (Math.abs(n) <= DEUDA_EPS) return <span className="cc-dash">—</span>
  return <span className={className}>{formatMoneyAR(n)}</span>
}

function celdaPendiente(m) {
  if (!m || m.esSaldoAnterior || m.tipo !== 'compra') {
    return <span className="cc-dash">—</span>
  }
  if (m.anulado) return dashOMonto(m.resto, 'cc-money cc-money--resto')
  if (m.resto == null || m.resto === '') return <span className="cc-dash">—</span>
  const n = Number(m.resto)
  if (!Number.isFinite(n)) return <span className="cc-dash">—</span>
  return <span className="cc-money cc-money--resto">{formatMoneyAR(n)}</span>
}

function saldoClass(saldo) {
  const estado = getEstadoCuenta(saldo)
  if (estado === 'debe') return 'cc-money cc-money--deuda'
  if (estado === 'a_favor') return 'cc-money cc-money--favor'
  return 'cc-money cc-money--aldia'
}

function badgeClass(estado) {
  if (estado === 'debe') return 'clientes-badge clientes-badge--debe'
  if (estado === 'a_favor') return 'clientes-badge clientes-badge--a-favor'
  return 'clientes-badge clientes-badge--al-dia'
}

function labelEstado(estado) {
  if (estado === 'debe') return 'PENDIENTE'
  if (estado === 'a_favor') return 'A FAVOR'
  return 'AL DÍA'
}

function ProveedorCompras() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { puedeModulo } = useAuthContext()
  const { timezone } = useDateTime()
  const puedeVerOrden = puedeModulo('compras')
  const puedeRegistrarPago = puedeModulo('compras') || puedeModulo('reportes')
  const columnasCuenta = useColumnasTabla('proveedores.cuenta', COLUMNAS_CUENTA)

  const [proveedor, setProveedor] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [comprasOk, setComprasOk] = useState(false)
  const [tipo, setTipo] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [mesKey, setMesKey] = useState('')
  const [successMessage, setSuccessMessage] = useState(null)
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [pagoSaving, setPagoSaving] = useState(false)
  const [pagoError, setPagoError] = useState(null)

  const listState = location.state?.listState || readProveedoresListState()

  const volverAlListado = useCallback(() => {
    navigate('/proveedores', {
      state: listState ? { restoreList: listState } : {},
    })
  }, [navigate, listState])

  const loadDatos = useCallback(async (options = {}) => {
    const silent = options?.silent === true
    if (!id) return
    setError(null)
    if (!silent) {
      setLoading(true)
      setComprasOk(false)
    }
    const [proveedorRes, comprasRes] = await Promise.all([
      getProveedor(id),
      getComprasPorProveedorId(id),
    ])

    if (proveedorRes.error) {
      setProveedor(null)
      setMovimientos([])
      setError(proveedorRes.error.message || 'No se pudo cargar el proveedor.')
      setLoading(false)
      return
    }

    setProveedor(proveedorRes.data || null)
    if (comprasRes.error) {
      setMovimientos([])
      setError(comprasRes.error.message || 'No se pudieron cargar las compras de este proveedor.')
      setLoading(false)
      return
    }

    setMovimientos(buildMovimientos(comprasRes.data || []))
    setComprasOk(true)
    setLoading(false)
  }, [id])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadDatos()
    }, 0)
    return () => window.clearTimeout(t)
  }, [loadDatos])

  const saldoActual = useMemo(() => {
    for (let i = movimientos.length - 1; i >= 0; i -= 1) {
      if (!movimientos[i].anulado) return Number(movimientos[i].saldo) || 0
    }
    return 0
  }, [movimientos])
  const estadoCuenta = getEstadoCuenta(saldoActual)
  const mesActual = useMemo(() => currentYearMonth(timezone), [timezone])
  const mesesDisponibles = useMemo(
    () => listarMesesDisponibles(movimientos, timezone),
    [movimientos, timezone],
  )
  const mesSeleccionado = parseYearMonthKey(mesKey) || mesActual
  const mesSeleccionadoKey = yearMonthKey(mesSeleccionado)
  const esMesActual =
    mesSeleccionado.year === mesActual.year && mesSeleccionado.month === mesActual.month
  const indiceMes = mesesDisponibles.findIndex((m) => m.key === mesSeleccionadoKey)

  const filas = useMemo(() => {
    const ym = parseYearMonthKey(mesSeleccionadoKey) || currentYearMonth(timezone)
    const base = armarFilasMes(movimientos, ym, { tipo: 'todos', busqueda, timeZone: timezone })
    const opening = base[0]
    const delMes = base.slice(1).filter((m) => {
      if (tipo === 'todos') return true
      if (m.tipo === 'pago') return false
      if (tipo === 'con_deuda') return !m.anulado && Number(m.deudaActual) > DEUDA_EPS
      if (tipo === 'pagadas') return !m.anulado && Number(m.deudaActual) <= DEUDA_EPS
      if (tipo === 'canceladas') return m.tipo === 'compra' && m.anulado
      return true
    })
    return opening ? [opening, ...delMes] : delMes
  }, [movimientos, mesSeleccionadoKey, tipo, busqueda, timezone])

  const totales = useMemo(() => calcularTotalesCuentaCorriente(filas), [filas])
  const filasDelMes = filas.filter((m) => !m.esSaldoAnterior)
  const estadoCierre = getEstadoCuenta(totales.saldoPendiente)
  const sinMovimientos = !loading && comprasOk && movimientos.length === 0
  const sinResultadosFiltro =
    !loading &&
    comprasOk &&
    movimientos.length > 0 &&
    filasDelMes.length === 0 &&
    (busqueda.trim() !== '' || tipo !== 'todos')

  const openPagoModal = () => {
    setPagoError(null)
    setShowPagoModal(true)
  }

  const closePagoModal = () => {
    if (pagoSaving) return
    setShowPagoModal(false)
    setPagoError(null)
  }

  const handleRegistrarPago = async (payload) => {
    if (saldoActual <= 0.009) {
      setPagoError('Este proveedor no tiene saldo pendiente.')
      return
    }
    setPagoError(null)
    setPagoSaving(true)
    const { data: pagoData, error: err } = await registrarPagoProveedorDistribuido({
      proveedorId: id,
      monto: payload.monto,
      metodo_pago: payload.metodo_pago,
      observaciones: payload.observaciones,
      fecha_pago: payload.fecha_pago,
    })
    if (err) {
      setPagoError(err.message || 'No se pudo registrar el pago.')
      setPagoSaving(false)
      await loadDatos({ silent: true })
      return
    }

    const aviso = mensajePagoProveedor(pagoData)
    if (!aviso.ok) {
      setPagoError(aviso.text)
      setPagoSaving(false)
      return
    }

    setPagoSaving(false)
    setShowPagoModal(false)
    setSuccessMessage(aviso.text)
    window.setTimeout(() => setSuccessMessage(null), 5000)
    await loadDatos({ silent: true })
  }

  const anularMovimiento = async (movimiento) => {
    if (movimiento.tipo === 'compra' && movimiento.compraId) {
      const { error: err } = await cancelarCompra(movimiento.compraId)
      if (err) throw err instanceof Error ? err : new Error(err.message || 'No se pudo anular la orden.')
    } else if (movimiento.tipo === 'pago') {
      const { error: err } = await anularPagosCompra(movimiento.pagoIds)
      if (err) throw err instanceof Error ? err : new Error(err.message || 'No se pudo anular el pago.')
    } else {
      throw new Error('Este movimiento no se puede anular.')
    }
    setSuccessMessage('Movimiento anulado. El saldo pendiente ya no lo tiene en cuenta.')
    window.setTimeout(() => setSuccessMessage(null), 5000)
    await loadDatos({ silent: true })
  }

  const menuAnular = (movimiento) => {
    if (movimiento.esSaldoAnterior || movimiento.anulado) return null
    const confirmText =
      movimiento.tipo === 'compra'
        ? 'La orden deja de sumar al saldo pendiente. Si estaba recibida, se revierte el stock.'
        : 'El pago deja de descontar la deuda. Ese monto vuelve al saldo pendiente.'
    return (
      <MovimientoAnularMenu
        detalle={movimiento.detalle}
        confirmText={confirmText}
        onAnular={() => anularMovimiento(movimiento)}
      />
    )
  }

  const irAlMes = (delta) => {
    const next = addMonths(mesSeleccionado, delta)
    const nextKey = yearMonthKey(next)
    const actualKey = yearMonthKey(mesActual)
    if (nextKey > actualKey) return
    if (mesesDisponibles.length && nextKey < mesesDisponibles[0].key) return
    setMesKey(nextKey)
  }

  const fechaCelda = (m) => {
    if (m.esSaldoAnterior) return m.fechaLabel
    if (m.tipo === 'pago') return formatDateTime(m.fecha, 'DD/MM/YYYY HH:mm', timezone)
    return formatearFechaOrden(m.fechaOrden)
  }

  const renderDetalle = (m) => {
    if (m.esSaldoAnterior || m.tipo === 'pago') return m.detalle
    const numero = m.numeroOrden
    const before = 'Compra '
    return (
      <>
        {before}
        {numero && puedeVerOrden && m.compraId ? (
          <Link to={`/compras/${m.compraId}`} className="cc-link cc-link--venta">
            {numero}
          </Link>
        ) : (
          numero || '—'
        )}
      </>
    )
  }

  if (loading) {
    return (
      <Layout>
        <ComprasShortcut visible={puedeVerOrden} />
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando compras del proveedor...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <ComprasShortcut visible={puedeVerOrden} />
      <CuentaChrome
        nombre={proveedor?.nombre_razon_social}
        periodo={mesSeleccionado ? formatMonthLabel(mesSeleccionado) : ''}
      />
      <div className="container cc-page prov-cc-page">
        {successMessage ? (
          <Alert variant="success" dismissible onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        ) : null}

        <header className="cc-topbar">
          <div className="cc-topbar__left">
            <button
              type="button"
              className="cc-back-btn"
              onClick={volverAlListado}
              title="Volver al listado de proveedores"
              aria-label="Volver al listado de proveedores"
            >
              <i className="bi bi-arrow-left" aria-hidden />
            </button>
            <nav className="cc-breadcrumb" aria-label="Ruta">
              <Link
                to="/proveedores"
                state={listState ? { restoreList: listState } : undefined}
                className="cc-breadcrumb__link"
              >
                Proveedores
              </Link>
              <span className="cc-breadcrumb__sep" aria-hidden>
                /
              </span>
              <span className="cc-breadcrumb__current">
                {proveedor?.nombre_razon_social || 'Proveedor'}
              </span>
            </nav>
          </div>
          {proveedor && comprasOk && puedeRegistrarPago && saldoActual > 0.009 ? (
            <div className="cc-topbar__actions">
              <Button variant="primary" onClick={openPagoModal}>
                + Registrar pago
              </Button>
            </div>
          ) : null}
        </header>

        {!proveedor ? (
          <Card>
            <p>No se encontró el proveedor.</p>
            <Button variant="outline" onClick={volverAlListado} style={{ marginTop: '1rem' }}>
              Volver al listado
            </Button>
          </Card>
        ) : (
          <>
            <section className="cc-summary" aria-label="Resumen del proveedor">
              <div className="cc-summary__identity">
                <span className="cc-avatar" aria-hidden>
                  {initialsFromNombre(proveedor.nombre_razon_social)}
                </span>
                <div className="cc-summary__text">
                  <h2 className="cc-summary__name">{proveedor.nombre_razon_social}</h2>
                  {comprasOk ? (
                    <div className="cc-summary__meta">
                      <span className={badgeClass(estadoCuenta)}>{labelEstado(estadoCuenta)}</span>
                      <span className="cc-summary__saldo-label">Saldo actual de la cuenta</span>
                      <strong className={saldoClass(saldoActual)}>{formatMoneyAR(saldoActual)}</strong>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            {comprasOk ? (
              <>
                <div className="cc-filters">
                  <div className="cc-filter cc-filter--mes">
                    <span className="cc-filter__label">
                      <i className="bi bi-calendar3" aria-hidden /> Mes
                    </span>
                    <div className="cc-month-nav">
                      <button
                        type="button"
                        className="cc-month-nav__btn"
                        onClick={() => irAlMes(-1)}
                        disabled={indiceMes <= 0}
                        title="Mes anterior"
                        aria-label="Ver mes anterior"
                      >
                        <i className="bi bi-chevron-left" aria-hidden />
                      </button>
                      <select
                        className="form-control"
                        value={mesSeleccionadoKey}
                        onChange={(e) => setMesKey(e.target.value)}
                        aria-label="Elegir mes del historial"
                      >
                        {mesesDisponibles.map((m) => (
                          <option key={m.key} value={m.key}>
                            {m.label}
                            {m.esActual ? ' (actual)' : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="cc-month-nav__btn"
                        onClick={() => irAlMes(1)}
                        disabled={esMesActual || indiceMes === mesesDisponibles.length - 1}
                        title="Mes siguiente"
                        aria-label="Ver mes siguiente"
                      >
                        <i className="bi bi-chevron-right" aria-hidden />
                      </button>
                    </div>
                  </div>
                  <label className="cc-filter">
                    <span className="cc-filter__label">
                      <i className="bi bi-arrow-left-right" aria-hidden /> Tipo de movimiento
                    </span>
                    <select className="form-control" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                      <option value="todos">Todos</option>
                      <option value="con_deuda">Órdenes con deuda</option>
                      <option value="pagadas">Órdenes pagadas</option>
                      <option value="canceladas">Órdenes canceladas</option>
                    </select>
                  </label>
                  <label className="cc-filter cc-filter--search">
                    <span className="cc-filter__label">
                      <i className="bi bi-search" aria-hidden /> Buscar
                    </span>
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Buscar movimiento"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </label>
                </div>

                <section className="cc-kpis prov-cc-resumen" aria-label="Resumen del período">
                  <article className="cc-kpi">
                    <div>
                      <span className="cc-kpi__label">Saldo inicial</span>
                      <strong className="cc-kpi__value">
                        {formatMoneyAR(filas[0]?.esSaldoAnterior ? filas[0].saldo : 0)}
                      </strong>
                    </div>
                  </article>
                  <article className="cc-kpi cc-kpi--cargo">
                    <div>
                      <span className="cc-kpi__label">Compras del período</span>
                      <strong className="cc-kpi__value cc-money--cargo">{formatMoneyAR(totales.totalCredito)}</strong>
                    </div>
                  </article>
                  <article className="cc-kpi cc-kpi--pago">
                    <div>
                      <span className="cc-kpi__label">Pagos del período</span>
                      <strong className="cc-kpi__value cc-money--pago">{formatMoneyAR(totales.totalCobrado)}</strong>
                    </div>
                  </article>
                  <article className={`cc-kpi cc-kpi--saldo cc-kpi--saldo-${estadoCierre}`}>
                    <div>
                      <span className="cc-kpi__label">
                        {esMesActual ? 'Saldo al cierre del mes' : `Saldo al cierre de ${formatMonthLabel(mesSeleccionado)}`}
                      </span>
                      <strong className={`cc-kpi__value ${saldoClass(totales.saldoPendiente)}`}>
                        {formatMoneyAR(totales.saldoPendiente)}
                      </strong>
                    </div>
                  </article>
                </section>
                <p className="prov-cc-aclaracion">
                  El saldo actual de la cuenta, en la ficha de arriba, incluye todos los meses.
                  Esta fila muestra solo el período elegido.
                </p>
                <div className="prov-cc-tools">
                  <SelectorColumnas
                    columnas={COLUMNAS_CUENTA}
                    ocultas={columnasCuenta.ocultas}
                    onToggle={columnasCuenta.toggle}
                    onMostrarTodas={columnasCuenta.mostrarTodas}
                    onRestablecer={columnasCuenta.restablecer}
                  />
                </div>

                <Card className="cc-table-card">
                  {sinMovimientos ? (
                    <p className="cc-empty">Este proveedor no tiene órdenes de compra.</p>
                  ) : (
                    <>
                      {sinResultadosFiltro ? (
                        <p className="cc-empty cc-empty--inline">
                          No hay órdenes de este mes que coincidan con los filtros. Se mantiene el saldo
                          arrastrado del mes anterior.
                        </p>
                      ) : null}
                      <BarraScrollTabla
                        className="table-container cc-table-wrap"
                        firma={columnasCuenta.ocultas.join(',')}
                      >
                        <table className="table clientes-table-futurist cc-table prov-cc-table">
                          <thead>
                            <tr>
                              {columnasCuenta.esVisible('fecha') ? <th>Fecha</th> : null}
                              {columnasCuenta.esVisible('movimiento') ? <th>Movimiento</th> : null}
                              {columnasCuenta.esVisible('comprobante') ? <th>Comprobante</th> : null}
                              {columnasCuenta.esVisible('compra') ? <th className="cc-th-money">Compra</th> : null}
                              {columnasCuenta.esVisible('pago') ? <th className="cc-th-money">Pago</th> : null}
                              {columnasCuenta.esVisible('saldo') ? <th className="cc-th-money">Saldo</th> : null}
                              {columnasCuenta.esVisible('resto') ? (
                                <th className="cc-th-money" title="Deuda actual de esa orden, ya descontados los pagos imputados que siguen vigentes">
                                  Pendiente de la orden
                                </th>
                              ) : null}
                              {columnasCuenta.esVisible('anulado') ? <th className="cc-th-money">Monto anulado</th> : null}
                              {columnasCuenta.esVisible('acciones') ? <th className="cc-th-actions" aria-label="Acciones" /> : null}
                            </tr>
                          </thead>
                          <tbody>
                            {filas.map((m) => (
                              <tr
                                key={m.id}
                                className={
                                  m.esSaldoAnterior
                                    ? 'cc-row--saldo-anterior'
                                    : m.anulado
                                      ? 'cc-row--anulado'
                                      : undefined
                                }
                              >
                                {columnasCuenta.esVisible('fecha') ? <td className="cc-td-fecha">{fechaCelda(m)}</td> : null}
                                {columnasCuenta.esVisible('movimiento') ? (
                                  <td className="cc-td-detalle">
                                    <span>{textoMovimiento(m)}</span>
                                    {m.anulado ? <span className="cc-anulado-badge">Anulado</span> : null}
                                  </td>
                                ) : null}
                                {columnasCuenta.esVisible('comprobante') ? (
                                  <td>{m.tipo === 'compra' ? renderDetalle(m) : textoComprobante(m)}</td>
                                ) : null}
                                {columnasCuenta.esVisible('compra') ? <td className="cc-td-money">{dashOMonto(m.cargo, 'cc-money cc-money--cargo')}</td> : null}
                                {columnasCuenta.esVisible('pago') ? <td className="cc-td-money">{dashOMonto(m.pago, 'cc-money cc-money--pago')}</td> : null}
                                {columnasCuenta.esVisible('saldo') ? (
                                  <td className="cc-td-money">
                                    <span className={saldoClass(m.saldo)}>{formatMoneyAR(m.saldo)}</span>
                                  </td>
                                ) : null}
                                {columnasCuenta.esVisible('resto') ? <td className="cc-td-money">{celdaPendiente(m)}</td> : null}
                                {columnasCuenta.esVisible('anulado') ? (
                                  <td className="cc-td-money">{dashOMonto(m.montoAnulado, 'cc-money cc-money--anulado')}</td>
                                ) : null}
                                {columnasCuenta.esVisible('acciones') ? <td className="cc-td-actions">{menuAnular(m)}</td> : null}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </BarraScrollTabla>

                      <ul className="cc-cards-list">
                        {filas.map((m) => (
                          <li
                            key={`card-${m.id}`}
                            className={`cc-mov-card${m.esSaldoAnterior ? ' cc-mov-card--saldo-anterior' : ''}${m.anulado ? ' cc-mov-card--anulado' : ''}`}
                          >
                            <div className="cc-mov-card__top">
                              <time className="cc-td-fecha">
                                {fechaCelda(m)}
                              </time>
                              {menuAnular(m)}
                            </div>
                            <p className="cc-mov-card__detalle">
                              {textoMovimiento(m)}
                              {m.anulado ? <span className="cc-anulado-badge">Anulado</span> : null}
                              {' · '}
                              {m.tipo === 'compra' ? renderDetalle(m) : textoComprobante(m)}
                            </p>
                            <dl className="cc-mov-card__amounts">
                              <div>
                                <dt>Compra</dt>
                                <dd>{dashOMonto(m.cargo, 'cc-money cc-money--cargo')}</dd>
                              </div>
                              <div>
                                <dt>Pago</dt>
                                <dd>{dashOMonto(m.pago, 'cc-money cc-money--pago')}</dd>
                              </div>
                              <div>
                                <dt>Pendiente de la orden</dt>
                                <dd>{celdaPendiente(m)}</dd>
                              </div>
                              <div>
                                <dt>Monto anulado</dt>
                                <dd>{dashOMonto(m.montoAnulado, 'cc-money cc-money--anulado')}</dd>
                              </div>
                              <div>
                                <dt>Saldo</dt>
                                <dd>
                                  <span className={saldoClass(m.saldo)}>{formatMoneyAR(m.saldo)}</span>
                                </dd>
                              </div>
                            </dl>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </Card>

              </>
            ) : null}
          </>
        )}
      </div>

      <RegistrarPagoProveedorModal
        isOpen={showPagoModal}
        onClose={closePagoModal}
        proveedorNombre={proveedor?.nombre_razon_social}
        deudaTotal={saldoActual}
        saving={pagoSaving}
        error={pagoError}
        onDismissError={() => setPagoError(null)}
        onSubmit={handleRegistrarPago}
      />
    </Layout>
  )
}

export default ProveedorCompras
