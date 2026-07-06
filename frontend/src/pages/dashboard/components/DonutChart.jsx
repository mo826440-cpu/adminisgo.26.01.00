import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { DONUT_COLORS } from '../utils/dashboardCalculations'
import { formatMoney } from '../utils/dashboardFormat'

function DonutChart({ title, data, onSliceClick, centerLabel }) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="dash-card dash-chart-donut">
      <div className="dash-card__head">
        <h3>{title}</h3>
      </div>
      <div className="dash-chart-donut__body">
        {data.length === 0 ? (
          <p className="dash-empty">Sin datos.</p>
        ) : (
          <>
            <div className="dash-chart-donut__chart">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={2}
                    onClick={(entry) => onSliceClick?.(entry?.name)}
                    style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
                  >
                    {data.map((entry, i) => (
                      <Cell key={entry.name} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8 }}
                    formatter={(v) => formatMoney(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="dash-chart-donut__center">
                <span>{centerLabel || 'Total'}</span>
                <strong>{formatMoney(total)}</strong>
              </div>
            </div>
            <ul className="dash-chart-donut__legend">
              {data.map((d, i) => {
                const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0'
                return (
                  <li key={d.name}>
                    <button
                      type="button"
                      className="dash-legend-item"
                      onClick={() => onSliceClick?.(d.name)}
                      title={onSliceClick ? 'Filtrar por este valor' : undefined}
                    >
                      <span className="dash-legend-item__dot" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span className="dash-legend-item__name">{d.name}</span>
                      <span className="dash-legend-item__pct">{pct}%</span>
                      <span className="dash-legend-item__val">{formatMoney(d.value)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

export default DonutChart
