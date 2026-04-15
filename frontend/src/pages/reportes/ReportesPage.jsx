// Módulo de informes: pestañas por área (contenido de reportes pendiente de implementar)
import { useState } from 'react'
import { Layout } from '../../components/layout'
import { Card } from '../../components/common'
import '../../styles/registros-seccion.css'
import './ReportesPage.css'
import ReporteVentasPanel from './ReporteVentasPanel'
import ReporteComprasPanel from './ReporteComprasPanel'
import ReporteBalancesPanel from './ReporteBalancesPanel'

const TABS = [
  {
    id: 'ventas',
    label: 'VENTAS',
    descripcion:
      'Totales por mes según registros de ventas: montos, cobranzas y deudas.',
  },
  {
    id: 'compras',
    label: 'COMPRAS',
    descripcion:
      'Totales por mes según registros de compras (fecha de orden): montos, pagos y deudas.',
  },
  {
    id: 'balances',
    label: 'BALANCES',
    descripcion:
      'Totales de ventas y compras por mes y rentabilidad (ventas − compras) en el mismo período.',
  },
]

function ReportesPage() {
  const [activeId, setActiveId] = useState(TABS[0].id)
  const active = TABS.find((t) => t.id === activeId) || TABS[0]

  return (
    <Layout>
      <div className="container reportes-page">
        <div className="page-header">
          <div>
            <div className="section-label">SECCIÓN</div>
            <h1 className="registros-seccion-titulo reportes-page-title">Módulo de informes</h1>
            <p className="text-secondary reportes-page-subtitle">
              Consultá reportes por área de tu negocio.
            </p>
          </div>
        </div>

        <Card className="reportes-card">
          <div
            className="reportes-tabs"
            role="tablist"
            aria-label="Tipos de informes"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`reportes-tab-${tab.id}`}
                aria-selected={activeId === tab.id}
                aria-controls={`reportes-panel-${tab.id}`}
                tabIndex={activeId === tab.id ? 0 : -1}
                className={`reportes-tab ${activeId === tab.id ? 'reportes-tab--active' : ''}`}
                onClick={() => setActiveId(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div
            role="tabpanel"
            id={`reportes-panel-${active.id}`}
            aria-labelledby={`reportes-tab-${active.id}`}
            className="reportes-panel"
          >
            {active.id === 'ventas' ? (
              <ReporteVentasPanel />
            ) : active.id === 'compras' ? (
              <ReporteComprasPanel />
            ) : (
              <ReporteBalancesPanel />
            )}
          </div>
        </Card>
      </div>
    </Layout>
  )
}

export default ReportesPage
