import { Button } from '../common'
import './RegistrosVentasFiltro.css'

const TIPO_LABELS = {
  fecha: 'Fecha',
  cliente: 'Cliente',
  metodo_pago: 'Método de pago',
  estado: 'Estado',
}

const OPCIONES_VACIAS = { clientes: [], metodosPago: [], estados: [] }

function RegistrosVentasFiltro({
  idPrefix = 'ventas-registros',
  tipoFiltro = '',
  valorFiltro = '',
  fechaDesde = '',
  fechaHasta = '',
  onTipoChange,
  onValorChange,
  onFechaDesdeChange,
  onFechaHastaChange,
  onAplicar,
  onLimpiar,
  opcionesFiltro = OPCIONES_VACIAS,
  aplicando = false,
}) {
  const tipoId = `${idPrefix}-filtro-tipo`
  const valorId = `${idPrefix}-filtro-valor`
  const desdeId = `${idPrefix}-filtro-fecha-desde`
  const hastaId = `${idPrefix}-filtro-fecha-hasta`

  const renderOpcionesSelect = (items, placeholder) => (
    <select
      id={valorId}
      name={`${idPrefix}_filtro_valor`}
      className="form-control registros-ventas-filtro__valor"
      value={valorFiltro}
      onChange={(e) => onValorChange(e.target.value)}
      disabled={items.length === 0}
    >
      <option value="">
        {items.length === 0 ? 'Sin opciones en los registros cargados' : placeholder}
      </option>
      {items.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )

  const renderValorField = () => {
    switch (tipoFiltro) {
      case 'fecha':
        return (
          <div className="registros-ventas-filtro__fecha-rango">
            <div className="registros-ventas-filtro__fecha-item">
              <label htmlFor={desdeId} className="registros-ventas-filtro__fecha-label">
                Desde
              </label>
              <input
                id={desdeId}
                name={`${idPrefix}_filtro_fecha_desde`}
                type="date"
                className="form-control"
                value={fechaDesde}
                max={fechaHasta || undefined}
                onChange={(e) => onFechaDesdeChange(e.target.value)}
              />
            </div>
            <div className="registros-ventas-filtro__fecha-item">
              <label htmlFor={hastaId} className="registros-ventas-filtro__fecha-label">
                Hasta
              </label>
              <input
                id={hastaId}
                name={`${idPrefix}_filtro_fecha_hasta`}
                type="date"
                className="form-control"
                value={fechaHasta}
                min={fechaDesde || undefined}
                onChange={(e) => onFechaHastaChange(e.target.value)}
              />
            </div>
          </div>
        )
      case 'cliente':
        return renderOpcionesSelect(opcionesFiltro.clientes, 'Seleccionar cliente…')
      case 'metodo_pago':
        return renderOpcionesSelect(opcionesFiltro.metodosPago, 'Seleccionar método…')
      case 'estado':
        return renderOpcionesSelect(opcionesFiltro.estados, 'Seleccionar estado…')
      default:
        return (
          <input
            id={valorId}
            name={`${idPrefix}_filtro_valor`}
            type="text"
            className="form-control registros-ventas-filtro__valor"
            placeholder="Elegí un criterio arriba"
            disabled
            value=""
            readOnly
          />
        )
    }
  }

  const puedeAplicar =
    tipoFiltro === 'fecha'
      ? Boolean(fechaDesde && fechaHasta)
      : Boolean(tipoFiltro && String(valorFiltro || '').trim())

  return (
    <div className="registros-ventas-filtro">
      <div className="registros-ventas-filtro__campo">
        <label htmlFor={tipoId}>Filtrar por:</label>
        <select
          id={tipoId}
          name={`${idPrefix}_filtro_tipo`}
          className="form-control"
          value={tipoFiltro}
          onChange={(e) => onTipoChange(e.target.value)}
        >
          <option value="">Sin filtro (últimos registros)</option>
          {Object.entries(TIPO_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div
        className={`registros-ventas-filtro__campo registros-ventas-filtro__campo--valor${
          tipoFiltro === 'fecha' ? ' registros-ventas-filtro__campo--fecha' : ''
        }`}
      >
        <label htmlFor={tipoFiltro === 'fecha' ? desdeId : valorId}>
          {tipoFiltro ? TIPO_LABELS[tipoFiltro] || 'Valor' : 'Valor'}
        </label>
        {renderValorField()}
      </div>
      <div className="registros-ventas-filtro__acciones">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onAplicar}
          disabled={!puedeAplicar || aplicando}
          loading={aplicando}
        >
          Aplicar filtro
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onLimpiar} disabled={aplicando}>
          Limpiar
        </Button>
      </div>
    </div>
  )
}

export default RegistrosVentasFiltro
