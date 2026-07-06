import { Link } from 'react-router-dom'
import { formatMoney, formatDateAR } from '../utils/dashboardFormat'

function estadoVentaBadge(estado) {
  const map = {
    pagado: { cls: 'dash-badge--green', label: 'PAGADO' },
    pendiente: { cls: 'dash-badge--amber', label: 'PENDIENTE' },
    cancelado: { cls: 'dash-badge--red', label: 'CANCELADA' },
  }
  const e = map[estado] || { cls: '', label: String(estado || '').toUpperCase() }
  return <span className={`dash-badge ${e.cls}`}>{e.label}</span>
}

function estadoCompraBadge(estado) {
  const map = {
    recibida: { cls: 'dash-badge--green', label: 'RECIBIDA' },
    pendiente: { cls: 'dash-badge--amber', label: 'PENDIENTE' },
    cancelada: { cls: 'dash-badge--red', label: 'CANCELADA' },
  }
  const e = map[estado] || { cls: 'dash-badge--cyan', label: String(estado || '').toUpperCase() }
  return <span className={`dash-badge ${e.cls}`}>{e.label}</span>
}

function DashboardTables({ latestVentas, latestCompras, featured }) {
  return (
    <section className="dash-tables-grid">
      <div className="dash-card">
        <div className="dash-card__head">
          <h3>Últimas ventas</h3>
        </div>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Pago</th>
                <th>Total</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {latestVentas.length === 0 ? (
                <tr><td colSpan={6} className="dash-empty">Sin ventas</td></tr>
              ) : latestVentas.map((v) => (
                <tr key={v.id}>
                  <td>{formatDateAR(v.fecha)}</td>
                  <td>{v.cliente}</td>
                  <td>{v.pago}</td>
                  <td>{formatMoney(v.total)}</td>
                  <td>{estadoVentaBadge(v.estado)}</td>
                  <td>
                    <Link to={`/ventas/${v.id}`} className="dash-link">Ver</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card__head">
          <h3>Últimas compras</h3>
        </div>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Total</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {latestCompras.length === 0 ? (
                <tr><td colSpan={5} className="dash-empty">Sin compras</td></tr>
              ) : latestCompras.map((c) => (
                <tr key={c.id}>
                  <td>{formatDateAR(c.fecha)}</td>
                  <td>{c.proveedor}</td>
                  <td>{formatMoney(c.total)}</td>
                  <td>{estadoCompraBadge(c.estado)}</td>
                  <td>
                    <Link to={`/compras/${c.id}`} className="dash-link">Ver</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card__head">
          <h3>Productos destacados</h3>
        </div>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cant./Stock</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {featured.topSold.map((p) => (
                <tr key={`top-${p.id}`}>
                  <td>{p.name}</td>
                  <td><span className="dash-badge dash-badge--green">Más vendido</span></td>
                  <td>{p.qty}</td>
                  <td>{formatMoney(p.amount)}</td>
                </tr>
              ))}
              {featured.lowStock.map((p) => (
                <tr key={`low-${p.id}`}>
                  <td>{p.name}</td>
                  <td><span className="dash-badge dash-badge--amber">Menor stock</span></td>
                  <td>{p.qty}</td>
                  <td>{formatMoney(p.amount)}</td>
                </tr>
              ))}
              {featured.topSold.length === 0 && featured.lowStock.length === 0 && (
                <tr><td colSpan={4} className="dash-empty">Sin datos</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="dash-todo">TODO: más rentables y mayor margen cuando exista costo por ítem.</p>
      </div>
    </section>
  )
}

export default DashboardTables
