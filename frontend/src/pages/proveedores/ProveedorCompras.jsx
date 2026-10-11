import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Alert, Button, Card, Spinner } from '../../components/common'
import { useLayoutChrome } from '../../components/layout/LayoutChromeContext'
import { useAuthContext } from '../../context/AuthContext'
import { useDateTime } from '../../context/DateTimeContext'
import { getProveedor } from '../../services/proveedores'
import { deudaEfectivaCompra, getComprasPorProveedorId } from '../../services/compras'
import { formatMoneyAR } from '../reportes/reporteVentasUtils'
import {
  addMonths,
  armarFilasMes,
  calcularTotalesCuentaCorriente,
  currentYearMonth,
  formatMonthLabel,
  getEstadoCuenta,
  initialsFromNombre,
  listarMesesDisponibles,
  parseYearMonthKey,
  yearMonthKey,
} from '../../utils/clienteCuentaCorriente'
import { readProveedoresListState } from './proveedoresListState'
import '../../components/ventas-prueba/VentasPruebaToolbar.css'
import '../clientes/ClientesList.css'
import '../clientes/ClienteCuentaCorriente.css'

const DEUDA_EPS = 0.009

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
            <span className="vp-toolbar__label">Compras</span>
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

function buildMovimientos(compras) {
  const sorted = [...(compras || [])].sort((a, b) => {
    const fa = String(a.fecha_orden || '')
    const fb = String(b.fecha_orden || '')
    if (fa !== fb) return fa < fb ? -1 : 1
    return Number(a.id) - Number(b.id)
  })

  let saldo = 0
  return sorted.map((compra) => {
    const cancelada = ordenCancelada(compra)
    const total = Number(compra.total) || 0
    const pagado = Number(compra.monto_pagado) || 0
    const deuda = cancelada ? 0 : deudaEfectivaCompra(compra)
    if (!cancelada) saldo += deuda
    const numero = String(compra.numero_orden || '').trim()
    return {
      id: `compra-${compra.id}`,
      tipo: 'compra',
      fecha: fechaOrdenIso(compra.fecha_orden),
      fechaOrden: compra.fecha_orden,
      compraId: compra.id,
      cargo: cancelada ? 0 : total,
      pago: cancelada ? 0 : pagado,
      resto: deuda,
      anulado: cancelada,
      numeroOrden: numero,
      detalle: numero ? `Compra ${numero}` : 'Compra',
      saldo,
    }
  })
}

