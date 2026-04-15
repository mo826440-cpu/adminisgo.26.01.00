import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getVentasPorRangoFechas } from '../../services/ventas'
import { getComprasPorRangoFechas } from '../../services/compras'
import { Spinner, Alert, Button } from '../../components/common'
import {
  aggregateVentasByMonth,
  mergeAggregatedWithSlicer,
  formatMoneyAR,
} from './reporteVentasUtils'
import {
  aggregateComprasByMonth,
  mergeComprasAggregatedWithSlicer,
} from './reporteComprasUtils'
import {
  buildSlicerDateKeySet,
  filterComprasBySlicerDateKeys,
  filterVentasBySlicerDateKeys,
  formatSlicerExportLines,
  getDefaultSlicerArrays,
  getSlicerBoundingDates,
  slicerArraysToState,
} from './reporteDateSlicers'
import ReporteDateSlicerBar from './ReporteDateSlicerBar'
import {
  mergeBalancesFromVentasYCompras,
  totalesBalances,
  maxBarVentasCompras,
  maxBarRentabilidadAbs,
} from './reporteBalancesUtils'
import {
  downloadReporteBalancesPdf,
  buildTicketTextBalances,
  printReporteTicket,
} from './reporteInformeExport'
import { ReporteInformeExportActions } from './ReporteInformeExportActions'
import './ReporteVentasPanel.css'

