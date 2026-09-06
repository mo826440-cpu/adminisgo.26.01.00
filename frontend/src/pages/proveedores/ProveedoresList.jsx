// Página de lista de proveedores
import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Spinner, Alert, Pagination, Modal } from '../../components/common'
import { getProveedores } from '../../services/proveedores'
import { getMapaDeudaPorProveedorIds } from '../../services/compras'
import { formatMoneyAR } from '../reportes/reporteVentasUtils'
import GlassTooltip from '../../components/clientes/GlassTooltip'
import ProveedoresActionsMenu from './ProveedoresActionsMenu'
import './ProveedoresList.css'
import '../../styles/registros-seccion.css'
import '../../components/ventas-prueba/VentasPruebaToolbar.css'

const ITEMS_PER_PAGE = 100

function datoOGuion(val) {
  const s = val != null && String(val).trim() !== '' ? String(val).trim() : null
  return s || '—'
}

function ProveedoresList() {
  const location = useLocation()
  const navigate = useNavigate()
  const [proveedores, setProveedores] = useState([])
  const [mapaDeuda, setMapaDeuda] = useState(() => new Map())
  const [loading, setLoading] = useState(true)
  const [loadingDeudas, setLoadingDeudas] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [successMessage, setSuccessMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [detalleProveedor, setDetalleProveedor] = useState(null)

  const loadProveedores = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getProveedores()

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
    if (!location.state?.success) return undefined
    const t0 = window.setTimeout(() => {
      setSuccessMessage(location.state.message || 'Operación realizada correctamente')
      navigate(location.pathname, { replace: true, state: {} })
    }, 0)
    const t1 = window.setTimeout(() => setSuccessMessage(null), 5000)
    return () => {
      window.clearTimeout(t0)
      window.clearTimeout(t1)
    }
  }, [location.state, navigate, location.pathname])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

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
        const ids = proveedores.map((p) => p.id)
        const map = await getMapaDeudaPorProveedorIds(ids)
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

  const filteredProveedores = proveedores.filter(
    (proveedor) =>
      proveedor.nombre_razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.cuit_rut?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.contacto_principal?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalItems = filteredProveedores.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProveedores = filteredProveedores.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando proveedores...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        {successMessage && (
          <Alert variant="success" dismissible onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card>
          <div className="section-label">SECCIÓN</div>
          <h3 className="registros-seccion-titulo">REGISTROS DE PROVEEDORES</h3>
          <div className="table-controls">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre, contacto, email, teléfono o CUIT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '400px' }}
            />
            {totalItems > 0 && (
              <div className="table-info">
                Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems}{' '}
                proveedores
                {loadingDeudas && (
                  <span className="proveedores-deuda-loading" aria-live="polite">
                    {' '}
                    · Sincronizando saldos…
                  </span>
                )}
              </div>
            )}
          </div>

          {filteredProveedores.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                {searchTerm
                  ? 'No se encontraron proveedores con ese criterio de búsqueda.'
                  : 'No hay proveedores registrados aún.'}
              </p>
              {!searchTerm && (
                <Link to="/proveedores/nuevo">
                  <Button variant="primary" style={{ marginTop: '1rem' }}>
                    Crear primer proveedor
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="table-container proveedores-table-wrap">
                <table className="table table-sticky-header proveedores-table">
                  <colgroup>
                    <col className="proveedores-col-nombre" />
                    <col className="proveedores-col-contacto" />
                    <col className="proveedores-col-estado" />
                    <col className="proveedores-col-acciones" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Nombre / Razón social</th>
                      <th>Contacto</th>
                      <th className="proveedores-th-estado">Estado</th>
                      <th className="proveedores-th-acciones">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProveedores.map((proveedor) => {
                      const proveedorId = Number(proveedor.id)
                      const saldoDeuda = mapaDeuda.get(proveedorId) || 0
                      const pendiente = saldoDeuda > 0.009
                      const tooltipDeuda = (
                        <>
                          <p className="glass-tooltip__title">Saldo pendiente</p>
                          <p className="glass-tooltip__deuda-monto">{formatMoneyAR(saldoDeuda)}</p>
                          <p
                            className="glass-tooltip__value"
                            style={{ marginTop: '0.35rem', fontSize: '0.75rem' }}
                          >
                            Suma de deudas en órdenes de compra asociadas a este proveedor.
                          </p>
                        </>
                      )

                      return (
                        <tr key={proveedor.id}>
                          <td className="proveedores-td-nombre">
                            <strong>{proveedor.nombre_razon_social}</strong>
                          </td>
                          <td>{datoOGuion(proveedor.contacto_principal)}</td>
                          <td className="proveedores-td-estado">
                            {pendiente ? (
                              <GlassTooltip content={tooltipDeuda}>
                                <span className="proveedores-badge proveedores-badge--pendiente" tabIndex={0}>
                                  Pendiente
                                </span>
                              </GlassTooltip>
                            ) : (
                              <span className="proveedores-badge proveedores-badge--al-dia">
                                Al día
                              </span>
                            )}
                          </td>
                          <td className="proveedores-td-acciones">
                            <ProveedoresActionsMenu
                              proveedorId={proveedor.id}
                              proveedorNombre={proveedor.nombre_razon_social}
                              onVerDetalles={() => setDetalleProveedor(proveedor)}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </Card>
      </div>

      <Modal
        isOpen={Boolean(detalleProveedor)}
        onClose={() => setDetalleProveedor(null)}
        title="Detalle del proveedor"
        footer={
          <>
            <Button variant="outline" onClick={() => setDetalleProveedor(null)}>
              Cerrar
            </Button>
            {detalleProveedor ? (
              <Link to={`/proveedores/${detalleProveedor.id}`}>
                <Button variant="primary">Editar proveedor</Button>
              </Link>
            ) : null}
          </>
        }
      >
        {detalleProveedor ? (
          <div className="proveedor-detalle-modal">
            <p className="proveedor-detalle-modal__nombre">
              <strong>{detalleProveedor.nombre_razon_social}</strong>
            </p>
            <dl className="proveedor-detalle-modal__lista">
              <dt>Contacto</dt>
              <dd>{datoOGuion(detalleProveedor.contacto_principal)}</dd>
              <dt>Email</dt>
              <dd>{datoOGuion(detalleProveedor.email)}</dd>
              <dt>Teléfono</dt>
              <dd>{datoOGuion(detalleProveedor.telefono)}</dd>
              <dt>CUIT / RUT</dt>
              <dd>{datoOGuion(detalleProveedor.cuit_rut)}</dd>
              <dt>Dirección</dt>
              <dd>{datoOGuion(detalleProveedor.direccion)}</dd>
              <dt>Condiciones de pago</dt>
              <dd>{datoOGuion(detalleProveedor.condiciones_pago)}</dd>
              <dt>Plazo de entrega</dt>
              <dd>{datoOGuion(detalleProveedor.plazo_entrega)}</dd>
              <dt>Notas</dt>
              <dd>{detalleProveedor.notas?.trim() || '—'}</dd>
            </dl>
          </div>
        ) : null}
      </Modal>
    </Layout>
  )
}

export default ProveedoresList
