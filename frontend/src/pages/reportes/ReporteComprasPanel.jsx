import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getComprasPorRangoFechas } from '../../services/compras'
import { Spinner, Alert, Button } from '../../components/common'
import {
  aggregateComprasByMonth,
  mergeComprasAggregatedWithSlicer,
  totalesGeneralesCompras,
  formatMoneyAR,
  maxBarScale,
  mesTituloPie,
} from './reporteComprasUtils'
import {
  buildSlicerDateKeySet,
  filterComprasBySlicerDateKeys,
  formatSlicerExportLines,
  getDefaultSlicerArrays,
  getSlicerBoundingDates,
  slicerArraysToState,
} from './reporteDateSlicers'
import ReporteDateSlicerBar from './ReporteDateSlicerBar'
import {
  downloadReporteComprasPdf,
  buildTicketTextCompras,
  printReporteTicket,
} from './reporteInformeExport'
import { ReporteInformeExportActions } from './ReporteInformeExportActions'
import './ReporteVentasPanel.css'

function PieMesCompras({ row }) {
  const total = row.numCompras
  const pag = row.comprasPagadas
  const deu = row.comprasConDeuda
  const pctPag = total > 0 ? Math.round((pag / total) * 1000) / 10 : 0
  const pctDeu = total > 0 ? Math.min(100, Math.round((deu / total) * 1000) / 10) : 0
  const gradosPag = total > 0 ? (pag / total) * 360 : 0

  const title = mesTituloPie(row.year, row.monthIndex)
  const grad =
    total === 0
      ? 'conic-gradient(var(--reporte-pie-vacio) 0deg 360deg)'
      : pag === 0
        ? 'conic-gradient(var(--reporte-deuda) 0deg 360deg)'
        : deu === 0
          ? 'conic-gradient(var(--reporte-cobradas) 0deg 360deg)'
          : `conic-gradient(var(--reporte-cobradas) 0deg ${gradosPag}deg, var(--reporte-deuda) ${gradosPag}deg 360deg)`

  return (
    <div className="reporte-ventas-pie-wrap">
      <div className="reporte-ventas-pie-title">{title}</div>
      <div className="reporte-ventas-pie-visual">
        <div className="reporte-ventas-pie" style={{ background: grad }} aria-hidden="true" />
      </div>
      {total === 0 ? (
        <p className="reporte-ventas-pie-empty text-secondary">Sin compras</p>
      ) : (
        <ul className="reporte-ventas-pie-leyenda">
          <li>
            <span className="reporte-ventas-dot reporte-ventas-dot--cobradas" />
            COMPRAS PAGADAS: {pag} ({pctPag}%)
          </li>
          <li>
            <span className="reporte-ventas-dot reporte-ventas-dot--deuda" />
            COMPRAS CON DEUDA: {deu} ({pctDeu}%)
          </li>
        </ul>
      )}
    </div>
  )
}

