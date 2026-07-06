import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { formatMoney, formatNumber } from '../utils/dashboardFormat'

function TopProductsChart({ products }) {
  const data = products.map((p) => ({
    name: p.name.length > 22 ? `${p.name.slice(0, 22)}…` : p.name,
    fullName: p.name,
    qty: p.qty,
    amount: p.amount,
  }))

  return (
    <div className="dash-card">
      <div className="dash-card__head">
        <h3>Top productos vendidos</h3>
      </div>
      <div className="dash-chart-bar__body">
        {data.length === 0 ? (
          <p className="dash-empty">Sin ventas en el período.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(220, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#cbd5e1', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8 }}
                formatter={(v, name) => [name === 'qty' ? formatNumber(v) : formatMoney(v), name === 'qty' ? 'Unidades' : 'Importe']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
              />
              <Bar dataKey="qty" fill="#34d399" radius={[0, 4, 4, 0]} name="qty" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default TopProductsChart
