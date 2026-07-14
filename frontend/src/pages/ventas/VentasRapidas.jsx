// Página de Ventas Rápidas (listado + herramientas compartidas de caja / venta rápida)
import { useState, useEffect, useRef, useCallback } from 'react'
import { Layout } from '../../components/layout'
import { Card, Button, Alert, Spinner, Modal, Badge, Pagination } from '../../components/common'
import { getVentasRapidas, deleteVentaRapida } from '../../services/ventasRapidas'
import { useDateTime } from '../../context/DateTimeContext'
import { formatDateTime } from '../../utils/dateFormat'
import {
  VENTAS_REGISTROS_LIMIT,
  extraerOpcionesFiltroRegistros,
  encodeFiltroFechaRango,
} from '../../services/ventasListado'
import RegistrosVentasFiltro from '../../components/ventas/RegistrosVentasFiltro'
import VentasSharedToolsHost from '../../components/ventas/VentasSharedToolsHost'
import './VentasRapidas.css'
import '../../styles/registros-seccion.css'
import VentasRapidasActionsMenu from './VentasRapidasActionsMenu'
import {
  getVentaEstadoDisplayRegistro,
  getVentaEstadoLabelTabla,
  getVentaEstadoBadgeVariant,
} from '../../utils/ventaEstado'

