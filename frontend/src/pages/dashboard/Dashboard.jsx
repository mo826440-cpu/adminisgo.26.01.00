import { useState, useEffect } from 'react'
import { useAuthContext } from '../../context/AuthContext'
import { useDateTime } from '../../context/DateTimeContext'
import { Layout } from '../../components/layout'
import { Spinner, Alert } from '../../components/common'
import { getEstadoSuscripcion } from '../../services/planes'
import { useDashboardData } from './hooks/useDashboardData'
import DashboardHeader from './components/DashboardHeader'
import DashboardFilters from './components/DashboardFilters'
import DashboardKPIs from './components/DashboardKPIs'
import EvolutionChart from './components/EvolutionChart'
import DonutChart from './components/DonutChart'
import TopProductsChart from './components/TopProductsChart'
import DashboardTables from './components/DashboardTables'
import {
  VentaStatusCards,
  CompraStatusCards,
  ComparisonsBar,
  StockIndicators,
  AlertsPanel,
  TopClientesTable,
  TopProveedoresTable,
} from './components/DashboardStatusCards'
import { downloadDashboardPdf, downloadDashboardExcel } from './utils/dashboardExport'
import './Dashboard.css'

function Dashboard() {
  const { user, loading: authLoading } = useAuthContext()
  const { currentDateTime, timezone, dateFormat } = useDateTime()
  const [suscripcion, setSuscripcion] = useState(null)
  const [loadingSuscripcion, setLoadingSuscripcion] = useState(true)
  const [filtersCollapsed, setFiltersCollapsed] = useState(true)

  const {
    loading,
    error,
    draftFilters,
    appliedFilters,
    catalogos,
    analytics,
    evolutionMetric,
    setEvolutionMetric,
    evolutionGranularity,
    setEvolutionGranularity,
    setFilter,
    setAppliedFilter,
    applyFilters,
    clearFilters,
    refresh,
  } = useDashboardData(user, authLoading)

  useEffect(() => {
    const cargarSuscripcion = async () => {
      if (!user) return
      setLoadingSuscripcion(true)
      try {
        const { data, error: err } = await getEstadoSuscripcion()
        if (!err) setSuscripcion(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingSuscripcion(false)
      }
    }
    if (!authLoading && user) cargarSuscripcion()
  }, [user, authLoading])

  const handleHeaderDateFrom = (val) => {
    setAppliedFilter('fechaDesde', val)
  }

  const handleHeaderDateTo = (val) => {
    setAppliedFilter('fechaHasta', val)
  }

  const handlePaymentClick = (metodo) => {
    if (!metodo || metodo === 'Deuda') return
    setAppliedFilter('metodoPago', metodo)
  }

  if (authLoading) {
    return (
      <Layout>
        <div className="dash-loading">
          <Spinner size="lg" />
          <p>Cargando...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="dash-page">
        <DashboardHeader
          user={user}
          currentDateTime={currentDateTime}
          timezone={timezone}
          dateFormat={dateFormat}
          suscripcion={suscripcion}
          loadingSuscripcion={loadingSuscripcion}
          fechaDesde={appliedFilters.fechaDesde || appliedFilters.desde}
          fechaHasta={appliedFilters.fechaHasta || appliedFilters.hasta}
          onFechaDesdeChange={handleHeaderDateFrom}
          onFechaHastaChange={handleHeaderDateTo}
          onRefresh={refresh}
          onExportPdf={() => downloadDashboardPdf({ analytics, filters: appliedFilters, userEmail: user?.email })}
          onExportExcel={() => downloadDashboardExcel({ analytics, filters: appliedFilters })}
          loading={loading}
        />

        {error && (
          <Alert variant="danger" dismissible>
            {error}
          </Alert>
        )}

        <DashboardFilters
          filters={draftFilters}
          catalogos={catalogos}
          onChange={setFilter}
          onApply={applyFilters}
          onClear={clearFilters}
          collapsed={filtersCollapsed}
          onToggleCollapsed={() => setFiltersCollapsed((c) => !c)}
        />

        <ComparisonsBar comparisons={analytics.comparisons} />

        {loading ? (
          <div className="dash-loading dash-loading--inline">
            <Spinner size="md" />
            <span>Actualizando indicadores...</span>
          </div>
        ) : (
          <>
            <DashboardKPIs kpis={analytics.kpis} />

            <div className="dash-charts-main">
              <EvolutionChart
                data={analytics.evolution}
                metric={evolutionMetric}
                granularity={evolutionGranularity}
                onMetricChange={setEvolutionMetric}
                onGranularityChange={setEvolutionGranularity}
              />
              <div className="dash-charts-donuts">
                <DonutChart
                  title="Ventas por forma de pago"
                  data={analytics.paymentDonut}
                  onSliceClick={handlePaymentClick}
                  centerLabel="Total"
                />
                <DonutChart
                  title="Ventas por categoría"
                  data={analytics.categoryDonut}
                />
              </div>
            </div>

            <div className="dash-mid-grid">
              <TopProductsChart products={analytics.topProducts} />
              <AlertsPanel alerts={analytics.alerts} />
            </div>

            <div className="dash-status-grid">
              <VentaStatusCards items={analytics.ventaEstados} />
              <CompraStatusCards items={analytics.compraEstados} />
              <StockIndicators stock={analytics.stock} />
            </div>

            <div className="dash-rank-grid">
              <TopClientesTable rows={analytics.topClientes} />
              <TopProveedoresTable rows={analytics.topProveedores} />
            </div>

            <DashboardTables
              latestVentas={analytics.latestVentas}
              latestCompras={analytics.latestCompras}
              featured={analytics.featured}
            />
          </>
        )}
      </div>
    </Layout>
  )
}

export default Dashboard
