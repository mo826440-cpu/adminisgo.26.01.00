import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { useLayoutChrome } from '../../components/layout/LayoutChromeContext'
import { useAuthContext } from '../../context/AuthContext'
import { Card, Button, Spinner, Alert, Pagination } from '../../components/common'
import { getProveedores } from '../../services/proveedores'
import { getMapaDeudaPorProveedorIds, registrarPagoProveedorDistribuido } from '../../services/compras'
import { formatMoneyAR } from '../reportes/reporteVentasUtils'
import SelectorColumnas from '../../components/tablas/SelectorColumnas'
import BarraScrollTabla from '../../components/tablas/BarraScrollTabla'
import { useColumnasTabla } from '../../components/tablas/useColumnasTabla'
import ProveedoresActionsMenu from './ProveedoresActionsMenu'
import ProveedorDetalleModal from './ProveedorDetalleModal'
import RegistrarPagoProveedorModal, { mensajePagoProveedor } from './RegistrarPagoProveedorModal'
import { readProveedoresListState, writeProveedoresListState } from './proveedoresListState'
import './ProveedoresList.css'
import '../../components/ventas-prueba/VentasPruebaToolbar.css'

const COLUMNAS = [
  { id: 'proveedor', label: 'Proveedor' },
  { id: 'cuit', label: 'CUIT' },
  { id: 'contacto', label: 'Contacto' },
  { id: 'telefono', label: 'Teléfono' },
  { id: 'email', label: 'Email' },
  { id: 'saldo', label: 'Saldo pendiente' },
  { id: 'estado', label: 'Estado del proveedor' },
  { id: 'deuda', label: 'Estado de deuda' },
  { id: 'acciones', label: 'Acciones', dato: false },
]

function textoCantidad(n) {
  return n === 1 ? '1 proveedor encontrado' : `${n} proveedores encontrados`
}

function segundaLinea(proveedor) {
  return proveedor.contacto_principal?.trim() || ''
}

function BarraProveedores({ puedeCompras }) {
  const { setToolbarEndOverride } = useLayoutChrome()

  useLayoutEffect(() => {
    setToolbarEndOverride(
      <div className="vp-toolbar">
        {puedeCompras ? (
          <Link to="/compras">
            <Button type="button" variant="outline" className="vp-toolbar__btn" title="Ver compras generales">
              <i className="bi bi-cart3" aria-hidden />
              <span className="vp-toolbar__label">Ver compras generales</span>
            </Button>
          </Link>
        ) : null}
        <Link to="/proveedores/nuevo">
          <Button variant="primary" className="vp-toolbar__btn vp-toolbar__btn--primary">
            <i className="bi bi-plus-lg" aria-hidden />
            <span className="vp-toolbar__label">Nuevo proveedor</span>
          </Button>
        </Link>
      </div>,
    )
    return () => setToolbarEndOverride(null)
  }, [puedeCompras, setToolbarEndOverride])

  return null
}