function ReporteComprasPanel() {
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
    const { data, error: err } = await getComprasPorRangoFechas(bounds.desde, bounds.hasta)
    if (err) {
      setError(err.message || 'No se pudieron cargar las compras.')
      setRows([])
      setLoading(false)
      return
    }
    const filtradas = filterComprasBySlicerDateKeys(data || [], ks)
    const agregado = aggregateComprasByMonth(filtradas)
    setRows(mergeComprasAggregatedWithSlicer(agregado, s))
    setLoading(false)
  }, [slicer])

  useEffect(() => {
    cargar()
  }, [cargar])

  const totales = useMemo(() => totalesGeneralesCompras(rows), [rows])
  const barScale = useMemo(() => maxBarScale(rows), [rows])
  const ticketText = useMemo(
    () =>
      buildTicketTextCompras({
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
      await downloadReporteComprasPdf({
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
    printReporteTicket({ titulo: 'Reporte de compras — ticket', texto: ticketText })
  }

  return (
    <div className="reporte-ventas">
      <h2 className="reportes-panel-heading">Reporte de compras</h2>
      <p className="reportes-panel-text reporte-ventas-intro">
        Totales por mes según el rango de fechas (fecha de orden del registro de compras): montos, pagos y deudas, y
        cantidad de operaciones.
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
        <div className="reporte-ventas-grid">
          <section className="reporte-ventas-col" aria-labelledby="reporte-compras-montos-title">
            <h3 id="reporte-compras-montos-title" className="reporte-ventas-subtitle">
              Montos
            </h3>
            <div className="reporte-ventas-table-wrap">
              <table className="reporte-ventas-table">
                <thead>
                  <tr>
                    <th>MES</th>
                    <th>TOTAL $</th>
                    <th>$ PAGADO</th>
                    <th>$ DEUDA</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="reporte-ventas-sin-datos">
                        No hay compras en el rango seleccionado.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.key}>
                        <td>{r.labelCorto}</td>
                        <td>{formatMoneyAR(r.totalMonto)}</td>
                        <td>{formatMoneyAR(r.montoPagado)}</td>
                        <td>{formatMoneyAR(r.montoDeuda)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr>
                      <td>Total general</td>
                      <td>{formatMoneyAR(totales.totalMonto)}</td>
                      <td>{formatMoneyAR(totales.montoPagado)}</td>
                      <td>{formatMoneyAR(totales.montoDeuda)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {rows.length > 0 && (
              <div
                ref={chartBarrasRef}
                className="reporte-ventas-chart-area"
                aria-label="Gráfico de barras montos pagado y deuda"
              >
                <div className="reporte-ventas-barras">
                  {rows.map((r) => (
                    <div key={r.key} className="reporte-ventas-barra-fila">
                      <span className="reporte-ventas-barra-mes">{r.labelCorto}</span>
                      <div className="reporte-ventas-barra-tracks">
                        <div className="reporte-ventas-barra-line">
                          <div
                            className="reporte-ventas-barra-fill reporte-ventas-barra-fill--pagado"
                            style={{ width: `${(r.montoPagado / barScale) * 100}%` }}
                          />
                          <span className="reporte-ventas-barra-valor">{formatMoneyAR(r.montoPagado)}</span>
                        </div>
                        <div className="reporte-ventas-barra-line">
                          <div
                            className="reporte-ventas-barra-fill reporte-ventas-barra-fill--deuda"
                            style={{ width: `${(r.montoDeuda / barScale) * 100}%` }}
                          />
                          <span className="reporte-ventas-barra-valor">{formatMoneyAR(r.montoDeuda)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="reporte-ventas-leyenda-barras">
                  <span>
                    <i className="reporte-ventas-sq reporte-ventas-sq--deuda" /> $ DEUDA
                  </span>
                  <span>
                    <i className="reporte-ventas-sq reporte-ventas-sq--pagado" /> $ PAGADO
                  </span>
                </div>
              </div>
            )}
          </section>

          <section className="reporte-ventas-col" aria-labelledby="reporte-compras-volumen-title">
            <h3 id="reporte-compras-volumen-title" className="reporte-ventas-subtitle">
              Cantidad de compras
            </h3>
            <div className="reporte-ventas-table-wrap">
              <table className="reporte-ventas-table">
                <thead>
                  <tr>
                    <th>MES</th>
                    <th>Nº COMPRAS</th>
                    <th>COMPRAS PAGADAS</th>
                    <th>COMPRAS CON DEUDA</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="reporte-ventas-sin-datos">
                        No hay compras en el rango seleccionado.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.key}>
                        <td>{r.labelCorto}</td>
                        <td>{r.numCompras}</td>
                        <td>{r.comprasPagadas}</td>
                        <td>{r.comprasConDeuda}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr>
                      <td>Total general</td>
                      <td>{totales.numCompras}</td>
                      <td>{totales.comprasPagadas}</td>
                      <td>{totales.comprasConDeuda}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {rows.length > 0 && (
              <div className="reporte-ventas-chart-area reporte-ventas-pies-grid" aria-label="Gráficos por mes">
                {rows.map((r) => (
                  <PieMesCompras key={r.key} row={r} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default ReporteComprasPanel
