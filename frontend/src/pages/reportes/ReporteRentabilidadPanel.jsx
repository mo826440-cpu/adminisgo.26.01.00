import { useState, useEffect, useCallback, useMemo } from 'react'
import { getRentabilidadMensual } from '../../services/rentabilidad'
import { Spinner, Alert, Button } from '../../components/common'
import { formatMoneyAR, mesCorto } from './reporteVentasUtils'
import {
  enumerateMonthBuckets,
  formatSlicerExportLines,
  getDefaultSlicerArrays,
  slicerArraysToState,
} from './reporteDateSlicers'
import ReporteDateSlicerBar from './ReporteDateSlicerBar'
import './ReporteVentasPanel.css'
import './ReporteRentabilidadPanel.css'

function num(v) {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function buildOrFilterFromBuckets(buckets) {
  if (!buckets.length) return null
  return buckets.map((b) => `and(anio.eq.${b.year},mes.eq.${b.monthIndex + 1})`).join(',')
}

function mergeBucketsWithView(buckets, viewRows) {
  const map = new Map()
  for (const r of viewRows || []) {
    const y = parseInt(r.anio, 10)
    const m = parseInt(r.mes, 10)
    if (!Number.isFinite(y) || !Number.isFinite(m)) continue
    const key = `${y}-${String(m).padStart(2, '0')}`
    map.set(key, r)
  }
  return buckets.map((b) => {
    const key = `${b.year}-${String(b.monthIndex + 1).padStart(2, '0')}`
    const raw = map.get(key)
    const ingresos = raw ? num(raw.ingresos) : 0
    const compras = raw ? num(raw.costo_mercaderia) : 0
    const gastos = raw ? num(raw.gastos_operativos) : 0
    const egresos = compras + gastos
    const utilidad = raw ? num(raw.utilidad_neta) : ingresos - compras - gastos
    const margen = raw ? num(raw.margen_porcentaje) : ingresos > 0 ? (utilidad / ingresos) * 100 : 0
    return {
      key,
      year: b.year,
      monthIndex: b.monthIndex,
      labelCorto: mesCorto(b.year, b.monthIndex),
      ingresos,
      compras,
      gastos,
      egresos,
      utilidad,
      margen,
    }
  })
}

function totalesRentabilidad(rows) {
  return (rows || []).reduce(
    (acc, r) => ({
      ingresos: acc.ingresos + r.ingresos,
      compras: acc.compras + r.compras,
      gastos: acc.gastos + r.gastos,
      egresos: acc.egresos + r.egresos,
      utilidad: acc.utilidad + r.utilidad,
    }),
    { ingresos: 0, compras: 0, gastos: 0, egresos: 0, utilidad: 0 }
  )
}

function maxBarIngresosEgresos(rows) {
  let m = 0
  for (const r of rows || []) {
    m = Math.max(m, r.ingresos, r.egresos)
  }
  return m > 0 ? m : 1
}

function formatPct(val) {
  const n = Number(val)
  if (!Number.isFinite(n)) return '0,00%'
  return `${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

function MargenLineChart({ rows }) {
  const data = rows.filter((r) => r.ingresos > 0 || Math.abs(r.margen) > 0.0001)
  if (data.length === 0) return null

  const values = data.map((d) => d.margen)
  const minV = Math.min(0, ...values)
  const maxV = Math.max(0, ...values)
  const span = Math.max(maxV - minV, 1e-6)

  const padLeft = 44
  const padRight = 16
  const padTop = 20
  const padBottom = 36
  const w = 720
  const h = 200
  const chartW = w - padLeft - padRight
  const chartH = h - padTop - padBottom
  const n = data.length
  const xAt = (i) => padLeft + (n <= 1 ? chartW / 2 : (i / (n - 1)) * chartW)
  const yAt = (pct) => padTop + chartH - ((pct - minV) / span) * chartH
  const pointsLine = data.map((d, i) => `${xAt(i)},${yAt(d.margen)}`).join(' ')

  return (
    <div className="reporte-renta-line-wrap">
      <p className="reporte-renta-line-desc">Evolución del margen % sobre ingresos (por mes).</p>
      <svg className="reporte-renta-line-svg" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Margen porcentual por mes">
        <line
          x1={padLeft}
          y1={yAt(0)}
          x2={padLeft + chartW}
          y2={yAt(0)}
          stroke="var(--border-color)"
          strokeDasharray="4 4"
          strokeWidth="1"
        />
        <polyline fill="none" stroke="#6c8cff" strokeWidth="2.5" points={pointsLine} />
        {data.map((d, i) => (
          <g key={d.key}>
            <circle cx={xAt(i)} cy={yAt(d.margen)} r="4" fill="#6c8cff" />
            <text x={xAt(i)} y={h - 10} textAnchor="middle" className="reporte-renta-line-xlabel">
              {d.labelCorto}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function ReporteRentabilidadPanel() {
  const [slicer, setSlicer] = useState(() => getDefaultSlicerArrays())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rows, setRows] = useState([])

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
    const buckets = enumerateMonthBuckets(s)
    if (!buckets.length) {
      setError('La combinación de segmentos no incluye ningún mes.')
      setLoading(false)
      setRows([])
      return
    }

    const orFilter = buildOrFilterFromBuckets(buckets)
    const { data, error: err } = await getRentabilidadMensual({ orFilter })
    if (err) {
      setError(err.message || 'No se pudo cargar la rentabilidad.')
      setRows([])
      setLoading(false)
      return
    }

    setRows(mergeBucketsWithView(buckets, data))
    setLoading(false)
  }, [slicer])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void cargar()
    }, 0)
    return () => clearTimeout(id)
  }, [cargar])

  const totales = useMemo(() => totalesRentabilidad(rows), [rows])
  const margenTotal =
    totales.ingresos > 0.005 ? (totales.utilidad / totales.ingresos) * 100 : 0
  const barMax = useMemo(() => maxBarIngresosEgresos(rows), [rows])

  return (
    <div className="reporte-ventas">
      <h2 className="reportes-panel-heading">Rentabilidad mensual</h2>
      <p className="reportes-panel-text reporte-ventas-intro">
        Cruce de <strong>ventas</strong> (ingresos), <strong>compras</strong> (costo de mercadería) y{' '}
        <strong>otros costos</strong> operativos (tipos Fijo y Variable). La utilidad es ingresos menos compras menos
        gastos; el margen % es utilidad sobre ingresos del mes.
      </p>
      {slicer.days.length > 0 && (
        <p className="reporte-renta-aviso-dias text-secondary" role="note">
          Los importes provienen de totales <strong>mensuales completos</strong> en base de datos. Si filtrás por días
          puntuales, igual se listan los meses seleccionados; para desglose por día usá los informes de ventas o compras.
        </p>
      )}

      <div className="reporte-ventas-filtro">
        <span className="reporte-ventas-filtro-label">FILTRAR POR FECHA (SEGMENTOS)</span>
        <div className="reporte-ventas-filtro-campos reporte-ventas-filtro-campos--slicer">
          <ReporteDateSlicerBar years={slicer.years} months={slicer.months} days={slicer.days} onChange={setSlicer} />
          <div className="reporte-ventas-filtro-actions">
            <Button type="button" variant="outline" size="sm" onClick={() => void cargar()} disabled={loading}>
              Actualizar
            </Button>
          </div>
          <p className="reporte-ventas-periodo-resumen text-secondary" aria-live="polite">
            Filtro de meses: {exportLines.criterio}
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
          <section aria-labelledby="reporte-renta-tabla-title">
            <h3 id="reporte-renta-tabla-title" className="reporte-ventas-subtitle">
              Resumen por mes
            </h3>
            <div className="reporte-ventas-table-wrap">
              <table className="reporte-ventas-table">
                <thead>
                  <tr>
                    <th>MES</th>
                    <th>INGRESOS</th>
                    <th>COMPRAS</th>
                    <th>GASTOS</th>
                    <th>UTILIDAD</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="reporte-ventas-sin-datos">
                        No hay meses en el criterio seleccionado.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.key}>
                        <td>{r.labelCorto}</td>
                        <td>{formatMoneyAR(r.ingresos)}</td>
                        <td>{formatMoneyAR(r.compras)}</td>
                        <td>{formatMoneyAR(r.gastos)}</td>
                        <td
                          className={
                            r.utilidad < -0.005
                              ? 'reporte-balance-renta-neg'
                              : r.utilidad > 0.005
                                ? 'reporte-balance-renta-pos'
                                : ''
                          }
                        >
                          {formatMoneyAR(r.utilidad)}
                        </td>
                        <td>{formatPct(r.margen)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr>
                      <td>Total general</td>
                      <td>{formatMoneyAR(totales.ingresos)}</td>
                      <td>{formatMoneyAR(totales.compras)}</td>
                      <td>{formatMoneyAR(totales.gastos)}</td>
                      <td
                        className={
                          totales.utilidad < -0.005
                            ? 'reporte-balance-renta-neg'
                            : totales.utilidad > 0.005
                              ? 'reporte-balance-renta-pos'
                              : ''
                        }
                      >
                        {formatMoneyAR(totales.utilidad)}
                      </td>
                      <td>{formatPct(margenTotal)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>

          {rows.length > 0 && (
            <section className="reporte-balances-chart-block" aria-labelledby="reporte-renta-graficos-title">
              <h3 id="reporte-renta-graficos-title" className="reporte-ventas-subtitle">
                Visualización
              </h3>
              <div className="reporte-ventas-chart-area" aria-label="Ingresos versus egresos por mes">
                <h4 className="reporte-renta-chart-sub">Ingresos vs egresos (compras + gastos)</h4>
                <div className="reporte-ventas-barras">
                  {rows.map((r) => (
                    <div key={r.key} className="reporte-ventas-barra-fila">
                      <span className="reporte-ventas-barra-mes">{r.labelCorto}</span>
                      <div className="reporte-ventas-barra-tracks">
                        <div className="reporte-ventas-barra-line">
                          <div
                            className="reporte-ventas-barra-fill reporte-renta-fill--ingresos"
                            style={{ width: `${(r.ingresos / barMax) * 100}%` }}
                          />
                          <span className="reporte-ventas-barra-valor">{formatMoneyAR(r.ingresos)}</span>
                        </div>
                        <div className="reporte-ventas-barra-line">
                          <div
                            className="reporte-ventas-barra-fill reporte-renta-fill--egresos"
                            style={{ width: `${(r.egresos / barMax) * 100}%` }}
                          />
                          <span className="reporte-ventas-barra-valor">{formatMoneyAR(r.egresos)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="reporte-ventas-leyenda-barras">
                  <span>
                    <i className="reporte-ventas-sq reporte-renta-sq--ingresos" aria-hidden="true" /> Ingresos (ventas)
                  </span>
                  <span>
                    <i className="reporte-ventas-sq reporte-renta-sq--egresos" aria-hidden="true" /> Egresos (compras +
                    gastos operativos)
                  </span>
                </div>
              </div>

              <div className="reporte-ventas-chart-area reporte-renta-line-block">
                <h4 className="reporte-renta-chart-sub">Margen % (utilidad / ingresos)</h4>
                <MargenLineChart rows={rows} />
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default ReporteRentabilidadPanel
