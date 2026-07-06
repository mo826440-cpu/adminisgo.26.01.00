import { formatMoney, formatNumber } from '../utils/dashboardFormat'

function TrendBadge({ change }) {
  if (change == null || Number.isNaN(change)) return null
  const up = change >= 0
  return (
    <span className={`dash-kpi__trend ${up ? 'dash-kpi__trend--up' : 'dash-kpi__trend--down'}`}>
      <i className={`bi bi-arrow-${up ? 'up' : 'down'}-short`} aria-hidden />
      {Math.abs(change).toFixed(1)}%
    </span>
  )
}

function DashboardKPIs({ kpis }) {
  return (
    <section className="dash-kpis">
      {kpis.map((kpi) => (
        <article key={kpi.id} className={`dash-kpi dash-kpi--${kpi.tone}`}>
          <div className="dash-kpi__icon-wrap">
            <i className={`bi ${kpi.icon}`} aria-hidden />
          </div>
          <div className="dash-kpi__body">
            <span className="dash-kpi__label">{kpi.label}</span>
            <strong className="dash-kpi__value">
              {kpi.format === 'money' ? formatMoney(kpi.value) : formatNumber(kpi.value)}
            </strong>
            <div className="dash-kpi__footer">
              <TrendBadge change={kpi.change} />
              <span className="dash-kpi__compare">{kpi.compareLabel}</span>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}

export default DashboardKPIs
