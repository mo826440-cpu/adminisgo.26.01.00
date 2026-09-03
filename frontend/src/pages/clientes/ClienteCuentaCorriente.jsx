import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Alert, Button, Card, Modal, Spinner } from '../../components/common'
import { useLayoutChrome } from '../../components/layout/LayoutChromeContext'
import { getCliente } from '../../services/clientes'
import { getCuentaCorrientePorClienteId, registrarPagoClienteDistribuido } from '../../services/ventas'
import { formatMoneyAR } from '../reportes/reporteVentasUtils'
import { downloadClienteEstadoCuentaPdf } from '../../utils/clienteMovimientosExport'
import {
  addMonths,
  armarFilasMes,
  buildCuentaCorrienteMovimientos,
  calcularTotalesCuentaCorriente,
  currentYearMonth,
  formatMonthLabel,
  getEstadoCuenta,
  getEstadoCuentaLabel,
  getPeriodoLabel,
  getSaldoActual,
  initialsFromNombre,
  listarMesesDisponibles,
  parseYearMonthKey,
  yearMonthKey,
} from '../../utils/clienteCuentaCorriente'
import { useDateTime } from '../../context/DateTimeContext'
import { formatDateTime } from '../../utils/dateFormat'
import '../../styles/registros-seccion.css'
import '../../components/ventas-prueba/VentasPruebaToolbar.css'
import './ClientesList.css'
import './ClienteCuentaCorriente.css'

function CuentaCorrienteVentasShortcut() {
  const { setToolbarEndOverride } = useLayoutChrome()

  useLayoutEffect(() => {
    setToolbarEndOverride(
      <div className="vp-toolbar">
        <Link to="/ventas">
          <Button type="button" variant="outline" className="vp-toolbar__btn" title="Ventas">
            <i className="bi bi-graph-up-arrow" aria-hidden />
            <span className="vp-toolbar__label">Ventas</span>
          </Button>
        </Link>
      </div>,
    )
    return () => setToolbarEndOverride(null)
  }, [setToolbarEndOverride])

  return null
}

function dashOMonto(valor, className) {
  const n = Number(valor) || 0
  if (Math.abs(n) <= 0.009) return <span className="cc-dash">—</span>
  return <span className={className}>{formatMoneyAR(n)}</span>
}

function saldoClass(saldo) {
  const estado = getEstadoCuenta(saldo)
  if (estado === 'debe') return 'cc-money cc-money--deuda'
  if (estado === 'a_favor') return 'cc-money cc-money--favor'
  return 'cc-money cc-money--aldia'
}

