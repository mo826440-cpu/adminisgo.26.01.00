import { Button } from '../../../components/common'
import { METODOS_PAGO } from '../chartConfig'

function DashboardFilters({
  filters,
  catalogos,
  onChange,
  onApply,
  onClear,
  collapsed,
  onToggleCollapsed,
}) {
  const { categorias, marcas, productos, clientes, proveedores } = catalogos

  return (
    <section className="dash-filters">
      <button
        type="button"
        className="dash-filters__toggle"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
      >
        <i className="bi bi-funnel" aria-hidden />
        <span>Filtros globales</span>
        <i className={`bi bi-chevron-${collapsed ? 'down' : 'up'}`} aria-hidden />
      </button>
      {!collapsed && (
        <div className="dash-filters__panel">
          <div className="dash-filters__grid">
            <label className="dash-field">
              <span>Desde</span>
              <input type="date" className="form-control dash-input" value={filters.fechaDesde} onChange={(e) => onChange('fechaDesde', e.target.value)} />
            </label>
            <label className="dash-field">
              <span>Hasta</span>
              <input type="date" className="form-control dash-input" value={filters.fechaHasta} onChange={(e) => onChange('fechaHasta', e.target.value)} />
            </label>
            <label className="dash-field">
              <span>Cliente</span>
              <select className="form-control dash-input" value={filters.clienteId} onChange={(e) => onChange('clienteId', e.target.value)}>
                <option value="">Todos</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </label>
            <label className="dash-field">
              <span>Proveedor</span>
              <select className="form-control dash-input" value={filters.proveedorId} onChange={(e) => onChange('proveedorId', e.target.value)}>
                <option value="">Todos</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre_razon_social}</option>
                ))}
              </select>
            </label>
            <label className="dash-field">
              <span>Categoría</span>
              <select className="form-control dash-input" value={filters.categoriaId} onChange={(e) => onChange('categoriaId', e.target.value)}>
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </label>
            <label className="dash-field">
              <span>Marca</span>
              <select className="form-control dash-input" value={filters.marcaId} onChange={(e) => onChange('marcaId', e.target.value)}>
                <option value="">Todas</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </label>
            <label className="dash-field">
              <span>Producto</span>
              <select className="form-control dash-input" value={filters.productoId} onChange={(e) => onChange('productoId', e.target.value)}>
                <option value="">Todos</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </label>
            <label className="dash-field">
              <span>Forma de pago</span>
              <select className="form-control dash-input" value={filters.metodoPago} onChange={(e) => onChange('metodoPago', e.target.value)}>
                <option value="">Todas</option>
                {METODOS_PAGO.map((mp) => (
                  <option key={mp} value={mp}>{mp}</option>
                ))}
              </select>
            </label>
            <label className="dash-field">
              <span>Estado venta</span>
              <select className="form-control dash-input" value={filters.estadoVenta} onChange={(e) => onChange('estadoVenta', e.target.value)}>
                <option value="">Todos</option>
                <option value="pagada">Pagada</option>
                <option value="pendiente">Pendiente</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </label>
            <label className="dash-field">
              <span>Estado compra</span>
              <select className="form-control dash-input" value={filters.estadoCompra} onChange={(e) => onChange('estadoCompra', e.target.value)}>
                <option value="">Todos</option>
                <option value="recibida">Recibida</option>
                <option value="pendiente">Pendiente</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </label>
            <label className="dash-field">
              <span>Activo</span>
              <select className="form-control dash-input" value={filters.activo} onChange={(e) => onChange('activo', e.target.value)}>
                <option value="">Todos</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </label>
            {/* TODO: sucursal cuando exista en el modelo */}
            {/* TODO: usuario vendedor cuando esté expuesto en consultas */}
          </div>
          <div className="dash-filters__actions">
            <Button variant="primary" size="sm" onClick={onApply}>Aplicar filtros</Button>
            <Button variant="outline" size="sm" onClick={onClear}>Limpiar filtros</Button>
          </div>
        </div>
      )}
    </section>
  )
}

export default DashboardFilters