function dashOMonto(valor, className) {
  const n = Number(valor) || 0
  if (Math.abs(n) <= DEUDA_EPS) return <span className="cc-dash">—</span>
  return <span className={className}>{formatMoneyAR(n)}</span>
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

  const [proveedor, setProveedor] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [comprasOk, setComprasOk] = useState(false)
  const [tipo, setTipo] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [mesKey, setMesKey] = useState('')

  const listState = location.state?.listState || readProveedoresListState()

  const volverAlListado = useCallback(() => {
    navigate('/proveedores', {
      state: listState ? { restoreList: listState } : {},
    })
  }, [navigate, listState])

  const loadDatos = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    setComprasOk(false)
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
      if (tipo === 'con_deuda') return !m.anulado && Number(m.resto) > DEUDA_EPS
      if (tipo === 'pagadas') return !m.anulado && Number(m.resto) <= DEUDA_EPS
      if (tipo === 'canceladas') return m.anulado
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

  const irAlMes = (delta) => {
    const next = addMonths(mesSeleccionado, delta)
    const nextKey = yearMonthKey(next)
    const actualKey = yearMonthKey(mesActual)
    if (nextKey > actualKey) return
    if (mesesDisponibles.length && nextKey < mesesDisponibles[0].key) return
    setMesKey(nextKey)
  }

  const renderDetalle = (m) => {
    if (m.esSaldoAnterior) return m.detalle
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
        {m.anulado ? <span className="cc-anulado-badge">Cancelada</span> : null}
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
      <div className="container cc-page">
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
                      <span className="cc-summary__saldo-label">Saldo actual</span>
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
                      <i className="bi bi-arrow-left-right" aria-hidden /> Tipo de orden
                    </span>
                    <select className="form-control" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                      <option value="todos">Todos</option>
                      <option value="con_deuda">Con deuda</option>
                      <option value="pagadas">Pagadas</option>
                      <option value="canceladas">Canceladas</option>
                    </select>
                  </label>
                  <label className="cc-filter cc-filter--search">
                    <span className="cc-filter__label">
                      <i className="bi bi-search" aria-hidden /> Buscar
                    </span>
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Buscar orden"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </label>
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
                      <div className="table-container cc-table-wrap">
                        <table className="table table-sticky-header clientes-table-futurist cc-table">
                          <thead>
                            <tr>
                              <th>Fecha</th>
                              <th>Detalle de la operación</th>
                              <th className="cc-th-money">Cargo / Compra</th>
                              <th className="cc-th-money">Pago</th>
                              <th className="cc-th-money">Resto orden</th>
                              <th className="cc-th-money">Saldo pendiente</th>
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
                                <td className="cc-td-fecha">
                                  {m.esSaldoAnterior ? m.fechaLabel : formatearFechaOrden(m.fechaOrden)}
                                </td>
                                <td className="cc-td-detalle">{renderDetalle(m)}</td>
                                <td className="cc-td-money">{dashOMonto(m.cargo, 'cc-money cc-money--cargo')}</td>
                                <td className="cc-td-money">{dashOMonto(m.pago, 'cc-money cc-money--pago')}</td>
                                <td className="cc-td-money">{dashOMonto(m.resto, 'cc-money cc-money--resto')}</td>
                                <td className="cc-td-money">
                                  <span className={saldoClass(m.saldo)}>{formatMoneyAR(m.saldo)}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <ul className="cc-cards-list">
                        {filas.map((m) => (
                          <li
                            key={`card-${m.id}`}
                            className={`cc-mov-card${m.esSaldoAnterior ? ' cc-mov-card--saldo-anterior' : ''}${m.anulado ? ' cc-mov-card--anulado' : ''}`}
                          >
                            <div className="cc-mov-card__top">
                              <time className="cc-td-fecha">
                                {m.esSaldoAnterior ? m.fechaLabel : formatearFechaOrden(m.fechaOrden)}
                              </time>
                            </div>
                            <p className="cc-mov-card__detalle">{renderDetalle(m)}</p>
                            <dl className="cc-mov-card__amounts">
                              <div>
                                <dt>Cargo / Compra</dt>
                                <dd>{dashOMonto(m.cargo, 'cc-money cc-money--cargo')}</dd>
                              </div>
                              <div>
                                <dt>Pago</dt>
                                <dd>{dashOMonto(m.pago, 'cc-money cc-money--pago')}</dd>
                              </div>
                              <div>
                                <dt>Resto orden</dt>
                                <dd>{dashOMonto(m.resto, 'cc-money cc-money--resto')}</dd>
                              </div>
                              <div>
                                <dt>Saldo pendiente</dt>
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

                <section className="cc-kpis" aria-label="Totales de las compras">
                  <article className="cc-kpi cc-kpi--cargo">
                    <div className="cc-kpi__icon" aria-hidden>
                      <i className="bi bi-cart3" />
                    </div>
                    <div>
                      <span className="cc-kpi__label">Total comprado</span>
                      <strong className="cc-kpi__value cc-money--cargo">
                        {formatMoneyAR(totales.totalCredito)}
                      </strong>
                    </div>
                  </article>
                  <article className="cc-kpi cc-kpi--pago">
                    <div className="cc-kpi__icon" aria-hidden>
                      <i className="bi bi-cash-stack" />
                    </div>
                    <div>
                      <span className="cc-kpi__label">Total pagado</span>
                      <strong className="cc-kpi__value cc-money--pago">
                        {formatMoneyAR(totales.totalCobrado)}
                      </strong>
                    </div>
                  </article>
                  <article className={`cc-kpi cc-kpi--saldo cc-kpi--saldo-${estadoCierre}`}>
                    <div className="cc-kpi__icon" aria-hidden>
                      <i className="bi bi-wallet2" />
                    </div>
                    <div>
                      <span className="cc-kpi__label">
                        {esMesActual
                          ? 'Saldo pendiente'
                          : `Saldo al cierre de ${formatMonthLabel(mesSeleccionado)}`}
                      </span>
                      <strong className={`cc-kpi__value ${saldoClass(totales.saldoPendiente)}`}>
                        {formatMoneyAR(totales.saldoPendiente)}
                      </strong>
                    </div>
                  </article>
                </section>
              </>
            ) : null}
          </>
        )}
      </div>
    </Layout>
  )
}

export default ProveedorCompras
