// Página de lista de clientes — tabla refactorizada (estado de deuda, tooltips, exportación)
import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Spinner, Alert, Pagination } from '../../components/common'
import { getClientes } from '../../services/clientes'
import { getMapaDeudaPorClienteIds, getVentasMovimientosPorClienteId } from '../../services/ventas'
import { formatMoneyAR } from '../reportes/reporteVentasUtils'
import {
  downloadClienteMovimientosCsv,
  downloadClienteMovimientosPdf,
} from '../../utils/clienteMovimientosExport'
import GlassTooltip from '../../components/clientes/GlassTooltip'
import './ClientesList.css'
import '../../styles/registros-seccion.css'

const ITEMS_PER_PAGE = 100

function datoOGuion(val) {
  const s = val != null && String(val).trim() !== '' ? String(val).trim() : null
  return s || '—'
}

function ClientesList() {
  const location = useLocation()
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [mapaDeuda, setMapaDeuda] = useState(() => new Map())
  const [loading, setLoading] = useState(true)
  const [loadingDeudas, setLoadingDeudas] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [successMessage, setSuccessMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [reporteLoadingId, setReporteLoadingId] = useState(null)

  const loadClientes = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getClientes()

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setClientes(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadClientes()
    }, 0)
    return () => window.clearTimeout(t)
  }, [loadClientes])

  useEffect(() => {
    if (!location.state?.success) return undefined
    const t0 = window.setTimeout(() => {
      setSuccessMessage(location.state.message || 'Operación realizada correctamente')
      navigate(location.pathname, { replace: true, state: {} })
    }, 0)
    const t1 = window.setTimeout(() => {
      setSuccessMessage(null)
    }, 5000)
    return () => {
      window.clearTimeout(t0)
      window.clearTimeout(t1)
    }
  }, [location.state, navigate, location.pathname])

  useEffect(() => {
    let cancelled = false
    const t = window.setTimeout(() => {
      if (!clientes.length) {
        if (!cancelled) {
          setMapaDeuda(new Map())
          setLoadingDeudas(false)
        }
        return
      }
      setLoadingDeudas(true)
      void (async () => {
        const ids = clientes.map((c) => c.id)
        const map = await getMapaDeudaPorClienteIds(ids)
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
  }, [clientes])

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefono?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalItems = filteredClientes.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedClientes = filteredClientes.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const ejecutarDescargaReporte = async (cliente, formato) => {
    setError(null)
    setReporteLoadingId(cliente.id)
    const { data, error: err } = await getVentasMovimientosPorClienteId(cliente.id)
    setReporteLoadingId(null)
    if (err) {
      setError(err.message || 'No se pudo obtener el historial de ventas del cliente.')
      return
    }
    if (formato === 'csv') {
      downloadClienteMovimientosCsv(cliente.nombre, data || [])
    } else {
      downloadClienteMovimientosPdf(cliente.nombre, data || [])
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando clientes...</p>
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
          <h3 className="registros-seccion-titulo">REGISTROS DE CLIENTES</h3>
          <div className="table-controls">
            <input
              type="text"
              className="form-control clientes-search-input"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
            {totalItems > 0 && (
              <div className="table-info">
                Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems} clientes
                {loadingDeudas && (
                  <span className="clientes-deuda-loading" aria-live="polite">
                    {' '}
                    · Sincronizando saldos…
                  </span>
                )}
              </div>
            )}
          </div>

          {filteredClientes.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                {searchTerm
                  ? 'No se encontraron clientes con ese criterio de búsqueda.'
                  : 'No hay clientes registrados aún.'}
              </p>
              {!searchTerm && (
                <Link to="/clientes/nuevo">
                  <Button variant="primary" style={{ marginTop: '1rem' }}>
                    Crear primer cliente
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="table-container clientes-table-wrap">
                <table className="table table-sticky-header clientes-table-futurist">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th className="clientes-th-estado">Estado</th>
                      <th className="clientes-th-acciones">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClientes.map((cliente) => {
                      const saldoDeuda = mapaDeuda.get(Number(cliente.id)) || 0
                      const debe = saldoDeuda > 0.009
                      const tooltipNombre = (
                        <>
                          <p className="glass-tooltip__title">Datos de contacto</p>
                          <div className="glass-tooltip__row">
                            <span className="glass-tooltip__label">Email</span>
                            <span className="glass-tooltip__value">{datoOGuion(cliente.email)}</span>
                          </div>
                          <div className="glass-tooltip__row">
                            <span className="glass-tooltip__label">Teléfono</span>
                            <span className="glass-tooltip__value">{datoOGuion(cliente.telefono)}</span>
                          </div>
                          <div className="glass-tooltip__row">
                            <span className="glass-tooltip__label">Dirección</span>
                            <span className="glass-tooltip__value">{datoOGuion(cliente.direccion)}</span>
                          </div>
                        </>
                      )
                      const tooltipDeuda = (
                        <>
                          <p className="glass-tooltip__title">Saldo pendiente</p>
                          <p className="glass-tooltip__deuda-monto">{formatMoneyAR(saldoDeuda)}</p>
                          <p className="glass-tooltip__value" style={{ marginTop: '0.35rem', fontSize: '0.75rem' }}>
                            Suma de deudas en ventas asociadas a este cliente.
                          </p>
                        </>
                      )
                      return (
                        <tr key={cliente.id}>
                          <td className="clientes-td-nombre">
                            <GlassTooltip content={tooltipNombre}>
                              <span className="clientes-table__nombre-text">{cliente.nombre}</span>
                            </GlassTooltip>
                          </td>
                          <td className="clientes-td-estado">
                            {debe ? (
                              <GlassTooltip content={tooltipDeuda}>
                                <span className="clientes-badge clientes-badge--debe" tabIndex={0}>
                                  DEBE
                                </span>
                              </GlassTooltip>
                            ) : (
                              <span className="clientes-badge clientes-badge--al-dia">AL DÍA</span>
                            )}
                          </td>
                          <td className="clientes-td-acciones">
                            <div className="clientes-acciones">
                              <button
                                type="button"
                                className="clientes-btn-icon clientes-btn-icon--csv"
                                disabled={reporteLoadingId === cliente.id}
                                aria-label={`Descargar historial CSV de ${cliente.nombre}`}
                                onClick={() => ejecutarDescargaReporte(cliente, 'csv')}
                              >
                                {reporteLoadingId === cliente.id ? (
                                  <span
                                    className="spinner-border spinner-border-sm clientes-reporte-spinner"
                                    role="status"
                                    aria-label="Generando archivo"
                                  />
                                ) : (
                                  <i className="bi bi-filetype-csv" aria-hidden />
                                )}
                              </button>
                              <button
                                type="button"
                                className="clientes-btn-icon clientes-btn-icon--pdf"
                                disabled={reporteLoadingId === cliente.id}
                                aria-label={`Descargar historial PDF de ${cliente.nombre}`}
                                onClick={() => ejecutarDescargaReporte(cliente, 'pdf')}
                              >
                                <i className="bi bi-file-earmark-pdf" aria-hidden />
                              </button>
                              <Link to={`/clientes/${cliente.id}`} className="clientes-link-editar">
                                <Button variant="ghost" size="sm">
                                  Editar
                                </Button>
                              </Link>
                            </div>
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
    </Layout>
  )
}

export default ClientesList
