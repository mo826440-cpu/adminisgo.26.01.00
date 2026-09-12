import { useCallback, useEffect, useMemo, useState } from 'react'
import { Layout } from '../../components/layout'
import { Alert, Button, Card, Modal, Spinner } from '../../components/common'
import { getEsquemaTablas } from '../../services/mantenimiento'
import { getComercio } from '../../services/comercio'
import {
  getDatosSeleccionadosParaExcel,
  TABLAS_CON_FILTRO_FECHA,
} from '../../services/mantenimientoExport'
import { downloadMantenimientoExcel } from '../../utils/mantenimientoExcel'
import '../../styles/registros-seccion.css'
import './MantenimientoPage.css'

const BASIC_SYSTEM_TABLES = new Set([
  'categorias',
  'clientes',
  'compra_items',
  'compra_pagos',
  'compras',
  'formas_pago',
  'historial_cajas',
  'marcas',
  'otros_costos',
  'productos',
  'proveedores',
  'usuarios',
  'venta_items',
  'venta_pagos',
  'ventas',
])

function tableKey(tableName) {
  return `t:${tableName}`
}

function columnKey(tableName, columnName) {
  return `c:${tableName}.${columnName}`
}

function formatBytes(bytes) {
  const value = Number(bytes)
  if (!Number.isFinite(value) || value < 0) return 'No disponible'
  if (value === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const unitIndex = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  const amount = value / (1024 ** unitIndex)
  return `${amount.toLocaleString('es-AR', {
    minimumFractionDigits: unitIndex === 0 ? 0 : 2,
    maximumFractionDigits: unitIndex === 0 ? 0 : 2,
  })} ${units[unitIndex]}`
}

function formatRowCount(count) {
  if (count == null) return 'Conteo no disponible'
  const value = Number(count)
  if (!Number.isFinite(value) || value < 0) return 'Conteo no disponible'
  return `${value.toLocaleString('es-AR')} ${value === 1 ? 'registro' : 'registros'}`
}

function formatDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function initialDateRange() {
  const today = new Date()
  const from = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
  return {
    fechaDesde: formatDateInput(from),
    fechaHasta: formatDateInput(today),
  }
}

function MantenimientoPage() {
  const [tablas, setTablas] = useState([])
  const [totalTablas, setTotalTablas] = useState(0)
  const [databaseSizeBytes, setDatabaseSizeBytes] = useState(null)
  const [selected, setSelected] = useState({})
  const [expanded, setExpanded] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [showExportModal, setShowExportModal] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(null)
  const [dateRange, setDateRange] = useState(initialDateRange)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    const {
      data,
      tableCount,
      databaseSizeBytes: sizeBytes,
      error: err,
    } = await getEsquemaTablas()
    if (err) {
      setError(err.message || 'No se pudo cargar el catálogo de tablas.')
      setTablas([])
      setTotalTablas(0)
      setDatabaseSizeBytes(null)
      setLoading(false)
      return
    }
    setTablas(data || [])
    setTotalTablas(tableCount || 0)
    setDatabaseSizeBytes(sizeBytes)
    setLoading(false)
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const tablasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return tablas
    return tablas
      .map((tabla) => {
        const nombreOk = tabla.table_name.toLowerCase().includes(q)
        const columnas = nombreOk
          ? tabla.columns
          : tabla.columns.filter((col) => col.column_name.toLowerCase().includes(q))
        if (!nombreOk && columnas.length === 0) return null
        return { ...tabla, columns: columnas }
      })
      .filter(Boolean)
  }, [tablas, busqueda])

  const exportSelections = useMemo(() => {
    return tablas
      .map((tabla) => {
        const selectedColumns = tabla.columns
          .filter((column) => selected[columnKey(tabla.table_name, column.column_name)])
          .map((column) => column.column_name)
        const tableSelected = !!selected[tableKey(tabla.table_name)]
        if (!tableSelected && selectedColumns.length === 0) return null

        return {
          tableName: tabla.table_name,
          columns: selectedColumns.length > 0
            ? selectedColumns
            : tabla.columns.map((column) => column.column_name),
          allColumns: tabla.columns.map((column) => column.column_name),
        }
      })
      .filter(Boolean)
  }, [tablas, selected])

  const toggle = (key) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleExpanded = (tableName) => {
    setExpanded((prev) => ({ ...prev, [tableName]: !prev[tableName] }))
  }

  const seleccionarTablasBasicas = () => {
    const availableBasics = new Set(
      tablas
        .map((tabla) => tabla.table_name)
        .filter((tableName) => BASIC_SYSTEM_TABLES.has(tableName)),
    )

    setSelected((prev) => {
      const next = {}
      for (const tableName of availableBasics) {
        next[tableKey(tableName)] = true
      }

      for (const [key, isSelected] of Object.entries(prev)) {
        if (!isSelected || !key.startsWith('c:')) continue
        const tableName = key.slice(2).split('.')[0]
        if (availableBasics.has(tableName)) next[key] = true
      }
      return next
    })
  }

  const limpiarSeleccion = () => {
    setSelected({})
  }

  const abrirExportacion = () => {
    setExportError(null)
    setSuccess(null)
    setShowExportModal(true)
  }

  const crearExcel = async () => {
    const { fechaDesde, fechaHasta } = dateRange
    if (!fechaDesde || !fechaHasta) {
      setExportError('Ingresá la fecha desde y la fecha hasta.')
      return
    }
    if (fechaDesde > fechaHasta) {
      setExportError('La fecha desde no puede ser posterior a la fecha hasta.')
      return
    }
    if (exportSelections.length === 0) {
      setExportError('Seleccioná al menos una tabla o columna.')
      return
    }

    setExporting(true)
    setExportError(null)
    try {
      const { data: comercio, error: comercioError } = await getComercio()
      if (comercioError || !comercio?.nombre) {
        throw new Error('No se pudo obtener el nombre del comercio para crear el archivo.')
      }

      const data = await getDatosSeleccionadosParaExcel({
        selections: exportSelections,
        fechaDesde,
        fechaHasta,
      })
      await downloadMantenimientoExcel({
        tables: data,
        comercioNombre: comercio.nombre,
      })
      setShowExportModal(false)
      setSuccess(`Excel creado con ${data.length} ${data.length === 1 ? 'hoja' : 'hojas'}.`)
    } catch (err) {
      setExportError(err.message || 'No se pudo crear el archivo Excel.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mantenimiento-page" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p>Cargando tablas…</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mantenimiento-page">
        <p className="text-secondary mantenimiento-page__intro">
          Tablas creadas en la base de datos y columnas de cada una. Marcá el tilde para seleccionar un
          nombre; si está vacío, no está seleccionado.
        </p>

        <section className="mantenimiento-indicators" aria-label="Indicadores de base de datos">
          <Card className="mantenimiento-indicator">
            <span className="mantenimiento-indicator__icon" aria-hidden="true">▦</span>
            <div>
              <span className="mantenimiento-indicator__label">Total de tablas</span>
              <strong className="mantenimiento-indicator__value">{totalTablas}</strong>
            </div>
          </Card>
          <Card className="mantenimiento-indicator">
            <span className="mantenimiento-indicator__icon" aria-hidden="true">◫</span>
            <div>
              <span className="mantenimiento-indicator__label">Memoria utilizada</span>
              <strong className="mantenimiento-indicator__value">
                {formatBytes(databaseSizeBytes)}
              </strong>
              <span className="mantenimiento-indicator__detail">Tamaño total de la base de datos</span>
            </div>
          </Card>
        </section>

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Card className="mantenimiento-card">
          <div className="mantenimiento-toolbar">
            <div className="mantenimiento-basic-selection">
              <div>
                <strong>Tablas básicas del sistema</strong>
                <span className="text-secondary">
                  Selecciona las 15 tablas principales y desmarca las demás.
                </span>
              </div>
              <div className="mantenimiento-selection-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={seleccionarTablasBasicas}
                >
                  Seleccionar tablas básicas
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={limpiarSeleccion}
                >
                  Limpiar selección
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={abrirExportacion}
                  disabled={exportSelections.length === 0}
                >
                  Crear Excel ({exportSelections.length})
                </Button>
              </div>
            </div>
            <label htmlFor="mantenimiento-buscar" className="mantenimiento-label">
              Buscar tabla o columna
            </label>
            <input
              id="mantenimiento-buscar"
              type="search"
              className="form-control mantenimiento-search"
              placeholder="Ej. usuarios, fecha_registro…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <p className="mantenimiento-count text-secondary">
              {tablasFiltradas.length} tabla{tablasFiltradas.length === 1 ? '' : 's'}
              {busqueda.trim() ? ' coincidentes' : ''}
            </p>
          </div>

          {tablasFiltradas.length === 0 ? (
            <p className="text-secondary" style={{ margin: 0 }}>
              No hay tablas para mostrar.
            </p>
          ) : (
            <ul className="mantenimiento-tables">
              {tablasFiltradas.map((tabla) => {
                const tKey = tableKey(tabla.table_name)
                const tableChecked = !!selected[tKey]
                const isExpanded = !!expanded[tabla.table_name]
                const columnsId = `columnas-${tabla.table_name.replace(/[^a-zA-Z0-9_-]/g, '-')}`
                return (
                  <li key={tabla.table_name} className="mantenimiento-table">
                    <div className="mantenimiento-table-header">
                      <label className="mantenimiento-row mantenimiento-row--table">
                        <input
                          type="checkbox"
                          className="mantenimiento-check"
                          checked={tableChecked}
                          onChange={() => toggle(tKey)}
                          aria-label={`Seleccionar tabla ${tabla.table_name}`}
                        />
                        <span className="mantenimiento-table-name">{tabla.table_name}</span>
                        <span className="mantenimiento-row-count">
                          {formatRowCount(tabla.row_count)}
                        </span>
                      </label>
                      <button
                        type="button"
                        className={`mantenimiento-expand ${isExpanded ? 'mantenimiento-expand--open' : ''}`}
                        onClick={() => toggleExpanded(tabla.table_name)}
                        aria-expanded={isExpanded}
                        aria-controls={columnsId}
                        aria-label={`${isExpanded ? 'Ocultar' : 'Mostrar'} columnas de ${tabla.table_name}`}
                      >
                        <span aria-hidden="true">⌄</span>
                        <span className="mantenimiento-expand__count">{tabla.columns.length}</span>
                      </button>
                    </div>
                    {isExpanded && (
                      <ul id={columnsId} className="mantenimiento-columns">
                        {tabla.columns.map((col) => {
                          const cKey = columnKey(tabla.table_name, col.column_name)
                          return (
                            <li key={cKey}>
                              <label className="mantenimiento-row mantenimiento-row--column">
                                <input
                                  type="checkbox"
                                  className="mantenimiento-check"
                                  checked={!!selected[cKey]}
                                  onChange={() => toggle(cKey)}
                                  aria-label={`Seleccionar columna ${col.column_name} de ${tabla.table_name}`}
                                />
                                <span className="mantenimiento-column-name">{col.column_name}</span>
                              </label>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Modal
          isOpen={showExportModal}
          onClose={() => {
            if (!exporting) setShowExportModal(false)
          }}
          closeOnOverlayClick={!exporting}
          title="Exportar selección a Excel"
          footer={(
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowExportModal(false)}
                disabled={exporting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => void crearExcel()}
                loading={exporting}
              >
                {exporting ? 'Creando Excel…' : 'Crear Excel'}
              </Button>
            </>
          )}
        >
          <p className="mantenimiento-export-description">
            El rango se aplicará una sola vez a las tablas con información fechada. Las demás tablas
            se exportarán completas.
          </p>

          <div className="mantenimiento-export-dates">
            <label>
              <span>Fecha desde</span>
              <input
                type="date"
                className="form-control"
                value={dateRange.fechaDesde}
                max={dateRange.fechaHasta || undefined}
                onChange={(event) => {
                  setDateRange((prev) => ({ ...prev, fechaDesde: event.target.value }))
                  setExportError(null)
                }}
                disabled={exporting}
              />
            </label>
            <label>
              <span>Fecha hasta</span>
              <input
                type="date"
                className="form-control"
                value={dateRange.fechaHasta}
                min={dateRange.fechaDesde || undefined}
                onChange={(event) => {
                  setDateRange((prev) => ({ ...prev, fechaHasta: event.target.value }))
                  setExportError(null)
                }}
                disabled={exporting}
              />
            </label>
          </div>

          <div className="mantenimiento-export-summary">
            <strong>
              {exportSelections.length} {exportSelections.length === 1 ? 'hoja seleccionada' : 'hojas seleccionadas'}
            </strong>
            <ul>
              {exportSelections.map((selection) => (
                <li key={selection.tableName}>
                  <span>{selection.tableName}</span>
                  <small>
                    {selection.columns.length} {selection.columns.length === 1 ? 'columna' : 'columnas'}
                    {TABLAS_CON_FILTRO_FECHA.has(selection.tableName) ? ' · con rango de fecha' : ' · todos los registros'}
                  </small>
                </li>
              ))}
            </ul>
          </div>

          {exportError && <Alert variant="danger">{exportError}</Alert>}
        </Modal>
      </div>
    </Layout>
  )
}

export default MantenimientoPage
