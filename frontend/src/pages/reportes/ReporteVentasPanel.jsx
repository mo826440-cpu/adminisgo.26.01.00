import { useState, useEffect, useCallback, useMemo } from 'react'
import { getVentasPorRangoFechas } from '../../services/ventas'
import { Spinner, Alert, Button } from '../../components/common'
import {
  aggregateVentasByMonth,
  mergeAggregatedWithAllMonthsInRange,
  totalesGenerales,
  formatMoneyAR,
  maxBarScale,
  mesTituloPie,
} from './reporteVentasUtils'
import './ReporteVentasPanel.css'

function getDefaultFechaDesde() {
  const ahora = new Date()
  const desde = new Date(ahora.getFullYear(), ahora.getMonth() - 3, ahora.getDate())
  const y = desde.getFullYear()
  const m = String(desde.getMonth() + 1).padStart(2, '0')
  const d = String(desde.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDefaultFechaHasta() {
  const ahora = new Date()
  const y = ahora.getFullYear()
  const m = String(ahora.getMonth() + 1).padStart(2, '0')
  const d = String(ahora.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function PieMes({ row }) {
  const total = row.numVentas
  const cob = row.ventasCobradas
  const deu = row.ventasConDeuda
  const pctCob = total > 0 ? Math.round((cob / total) * 1000) / 10 : 0
  const pctDeu = total > 0 ? Math.min(100, Math.round((deu / total) * 1000) / 10) : 0
  const gradosCob = total > 0 ? (cob / total) * 360 : 0

  const title = mesTituloPie(row.year, row.monthIndex)
  const grad =
    total === 0
      ? 'conic-gradient(var(--reporte-pie-vacio) 0deg 360deg)'
      : cob === 0
        ? 'conic-gradient(var(--reporte-deuda) 0deg 360deg)'
        : deu === 0
          ? 'conic-gradient(var(--reporte-cobradas) 0deg 360deg)'
          : `conic-gradient(var(--reporte-cobradas) 0deg ${gradosCob}deg, var(--reporte-deuda) ${gradosCob}deg 360deg)`

  return (
    <div className="reporte-ventas-pie-wrap">
      <div className="reporte-ventas-pie-title">{title}</div>
      <div className="reporte-ventas-pie-visual">
        <div className="reporte-ventas-pie" style={{ background: grad }} aria-hidden="true" />
      </div>
      {total === 0 ? (
        <p className="reporte-ventas-pie-empty text-secondary">Sin ventas</p>
      ) : (
        <ul className="reporte-ventas-pie-leyenda">
          <li>
            <span className="reporte-ventas-dot reporte-ventas-dot--cobradas" />
            VENTAS COBRADAS: {cob} ({pctCob}%)
          </li>
          <li>
            <span className="reporte-ventas-dot reporte-ventas-dot--deuda" />
            VENTAS CON DEUDA: {deu} ({pctDeu}%)
          </li>
        </ul>
      )}
    </div>
  )
}

function ReporteVentasPanel() {
  const [desde, setDesde] = useState(getDefaultFechaDesde)
  const [hasta, setHasta] = useState(getDefaultFechaHasta)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rows, setRows] = useState([])

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [y0, m0, d0] = desde.split('-').map(Number)
    const [y1, m1, d1] = hasta.split('-').map(Number)
    const dDesde = new Date(y0, m0 - 1, d0)
    const dHasta = new Date(y1, m1 - 1, d1)
    if (dDesde > dHasta) {
      setError('La fecha "Desde" no puede ser posterior a "Hasta".')
      setLoading(false)
      setRows([])
      return
    }

    const { data, error: err } = await getVentasPorRangoFechas(dDesde, dHasta)
    if (err) {
      setError(err.message || 'No se pudieron cargar las ventas.')
      setRows([])
      setLoading(false)
      return
    }
    const agregado = aggregateVentasByMonth(data || [])
    setRows(mergeAggregatedWithAllMonthsInRange(dDesde, dHasta, agregado))
    setLoading(false)
  }, [desde, hasta])

  useEffect(() => {
    cargar()
  }, [cargar])

  const totales = useMemo(() => totalesGenerales(rows), [rows])
  const barScale = useMemo(() => maxBarScale(rows), [rows])

  return (
    <div className="reporte-ventas">
      <h2 className="reportes-panel-heading">Reporte de ventas</h2>
      <p className="reportes-panel-text reporte-ventas-intro">
        Totales por mes según el rango de fechas: montos, cobranzas y deudas, y cantidad de operaciones.
      </p>

      <div className="reporte-ventas-filtro">
        <span className="reporte-ventas-filtro-label">FILTRAR</span>
        <div className="reporte-ventas-filtro-campos">
          <label className="reporte-ventas-fecha">
            Desde
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </label>
          <label className="reporte-ventas-fecha">
            Hasta
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </label>
          <Button type="button" variant="outline" size="sm" onClick={cargar} disabled={loading}>
            Actualizar
          </Button>
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
          <section className="reporte-ventas-col" aria-labelledby="reporte-ventas-montos-title">
            <h3 id="reporte-ventas-montos-title" className="reporte-ventas-subtitle">
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
                        No hay ventas en el rango seleccionado.
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
              <div className="reporte-ventas-chart-area" aria-label="Gráfico de barras montos pagado y deuda">
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

          <section className="reporte-ventas-col" aria-labelledby="reporte-ventas-volumen-title">
            <h3 id="reporte-ventas-volumen-title" className="reporte-ventas-subtitle">
              Cantidad de ventas
            </h3>
            <div className="reporte-ventas-table-wrap">
              <table className="reporte-ventas-table">
                <thead>
                  <tr>
                    <th>MES</th>
                    <th>NUMERO VENTAS</th>
                    <th>VENTAS COBRADAS</th>
                    <th>VENTAS CON DEUDA</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="reporte-ventas-sin-datos">
                        No hay ventas en el rango seleccionado.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.key}>
                        <td>{r.labelCorto}</td>
                        <td>{r.numVentas}</td>
                        <td>{r.ventasCobradas}</td>
                        <td>{r.ventasConDeuda}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr>
                      <td>Total general</td>
                      <td>{totales.numVentas}</td>
                      <td>{totales.ventasCobradas}</td>
                      <td>{totales.ventasConDeuda}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {rows.length > 0 && (
              <div className="reporte-ventas-chart-area reporte-ventas-pies-grid" aria-label="Gráficos por mes">
                {rows.map((r) => (
                  <PieMes key={r.key} row={r} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default ReporteVentasPanel
