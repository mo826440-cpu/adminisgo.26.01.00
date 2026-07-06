import { formatDateTime } from '../../../utils/dateFormat'
import { Button, Badge } from '../../../components/common'
import { usePWAInstall } from '../../../hooks/usePWAInstall'

function DashboardHeader({
  user,
  currentDateTime,
  timezone,
  dateFormat,
  suscripcion,
  loadingSuscripcion,
  fechaDesde,
  fechaHasta,
  onFechaDesdeChange,
  onFechaHastaChange,
  onRefresh,
  onExportPdf,
  onExportExcel,
  loading,
}) {
  const { isInstallable, isInstalled, install } = usePWAInstall()

  const getNombrePlan = (tipo) => {
    const nombres = { gratis: 'Plan Gratuito', pago: 'Plan Pago', basico: 'Plan Pago', personalizado: 'Plan Personalizado' }
    return nombres[tipo] || tipo || 'Sin plan'
  }

  return (
    <header className="dash-header">
      <div className="dash-header__main">
        <div>
          <h1 className="dash-header__title">Dashboard</h1>
          <p className="dash-header__subtitle">
            Resumen general de tu sistema de gestión de kioscos
          </p>
          <p className="dash-header__user">Bienvenido, {user?.email}</p>
          <div className="dash-header__clock">
            <i className="bi bi-clock" aria-hidden />
            <span>{formatDateTime(currentDateTime, dateFormat, timezone)}</span>
          </div>
          {!loadingSuscripcion && suscripcion?.plan && (
            <div className="dash-header__badges">
              <Badge variant="primary">{getNombrePlan(suscripcion.plan.tipo)}</Badge>
              {suscripcion.periodo_gratis?.activo && suscripcion.periodo_gratis.dias_restantes != null && (
                <Badge variant="success">
                  Período gratis: {suscripcion.periodo_gratis.dias_restantes} días
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="dash-header__actions">
          {isInstallable && !isInstalled && (
            <Button onClick={install} variant="outline" size="sm" className="dash-header__pwa">
              Instalar App
            </Button>
          )}
          {isInstalled && <Badge variant="success">App instalada</Badge>}
          <div className="dash-header__range">
            <input
              type="date"
              className="form-control dash-input"
              value={fechaDesde}
              onChange={(e) => onFechaDesdeChange(e.target.value)}
              aria-label="Desde"
            />
            <span className="dash-header__range-sep">—</span>
            <input
              type="date"
              className="form-control dash-input"
              value={fechaHasta}
              onChange={(e) => onFechaHastaChange(e.target.value)}
              aria-label="Hasta"
            />
          </div>
          <Button variant="outline" size="sm" onClick={onExportPdf} disabled={loading}>
            <i className="bi bi-file-earmark-pdf" aria-hidden /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onExportExcel} disabled={loading} title="TODO: exportación Excel completa">
            <i className="bi bi-file-earmark-spreadsheet" aria-hidden /> Excel
          </Button>
          <Button variant="primary" size="sm" onClick={onRefresh} loading={loading}>
            <i className="bi bi-arrow-clockwise" aria-hidden /> Actualizar
          </Button>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