function VentasRapidas() {
  const { timezone } = useDateTime()
  const sharedToolsRef = useRef(null)

  const [ventasRapidas, setVentasRapidas] = useState([])
  const [totalVentasRapidas, setTotalVentasRapidas] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingVentas, setLoadingVentas] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const [filtroTipoDraft, setFiltroTipoDraft] = useState('')
  const [filtroValorDraft, setFiltroValorDraft] = useState('')
  const [filtroFechaDesdeDraft, setFiltroFechaDesdeDraft] = useState('')
  const [filtroFechaHastaDraft, setFiltroFechaHastaDraft] = useState('')
  const [filtroActivo, setFiltroActivo] = useState({ tipo: '', valor: '' })
  const [opcionesFiltro, setOpcionesFiltro] = useState({
    clientes: [],
    metodosPago: [],
    estados: [],
  })

  const [ventaRapidaToDelete, setVentaRapidaToDelete] = useState(null)
  const [showDeleteVentaRapidaModal, setShowDeleteVentaRapidaModal] = useState(false)
  const [deletingVentaRapida, setDeletingVentaRapida] = useState(false)

  const formatearMoneda = (valor) => {
    const num = Number(valor || 0)
    return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatearFechaHora = (fecha) => {
    if (!fecha) return '-'
    return formatDateTime(fecha, 'DD/MM/YYYY HH:mm', timezone)
  }

  const loadVentasRapidas = useCallback(async () => {
    setLoadingVentas(true)
    const { data, total, error: err } = await getVentasRapidas({
      page: currentPage,
      pageSize: VENTAS_REGISTROS_LIMIT,
      filtroTipo: filtroActivo.tipo,
      filtroValor: filtroActivo.valor,
    })
    if (err) {
      setError(err.message || 'Error al cargar ventas rápidas')
    } else {
      const rows = data || []
      setVentasRapidas(rows)
      setTotalVentasRapidas(total ?? 0)
      if (!filtroActivo.tipo && currentPage === 1) {
        setOpcionesFiltro(extraerOpcionesFiltroRegistros(rows, { modo: 'rapidas' }))
      }
    }
    setLoadingVentas(false)
  }, [filtroActivo, currentPage])

  useEffect(() => {
    loadVentasRapidas()
  }, [loadVentasRapidas])

  const handleTipoFiltroChange = (tipo) => {
    setFiltroTipoDraft(tipo)
    setFiltroValorDraft('')
    setFiltroFechaDesdeDraft('')
    setFiltroFechaHastaDraft('')
  }

  const aplicarFiltroRegistros = () => {
    if (!filtroTipoDraft) return
    setCurrentPage(1)
    if (filtroTipoDraft === 'fecha') {
      if (!filtroFechaDesdeDraft || !filtroFechaHastaDraft) return
      setFiltroActivo({
        tipo: 'fecha',
        valor: encodeFiltroFechaRango(filtroFechaDesdeDraft, filtroFechaHastaDraft),
      })
      return
    }
    if (!String(filtroValorDraft).trim()) return
    setFiltroActivo({ tipo: filtroTipoDraft, valor: filtroValorDraft })
  }

  const limpiarFiltroRegistros = () => {
    setFiltroTipoDraft('')
    setFiltroValorDraft('')
    setFiltroFechaDesdeDraft('')
    setFiltroFechaHastaDraft('')
    setCurrentPage(1)
    setFiltroActivo({ tipo: '', valor: '' })
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEditarVenta = (ventaId) => {
    sharedToolsRef.current?.iniciarEdicion?.(ventaId)
  }

  const handleEliminarVentaRapida = async () => {
    if (!ventaRapidaToDelete) return
    setDeletingVentaRapida(true)
    const { error: err } = await deleteVentaRapida(ventaRapidaToDelete.id)
    if (err) {
      setError(err.message || 'Error al eliminar la venta rápida')
      setDeletingVentaRapida(false)
      return
    }
    setDeletingVentaRapida(false)
    setShowDeleteVentaRapidaModal(false)
    setVentaRapidaToDelete(null)
    setSuccessMessage('Venta rápida eliminada correctamente')
    await loadVentasRapidas()
    await sharedToolsRef.current?.refrescarCaja?.()
  }

  const hayFiltroActivo = Boolean(filtroActivo.tipo && filtroActivo.valor)
  const totalPages = Math.max(1, Math.ceil(totalVentasRapidas / VENTAS_REGISTROS_LIMIT))
  const startIndex = totalVentasRapidas === 0 ? 0 : (currentPage - 1) * VENTAS_REGISTROS_LIMIT + 1
  const endIndex = Math.min(currentPage * VENTAS_REGISTROS_LIMIT, totalVentasRapidas)

  return (
    <Layout>
      <div className="container ventas-rapidas-page">
        <div id="ventas-rapidas-mensajes">
          {error && (
            <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}
          {successMessage && (
            <Alert variant="success" dismissible onDismiss={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}
        </div>

        <VentasSharedToolsHost
          ref={sharedToolsRef}
          enableFormHotkeyF2
          onVentaRapidaSuccess={async () => {
            await loadVentasRapidas()
          }}
        />

        <Card style={{ marginTop: '1.5rem' }}>
          <div className="section-label">SECCIÓN</div>
          <h3 className="registros-seccion-titulo">REGISTROS DE VENTAS RAPIDAS</h3>
          <p className="registros-aviso-filtro">
            Se muestran {VENTAS_REGISTROS_LIMIT} registros por página
            {hayFiltroActivo ? ' (con filtro aplicado)' : ''}. Usá la paginación para ver más
            registros o el filtro para buscar por fecha, cliente, método de pago o estado.
          </p>

          <RegistrosVentasFiltro
            idPrefix="ventas-rapidas"
            tipoFiltro={filtroTipoDraft}
            valorFiltro={filtroValorDraft}
            fechaDesde={filtroFechaDesdeDraft}
            fechaHasta={filtroFechaHastaDraft}
            onTipoChange={handleTipoFiltroChange}
            onValorChange={setFiltroValorDraft}
            onFechaDesdeChange={setFiltroFechaDesdeDraft}
            onFechaHastaChange={setFiltroFechaHastaDraft}
            onAplicar={aplicarFiltroRegistros}
            onLimpiar={limpiarFiltroRegistros}
            opcionesFiltro={opcionesFiltro}
            aplicando={loadingVentas}
          />

          {loadingVentas ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spinner />
            </div>
          ) : ventasRapidas.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              {hayFiltroActivo
                ? 'No hay ventas que coincidan con el filtro aplicado.'
                : 'No hay ventas rápidas registradas'}
            </p>
          ) : (
            <>
              <div className="ventas-rapidas-registros-scroll table-container">
                <table className="table ventas-rapidas-registros-table table-sticky-header">
                  <colgroup>
                    <col className="vr-reg-col vr-reg-col--fecha" />
                    <col className="vr-reg-col vr-reg-col--hide-mobile vr-reg-col--cliente" />
                    <col className="vr-reg-col vr-reg-col--total" />
                    <col className="vr-reg-col vr-reg-col--hide-mobile" />
                    <col className="vr-reg-col vr-reg-col--hide-mobile" />
                    <col className="vr-reg-col vr-reg-col--hide-mobile" />
                    <col className="vr-reg-col vr-reg-col--estado" />
                    <col className="vr-reg-col vr-reg-col--acciones" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="vr-reg-col--fecha">
                        <span className="vr-reg-label vr-reg-label--desktop">Fecha y Hora</span>
                        <span className="vr-reg-label vr-reg-label--mobile">Fecha</span>
                      </th>
                      <th className="vr-reg-col--hide-mobile">Cliente</th>
                      <th className="ventas-rapidas-th-num vr-reg-col--total">
                        <span className="vr-reg-label vr-reg-label--desktop">$Total</span>
                        <span className="vr-reg-label vr-reg-label--mobile">Total</span>
                      </th>
                      <th className="ventas-rapidas-th-num vr-reg-col--hide-mobile">$ Pagado</th>
                      <th className="ventas-rapidas-th-num vr-reg-col--hide-mobile">$ Pendiente</th>
                      <th className="vr-reg-col--hide-mobile">Forma de Pago</th>
                      <th className="vr-reg-col--estado">Estado</th>
                      <th className="vr-reg-col--acciones">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasRapidas.map((venta) => {
                      const estadoKey = getVentaEstadoDisplayRegistro(venta, { modo: 'rapidas' })
                      return (
                        <tr key={venta.id}>
                          <td className="vr-reg-col--fecha">{formatearFechaHora(venta.fecha_hora)}</td>
                          <td className="ventas-rapidas-td-cliente vr-reg-col--hide-mobile">
                            {venta.clientes?.nombre?.trim() || 'Cliente genérico'}
                          </td>
                          <td className="ventas-rapidas-td-num vr-reg-col--total">
                            {formatearMoneda(venta.total)}
                          </td>
                          <td className="ventas-rapidas-td-num vr-reg-col--hide-mobile">
                            {formatearMoneda(venta.monto_pagado)}
                          </td>
                          <td className="ventas-rapidas-td-num vr-reg-col--hide-mobile">
                            {formatearMoneda(
                              venta.monto_pendiente ??
                                Math.max(0, Number(venta.total || 0) - Number(venta.monto_pagado || 0)),
                            )}
                          </td>
                          <td className="vr-reg-col--hide-mobile">{venta.metodo_pago}</td>
                          <td className="vr-reg-col--estado">
                            <Badge variant={getVentaEstadoBadgeVariant(estadoKey)}>
                              {getVentaEstadoLabelTabla(estadoKey)}
                            </Badge>
                          </td>
                          <td className="vr-reg-col--acciones">
                            <VentasRapidasActionsMenu
                              ventaRapidaId={venta.id}
                              onEditar={handleEditarVenta}
                              onDelete={() => {
                                setVentaRapidaToDelete(venta)
                                setShowDeleteVentaRapidaModal(true)
                              }}
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

              <div className="table-info" style={{ marginTop: '1rem' }}>
                {totalVentasRapidas > 0
                  ? `Mostrando ${startIndex}-${endIndex} de ${totalVentasRapidas} ventas`
                  : 'Sin registros para mostrar'}
              </div>
            </>
          )}
        </Card>

        <Modal
          isOpen={showDeleteVentaRapidaModal}
          onClose={() => {
            setShowDeleteVentaRapidaModal(false)
            setVentaRapidaToDelete(null)
          }}
          title="Eliminar registro"
          variant="danger"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteVentaRapidaModal(false)
                  setVentaRapidaToDelete(null)
                }}
                disabled={deletingVentaRapida}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleEliminarVentaRapida}
                loading={deletingVentaRapida}
                disabled={deletingVentaRapida}
              >
                Eliminar
              </Button>
            </>
          }
        >
          <p>¿Eliminar este registro de venta rápida?</p>
          {ventaRapidaToDelete && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              {formatearFechaHora(ventaRapidaToDelete.fecha_hora)} —{' '}
              {formatearMoneda(ventaRapidaToDelete.total)}
            </p>
          )}
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
            También se quitará de la Tabla de Registros en la página de Ventas.
          </p>
        </Modal>
      </div>
    </Layout>
  )
}

export default VentasRapidas