function ClienteCuentaCorriente() {
  const { clienteId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { timezone } = useDateTime()

  const [cliente, setCliente] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const [tipo, setTipo] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [mesKey, setMesKey] = useState('')

  const [showPagoModal, setShowPagoModal] = useState(false)
  const [pagoMonto, setPagoMonto] = useState('')
  const [pagoMetodo, setPagoMetodo] = useState('efectivo')
  const [pagoObs, setPagoObs] = useState('')
  const [pagoSaving, setPagoSaving] = useState(false)
  const [pagoError, setPagoError] = useState(null)

  const listState = location.state?.listState || null

  const volverAlListado = useCallback(() => {
    navigate('/clientes', {
      state: listState ? { restoreList: listState } : {},
    })
  }, [navigate, listState])

  const loadCuenta = useCallback(async () => {
    if (!clienteId) return
    setLoading(true)
    setError(null)
    const [clienteRes, ccRes] = await Promise.all([
      getCliente(clienteId),
      getCuentaCorrientePorClienteId(clienteId),
    ])

    if (clienteRes.error) {
      setError(clienteRes.error.message || 'No se pudo cargar el cliente.')
      setCliente(null)
      setMovimientos([])
      setLoading(false)
      return
    }
    if (ccRes.error) {
      setError(ccRes.error.message || 'No se pudieron cargar los movimientos.')
      setCliente(clienteRes.data || null)
      setMovimientos([])
      setLoading(false)
      return
    }

    setCliente(clienteRes.data || null)
    setMovimientos(buildCuentaCorrienteMovimientos(ccRes.data || {}))
    setLoading(false)
  }, [clienteId])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadCuenta()
    }, 0)
    return () => window.clearTimeout(t)
  }, [loadCuenta])

  useEffect(() => {
    if (!location.state?.success) return undefined
    const t0 = window.setTimeout(() => {
      setSuccessMessage(location.state.message || 'Operación realizada correctamente')
      navigate(location.pathname, {
        replace: true,
        state: { listState: location.state?.listState || null },
      })
    }, 0)
    const t1 = window.setTimeout(() => setSuccessMessage(null), 5000)
    return () => {
      window.clearTimeout(t0)
      window.clearTimeout(t1)
    }
  }, [location.state, navigate, location.pathname])

  const saldoActual = useMemo(() => getSaldoActual(movimientos), [movimientos])
  const estadoCuenta = getEstadoCuenta(saldoActual)
  const estadoLabel = getEstadoCuentaLabel(estadoCuenta)
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
    return armarFilasMes(movimientos, ym, {
      tipo,
      busqueda,
      timeZone: timezone,
    })
  }, [movimientos, mesSeleccionadoKey, tipo, busqueda, timezone])

  const totales = useMemo(() => calcularTotalesCuentaCorriente(filas), [filas])
  const filasDelMes = filas.filter((m) => !m.esSaldoAnterior)
  const estadoCierre = getEstadoCuenta(totales.saldoPendiente)

  const formatearFechaFila = (m) => {
    if (m?.esSaldoAnterior) return m.fechaLabel || '—'
    if (!m?.fecha) return '—'
    return formatDateTime(m.fecha, 'DD/MM/YYYY HH:mm', timezone)
  }

  const irAlMes = (delta) => {
    const next = addMonths(mesSeleccionado, delta)
    const nextKey = yearMonthKey(next)
    const actualKey = yearMonthKey(mesActual)
    if (nextKey > actualKey) return
    if (mesesDisponibles.length && nextKey < mesesDisponibles[0].key) return
    setMesKey(nextKey)
  }

  const openPagoModal = () => {
    setPagoError(null)
    setPagoMonto('')
    setPagoMetodo('efectivo')
    setPagoObs('')
    setShowPagoModal(true)
  }

  const closePagoModal = () => {
    if (pagoSaving) return
    setShowPagoModal(false)
    setPagoError(null)
  }

  const handleRegistrarPago = async () => {
    setPagoError(null)
    const monto = Number(String(pagoMonto || '').replace(/[^\d,.-]/g, '').replace(',', '.'))
    if (!Number.isFinite(monto) || monto <= 0) {
      setPagoError('Ingresá un monto válido mayor a 0.')
      return
    }

    setPagoSaving(true)
    const { error: err } = await registrarPagoClienteDistribuido({
      clienteId,
      monto,
      metodo_pago: pagoMetodo,
      observaciones: pagoObs?.trim() || null,
    })
    if (err) {
      setPagoError(err.message || 'No se pudo registrar el cobro.')
      setPagoSaving(false)
      return
    }

    setPagoSaving(false)
    setShowPagoModal(false)
    setSuccessMessage('Cobro registrado correctamente.')
    window.setTimeout(() => setSuccessMessage(null), 5000)
    await loadCuenta()
  }

  const handleNuevaVenta = () => {
    navigate('/ventas/nueva', {
      state: {
        clienteId: Number(clienteId),
        clienteNombre: cliente?.nombre || '',
        returnTo: `/clientes/${clienteId}/cuenta-corriente`,
        listState,
      },
    })
  }

  const handleDescargarEstado = () => {
    downloadClienteEstadoCuentaPdf(cliente?.nombre, filas, {
      periodoLabel: `Período: ${getPeriodoLabel(mesSeleccionado)}`,
      totalCredito: totales.totalCredito,
      totalCobrado: totales.totalCobrado,
      saldoPendiente: totales.saldoPendiente,
    })
  }

  const sinMovimientos = !loading && !error && movimientos.length === 0
  const sinResultadosFiltro =
    !loading && !error && movimientos.length > 0 && filasDelMes.length === 0 && (busqueda.trim() !== '' || tipo !== 'todos')

  const renderMovimientoDetalle = (m) => {
    const text = String(m.detalle || '—')
    const token = m.tipo === 'venta' ? m.numeroVenta : m.numeroRecibo
    const to = m.ventaId ? `/ventas/${m.ventaId}` : null
    const linkClass = m.tipo === 'cobro' ? 'cc-link cc-link--cobro' : 'cc-link cc-link--venta'
    if (!token || !text.includes(token)) {
      return (
        <>
          {text}
          {m.anulado ? <span className="cc-anulado-badge">Anulado</span> : null}
        </>
      )
    }
    const idx = text.indexOf(token)
    const before = text.slice(0, idx)
    const after = text.slice(idx + token.length)
    return (
      <>
        {before}
        {to ? (
          <Link to={to} className={linkClass}>
            {token}
          </Link>
        ) : (
          token
        )}
        {after}
        {m.anulado ? <span className="cc-anulado-badge">Anulado</span> : null}
      </>
    )
  }

  if (loading) {
    return (
      <Layout>
        <CuentaCorrienteVentasShortcut />
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando cuenta corriente...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <CuentaCorrienteVentasShortcut />
      <div className="container cc-page">
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
              title="Volver al listado de clientes"
              aria-label="Volver al listado de clientes"
            >
              <i className="bi bi-arrow-left" aria-hidden />
            </button>
            <nav className="cc-breadcrumb" aria-label="Ruta">
              <Link
                to="/clientes"
                state={listState ? { restoreList: listState } : undefined}
                className="cc-breadcrumb__link"
              >
                Clientes
              </Link>
              <span className="cc-breadcrumb__sep" aria-hidden>
                /
              </span>
              <span className="cc-breadcrumb__current">{cliente?.nombre || 'Cliente'}</span>
            </nav>
          </div>
          <div className="cc-topbar__actions">
            <Button variant="primary" onClick={openPagoModal}>
              + Registrar cobro
            </Button>
            <Button variant="primary" onClick={handleNuevaVenta}>
              + Nueva venta
            </Button>
            <Button variant="outline" onClick={handleDescargarEstado} disabled={!cliente}>
              <i className="bi bi-cloud-arrow-down" aria-hidden /> Descargar estado
            </Button>
          </div>
        </header>

        {!cliente ? (
          <Card>
            <p>No se encontró el cliente.</p>
            <Button variant="outline" onClick={volverAlListado} style={{ marginTop: '1rem' }}>
              Volver al listado
            </Button>
          </Card>
        ) : (
          <>
            <section className="cc-summary" aria-label="Resumen del cliente">
              <div className="cc-summary__identity">
                <span className="cc-avatar" aria-hidden>
                  {initialsFromNombre(cliente.nombre)}
                </span>
                <div className="cc-summary__text">
                  <h2 className="cc-summary__name">{cliente.nombre}</h2>
                  <div className="cc-summary__meta">
                    <span
                      className={`clientes-badge ${
                        estadoCuenta === 'debe'
                          ? 'clientes-badge--debe'
                          : estadoCuenta === 'a_favor'
                            ? 'clientes-badge--a-favor'
                            : 'clientes-badge--al-dia'
                      }`}
                    >
                      {estadoLabel}
                    </span>
                    <span className="cc-summary__saldo-label">Saldo actual</span>
                    <strong className={saldoClass(saldoActual)}>{formatMoneyAR(saldoActual)}</strong>
                  </div>
                </div>
              </div>
            </section>

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
                  <option value="ventas">Ventas</option>
                  <option value="cobros">Cobros</option>
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

            <Card className="cc-table-card">
              {sinMovimientos ? (
                <p className="cc-empty">Este cliente todavía no tiene movimientos en cuenta corriente.</p>
              ) : (
                <>
                  {sinResultadosFiltro ? (
                    <p className="cc-empty cc-empty--inline">
                      No hay movimientos de este mes que coincidan con los filtros. Se mantiene el saldo
                      arrastrado del mes anterior.
                    </p>
                  ) : null}
                  <div className="table-container cc-table-wrap">
                    <table className="table table-sticky-header clientes-table-futurist cc-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Detalle de la operación</th>
                          <th className="cc-th-money">Cargo / Venta</th>
                          <th className="cc-th-money">Pago / Cobro</th>
                          <th className="cc-th-money">Resto venta</th>
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
                            <td className="cc-td-fecha">{formatearFechaFila(m)}</td>
                            <td className="cc-td-detalle">{renderMovimientoDetalle(m)}</td>
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
                          <time className="cc-td-fecha">{formatearFechaFila(m)}</time>
                        </div>
                        <p className="cc-mov-card__detalle">{renderMovimientoDetalle(m)}</p>
                        <dl className="cc-mov-card__amounts">
                          <div>
                            <dt>Cargo / Venta</dt>
                            <dd>{dashOMonto(m.cargo, 'cc-money cc-money--cargo')}</dd>
                          </div>
                          <div>
                            <dt>Pago / Cobro</dt>
                            <dd>{dashOMonto(m.pago, 'cc-money cc-money--pago')}</dd>
                          </div>
                          <div>
                            <dt>Resto venta</dt>
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

            <section className="cc-kpis" aria-label="Totales de la cuenta">
              <article className="cc-kpi cc-kpi--cargo">
                <div className="cc-kpi__icon" aria-hidden>
                  <i className="bi bi-cart3" />
                </div>
                <div>
                  <span className="cc-kpi__label">Total vendido a crédito</span>
                  <strong className="cc-kpi__value cc-money--cargo">{formatMoneyAR(totales.totalCredito)}</strong>
                </div>
              </article>
              <article className="cc-kpi cc-kpi--pago">
                <div className="cc-kpi__icon" aria-hidden>
                  <i className="bi bi-cash-stack" />
                </div>
                <div>
                  <span className="cc-kpi__label">Total cobrado</span>
                  <strong className="cc-kpi__value cc-money--pago">{formatMoneyAR(totales.totalCobrado)}</strong>
                </div>
              </article>
              <article className={`cc-kpi cc-kpi--saldo cc-kpi--saldo-${estadoCierre}`}>
                <div className="cc-kpi__icon" aria-hidden>
                  <i className="bi bi-wallet2" />
                </div>
                <div>
                  <span className="cc-kpi__label">
                    {esMesActual ? 'Saldo pendiente' : `Saldo al cierre de ${formatMonthLabel(mesSeleccionado)}`}
                  </span>
                  <strong className={`cc-kpi__value ${saldoClass(totales.saldoPendiente)}`}>
                    {formatMoneyAR(totales.saldoPendiente)}
                  </strong>
                </div>
              </article>
            </section>
          </>
        )}
      </div>

      <Modal
        isOpen={showPagoModal}
        onClose={closePagoModal}
        title={cliente ? `Registrar cobro — ${cliente.nombre}` : 'Registrar cobro'}
        closeOnOverlayClick={!pagoSaving}
        footer={
          <>
            <Button variant="outline" onClick={closePagoModal} disabled={pagoSaving}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleRegistrarPago} loading={pagoSaving} disabled={pagoSaving}>
              Registrar cobro
            </Button>
          </>
        }
      >
        {cliente ? (
          <p className="text-secondary" style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>
            <strong>Deuda total:</strong> {formatMoneyAR(saldoActual)}
          </p>
        ) : null}

        {pagoError ? (
          <Alert variant="danger" dismissible onDismiss={() => setPagoError(null)}>
            {pagoError}
          </Alert>
        ) : null}

        <div className="form-row">
          <div className="form-col">
            <label className="form-label">
              Monto abonado
              <input
                className="form-control"
                value={pagoMonto}
                onChange={(e) => setPagoMonto(e.target.value)}
                placeholder="$0,00"
                inputMode="decimal"
                autoFocus
                disabled={pagoSaving}
              />
            </label>
          </div>
          <div className="form-col">
            <label className="form-label">
              Método
              <select
                className="form-control"
                value={pagoMetodo}
                onChange={(e) => setPagoMetodo(e.target.value)}
                disabled={pagoSaving}
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="qr">QR</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
                <option value="cheque">Cheque</option>
                <option value="otro">Otro</option>
              </select>
            </label>
          </div>
        </div>
        <div className="form-row">
          <div className="form-col form-col-full">
            <label className="form-label">
              Observaciones (opcional)
              <textarea
                className="form-control"
                rows="2"
                value={pagoObs}
                onChange={(e) => setPagoObs(e.target.value)}
                disabled={pagoSaving}
              />
            </label>
          </div>
        </div>
        <p className="text-secondary" style={{ margin: '0.5rem 0 0', fontSize: '0.82rem' }}>
          El monto se descuenta automáticamente desde las deudas más antiguas a las más recientes.
        </p>
      </Modal>
    </Layout>
  )
}

export default ClienteCuentaCorriente
