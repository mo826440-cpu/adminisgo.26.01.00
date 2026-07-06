import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  ComposedChart,
  Line,
} from 'recharts'
import { formatMoney, formatNumber } from '../utils/dashboardFormat'

const METRICS = [
  { id: 'ventas', label: 'Ventas' },
  { id: 'compras', label: 'Compras' },
  { id: 'ganancias', label: 'Ganancias' },
  { id: 'tickets', label: 'Cantidad tickets' },
  { id: 'ticket', label: 'Ticket promedio' },
  { id: 'clientes', label: 'Clientes nuevos' },
]

const GRANULARITIES = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'year', label: 'Año' },
]

function EvolutionChart({ data, metric, granularity, onMetricChange, onGranularityChange }) {
  const isMoney = ['ventas', 'compras', 'ganancias', 'ticket'].includes(metric)
  const fmt = (v) => (isMoney ? formatMoney(v) : formatNumber(v))

  return (
    <div className="dash-card dash-chart-evolution">
      <div className="dash-card__head">
        <h3>Evolución del período</h3>
        <div className="dash-card__controls">
          <select className="form-control dash-input dash-input--sm" value={metric} onChange={(e) => onMetricChange(e.target.value)}>
            {METRICS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <select className="form-control dash-input dash-input--sm" value={granularity} onChange={(e) => onGranularityChange(e.target.value)}>
            {GRANULARITIES.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="dash-chart-evolution__body">
        {data.length === 0 ? (
          <p className="dash-empty">Sin datos para el período seleccionado.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="dashLineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => (isMoney ? `$${(v / 1000).toFixed(0)}k` : v)} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(v) => [fmt(v), 'Valor']}
              />
              <Area type="monotone" dataKey="value" fill="url(#dashLineGrad)" stroke="none" />
              <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 4, fill: '#22d3ee' }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
        {metric === 'ganancias' && (
          <p className="dash-todo">TODO: ganancias reales cuando exista costo por ítem en ventas.</p>
        )}
      </div>
    </div>
  )
}

export default EvolutionChart
