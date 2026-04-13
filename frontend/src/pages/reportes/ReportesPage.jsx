// Módulo de informes: pestañas por área (contenido de reportes pendiente de implementar)
import { useState } from 'react'
import { Layout } from '../../components/layout'
import { Card } from '../../components/common'
import '../../styles/registros-seccion.css'
import './ReportesPage.css'
import ReporteVentasPanel from './ReporteVentasPanel'

const TABS = [
  {
    id: 'ventas',
    label: 'VENTAS',
    descripcion:
      'En esta sección se implementarán los reportes sobre los registros del módulo de ventas.',
  },
  {
    id: 'compras',
    label: 'COMPRAS',
    descripcion:
      'En esta sección se implementarán los reportes sobre los registros del módulo de compras.',
  },
  {
    id: 'productos',
    label: 'PRODUCTOS',
    descripcion:
      'En esta sección se implementarán los reportes sobre los registros del módulo de productos.',
  },
  {
    id: 'proveedores',
    label: 'PROVEEDORES',
    descripcion:
      'En esta sección se implementarán los reportes sobre los registros del módulo de proveedores.',
  },
  {
    id: 'clientes',
    label: 'CLIENTES',
    descripcion:
      'En esta sección se implementarán los reportes sobre los registros del módulo de clientes.',
  },
  {
    id: 'balances',
    label: 'BALANCES',
    descripcion:
      'En esta sección se implementarán los informes de balances y estados resumidos de tu negocio.',
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
            ) : (
              <>
                <h2 className="reportes-panel-heading">{active.label}</h2>
                <p className="reportes-panel-text">{active.descripcion}</p>
                <p className="reportes-panel-hint text-secondary">
                  El contenido de informes y exportaciones se agregará en próximas iteraciones.
                </p>
              </>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  )
}

export default ReportesPage
