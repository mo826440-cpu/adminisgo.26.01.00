// Formulario para crear/editar orden de compra (layout alineado a venta detallada)
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Button, Alert, Spinner, Modal } from '../../components/common'
import { getCompraById, createCompra, updateCompra } from '../../services/compras'
import { getProveedores } from '../../services/proveedores'
import {
  getProductos,
  getProductoPreferible,
  getProductoPorCodigoBarras,
} from '../../services/productos'
import { CODIGO_BARRAS_PRODUCTO_VENTA_RAPIDA } from '../../constants/ventaRapida'
import '../../components/ventas-prueba/ventasPrueba.css'
import '../ventas-prueba/VentaDetalladaPrueba.css'
import './CompraForm.css'

const METODOS_PAGO = [
  { codigo: 'efectivo', nombre: 'Efectivo' },
  { codigo: 'transferencia', nombre: 'Transferencia' },
  { codigo: 'qr', nombre: 'QR' },
  { codigo: 'debito', nombre: 'Débito' },
  { codigo: 'credito', nombre: 'Crédito' },
  { codigo: 'cheque', nombre: 'Cheque' },
  { codigo: 'pendiente', nombre: 'Pendiente' },
  { codigo: 'otro', nombre: 'Otro' },
]

function formatearMoneda(valor) {
  const num = Number(valor || 0)
  return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function recalcItem(item) {
  const precio = parseFloat(item.precio_unitario) || 0
  const desc = Math.min(100, Math.max(0, parseFloat(item.descuento || 0)))
  const impuesto = Math.min(100, Math.max(0, parseFloat(item.impuesto || 0)))
  const cant = Math.max(0, parseFloat(item.cantidad_solicitada || 0))
  const precioConDescuento = precio * (1 - desc / 100)
  const precioFinal = precioConDescuento * (1 + impuesto / 100)
  return {
    ...item,
    cantidad_solicitada: cant,
    descuento: desc,
    impuesto,
    precio_unitario: precio,
    precio_unitario_final: precioFinal,
    subtotal: precioFinal * cant,
  }
}

function CompraForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [validatedData, setValidatedData] = useState(null)
  const [bloqueada, setBloqueada] = useState(false)

  const [proveedores, setProveedores] = useState([])
  const [productos, setProductos] = useState([])

  const [proveedorSearch, setProveedorSearch] = useState('')
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null)
  const [proveedorSuggestions, setProveedorSuggestions] = useState([])
  const [showProveedorSuggestions, setShowProveedorSuggestions] = useState(false)
  const [proveedorActiveIndex, setProveedorActiveIndex] = useState(-1)
  const proveedorListRef = useRef(null)

  const [fechaOrden, setFechaOrden] = useState(new Date().toISOString().split('T')[0])
  const [estado, setEstado] = useState('pendiente')
  const [observaciones, setObservaciones] = useState('')

  const [items, setItems] = useState([])
  const [productoSearch, setProductoSearch] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [productoSuggestions, setProductoSuggestions] = useState([])
  const [showProductoSuggestions, setShowProductoSuggestions] = useState(false)
  const [productoActiveIndex, setProductoActiveIndex] = useState(-1)
  const productoListRef = useRef(null)
  const productoInputRef = useRef(null)
  const [unidades, setUnidades] = useState('1')

  const [metodosPago, setMetodosPago] = useState([])
  const [descuentoGlobal, setDescuentoGlobal] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  useEffect(() => {
    if (productoInputRef.current && !bloqueada) {
      productoInputRef.current.focus()
    }
  }, [productoSeleccionado, bloqueada])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [provRes, prodRes] = await Promise.all([getProveedores(), getProductos()])
      if (provRes.error) throw provRes.error
      if (prodRes.error) throw prodRes.error

      const listaProveedores = provRes.data || []
      const listaProductos = prodRes.data || []
      setProveedores(listaProveedores)
      setProductos(listaProductos)

      if (isEditing) {
        const { data, error: err } = await getCompraById(id)
        if (err) throw err
        if (!data) throw new Error('Compra no encontrada')

        if (String(data.estado || '').toLowerCase() === 'cancelada') {
          setBloqueada(true)
          setError('Esta compra está cancelada y no puede editarse.')
        }

        setEstado(data.estado || 'pendiente')
        setFechaOrden(data.fecha_orden || new Date().toISOString().split('T')[0])
        setObservaciones(data.observaciones || '')

        const prov = listaProveedores.find((p) => Number(p.id) === Number(data.proveedor_id))
        if (prov) {
          setProveedorSeleccionado(prov)
          setProveedorSearch(prov.nombre_razon_social || '')
        } else if (data.proveedores) {
          setProveedorSeleccionado({
            id: data.proveedor_id,
            nombre_razon_social: data.proveedores.nombre_razon_social,
          })
          setProveedorSearch(data.proveedores.nombre_razon_social || '')
        }

        const pagosData = data.pagos || data.compra_pagos || []
        setMetodosPago(
          (pagosData || []).map((p) => ({
            metodo: p.metodo_pago || 'efectivo',
            fecha_pago: p.fecha_pago || new Date().toISOString().slice(0, 10),
            monto_pagado: parseFloat(p.monto_pagado || 0),
          })),
        )

        if (data.items && data.items.length > 0) {
          setItems(
            data.items.map((item) =>
              recalcItem({
                id: item.id,
                producto_id: item.producto_id,
                producto_nombre: item.productos?.nombre || '',
                cantidad_solicitada: parseFloat(item.cantidad_solicitada || 0),
                precio_unitario: parseFloat(item.precio_unitario || 0),
                descuento: parseFloat(item.descuento || 0),
                impuesto: parseFloat(item.impuesto || 0),
                cantidad_recibida: item.cantidad_recibida || null,
              }),
            ),
          )
        }
      } else {
        // Alta: producto genérico por defecto (preferible o código de venta rápida)
        let generico = null
        const { data: prefProducto } = await getProductoPreferible()
        if (prefProducto) {
          generico = prefProducto
        } else {
          generico =
            listaProductos.find(
              (p) =>
                String(p.codigo_barras || '').trim() ===
                String(CODIGO_BARRAS_PRODUCTO_VENTA_RAPIDA).trim(),
            ) || null
          if (!generico) {
            const { data: porCodigo } = await getProductoPorCodigoBarras(
              CODIGO_BARRAS_PRODUCTO_VENTA_RAPIDA,
            )
            generico = porCodigo || null
          }
        }

        if (generico) {
          setProductoSeleccionado(generico)
          setProductoSearch(generico.nombre || 'Producto genérico')
          setItems([
            recalcItem({
              producto_id: generico.id,
              producto_nombre: generico.nombre || 'Producto genérico',
              cantidad_solicitada: 1,
              precio_unitario: parseFloat(generico.precio_compra || 0) || 0,
              descuento: 0,
              impuesto: 0,
            }),
          ])
        } else {
          setProductoSearch('Producto genérico')
          setError(
            `No hay producto genérico activo (preferible o código ${CODIGO_BARRAS_PRODUCTO_VENTA_RAPIDA}). Registralo para usarlo por defecto en compras.`,
          )
        }
      }
    } catch (err) {
      setError(err.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const filtrarProveedores = (termino) => {
    if (!termino.trim()) return listaLimitada(proveedores, 8)
    const lower = termino.toLowerCase()
    return proveedores
      .filter(
        (p) =>
          p.nombre_razon_social?.toLowerCase().includes(lower) ||
          p.cuit?.toLowerCase().includes(lower) ||
          p.email?.toLowerCase().includes(lower),
      )
      .slice(0, 8)
  }

  const listaLimitada = (arr, n) => arr.slice(0, n)

  const seleccionarProveedor = (prov) => {
    setProveedorSeleccionado(prov)
    setProveedorSearch(prov.nombre_razon_social || '')
    setShowProveedorSuggestions(false)
    setProveedorSuggestions([])
    setProveedorActiveIndex(-1)
  }

  const buscarProveedor = (termino) => {
    setProveedorSearch(termino)
    const sugerencias = filtrarProveedores(termino)
    setProveedorSuggestions(sugerencias)
    setShowProveedorSuggestions(sugerencias.length > 0)
    setProveedorActiveIndex(sugerencias.length > 0 ? 0 : -1)
    if (!termino.trim()) setProveedorSeleccionado(null)
  }

  const handleProveedorKeyDown = (e) => {
    if (proveedorSuggestions.length === 0) return
    if (!showProveedorSuggestions && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setShowProveedorSuggestions(true)
      setProveedorActiveIndex(0)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setProveedorActiveIndex((prev) => (prev + 1) % proveedorSuggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setProveedorActiveIndex(
        (prev) => (prev - 1 + proveedorSuggestions.length) % proveedorSuggestions.length,
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (proveedorActiveIndex >= 0) seleccionarProveedor(proveedorSuggestions[proveedorActiveIndex])
    } else if (e.key === 'Escape') {
      setShowProveedorSuggestions(false)
    }
  }

  const filtrarProductos = (termino) => {
    if (!termino.trim()) return []
    const lower = termino.toLowerCase()
    return productos
      .filter(
        (p) =>
          p.nombre?.toLowerCase().includes(lower) ||
          p.codigo_barras?.toLowerCase().includes(lower) ||
          p.codigo_interno?.toLowerCase().includes(lower),
      )
      .slice(0, 8)
  }

  const agregarProductoAlCarrito = (producto, cantidadOverride) => {
    if (!producto) return
    const cantidadRaw = String(cantidadOverride ?? unidades).replace(/[^\d.,]/g, '').replace(',', '.')
    const cantidad = Math.max(0.01, parseFloat(cantidadRaw || 1) || 1)
    const precio = parseFloat(producto.precio_compra || 0) || 0

    const nuevoItem = recalcItem({
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      cantidad_solicitada: cantidad,
      precio_unitario: precio,
      descuento: 0,
      impuesto: 0,
    })

    setItems((prev) => [...prev, nuevoItem])
    setProductoSeleccionado(null)
    setProductoSearch('')
    setProductoSuggestions([])
    setShowProductoSuggestions(false)
    setUnidades('1')
    setError(null)
    setTimeout(() => productoInputRef.current?.focus(), 0)
  }

  const buscarProducto = (termino) => {
    setProductoSearch(termino)
    const sugerencias = filtrarProductos(termino)
    setProductoSuggestions(sugerencias)
    setShowProductoSuggestions(sugerencias.length > 0)
    setProductoActiveIndex(sugerencias.length > 0 ? 0 : -1)

    if (!termino.trim()) {
      setProductoSeleccionado(null)
      return
    }

    const exact = productos.find(
      (p) =>
        p.codigo_barras?.toLowerCase() === termino.toLowerCase() ||
        p.codigo_interno?.toLowerCase() === termino.toLowerCase(),
    )
    if (exact) {
      setProductoSeleccionado(exact)
      setShowProductoSuggestions(false)
    }
  }

  const handleProductoKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (showProductoSuggestions && productoActiveIndex >= 0 && productoSuggestions[productoActiveIndex]) {
        agregarProductoAlCarrito(productoSuggestions[productoActiveIndex])
        return
      }
      if (productoSeleccionado) {
        agregarProductoAlCarrito(productoSeleccionado)
        return
      }
      const exact = productos.find(
        (p) =>
          p.codigo_barras?.toLowerCase() === productoSearch.toLowerCase() ||
          p.codigo_interno?.toLowerCase() === productoSearch.toLowerCase(),
      )
      if (exact) agregarProductoAlCarrito(exact)
      return
    }

    if (productoSuggestions.length === 0) return
    if (!showProductoSuggestions && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setShowProductoSuggestions(true)
      setProductoActiveIndex(0)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setProductoActiveIndex((prev) => (prev + 1) % productoSuggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setProductoActiveIndex(
        (prev) => (prev - 1 + productoSuggestions.length) % productoSuggestions.length,
      )
    } else if (e.key === 'Escape') {
      setShowProductoSuggestions(false)
    }
  }

  useEffect(() => {
    if (!productoListRef.current) return
    const el = productoListRef.current.querySelector(`li[data-index="${productoActiveIndex}"]`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [productoActiveIndex, productoSuggestions.length])

  useEffect(() => {
    if (!proveedorListRef.current) return
    const el = proveedorListRef.current.querySelector(`li[data-index="${proveedorActiveIndex}"]`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [proveedorActiveIndex, proveedorSuggestions.length])

  const actualizarItem = (index, patch) => {
    setItems((prev) => prev.map((item, i) => (i === index ? recalcItem({ ...item, ...patch }) : item)))
    setError(null)
  }

  const eliminarItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index))

  const aplicarDescuentoGlobal = () => {
    const desc = Math.min(100, Math.max(0, parseFloat(descuentoGlobal || 0)))
    setItems((prev) => prev.map((item) => recalcItem({ ...item, descuento: desc })))
  }

  const totalDescuento = items.reduce(
    (sum, item) =>
      sum + (item.precio_unitario * item.cantidad_solicitada * (item.descuento || 0)) / 100,
    0,
  )
  const totalImpuesto = items.reduce((sum, item) => {
    const precioConDescuento = item.precio_unitario * (1 - (item.descuento || 0) / 100)
    return sum + (precioConDescuento * item.cantidad_solicitada * (item.impuesto || 0)) / 100
  }, 0)
  const totalUnidades = items.reduce((sum, item) => sum + (parseFloat(item.cantidad_solicitada) || 0), 0)
  const totalSubtotalBruto = items.reduce(
    (sum, item) => sum + item.precio_unitario * item.cantidad_solicitada,
    0,
  )
  const totalCalculado = items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0)
  const totalPagado = metodosPago.reduce((sum, mp) => sum + (parseFloat(mp.monto_pagado) || 0), 0)
  const deudaRestantePago = Math.max(0, totalCalculado - totalPagado)

  useEffect(() => {
    if (items.length === 0) {
      setMetodosPago([])
      return
    }
    setMetodosPago((prev) => {
      if (prev.length > 0) return prev
      return [
        {
          metodo: 'efectivo',
          fecha_pago: new Date().toISOString().slice(0, 10),
          monto_pagado: totalCalculado,
        },
      ]
    })
  }, [items.length, totalCalculado])

  const agregarLineaPago = () => {
    if (deudaRestantePago <= 0.01) return
    setMetodosPago((prev) => [
      ...prev,
      {
        metodo: 'efectivo',
        fecha_pago: new Date().toISOString().slice(0, 10),
        monto_pagado: deudaRestantePago,
      },
    ])
  }

  const actualizarPago = (index, patch) => {
    setMetodosPago((prev) => prev.map((mp, i) => (i === index ? { ...mp, ...patch } : mp)))
  }

  const eliminarPago = (index) => {
    setMetodosPago((prev) => prev.filter((_, i) => i !== index))
  }

  const handleConfirmar = () => {
    setError(null)
    if (bloqueada) {
      setError('Esta compra está cancelada y no puede editarse.')
      return
    }
    if (!proveedorSeleccionado?.id) {
      setError('Debes seleccionar un proveedor')
      return
    }
    if (!fechaOrden) {
      setError('Debes seleccionar una fecha de orden')
      return
    }
    if (items.length === 0) {
      setError('Debes agregar al menos un producto a la compra')
      return
    }

    const compraData = {
      proveedor_id: parseInt(proveedorSeleccionado.id, 10),
      fecha_orden: fechaOrden,
      estado: isEditing ? estado : 'pendiente',
      observaciones: observaciones.trim() || null,
      subtotal: totalSubtotalBruto,
      descuento: totalDescuento,
      impuestos: totalImpuesto,
      total: totalCalculado,
      items: items.map((item) => ({
        producto_id: item.producto_id,
        cantidad_solicitada: item.cantidad_solicitada,
        cantidad_recibida: item.cantidad_recibida || null,
        precio_unitario: item.precio_unitario,
        descuento: item.descuento || 0,
        impuesto: item.impuesto || 0,
        subtotal: item.subtotal,
      })),
      pagos: metodosPago
        .filter((mp) => parseFloat(mp.monto_pagado || 0) > 0 && mp.metodo !== 'pendiente')
        .map((mp) => ({
          metodo_pago: mp.metodo,
          monto_pagado: parseFloat(mp.monto_pagado || 0),
          fecha_pago: mp.fecha_pago,
          observaciones: null,
        })),
    }

    setValidatedData(compraData)
    setShowConfirmModal(true)
  }

  const handleConfirmSave = async () => {
    setShowConfirmModal(false)
    setSaving(true)
    setError(null)
    try {
      if (isEditing) {
        const { error: err } = await updateCompra(id, validatedData)
        if (err) {
          setError(err.message || 'Error al actualizar la compra')
          setSaving(false)
          return
        }
      } else {
        const { error: err } = await createCompra(validatedData)
        if (err) {
          setError(err.message || 'Error al crear la compra')
          setSaving(false)
          return
        }
      }
      setSaving(false)
      navigate('/compras', {
        replace: true,
        state: {
          success: true,
          message: isEditing ? 'Compra actualizada correctamente' : 'Orden de compra creada correctamente',
        },
      })
    } catch (err) {
      setError(err.message || 'Error inesperado al guardar la compra')
      setSaving(false)
    }
  }

  const handleCancelarOrden = () => {
    if (items.length > 0 || metodosPago.length > 0 || proveedorSeleccionado) {
      setShowCancelModal(true)
      return
    }
    navigate('/compras')
  }

  const confirmarCancelar = () => {
    setShowCancelModal(false)
    navigate('/compras')
  }

  if (loading) {
    return (
      <Layout>
        <div className="container vp-vd-loading">
          <Spinner size="lg" />
          <p>Cargando compra…</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container vp-module vp-vd-page cp-form-page">
        {error ? (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)} className="vp-vd-alert">
            {error}
          </Alert>
        ) : null}

        <div className="vp-vd-grid">
          <div className="vp-vd-col-left">
            <section className="vp-vd-card">
              <h2 className="vp-vd-card__title">1. Proveedor</h2>
              <div className="vp-vd-cliente-controls">
                <div className="autocomplete-wrapper vp-vd-cliente-field">
                  <i className="bi bi-truck vp-vd-cliente-field__icon" aria-hidden />
                  <input
                    type="text"
                    className="form-control vp-vd-input"
                    value={proveedorSearch}
                    onChange={(e) => buscarProveedor(e.target.value)}
                    onKeyDown={handleProveedorKeyDown}
                    onFocus={() => {
                      const sugerencias = filtrarProveedores(proveedorSearch)
                      setProveedorSuggestions(sugerencias)
                      setShowProveedorSuggestions(sugerencias.length > 0)
                    }}
                    onBlur={() => setTimeout(() => setShowProveedorSuggestions(false), 150)}
                    autoComplete="off"
                    placeholder="Buscar proveedor…"
                    disabled={bloqueada}
                  />
                  {showProveedorSuggestions && proveedorSuggestions.length > 0 && (
                    <ul className="autocomplete-list" ref={proveedorListRef}>
                      {proveedorSuggestions.map((p, idx) => (
                        <li
                          key={p.id}
                          data-index={idx}
                          className={idx === proveedorActiveIndex ? 'active' : ''}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            seleccionarProveedor(p)
                          }}
                          onMouseEnter={() => setProveedorActiveIndex(idx)}
                        >
                          <strong>{p.nombre_razon_social}</strong>
                          {p.cuit ? ` — ${p.cuit}` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <Link
                  to="/proveedores"
                  className="vp-vd-icon-btn"
                  title="Gestión de proveedores"
                  aria-label="Gestión de proveedores"
                >
                  <i className="bi bi-person-plus" aria-hidden />
                </Link>
              </div>
            </section>

            <section className="vp-vd-card">
              <h2 className="vp-vd-card__title">2. Producto</h2>
              <div className="autocomplete-wrapper vp-vd-search-row">
                <div className="vp-vd-search-field">
                  <i className="bi bi-search vp-vd-search-field__icon" aria-hidden />
                  <input
                    ref={productoInputRef}
                    type="text"
                    name="producto"
                    className="form-control vp-vd-input vp-vd-input--search"
                    value={productoSearch}
                    onChange={(e) => buscarProducto(e.target.value)}
                    onKeyDown={handleProductoKeyDown}
                    onFocus={() => {
                      if (productoSuggestions.length > 0) setShowProductoSuggestions(true)
                    }}
                    onBlur={() => setTimeout(() => setShowProductoSuggestions(false), 150)}
                    autoComplete="off"
                    placeholder="Producto genérico (o buscá otro…)"
                    disabled={bloqueada}
                  />
                  {productoSeleccionado &&
                  (productoSeleccionado.preferible ||
                    String(productoSeleccionado.codigo_barras || '').trim() ===
                      String(CODIGO_BARRAS_PRODUCTO_VENTA_RAPIDA).trim()) ? (
                    <span className="vp-vd-search-stock" title="Producto genérico por defecto">
                      Genérico
                    </span>
                  ) : null}
                </div>
                <Link
                  to="/productos"
                  className="vp-vd-icon-btn"
                  title="Gestión de productos"
                  aria-label="Gestión de productos"
                >
                  <i className="bi bi-box-seam" aria-hidden />
                </Link>
                {showProductoSuggestions && productoSuggestions.length > 0 && (
                  <ul className="autocomplete-list vp-vd-search-suggestions" ref={productoListRef}>
                    {productoSuggestions.map((p, idx) => (
                      <li
                        key={p.id}
                        data-index={idx}
                        className={idx === productoActiveIndex ? 'active' : ''}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          agregarProductoAlCarrito(p)
                        }}
                        onMouseEnter={() => setProductoActiveIndex(idx)}
                      >
                        <strong>{p.nombre}</strong>
                        {p.codigo_barras
                          ? ` — ${p.codigo_barras}`
                          : p.codigo_interno
                            ? ` — ${p.codigo_interno}`
                            : ''}
                        {` · ${formatearMoneda(p.precio_compra)}`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="vp-vd-card vp-vd-cart">
              <div className="vp-vd-card__head">
                <h2 className="vp-vd-card__title">3. Carrito</h2>
                <div className="vp-vd-cart__actions">
                  <div className="vp-vd-desc-global">
                    <label htmlFor="cp-desc-global" className="vp-vd-desc-global__label">
                      % Desc. a todos
                    </label>
                    <input
                      id="cp-desc-global"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      className="vp-vd-inline-input vp-vd-inline-input--desc"
                      value={descuentoGlobal}
                      onChange={(e) => setDescuentoGlobal(e.target.value.replace(/[^\d]/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          aplicarDescuentoGlobal()
                        }
                      }}
                      disabled={bloqueada || items.length === 0}
                      placeholder="0"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="vp-vd-desc-global__btn"
                      onClick={aplicarDescuentoGlobal}
                      disabled={bloqueada || items.length === 0}
                    >
                      Aplicar
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="vp-vd-vaciar"
                    onClick={() => {
                      if (productoSeleccionado) {
                        setItems([
                          recalcItem({
                            producto_id: productoSeleccionado.id,
                            producto_nombre:
                              productoSeleccionado.nombre || 'Producto genérico',
                            cantidad_solicitada: 1,
                            precio_unitario:
                              parseFloat(productoSeleccionado.precio_compra || 0) || 0,
                            descuento: 0,
                            impuesto: 0,
                          }),
                        ])
                      } else {
                        setItems([])
                      }
                      setDescuentoGlobal('')
                      setError(null)
                    }}
                    disabled={bloqueada || items.length === 0}
                  >
                    <i className="bi bi-trash" aria-hidden /> Vaciar carrito
                  </Button>
                </div>
              </div>

              <div className="vp-vd-cart__table-wrap">
                <table className="vp-vd-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Precio unit.</th>
                      <th>Cant.</th>
                      <th>% Desc.</th>
                      <th>% Imp.</th>
                      <th>Subtotal</th>
                      <th aria-label="Acciones" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="vp-vd-empty">
                          Agregá productos con el buscador superior
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => (
                        <tr key={`${item.producto_id}-${index}`}>
                          <td className="vp-vd-table__nombre">{item.producto_nombre}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="vp-vd-inline-input vp-vd-inline-input--money"
                              value={item.precio_unitario}
                              onChange={(e) =>
                                actualizarItem(index, { precio_unitario: e.target.value })
                              }
                              disabled={bloqueada}
                              aria-label={`Precio de ${item.producto_nombre}`}
                            />
                          </td>
                          <td>
                            <div className="vp-vd-qty">
                              <button
                                type="button"
                                className="vp-vd-qty__btn"
                                onClick={() =>
                                  actualizarItem(index, {
                                    cantidad_solicitada: Math.max(
                                      0.01,
                                      (parseFloat(item.cantidad_solicitada) || 1) - 1,
                                    ),
                                  })
                                }
                                disabled={bloqueada || item.cantidad_solicitada <= 1}
                                aria-label="Restar"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                className="vp-vd-inline-input vp-vd-inline-input--qty"
                                value={item.cantidad_solicitada}
                                onChange={(e) =>
                                  actualizarItem(index, { cantidad_solicitada: e.target.value })
                                }
                                disabled={bloqueada}
                              />
                              <button
                                type="button"
                                className="vp-vd-qty__btn"
                                onClick={() =>
                                  actualizarItem(index, {
                                    cantidad_solicitada:
                                      (parseFloat(item.cantidad_solicitada) || 0) + 1,
                                  })
                                }
                                disabled={bloqueada}
                                aria-label="Sumar"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              className="vp-vd-inline-input vp-vd-inline-input--desc"
                              value={item.descuento}
                              onChange={(e) => actualizarItem(index, { descuento: e.target.value })}
                              disabled={bloqueada}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              className="vp-vd-inline-input vp-vd-inline-input--desc"
                              value={item.impuesto}
                              onChange={(e) => actualizarItem(index, { impuesto: e.target.value })}
                              disabled={bloqueada}
                            />
                          </td>
                          <td className="vp-vd-table__subtotal">{formatearMoneda(item.subtotal)}</td>
                          <td>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="vp-vd-trash"
                              onClick={() => eliminarItem(index)}
                              disabled={bloqueada}
                              title="Quitar del carrito"
                            >
                              <i className="bi bi-trash" aria-hidden />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="vp-vd-cart__meta">
                <span>
                  {totalUnidades} {totalUnidades === 1 ? 'unidad' : 'unidades'}
                </span>
                <span>Subtotal: {formatearMoneda(totalSubtotalBruto)}</span>
                <span>Descuentos: {formatearMoneda(totalDescuento)}</span>
                <span>Impuestos: {formatearMoneda(totalImpuesto)}</span>
              </div>
            </section>
          </div>

          <aside className="vp-vd-col-right">
            <section className="vp-vd-card vp-vd-resumen">
              <h2 className="vp-vd-card__title">4. Resumen y pago</h2>

              <div className="cp-form-meta">
                <label className="vp-filter-field">
                  <span>Fecha de orden</span>
                  <input
                    type="date"
                    className="form-control vp-vd-input"
                    value={fechaOrden}
                    onChange={(e) => setFechaOrden(e.target.value)}
                    disabled={bloqueada}
                  />
                </label>
                <label className="vp-filter-field">
                  <span>Observaciones</span>
                  <input
                    type="text"
                    className="form-control vp-vd-input"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Opcional"
                    disabled={bloqueada}
                  />
                </label>
              </div>

              <div className="vp-vd-resumen__hero">
                <span className="vp-vd-resumen__hero-label">Total de la orden</span>
                <div className="vp-vd-resumen__hero-value">{formatearMoneda(totalCalculado)}</div>
              </div>

              <div className="vp-vd-pagos__head">
                <h3 className="vp-vd-pagos__title">Formas de pago</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="vp-vd-add-pago"
                  onClick={agregarLineaPago}
                  disabled={
                    bloqueada || items.length === 0 || (deudaRestantePago <= 0.01 && metodosPago.length > 0)
                  }
                >
                  + Agregar pago
                </Button>
              </div>

              <div className="vp-vd-pagos" role="group" aria-label="Formas de pago">
                {items.length === 0 ? (
                  <p className="vp-vd-pagos__empty">Cargá productos primero</p>
                ) : (
                  metodosPago.map((mp, index) => (
                    <div key={index} className="vp-vd-pagos__row">
                      <div className="vp-vd-pagos__metodo">
                        <select
                          className="form-control vp-vd-input"
                          value={mp.metodo}
                          onChange={(e) => actualizarPago(index, { metodo: e.target.value })}
                          disabled={bloqueada}
                          aria-label={`Forma de pago línea ${index + 1}`}
                        >
                          {METODOS_PAGO.map((f) => (
                            <option key={f.codigo} value={f.codigo}>
                              {f.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control vp-vd-input"
                        value={mp.monto_pagado}
                        onChange={(e) => actualizarPago(index, { monto_pagado: e.target.value })}
                        disabled={bloqueada}
                        aria-label={`Monto pago línea ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="vp-vd-trash"
                        onClick={() => eliminarPago(index)}
                        disabled={bloqueada}
                        aria-label="Quitar pago"
                      >
                        <i className="bi bi-x-lg" aria-hidden />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <div className="cp-form-pago-resumen">
                <div>
                  <span>Pagado</span>
                  <strong>{formatearMoneda(totalPagado)}</strong>
                </div>
                <div>
                  <span>Deuda</span>
                  <strong className={deudaRestantePago > 0.01 ? 'vp-money--warning' : ''}>
                    {formatearMoneda(deudaRestantePago)}
                  </strong>
                </div>
              </div>

              {items.length > 0 && deudaRestantePago > 0.01 ? (
                <p className="cp-form-hint">
                  Si pagás de menos, la diferencia quedará registrada como deuda pendiente.
                </p>
              ) : null}
            </section>

            <div className="vp-vd-footer">
              <Button
                variant="outline"
                className="vp-vd-footer__cancel"
                onClick={handleCancelarOrden}
                disabled={saving}
              >
                <i className="bi bi-x-lg" aria-hidden /> CANCELAR ORDEN
              </Button>
              <Button
                variant="primary"
                className="vp-vd-footer__finish"
                onClick={handleConfirmar}
                loading={saving}
                disabled={saving || bloqueada || items.length === 0}
              >
                <i className="bi bi-check2-circle" aria-hidden />{' '}
                {isEditing ? 'GUARDAR CAMBIOS' : 'FINALIZAR ORDEN'}
              </Button>
            </div>
          </aside>
        </div>

        <Modal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false)
            setValidatedData(null)
          }}
          title={isEditing ? 'Guardar compra' : 'Finalizar orden'}
          closeOnOverlayClick={false}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmModal(false)
                  setValidatedData(null)
                }}
              >
                Volver
              </Button>
              <Button variant="primary" onClick={handleConfirmSave} loading={saving}>
                {isEditing ? 'Actualizar compra' : 'Crear orden'}
              </Button>
            </>
          }
        >
          <p>
            {isEditing
              ? '¿Confirmás guardar los cambios de esta orden de compra?'
              : '¿Confirmás crear esta orden de compra?'}
          </p>
          {validatedData ? (
            <div className="cp-form-confirm">
              <p>
                <strong>Proveedor:</strong>{' '}
                {proveedorSeleccionado?.nombre_razon_social || '—'}
              </p>
              <p>
                <strong>Total:</strong> {formatearMoneda(validatedData.total)}
              </p>
              <p>
                <strong>Productos:</strong> {validatedData.items.length}
              </p>
              <p>
                <strong>Pagado:</strong>{' '}
                {formatearMoneda(
                  (validatedData.pagos || []).reduce((s, p) => s + (p.monto_pagado || 0), 0),
                )}
              </p>
            </div>
          ) : null}
        </Modal>

        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancelar orden"
          variant="danger"
          closeOnOverlayClick={false}
          footer={
            <>
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>
                Seguir editando
              </Button>
              <Button variant="primary" onClick={confirmarCancelar}>
                Descartar y salir
              </Button>
            </>
          }
        >
          <p>Hay datos cargados. ¿Seguro que querés cancelar y volver al listado?</p>
        </Modal>
      </div>
    </Layout>
  )
}

export default CompraForm
