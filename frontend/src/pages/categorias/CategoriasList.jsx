// Página de lista de categorías
import { useState, useEffect, useMemo, useCallback, Fragment } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Spinner, Alert, Badge, Pagination, Modal } from '../../components/common'
import { getCategorias } from '../../services/categorias'
import { getProductos, updateProductosPrecioBulk, updateProducto } from '../../services/productos'
import { downloadProductosCategoriaPdf, todosMismoPrecio } from '../../utils/productosCategoriaPdf'
import { downloadCategoriasSeleccionPdf } from '../../utils/categoriasSeleccionPdf'
import PrecioVentaCalculadoraForm from '../../components/productos/PrecioVentaCalculadoraForm'
import PrecioVentaCalcIconButton from '../../components/productos/PrecioVentaCalcIconButton'
import CategoriasActionsMenu from './CategoriasActionsMenu'
import './CategoriasList.css'
import '../../styles/registros-seccion.css'

const ITEMS_PER_PAGE = 100

function formatearMoneda(valor) {
  const num = Number(valor || 0)
  return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function CategoriasList() {
  const location = useLocation()
  const navigate = useNavigate()
  const [categorias, setCategorias] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [successMessage, setSuccessMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [selectedCategoriaIds, setSelectedCategoriaIds] = useState(() => new Set())
  const [selectedProductIds, setSelectedProductIds] = useState(() => new Set())
  const [showBulkPrecioModal, setShowBulkPrecioModal] = useState(false)
  const [bulkPrecioSaving, setBulkPrecioSaving] = useState(false)
  const [bulkPrecioCategoriaId, setBulkPrecioCategoriaId] = useState(null)
  const [bulkPrecioCompraInitial, setBulkPrecioCompraInitial] = useState('')
  const [bulkPrecioVentaInitial, setBulkPrecioVentaInitial] = useState('')
  const [bulkCalcState, setBulkCalcState] = useState({ precioVenta: NaN, valid: false })
  const [savingPrecioProductoId, setSavingPrecioProductoId] = useState(null)
  const [detalleCategoria, setDetalleCategoria] = useState(null)

  useEffect(() => {
    loadData()

    if (location.state?.success) {
      setSuccessMessage(location.state.message || 'Operación realizada correctamente')
      navigate(location.pathname, { replace: true, state: {} })

      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [location.state, navigate, location.pathname])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    const [catRes, prodRes] = await Promise.all([getCategorias(), getProductos()])

    if (catRes.error) {
      setError(catRes.error.message)
      setLoading(false)
      return
    }

    if (prodRes.error) {
      setError(prodRes.error.message)
      setLoading(false)
      return
    }

    setCategorias(catRes.data || [])
    setProductos(prodRes.data || [])
    setLoading(false)
  }

  const productosPorCategoria = useMemo(() => {
    const map = new Map()
    for (const p of productos) {
      const key = p.categoria_id != null ? String(p.categoria_id) : '__sin__'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(p)
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'))
    }
    return map
  }, [productos])

  const filteredCategorias = categorias.filter(
    (categoria) =>
      categoria.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoria.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalItems = filteredCategorias.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedCategorias = filteredCategorias.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleExpand = (categoriaId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      const key = String(categoriaId)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const getProductosCategoria = useCallback(
    (categoriaId) => productosPorCategoria.get(String(categoriaId)) || [],
    [productosPorCategoria],
  )

  const isAllSelectedInCategoria = (categoriaId) => {
    const items = getProductosCategoria(categoriaId)
    if (items.length === 0) return false
    return items.every((p) => selectedProductIds.has(p.id))
  }

  const isSomeSelectedInCategoria = (categoriaId) => {
    const items = getProductosCategoria(categoriaId)
    return items.some((p) => selectedProductIds.has(p.id))
  }

  const toggleSelectAllCategoria = (categoriaId) => {
    const items = getProductosCategoria(categoriaId)
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      const allSelected = items.length > 0 && items.every((p) => next.has(p.id))
      if (allSelected) {
        items.forEach((p) => next.delete(p.id))
      } else {
        items.forEach((p) => next.add(p.id))
      }
      return next
    })
  }

  const toggleSelectCategoria = (categoriaId) => {
    setSelectedCategoriaIds((prev) => {
      const next = new Set(prev)
      const key = String(categoriaId)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const isAllCategoriasSelectedOnPage = () => {
    if (paginatedCategorias.length === 0) return false
    return paginatedCategorias.every((c) => selectedCategoriaIds.has(String(c.id)))
  }

  const isSomeCategoriasSelectedOnPage = () =>
    paginatedCategorias.some((c) => selectedCategoriaIds.has(String(c.id)))

  const toggleSelectAllCategoriasOnPage = () => {
    setSelectedCategoriaIds((prev) => {
      const next = new Set(prev)
      const allSelected =
        paginatedCategorias.length > 0 &&
        paginatedCategorias.every((c) => next.has(String(c.id)))
      if (allSelected) {
        paginatedCategorias.forEach((c) => next.delete(String(c.id)))
      } else {
        paginatedCategorias.forEach((c) => next.add(String(c.id)))
      }
      return next
    })
  }

  const selectedCategoriasCount = useMemo(
    () => filteredCategorias.filter((c) => selectedCategoriaIds.has(String(c.id))).length,
    [filteredCategorias, selectedCategoriaIds],
  )

  const handleExportarPdfSeleccion = () => {
    const seleccionadas = filteredCategorias
      .filter((c) => selectedCategoriaIds.has(String(c.id)))
      .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'))
      .map((c) => ({
        nombre: c.nombre,
        productos: getProductosCategoria(c.id).map((p) => ({
          nombre: p.nombre,
          precio_venta: p.precio_venta,
        })),
      }))

    if (seleccionadas.length === 0) return

    downloadCategoriasSeleccionPdf({ categorias: seleccionadas })
  }

  const toggleSelectProducto = (productoId) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      if (next.has(productoId)) next.delete(productoId)
      else next.add(productoId)
      return next
    })
  }

  const handleBulkCalcChange = useCallback((payload) => {
    setBulkCalcState({ precioVenta: payload.precioVenta, valid: payload.valid })
  }, [])

  const guardarPrecioProducto = async (producto, precioVenta) => {
    const parsed = Number(precioVenta)
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError('Precio inválido')
      return false
    }

    setSavingPrecioProductoId(producto.id)
    setError(null)

    const { data, error: err } = await updateProducto(producto.id, { precio_venta: parsed })

    setSavingPrecioProductoId(null)

    if (err) {
      setError(err.message || 'No se pudo actualizar el precio')
      return false
    }

    setProductos((prev) =>
      prev.map((p) =>
        p.id === producto.id ? { ...p, precio_venta: data?.precio_venta ?? parsed } : p,
      ),
    )
    setSuccessMessage(`Precio de "${producto.nombre}" actualizado`)
    setTimeout(() => setSuccessMessage(null), 3000)
    return true
  }

  const closeBulkPrecioModal = () => {
    if (bulkPrecioSaving) return
    setShowBulkPrecioModal(false)
    setBulkPrecioCategoriaId(null)
    setBulkPrecioCompraInitial('')
    setBulkPrecioVentaInitial('')
    setBulkCalcState({ precioVenta: NaN, valid: false })
  }

  const openBulkPrecioModal = (categoriaId) => {
    const items = getProductosCategoria(categoriaId)
    const selectedInCat = items.filter((p) => selectedProductIds.has(p.id))
    if (selectedInCat.length === 0) return

    setBulkPrecioCategoriaId(categoriaId)
    const mismoPrecio = todosMismoPrecio(selectedInCat)
    const first = selectedInCat[0]
    setBulkPrecioCompraInitial(first?.precio_compra ?? '')
    setBulkPrecioVentaInitial(mismoPrecio && first ? first.precio_venta : '')
    setBulkCalcState({ precioVenta: NaN, valid: false })
    setShowBulkPrecioModal(true)
  }

  const getSelectedInCategoria = (categoriaId) =>
    getProductosCategoria(categoriaId).filter((p) => selectedProductIds.has(p.id))

  const handleBulkPrecioConfirm = async () => {
    if (!bulkCalcState.valid) {
      setError('Completá precio compra y % suma válidos')
      return
    }
    const parsed = bulkCalcState.precioVenta

    const ids = bulkPrecioCategoriaId
      ? getSelectedInCategoria(bulkPrecioCategoriaId).map((p) => p.id)
      : [...selectedProductIds]

    if (ids.length === 0) return

    setBulkPrecioSaving(true)
    setError(null)
    const { data, error: err } = await updateProductosPrecioBulk(ids, parsed)
    setBulkPrecioSaving(false)

    if (err) {
      setError(err.message || 'Error al actualizar precios')
      return
    }

    const updatedMap = new Map((data || []).map((r) => [r.id, r.precio_venta]))
    setProductos((prev) =>
      prev.map((p) =>
        updatedMap.has(p.id) ? { ...p, precio_venta: updatedMap.get(p.id) } : p,
      ),
    )
    setShowBulkPrecioModal(false)
    setBulkPrecioCategoriaId(null)
    setBulkPrecioCompraInitial('')
    setBulkPrecioVentaInitial('')
    setBulkCalcState({ precioVenta: NaN, valid: false })
    setSuccessMessage(`Precio actualizado en ${ids.length} producto${ids.length === 1 ? '' : 's'}`)
    setTimeout(() => setSuccessMessage(null), 5000)
  }

  const handleExportarPdf = (categoria) => {
    const items = getProductosCategoria(categoria.id)
    if (items.length === 0) return
    downloadProductosCategoriaPdf({
      categoriaNombre: categoria.nombre,
      productos: items.map((p) => ({
        nombre: p.nombre,
        codigo_barras: p.codigo_barras,
        codigo_interno: p.codigo_interno,
        precio_venta: p.precio_venta,
      })),
    })
  }

  const bulkModalCount = bulkPrecioCategoriaId
    ? getSelectedInCategoria(bulkPrecioCategoriaId).length
    : 0

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando categorías...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        {successMessage && (
          <Alert variant="success" dismissible onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card>
          <div className="section-label">SECCIÓN</div>
          <h3 className="registros-seccion-titulo">REGISTROS DE CATEGORIAS</h3>
          <p className="categorias-list-hint">
            Seleccioná categorías con la casilla de la tabla y generá un PDF con el detalle de
            precios. Expandí cada categoría para ver productos, cambiar precios o exportar una sola
            categoría desde acciones.
          </p>
          <div className="table-controls categorias-table-controls">
            <input
              type="text"
              className="form-control categorias-busqueda"
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="categorias-table-controls__actions">
              <button
                type="button"
                className="categorias-btn-pdf"
                onClick={handleExportarPdfSeleccion}
                disabled={selectedCategoriasCount === 0}
                title={
                  selectedCategoriasCount === 0
                    ? 'Seleccioná al menos una categoría'
                    : `Generar PDF de ${selectedCategoriasCount} categoría${selectedCategoriasCount === 1 ? '' : 's'}`
                }
              >
                <i className="bi bi-file-earmark-pdf" aria-hidden />
                <span className="categorias-btn-pdf__label">
                  PDF
                  {selectedCategoriasCount > 0 ? ` (${selectedCategoriasCount})` : ''}
                </span>
              </button>
              {totalItems > 0 && (
                <div className="table-info">
                  Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems}{' '}
                  categorías
                </div>
              )}
            </div>
          </div>

          {filteredCategorias.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                {searchTerm
                  ? 'No se encontraron categorías con ese criterio de búsqueda.'
                  : 'No hay categorías registradas aún.'}
              </p>
              {!searchTerm && (
                <Link to="/categorias/nuevo">
                  <Button variant="primary" style={{ marginTop: '1rem' }}>
                    Crear primera categoría
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="table-container categorias-table-container">
                <table className="table table-sticky-header categorias-table">
                  <colgroup>
                    <col className="categorias-col-expand" />
                    <col className="categorias-col-check" />
                    <col className="categorias-col-nombre" />
                    <col className="categorias-col-productos" />
                    <col className="categorias-col-estado" />
                    <col className="categorias-col-acciones" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="categorias-th-expand" aria-label="Expandir" />
                      <th className="categorias-th-check">
                        <input
                          type="checkbox"
                          checked={isAllCategoriasSelectedOnPage()}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate =
                                isSomeCategoriasSelectedOnPage() &&
                                !isAllCategoriasSelectedOnPage()
                            }
                          }}
                          onChange={toggleSelectAllCategoriasOnPage}
                          aria-label="Seleccionar todas las categorías de esta página"
                          title="Seleccionar todas en esta página"
                        />
                      </th>
                      <th>Nombre</th>
                      <th className="categorias-th-productos">Productos</th>
                      <th className="categorias-th-estado">Estado</th>
                      <th className="categorias-th-acciones">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCategorias.map((categoria) => {
                      const catId = String(categoria.id)
                      const isExpanded = expandedIds.has(catId)
                      const productosCat = getProductosCategoria(categoria.id)
                      const count = productosCat.length
                      const precioUnico =
                        count > 0 && todosMismoPrecio(productosCat)
                          ? productosCat[0]?.precio_venta
                          : null
                      const selectedCount = getSelectedInCategoria(categoria.id).length

                      return (
                        <Fragment key={categoria.id}>
                          <tr className={isExpanded ? 'categoria-row--expanded' : ''}>
                            <td className="categorias-td-expand">
                              <button
                                type="button"
                                className="categorias-expand-btn"
                                onClick={() => toggleExpand(categoria.id)}
                                aria-expanded={isExpanded}
                                aria-label={
                                  isExpanded
                                    ? `Ocultar productos de ${categoria.nombre}`
                                    : `Ver productos de ${categoria.nombre}`
                                }
                                title={isExpanded ? 'Ocultar productos' : 'Ver productos'}
                              >
                                <i
                                  className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`}
                                  aria-hidden
                                />
                              </button>
                            </td>
                            <td className="categorias-td-check">
                              <input
                                type="checkbox"
                                checked={selectedCategoriaIds.has(catId)}
                                onChange={() => toggleSelectCategoria(categoria.id)}
                                aria-label={`Seleccionar categoría ${categoria.nombre}`}
                              />
                            </td>
                            <td>
                              <strong>{categoria.nombre}</strong>
                              {precioUnico != null && (
                                <div className="categorias-precio-unico">
                                  Precio único: {formatearMoneda(precioUnico)}
                                </div>
                              )}
                            </td>
                            <td className="categorias-td-productos">
                              <Badge variant={count > 0 ? 'primary' : 'secondary'}>{count}</Badge>
                            </td>
                            <td className="categorias-td-estado">
                              <Badge variant={categoria.activo ? 'success' : 'secondary'}>
                                {categoria.activo ? 'ACTIVA' : 'INACTIVA'}
                              </Badge>
                            </td>
                            <td className="categorias-td-acciones">
                              <CategoriasActionsMenu
                                categoriaId={categoria.id}
                                productosCount={count}
                                onVerDetalles={() => setDetalleCategoria(categoria)}
                                onExportarPdf={() => handleExportarPdf(categoria)}
                              />
                            </td>
                          </tr>
                          {isExpanded ? (
                            <tr className="categoria-productos-row">
                              <td colSpan={6}>
                                <div className="categoria-productos-panel">
                                  {count === 0 ? (
                                    <p className="categoria-productos-empty">
                                      No hay productos activos en esta categoría.{' '}
                                      <Link to="/productos/nuevo">Crear producto</Link>
                                    </p>
                                  ) : (
                                    <>
                                      <div className="categoria-productos-toolbar">
                                        <label className="categoria-productos-select-all">
                                          <input
                                            type="checkbox"
                                            checked={isAllSelectedInCategoria(categoria.id)}
                                            ref={(el) => {
                                              if (el) {
                                                el.indeterminate =
                                                  isSomeSelectedInCategoria(categoria.id) &&
                                                  !isAllSelectedInCategoria(categoria.id)
                                              }
                                            }}
                                            onChange={() => toggleSelectAllCategoria(categoria.id)}
                                          />
                                          <span>Seleccionar todos ({count})</span>
                                        </label>
                                        <Button
                                          type="button"
                                          variant="primary"
                                          size="sm"
                                          disabled={selectedCount === 0}
                                          onClick={() => openBulkPrecioModal(categoria.id)}
                                        >
                                          <i className="bi bi-calculator" aria-hidden />
                                          Cambiar precio
                                          {selectedCount > 0 ? ` (${selectedCount})` : ''}
                                        </Button>
                                      </div>
                                      <div className="categoria-productos-scroll">
                                        <table className="table categoria-productos-table">
                                          <thead>
                                            <tr>
                                              <th className="categoria-productos-th-check" />
                                              <th>Producto</th>
                                              <th className="categoria-productos-th-precio">Precio venta</th>
                                              <th className="categoria-productos-th-acciones">Acciones</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {productosCat.map((producto) => (
                                              <tr key={producto.id}>
                                                <td className="categoria-productos-td-check">
                                                  <input
                                                    type="checkbox"
                                                    checked={selectedProductIds.has(producto.id)}
                                                    onChange={() => toggleSelectProducto(producto.id)}
                                                    aria-label={`Seleccionar ${producto.nombre}`}
                                                  />
                                                </td>
                                                <td className="categoria-productos-td-nombre">{producto.nombre}</td>
                                                <td className="categoria-productos-td-precio">
                                                  <div className="categoria-productos-precio-cell">
                                                    <span>{formatearMoneda(producto.precio_venta)}</span>
                                                    <PrecioVentaCalcIconButton
                                                      producto={producto}
                                                      saving={savingPrecioProductoId === producto.id}
                                                      onApply={(precio) =>
                                                        guardarPrecioProducto(producto, precio)
                                                      }
                                                    />
                                                  </div>
                                                </td>
                                                <td className="categoria-productos-td-acciones">
                                                  <Link
                                                    to={`/productos/${producto.id}`}
                                                    className="categoria-productos-edit-link"
                                                    title="Editar producto"
                                                    aria-label={`Editar ${producto.nombre}`}
                                                  >
                                                    <i className="bi bi-pencil" aria-hidden />
                                                  </Link>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showBulkPrecioModal}
        onClose={closeBulkPrecioModal}
        title="Calcular precio de venta"
        closeOnOverlayClick={!bulkPrecioSaving}
        footer={
          <>
            <Button variant="outline" onClick={closeBulkPrecioModal} disabled={bulkPrecioSaving}>
              Cancelar cambio
            </Button>
            <Button
              variant="primary"
              onClick={handleBulkPrecioConfirm}
              loading={bulkPrecioSaving}
              disabled={bulkPrecioSaving || bulkModalCount === 0 || !bulkCalcState.valid}
            >
              Aplicar cambio
            </Button>
          </>
        }
      >
        <PrecioVentaCalculadoraForm
          key={`bulk-${bulkPrecioCategoriaId}-${bulkModalCount}`}
          idPrefix="categorias-bulk-precio"
          intro={
            <>
              Se actualizará el precio de venta de{' '}
              <strong>
                {bulkModalCount} producto{bulkModalCount === 1 ? '' : 's'}
              </strong>
              .
            </>
          }
          precioCompraInitial={bulkPrecioCompraInitial}
          precioVentaInitial={bulkPrecioVentaInitial}
          onChange={handleBulkCalcChange}
        />
      </Modal>

      <Modal
        isOpen={Boolean(detalleCategoria)}
        onClose={() => setDetalleCategoria(null)}
        title="Detalle de categoría"
        footer={
          <>
            <Button variant="outline" onClick={() => setDetalleCategoria(null)}>
              Cerrar
            </Button>
            {detalleCategoria ? (
              <Link to={`/categorias/${detalleCategoria.id}`}>
                <Button variant="primary">Editar categoría</Button>
              </Link>
            ) : null}
          </>
        }
      >
        {detalleCategoria ? (
          <div className="categoria-detalle-modal">
            <p className="categoria-detalle-modal__nombre">
              <strong>{detalleCategoria.nombre}</strong>
            </p>
            <dl className="categoria-detalle-modal__lista">
              <dt>Descripción</dt>
              <dd>{detalleCategoria.descripcion?.trim() || 'Sin descripción'}</dd>
              <dt>Estado</dt>
              <dd>{detalleCategoria.activo ? 'Activa' : 'Inactiva'}</dd>
              <dt>Productos asociados</dt>
              <dd>{getProductosCategoria(detalleCategoria.id).length}</dd>
            </dl>
          </div>
        ) : null}
      </Modal>
    </Layout>
  )
}

export default CategoriasList
