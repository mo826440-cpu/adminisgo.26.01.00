import './VpKpiGrid.css'

function VpKpiGrid({ items = [] }) {
  return (
    <div className="vp-kpi-grid">
      {items.map((item) => (
        <article key={item.key || item.label} className={`vp-kpi vp-kpi--${item.tone || 'neutral'}`}>
          <div className="vp-kpi__icon" aria-hidden>
            <i className={`bi ${item.icon || 'bi-info-circle'}`} />
          </div>
          <div className="vp-kpi__body">
            <div className="vp-kpi__label">{item.label}</div>
            <div className="vp-kpi__value">{item.value}</div>
            {item.subtext ? <div className="vp-kpi__sub">{item.subtext}</div> : null}
          </div>
        </article>
      ))}
    </div>
  )
}

export default VpKpiGrid