function ProveedoresList() {
  const location = useLocation()
  const navigate = useNavigate()
  const { puedeModulo } = useAuthContext()
  const puedeCompras = puedeModulo('compras')
  const puedeRegistrarPago = puedeModulo('compras') || puedeModulo('reportes')
  const columnas = useColumnasTabla('proveedores.listado', COLUMNAS)
  const inicial = useRef(readProveedoresListState()).current
  const origenDetalle = useRef(null)

  const [proveedores, setProveedores] = useState([])
  const [mapaDeuda, setMapaDeuda] = useState(() => new Map())
  const [loading, setLoading] = useState(true)
  const [loadingDeudas, setLoadingDeudas] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState(inicial.searchTerm)
  const [successMessage, setSuccessMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(inicial.currentPage)
  const [pageSize, setPageSize] = useState(inicial.pageSize)
  const [filtroDeuda, setFiltroDeuda] = useState(inicial.filtroDeuda)
  const [filtroEstado, setFiltroEstado] = useState(inicial.filtroEstado)
  const [orden, setOrden] = useState(inicial.orden)
  const [detalleProveedor, setDetalleProveedor] = useState(null)
  const [pagoProveedor, setPagoProveedor] = useState(null)
  const [pagoSaving, setPagoSaving] = useState(false)
  const [pagoError, setPagoError] = useState(null)
  const [highlightId, setHighlightId] = useState(null)

  const listState = useMemo(
    () => ({ searchTerm, currentPage, pageSize, filtroDeuda, filtroEstado, orden }),
    [searchTerm, currentPage, pageSize, filtroDeuda, filtroEstado, orden],
  )

  const loadProveedores = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getProveedores({ incluirInactivos: true })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    setProveedores(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadProveedores()
    }, 0)
    return () => window.clearTimeout(t)
  }, [loadProveedores])

  useEffect(() => {
    const incoming = location.state
    if (!incoming?.success && !incoming?.highlightId && !incoming?.restoreList) return undefined
    const t0 = window.setTimeout(() => {
      if (incoming.restoreList) {
        const next = { ...readProveedoresListState(), ...incoming.restoreList }
        setSearchTerm(next.searchTerm || '')
        setCurrentPage(Number(next.currentPage) > 0 ? Number(next.currentPage) : 1)
        if ([25, 50, 100].includes(Number(next.pageSize))) setPageSize(Number(next.pageSize))
        if (next.filtroDeuda) setFiltroDeuda(next.filtroDeuda)
        if (next.filtroEstado) setFiltroEstado(next.filtroEstado)
        if (next.orden) setOrden(next.orden)
        writeProveedoresListState(next)
        if (Number(next.scrollY) > 0) window.scrollTo(0, Number(next.scrollY))
      }
      if (incoming.success) setSuccessMessage(incoming.message || 'Operación realizada correctamente')
      if (incoming.highlightId) setHighlightId(incoming.highlightId)
      navigate(location.pathname, { replace: true, state: {} })
    }, 0)
    return () => window.clearTimeout(t0)
  }, [location.state, navigate, location.pathname])

  useEffect(() => {
    if (!highlightId && !successMessage) return undefined
    const t = window.setTimeout(() => {
      setSuccessMessage(null)
      setHighlightId(null)
    }, 5000)
    return () => window.clearTimeout(t)
  }, [highlightId, successMessage])

  useEffect(() => {
    writeProveedoresListState({ ...listState, scrollY: window.scrollY })
  }, [listState])

  useEffect(() => {
    const onScroll = () => writeProveedoresListState({ scrollY: window.scrollY })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let cancelled = false
    const t = window.setTimeout(() => {
      if (!proveedores.length) {
        if (!cancelled) {
          setMapaDeuda(new Map())
          setLoadingDeudas(false)
        }
        return
      }
      setLoadingDeudas(true)
      void (async () => {
        const map = await getMapaDeudaPorProveedorIds(proveedores.map((p) => p.id))
        if (!cancelled) {
          setMapaDeuda(map)
          setLoadingDeudas(false)
        }
      })()
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [proveedores])

  const deudaDe = useCallback(
    (proveedor) => mapaDeuda.get(Number(proveedor.id)) || 0,
    [mapaDeuda],
  )

  const resumen = useMemo(() => {
    let conDeuda = 0
    let total = 0
    for (const proveedor of proveedores) {
      const saldo = deudaDe(proveedor)
      if (saldo > 0.009) {
        conDeuda += 1
        total += saldo
      }
    }
    return { total: proveedores.length, conDeuda, monto: total }
  }, [proveedores, deudaDe])

  const filtrados = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const lista = proveedores.filter((proveedor) => {
      const saldo = deudaDe(proveedor)
      const activo = proveedor.activo !== false
      if (filtroEstado === 'activos' && !activo) return false
      if (filtroEstado === 'inactivos' && activo) return false
      if (filtroDeuda === 'con_deuda' && saldo <= 0.009) return false
      if (filtroDeuda === 'sin_deuda' && saldo > 0.009) return false
      if (!q) return true
      const bolsa = [
        proveedor.nombre_razon_social,
        proveedor.email,
        proveedor.telefono,
        proveedor.cuit_rut,
        proveedor.contacto_principal,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return bolsa.includes(q)
    })
    lista.sort((a, b) => {
      if (orden === 'deuda') {
        const diff = deudaDe(b) - deudaDe(a)
        if (Math.abs(diff) > 0.009) return diff
      }
      return String(a.nombre_razon_social || '').localeCompare(String(b.nombre_razon_social || ''), 'es')
    })
    return lista
  }, [proveedores, searchTerm, filtroDeuda, filtroEstado, orden, deudaDe])

  const totalItems = filtrados.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const page = Math.min(currentPage, totalPages)
  const startIndex = (page - 1) * pageSize
  const visibles = filtrados.slice(startIndex, startIndex + pageSize)
  const hayFiltros = Boolean(searchTerm.trim()) || filtroDeuda !== 'todos' || filtroEstado !== 'activos' || orden !== 'nombre'

  useEffect(() => {
    if (currentPage !== page) setCurrentPage(page)
  }, [currentPage, page])

  useEffect(() => {
    if (!highlightId) return undefined
    const nodo = document.getElementById(`proveedor-fila-${highlightId}`)
    nodo?.scrollIntoView({ block: 'center' })
    return undefined
  }, [highlightId, visibles])

  const limpiarFiltros = () => {
    setSearchTerm('')
    setFiltroDeuda('todos')
    setFiltroEstado('activos')
    setOrden('nombre')
    setCurrentPage(1)
  }

  const refrescarDeudas = useCallback(async () => {
    if (!proveedores.length) {
      setMapaDeuda(new Map())
      return
    }
    setLoadingDeudas(true)
    const map = await getMapaDeudaPorProveedorIds(proveedores.map((p) => p.id))
    setMapaDeuda(map)
    setLoadingDeudas(false)
  }, [proveedores])

  const abrirCompras = (proveedor) => {
    const state = { ...listState, scrollY: window.scrollY }
    writeProveedoresListState(state)
    navigate(`/proveedores/${proveedor.id}/compras`, { state: { listState: state } })
  }

  const abrirDetalle = (proveedor) => {
    origenDetalle.current = document.activeElement
    setDetalleProveedor(proveedor)
  }

  const cerrarDetalle = () => {
    setDetalleProveedor(null)
    const origen = origenDetalle.current
    window.setTimeout(() => origen?.focus?.(), 0)
  }

  const editar = (proveedor) => {
    const state = { ...listState, scrollY: window.scrollY }
    writeProveedoresListState(state)
    navigate(`/proveedores/${proveedor.id}`, { state: { listState: state } })
  }

  const closePagoModal = () => {
    if (pagoSaving) return
    setPagoProveedor(null)
    setPagoError(null)
  }

  const handleRegistrarPago = async (payload) => {
    if (!pagoProveedor || pagoSaving) return
    if (deudaDe(pagoProveedor) <= 0.009) {
      setPagoError('Este proveedor no tiene saldo pendiente.')
      return
    }
    setPagoError(null)
    setPagoSaving(true)
    const { data: pagoData, error: err } = await registrarPagoProveedorDistribuido({
      proveedorId: pagoProveedor.id,
      monto: payload.monto,
      metodo_pago: payload.metodo_pago,
      observaciones: payload.observaciones,
      fecha_pago: payload.fecha_pago,
    })
    if (err) {
      setPagoError(err.message || 'No se pudo registrar el pago.')
      setPagoSaving(false)
      await refrescarDeudas()
      return
    }
    const aviso = mensajePagoProveedor(pagoData)
    if (!aviso.ok) {
      setPagoError(aviso.text)
      setPagoSaving(false)
      return
    }
    await refrescarDeudas()
    setPagoSaving(false)
    setPagoProveedor(null)
    setSuccessMessage(aviso.text)
    window.setTimeout(() => setSuccessMessage(null), 5000)
  }

  if (loading) {
    return (
      <Layout>
        <BarraProveedores puedeCompras={puedeCompras} />
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando proveedores...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <BarraProveedores puedeCompras={puedeCompras} />
      <div className="container proveedores-page">
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

        <section className="prov-kpis" aria-label="Resumen de proveedores">
          <article className="prov-kpi">
            <span>Proveedores</span>
            <strong>{resumen.total}</strong>
          </article>
          <article className="prov-kpi">
            <span>Con deuda</span>
            <strong>{resumen.conDeuda}</strong>
          </article>
          <article className="prov-kpi">
            <span>Total pendiente</span>
            <strong>{formatMoneyAR(resumen.monto)}</strong>
          </article>
        </section>

        <Card>
          <div className="prov-herramientas">
            <label className="prov-buscar">
              <span>Buscar proveedor</span>
              <span className="prov-buscar__campo">
                <i className="bi bi-search" aria-hidden />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Nombre, CUIT o teléfono"
                  aria-describedby="prov-buscar-ayuda"
                />
                {searchTerm ? (
                  <button type="button" className="prov-buscar__clear" aria-label="Limpiar búsqueda" onClick={() => setSearchTerm('')}>
                    ×
                  </button>
                ) : null}
              </span>
              <small id="prov-buscar-ayuda">Nombre, CUIT, teléfono, email o contacto.</small>
            </label>

            <div className="prov-filtros" role="group" aria-label="Filtro de deuda">
              {[
                ['todos', 'Todos'],
                ['con_deuda', 'Con deuda'],
                ['sin_deuda', 'Sin deuda'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={filtroDeuda === id ? 'is-active' : ''}
                  aria-pressed={filtroDeuda === id}
                  onClick={() => {
                    setFiltroDeuda(id)
                    setCurrentPage(1)
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="prov-select">
              Estado
              <select
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
                <option value="todos">Todos</option>
              </select>
            </label>

            <label className="prov-select">
              Ordenar
              <select
                value={orden}
                onChange={(e) => {
                  setOrden(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="nombre">Nombre</option>
                <option value="deuda">Mayor deuda</option>
              </select>
            </label>

            <button type="button" className="prov-limpiar" onClick={limpiarFiltros} disabled={!hayFiltros}>
              Limpiar filtros
            </button>
            <SelectorColumnas
              columnas={COLUMNAS}
              ocultas={columnas.ocultas}
              onToggle={columnas.toggle}
              onMostrarTodas={columnas.mostrarTodas}
              onRestablecer={columnas.restablecer}
            />
          </div>

          <p className="prov-conteo" aria-live="polite">
            {textoCantidad(totalItems)}
            {loadingDeudas ? ' · Sincronizando saldos…' : ''}
          </p>

          {totalItems === 0 ? (
            <div className="prov-vacio">
              <p>
                {hayFiltros
                  ? 'Ningún proveedor coincide con la búsqueda o los filtros.'
                  : 'No hay proveedores registrados aún.'}
              </p>
              {hayFiltros ? (
                <Button variant="outline" onClick={limpiarFiltros}>Limpiar búsqueda</Button>
              ) : (
                <Link to="/proveedores/nuevo">
                  <Button variant="primary">Nuevo proveedor</Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <BarraScrollTabla
                className="table-container proveedores-table-wrap"
                firma={columnas.ocultas.join(',')}
              >
                <table className="table proveedores-table">
                  <thead>
                    <tr>
                      {columnas.esVisible('proveedor') ? <th>Proveedor</th> : null}
                      {columnas.esVisible('cuit') ? <th>CUIT</th> : null}
                      {columnas.esVisible('contacto') ? <th>Contacto</th> : null}
                      {columnas.esVisible('telefono') ? <th>Teléfono</th> : null}
                      {columnas.esVisible('email') ? <th>Email</th> : null}
                      {columnas.esVisible('saldo') ? <th className="prov-th-money">Saldo pendiente</th> : null}
                      {columnas.esVisible('estado') ? <th>Estado del proveedor</th> : null}
                      {columnas.esVisible('deuda') ? <th>Estado de deuda</th> : null}
                      {columnas.esVisible('acciones') ? <th className="prov-th-acciones">Acciones</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((proveedor) => {
                      const saldo = deudaDe(proveedor)
                      const pendiente = saldo > 0.009
                      const activo = proveedor.activo !== false
                      const contacto = segundaLinea(proveedor)
                      return (
                        <tr
                          key={proveedor.id}
                          id={`proveedor-fila-${proveedor.id}`}
                          className={Number(highlightId) === Number(proveedor.id) ? 'prov-row--nuevo' : undefined}
                        >
                          {columnas.esVisible('proveedor') ? (
                            <td>
                              <button type="button" className="prov-nombre" onClick={() => abrirDetalle(proveedor)}>
                                {proveedor.nombre_razon_social}
                              </button>
                              {contacto ? <div className="prov-nombre__sub">{contacto}</div> : null}
                            </td>
                          ) : null}
                          {columnas.esVisible('cuit') ? <td>{proveedor.cuit_rut?.trim() || '—'}</td> : null}
                          {columnas.esVisible('contacto') ? <td>{proveedor.contacto_principal?.trim() || '—'}</td> : null}
                          {columnas.esVisible('telefono') ? <td>{proveedor.telefono?.trim() || '—'}</td> : null}
                          {columnas.esVisible('email') ? <td>{proveedor.email?.trim() || '—'}</td> : null}
                          {columnas.esVisible('saldo') ? (
                            <td className={`prov-money${pendiente ? ' prov-money--deuda' : ''}`}>{formatMoneyAR(saldo)}</td>
                          ) : null}
                          {columnas.esVisible('estado') ? (
                            <td>
                              <span className={activo ? 'prov-badge prov-badge--activo' : 'prov-badge prov-badge--inactivo'}>
                                {activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                          ) : null}
                          {columnas.esVisible('deuda') ? (
                            <td>
                              <span className={pendiente ? 'prov-badge prov-badge--deuda' : 'prov-badge prov-badge--ok'}>
                                {pendiente ? 'Con deuda' : 'Sin deuda'}
                              </span>
                            </td>
                          ) : null}
                          {columnas.esVisible('acciones') ? (
                            <td className="prov-acciones">
                              {pendiente && puedeRegistrarPago ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => {
                                    setPagoError(null)
                                    setPagoProveedor(proveedor)
                                  }}
                                >
                                  Registrar pago
                                </Button>
                              ) : null}
                              <ProveedoresActionsMenu
                                proveedorId={proveedor.id}
                                proveedorNombre={proveedor.nombre_razon_social}
                                onVerDetalles={() => abrirDetalle(proveedor)}
                                onVerCompras={() => abrirCompras(proveedor)}
                                onEditar={() => editar(proveedor)}
                              />
                            </td>
                          ) : null}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </BarraScrollTabla>

              <div className="prov-pie">
                <p>
                  Mostrando {totalItems === 0 ? 0 : startIndex + 1} a {Math.min(startIndex + pageSize, totalItems)} de {totalItems}
                </p>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setCurrentPage} />
                <label className="prov-select">
                  Registros por página
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </label>
              </div>
            </>
          )}
        </Card>
      </div>

      <ProveedorDetalleModal
        proveedor={detalleProveedor}
        saldo={detalleProveedor ? deudaDe(detalleProveedor) : 0}
        onClose={cerrarDetalle}
        onCuenta={() => detalleProveedor && abrirCompras(detalleProveedor)}
        onEditar={() => detalleProveedor && editar(detalleProveedor)}
      />

      <RegistrarPagoProveedorModal
        isOpen={Boolean(pagoProveedor)}
        onClose={closePagoModal}
        proveedorNombre={pagoProveedor?.nombre_razon_social}
        deudaTotal={pagoProveedor ? deudaDe(pagoProveedor) : 0}
        saving={pagoSaving}
        error={pagoError}
        onDismissError={() => setPagoError(null)}
        onSubmit={handleRegistrarPago}
      />
    </Layout>
  )
}

export default ProveedoresList