function ReporteBalancesPanel() {
  const [slicer, setSlicer] = useState(() => getDefaultSlicerArrays())
  const [loading, setLoading] = useState(true)
  const [pdfExporting, setPdfExporting] = useState(false)
  const [error, setError] = useState(null)
  const [rows, setRows] = useState([])
  const chartBarrasRef = useRef(null)

  const slicerNorm = useMemo(() => slicerArraysToState(slicer), [slicer])
  const exportLines = useMemo(() => formatSlicerExportLines(slicerNorm), [slicerNorm])

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    const s = slicerArraysToState(slicer)
    if (!s.years.length) {
      setError('Seleccioná al menos un año.')
      setLoading(false)
      setRows([])
      return
    }
    const bounds = getSlicerBoundingDates(s)
    if (!bounds) {
      setError('La combinación de segmentos no incluye ninguna fecha.')
      setLoading(false)
      setRows([])
      return
    }

    const ks = buildSlicerDateKeySet(s)
    const [resV, resC] = await Promise.all([
      getVentasPorRangoFechas(bounds.desde, bounds.hasta),
      getComprasPorRangoFechas(bounds.desde, bounds.hasta),
    ])

    if (resV.error) {
      setError(resV.error.message || 'No se pudieron cargar las ventas.')
      setRows([])
      setLoading(false)
      return
    }
    if (resC.error) {
      setError(resC.error.message || 'No se pudieron cargar las compras.')
      setRows([])
      setLoading(false)
      return
    }

    const ventasFiltradas = filterVentasBySlicerDateKeys(resV.data || [], ks)
    const comprasFiltradas = filterComprasBySlicerDateKeys(resC.data || [], ks)

    const ventasMerged = mergeAggregatedWithSlicer(aggregateVentasByMonth(ventasFiltradas), s)
    const comprasMerged = mergeComprasAggregatedWithSlicer(aggregateComprasByMonth(comprasFiltradas), s)
    setRows(mergeBalancesFromVentasYCompras(ventasMerged, comprasMerged))
    setLoading(false)
  }, [slicer])

  useEffect(() => {
    cargar()
  }, [cargar])

  const totales = useMemo(() => totalesBalances(rows), [rows])
  const barVc = useMemo(() => maxBarVentasCompras(rows), [rows])
  const barRent = useMemo(() => maxBarRentabilidadAbs(rows), [rows])

  const ticketText = useMemo(
    () =>
      buildTicketTextBalances({
        desde: exportLines.desdeStr,
        hasta: exportLines.hastaStr,
        detalleFiltro: exportLines.criterio,
        rows,
        totales,
      }),
    [exportLines, rows, totales]
  )

  const handlePdf = async () => {
    if (pdfExporting) return
    setPdfExporting(true)
    setError(null)
    try {
      await downloadReporteBalancesPdf({
        desde: exportLines.desdeStr,
        hasta: exportLines.hastaStr,
        detalleFiltro: exportLines.criterio,
        rows,
        totales,
        chartElements: rows.length > 0 ? { barras: chartBarrasRef.current } : null,
      })
    } catch (e) {
      console.error(e)
      setError('No se pudo generar el PDF.')
    } finally {
      setPdfExporting(false)
    }
  }

  const handlePrintTicket = () => {
    printReporteTicket({ titulo: 'Reporte de balances — ticket', texto: ticketText })
  }

  return (
    <div className="reporte-ventas">
      <h2 className="reportes-panel-heading">Reporte de balances</h2>
      <p className="reportes-panel-text reporte-ventas-intro">
        Por mes calendario: <strong>total de ventas</strong> (facturación), <strong>total de compras</strong> (órdenes
        según fecha de orden) y <strong>rentabilidad</strong> como ventas menos compras.
      </p>

      <div className="reporte-ventas-filtro">
        <span className="reporte-ventas-filtro-label">FILTRAR POR FECHA (SEGMENTOS)</span>
        <div className="reporte-ventas-filtro-campos reporte-ventas-filtro-campos--slicer">
          <ReporteDateSlicerBar years={slicer.years} months={slicer.months} days={slicer.days} onChange={setSlicer} />
          <div className="reporte-ventas-filtro-actions">
            <Button type="button" variant="outline" size="sm" onClick={cargar} disabled={loading}>
              Actualizar
            </Button>
            <ReporteInformeExportActions
              disabled={loading || pdfExporting}
              onPdf={() => {
                void handlePdf()
              }}
              onPrint={handlePrintTicket}
            />
          </div>
          <p className="reporte-ventas-periodo-resumen text-secondary" aria-live="polite">
            Consulta al servidor: {exportLines.desdeStr} → {exportLines.hastaStr} · {exportLines.criterio}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="reporte-ventas-alert" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="reporte-ventas-loading">
          <Spinner />
          <span>Cargando datos…</span>
        </div>
      ) : (
        <>
          <section aria-labelledby="reporte-balances-tabla-title">
            <h3 id="reporte-balances-tabla-title" className="reporte-ventas-subtitle">
              Resumen por mes
            </h3>
            <div className="reporte-ventas-table-wrap">
              <table className="reporte-ventas-table">
                <thead>
                  <tr>
                    <th>MES</th>
                    <th>TOTAL VENTAS</th>
                    <th>TOTAL COMPRAS</th>
                    <th>RENTABILIDAD</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="reporte-ventas-sin-datos">
                        No hay datos en el rango seleccionado.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.key}>
                        <td>{r.labelCorto}</td>
                        <td>{formatMoneyAR(r.totalVentas)}</td>
                        <td>{formatMoneyAR(r.totalCompras)}</td>
                        <td
                          className={
                            r.rentabilidad < -0.005
                              ? 'reporte-balance-renta-neg'
                              : r.rentabilidad > 0.005
                                ? 'reporte-balance-renta-pos'
                                : ''
                          }
                        >
                          {formatMoneyAR(r.rentabilidad)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr>
                      <td>Total general</td>
                      <td>{formatMoneyAR(totales.totalVentas)}</td>
                      <td>{formatMoneyAR(totales.totalCompras)}</td>
                      <td
                        className={
                          totales.rentabilidad < -0.005
                            ? 'reporte-balance-renta-neg'
                            : totales.rentabilidad > 0.005
                              ? 'reporte-balance-renta-pos'
                              : ''
                        }
                      >
                        {formatMoneyAR(totales.rentabilidad)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>

          {rows.length > 0 && (
            <section className="reporte-balances-chart-block" aria-labelledby="reporte-balances-grafico-title">
              <h3 id="reporte-balances-grafico-title" className="reporte-ventas-subtitle">
                Gráfico comparativo
              </h3>
              <div
                ref={chartBarrasRef}
                className="reporte-ventas-chart-area"
                aria-label="Ventas, compras y rentabilidad por mes"
              >
                <div className="reporte-ventas-barras">
                  {rows.map((r) => (
                    <div key={r.key} className="reporte-ventas-barra-fila">
                      <span className="reporte-ventas-barra-mes">{r.labelCorto}</span>
                      <div className="reporte-ventas-barra-tracks">
                        <div className="reporte-ventas-barra-line">
                          <div
                            className="reporte-ventas-barra-fill reporte-balance-fill--ventas"
                            style={{ width: `${(r.totalVentas / barVc) * 100}%` }}
                          />
                          <span className="reporte-ventas-barra-valor">{formatMoneyAR(r.totalVentas)}</span>
                        </div>
                        <div className="reporte-ventas-barra-line">
                          <div
                            className="reporte-ventas-barra-fill reporte-balance-fill--compras"
                            style={{ width: `${(r.totalCompras / barVc) * 100}%` }}
                          />
                          <span className="reporte-ventas-barra-valor">{formatMoneyAR(r.totalCompras)}</span>
                        </div>
                        <div className="reporte-ventas-barra-line">
                          <div
                            className={`reporte-ventas-barra-fill ${
                              r.rentabilidad >= 0 ? 'reporte-balance-fill--renta-pos' : 'reporte-balance-fill--renta-neg'
                            }`}
                            style={{
                              width: `${(Math.abs(r.rentabilidad) / barRent) * 100}%`,
                              minWidth: Math.abs(r.rentabilidad) > 0.005 ? undefined : '2px',
                            }}
                          />
                          <span className="reporte-ventas-barra-valor">{formatMoneyAR(r.rentabilidad)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="reporte-ventas-leyenda-barras">
                  <span>
                    <i className="reporte-ventas-sq reporte-balance-sq--ventas" aria-hidden="true" /> Total ventas
                  </span>
                  <span>
                    <i className="reporte-ventas-sq reporte-balance-sq--compras" aria-hidden="true" /> Total compras
                  </span>
                  <span>
                    <i className="reporte-ventas-sq reporte-balance-sq--renta" aria-hidden="true" /> Rentabilidad
                    (verde si es positiva o cero, rojo si es negativa)
                  </span>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default ReporteBalancesPanel
