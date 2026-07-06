import { formatMoney, formatNumber, formatDateAR } from '../utils/dashboardFormat'

function StatusCards({ title, items }) {
  return (
    <div className="dash-card dash-status-group">
      <div className="dash-card__head">
        <h3>{title}</h3>
      </div>
      <div className="dash-status-cards">
        {items.map((item) => (
          <article key={item.id} className={`dash-status-card dash-status-card--${item.tone}`}>
            <span className="dash-status-card__label">{item.label}</span>
            <strong className="dash-status-card__count">{formatNumber(item.count)}</strong>
            <span className="dash-status-card__amount">{formatMoney(item.amount)}</span>
          </article>
        ))}
      </div>
    </div>
  )
}

export function VentaStatusCards({ items }) {
  return <StatusCards title="Estado de ventas" items={items} />
}

export function CompraStatusCards({ items }) {
  return <StatusCards title="Estado de compras" items={items} />
}

export function ComparisonsBar({ comparisons }) {
  return (
    <div className="dash-comparisons">
      {comparisons.map((c) => {
        const up = c.change >= 0
        return (
          <div key={c.id} className="dash-comparison">
            <span>{c.label}</span>
            <strong className={up ? 'dash-comparison--up' : 'dash-comparison--down'}>
              <i className={`bi bi-arrow-${up ? 'up' : 'down'}-short`} aria-hidden />
              {Math.abs(c.change).toFixed(1)}%
            </strong>
          </div>
        )
      })}
    </div>
  )
}

export function StockIndicators({ stock }) {
  return (
    <div className="dash-card">
      <div className="dash-card__head">
        <h3>Indicadores de stock</h3>
      </div>
      <div className="dash-stock">
        <p className="dash-stock__valor">Valor inventario: <strong>{formatMoney(stock.valorInventario)}</strong></p>
        <div className="dash-stock__lists">
          <div>
            <h4>Stock bajo</h4>
            <ul>
              {stock.bajoStock.length === 0 ? <li className="dash-empty-inline">Ninguno</li> : stock.bajoStock.map((p) => (
                <li key={p.id}>{p.nombre} — {p.stock_actual ?? 0} u.</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Sin stock</h4>
            <ul>
              {stock.sinStock.length === 0 ? <li className="dash-empty-inline">Ninguno</li> : stock.sinStock.map((p) => (
                <li key={p.id}>{p.nombre}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="dash-todo">TODO: vencimientos y rotación de stock.</p>
      </div>
    </div>
  )
}

export function AlertsPanel({ alerts }) {
  return (
    <div className="dash-card dash-alerts">
      <div className="dash-card__head">
        <h3>Alertas</h3>
      </div>
      <ul className="dash-alerts__list">
        {alerts.length === 0 ? (
          <li className="dash-empty-inline">Sin alertas activas.</li>
        ) : (
          alerts.map((a) => (
            <li key={a.id} className={`dash-alert dash-alert--${a.type}`}>
              <i className={`bi ${a.icon}`} aria-hidden />
              <span>{a.text}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

export function RankTable({ title, columns, rows }) {
  return (
    <div className="dash-card dash-rank-table">
      <div className="dash-card__head">
        <h3>{title}</h3>
      </div>
      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="dash-empty">Sin datos</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TopClientesTable({ rows }) {
  return (
    <RankTable
      title="Top clientes"
      columns={[
        { key: 'name', label: 'Cliente' },
        { key: 'count', label: 'Compras' },
        { key: 'amount', label: 'Monto', render: (r) => formatMoney(r.amount) },
        { key: 'lastDate', label: 'Última compra', render: (r) => formatDateAR(r.lastDate) },
      ]}
      rows={rows}
    />
  )
}

export function TopProveedoresTable({ rows }) {
  return (
    <RankTable
      title="Top proveedores"
      columns={[
        { key: 'name', label: 'Proveedor' },
        { key: 'count', label: 'Compras' },
        { key: 'amount', label: 'Monto', render: (r) => formatMoney(r.amount) },
        { key: 'lastDate', label: 'Última compra', render: (r) => formatDateAR(r.lastDate) },
      ]}
      rows={rows}
    />
  )
}
