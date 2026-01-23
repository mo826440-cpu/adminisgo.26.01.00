// Formulario para crear/editar orden de compra
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Input, Alert, Spinner, Modal } from '../../components/common'
import { getCompraById, createCompra, updateCompra } from '../../services/compras'
import { getProveedores } from '../../services/proveedores'
import { getProductos } from '../../services/productos'
import { useDateTime } from '../../context/DateTimeContext'
import './CompraForm.css'

function CompraForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id
  const { timezone } = useDateTime()

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [validatedData, setValidatedData] = useState(null)

  const [proveedores, setProveedores] = useState([])
  const [productos, setProductos] = useState([])

  // Campos del formulario
  const [proveedorId, setProveedorId] = useState('')
  const [fechaOrden, setFechaOrden] = useState(new Date().toISOString().split('T')[0])
  const [estado, setEstado] = useState('pendiente')
  const [observaciones, setObservaciones] = useState('')

  // Estados para métodos de pago
  const [metodosPago, setMetodosPago] = useState([])
  const [metodoPagoActual, setMetodoPagoActual] = useState('efectivo')
  const [montoPagoActual, setMontoPagoActual] = useState('0')
  const [montoPagoManual, setMontoPagoManual] = useState(false)

  // Items de la compra
  const [items, setItems] = useState([])
  
  // Estado para agregar/editar item
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [productoSearch, setProductoSearch] = useState('')
  const [productoSuggestions, setProductoSuggestions] = useState([])
  const [showProductoSuggestions, setShowProductoSuggestions] = useState(false)
  const [productoActiveIndex, setProductoActiveIndex] = useState(-1)
  const productoListRef = useRef(null)
  const productoInputRef = useRef(null)
  const [cantidadSolicitada, setCantidadSolicitada] = useState('1')
  const [precioUnitario, setPrecioUnitario] = useState('0')
  const [descuentoItem, setDescuentoItem] = useState('0')
  const [impuestoItem, setImpuestoItem] = useState('0')

  useEffect(() => {
    loadProveedores()
    loadProductos()
    
    if (isEditing) {
      loadCompra()
    }
  }, [id])

  const loadCompra = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getCompraById(id)
    
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    
    if (data) {
      setProveedorId(data.proveedor_id?.toString() || '')
      setFechaOrden(data.fecha_orden || new Date().toISOString().split('T')[0])
      setEstado(data.estado || 'pendiente')
      setObservaciones(data.observaciones || '')
      // Los descuentos e impuestos ahora son por item, no globales
      
      // Cargar pagos (pueden venir como data.pagos o data.compra_pagos)
      const pagosData = data.pagos || data.compra_pagos || []
      if (pagosData && pagosData.length > 0) {
        const pagos = pagosData.map(p => ({
          metodo: p.metodo_pago,
          fecha_pago: p.fecha_pago,
          monto_pagado: parseFloat(p.monto_pagado || 0),
          monto_deuda: 0
        }))
        setMetodosPago(pagos)
        const totalPagado = pagos.reduce((sum, p) => sum + p.monto_pagado, 0)
        const montoRestante = (data.total || 0) - totalPagado
        setMontoPagoActual(montoRestante > 0 ? montoRestante.toFixed(1) : '0')
      } else {
        setMetodosPago([])
        setMontoPagoActual(data.total ? data.total.toFixed(1) : '0')
      }
      
      // Cargar items
      if (data.items && data.items.length > 0) {
        const itemsFormateados = data.items.map(item => {
          const precio = parseFloat(item.precio_unitario || 0)
          const descuento = parseFloat(item.descuento || 0)
          const impuesto = parseFloat(item.impuesto || 0)
          const precioConDescuento = precio * (1 - descuento / 100)
          const precioFinal = precioConDescuento * (1 + impuesto / 100)
          return {
            id: item.id,
            producto_id: item.producto_id,
            producto_nombre: item.productos?.nombre || '',
            cantidad_solicitada: parseFloat(item.cantidad_solicitada || 0),
            precio_unitario: precio,
            descuento: descuento,
            impuesto: impuesto,
            precio_unitario_final: precioFinal,
            subtotal: parseFloat(item.subtotal || precioFinal * parseFloat(item.cantidad_solicitada || 0))
          }
        })
        setItems(itemsFormateados)
      }
    }
    setLoading(false)
  }

  const loadProveedores = async () => {
    const { data } = await getProveedores()
    if (data) setProveedores(data)
  }

  const loadProductos = async () => {
    const { data } = await getProductos()
    if (data) setProductos(data)
  }

  // Calcular subtotal de items
  const calcularSubtotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0)
  }

  // Filtrar productos para autocompletado
  const filtrarProductos = (termino) => {
    if (!termino.trim()) return []
    const lower = termino.toLowerCase()
    return productos.filter(p =>
      p.nombre?.toLowerCase().includes(lower) ||
      p.codigo_barras?.toLowerCase().includes(lower) ||
      p.codigo_interno?.toLowerCase().includes(lower)
    ).slice(0, 8)
  }

  // Aplicar producto seleccionado
  const aplicarProductoSeleccionado = (producto) => {
    setProductoSeleccionado(producto)
    setProductoSearch(producto.nombre || '')
    if (producto && producto.precio_compra) {
      const precio = parseFloat(producto.precio_compra) || 0
      setPrecioUnitario(precio.toFixed(2))
    } else {
      setPrecioUnitario('0')
    }
  }

  // Buscar producto
  const buscarProducto = (termino) => {
    setProductoSearch(termino)
    const sugerencias = filtrarProductos(termino)
    setProductoSuggestions(sugerencias)
    setShowProductoSuggestions(sugerencias.length > 0)
    setProductoActiveIndex(sugerencias.length > 0 ? 0 : -1)

    if (!termino.trim()) {
      setProductoSeleccionado(null)
      setPrecioUnitario('0')
      return
    }

    // Buscar coincidencia exacta por código de barras o código interno
    const exact = productos.find(p =>
      p.codigo_barras?.toLowerCase() === termino.toLowerCase() ||
      p.codigo_interno?.toLowerCase() === termino.toLowerCase()
    )

    if (exact) {
      aplicarProductoSeleccionado(exact)
      setShowProductoSuggestions(false)
      setProductoSuggestions([])
      setProductoActiveIndex(-1)
    }
  }

  // Manejar teclas en búsqueda de producto
  const handleProductoKeyDown = (e) => {
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
      setProductoActiveIndex((prev) => (prev - 1 + productoSuggestions.length) % productoSuggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (productoActiveIndex >= 0) {
        aplicarProductoSeleccionado(productoSuggestions[productoActiveIndex])
        setShowProductoSuggestions(false)
      }
    } else if (e.key === 'Escape') {
      setShowProductoSuggestions(false)
    }
  }

  // Scroll automático en lista de sugerencias
  useEffect(() => {
    if (!productoListRef.current) return
    const el = productoListRef.current.querySelector(`li[data-index="${productoActiveIndex}"]`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [productoActiveIndex, productoSuggestions.length])

  // Calcular totales (suma de subtotales de cada item que ya incluyen descuento e impuesto)
  const subtotalCalculado = calcularSubtotal()
  const totalCalculado = subtotalCalculado
  
  // Calcular totales de descuentos e impuestos para mostrar en resumen
  const totalDescuento = items.reduce((sum, item) => {
    const descuentoPorcentaje = parseFloat(item.descuento || 0)
    return sum + (item.precio_unitario * item.cantidad_solicitada * descuentoPorcentaje / 100)
  }, 0)
  
  const totalImpuesto = items.reduce((sum, item) => {
    const descuentoPorcentaje = parseFloat(item.descuento || 0)
    const impuestoPorcentaje = parseFloat(item.impuesto || 0)
    const precioConDescuento = item.precio_unitario * (1 - descuentoPorcentaje / 100)
    return sum + (precioConDescuento * item.cantidad_solicitada * impuestoPorcentaje / 100)
  }, 0)

  // Agregar item a la lista
  const agregarItem = () => {
    if (!productoSeleccionado) {
      setError('Debes seleccionar un producto')
      return
    }

    // Parsear cantidad y asegurar que sea un número válido
    const cantidadRaw = cantidadSolicitada.replace(/[^\d.,]/g, '').replace(',', '.')
    const cantidad = parseFloat(cantidadRaw || 0)
    if (isNaN(cantidad) || cantidad <= 0) {
      setError('La cantidad debe ser mayor a 0')
      return
    }
    
    // Redondear a 2 decimales para evitar problemas de precisión
    const cantidadRedondeada = Math.round(cantidad * 100) / 100

    const precio = parseFloat(precioUnitario || 0)
    if (precio < 0) {
      setError('El precio unitario no puede ser negativo')
      return
    }

    // Calcular descuento e impuesto
    const descuentoPorcentaje = parseFloat(descuentoItem || 0)
    const impuestoPorcentaje = parseFloat(impuestoItem || 0)
    
    // Precio después del descuento
    const precioConDescuento = precio * (1 - descuentoPorcentaje / 100)
    
    // Precio final con impuesto (el impuesto se aplica sobre el precio con descuento)
    const precioFinal = precioConDescuento * (1 + impuestoPorcentaje / 100)
    
    // Subtotal del item
    const subtotal = precioFinal * cantidad

    const nuevoItem = {
      producto_id: productoSeleccionado.id,
      producto_nombre: productoSeleccionado.nombre,
      cantidad_solicitada: cantidadRedondeada, // Usar cantidad redondeada
      precio_unitario: precio,
      descuento: parseFloat(descuentoPorcentaje.toFixed(2)), // Guardar con 2 decimales
      impuesto: parseFloat(impuestoPorcentaje.toFixed(2)), // Guardar con 2 decimales
      precio_unitario_final: precioFinal,
      subtotal: subtotal
    }

    setItems([...items, nuevoItem])
    
    // Limpiar campos
    setProductoSeleccionado(null)
    setProductoSearch('')
    setProductoSuggestions([])
    setShowProductoSuggestions(false)
    setCantidadSolicitada('1')
    setPrecioUnitario('0')
    setDescuentoItem('0')
    setImpuestoItem('0')
    setError(null)
    
    // Enfocar el campo Producto después de agregar
    setTimeout(() => {
      if (productoInputRef.current) {
        productoInputRef.current.focus()
      }
    }, 0)
  }

  // Eliminar item
  const eliminarItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // Editar item (eliminar y cargar en campos)
  const editarItem = (index) => {
    const item = items[index]
    const producto = productos.find(p => p.id === item.producto_id)
    if (producto) {
      aplicarProductoSeleccionado(producto)
      setCantidadSolicitada(item.cantidad_solicitada.toString())
      setPrecioUnitario(item.precio_unitario.toString())
      setDescuentoItem(parseFloat(item.descuento || 0).toFixed(2))
      setImpuestoItem(parseFloat(item.impuesto || 0).toFixed(2))
      eliminarItem(index)
    }
  }

  // Formatear moneda
  const formatearMoneda = (valor) => {
    const num = Number(valor || 0)
    return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Formatear fecha corta
  const formatDateShort = (value) => {
    if (!value) return '-'
    const d = new Date(value)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Calcular total pagado
  const totalPagado = metodosPago.reduce((sum, mp) => sum + mp.monto_pagado, 0)
  const montoRestante = totalCalculado - totalPagado

  // Actualizar monto de pago automáticamente si no es manual
  // Solo actualizar si el usuario no está escribiendo manualmente
  useEffect(() => {
    // No actualizar si el usuario está escribiendo manualmente
    if (montoPagoManual) return
    
    if (metodosPago.length === 0) {
      setMontoPagoActual(totalCalculado > 0 ? totalCalculado.toFixed(1) : '0')
    } else if (montoRestante > 0) {
      setMontoPagoActual(montoRestante.toFixed(1))
    } else {
      setMontoPagoActual('0')
    }
  }, [totalCalculado, metodosPago.length, montoRestante, montoPagoManual])

  // Cargar método de pago
  const cargarMetodoPago = (e) => {
    e?.preventDefault()
    
    // Parsear el monto, limpiando cualquier formato
    const montoStr = montoPagoActual.toString().replace(/[^\d.,]/g, '').replace(',', '.')
    const monto = parseFloat(montoStr || 0)
    
    if (isNaN(monto) || monto <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }

    // Redondear a 1 decimal
    const montoRedondeado = parseFloat(monto.toFixed(1))

    const nuevoMetodo = {
      metodo: metodoPagoActual,
      fecha_pago: new Date().toISOString().slice(0, 10),
      monto_pagado: montoRedondeado, // Usar el monto que el usuario ingresó
      monto_deuda: 0 // Se calculará después
    }

    setMetodosPago([...metodosPago, nuevoMetodo])
    
    // Calcular monto restante
    const totalPagadoHastaAhora = [...metodosPago, nuevoMetodo].reduce((sum, mp) => sum + mp.monto_pagado, 0)
    const nuevoMontoRestante = totalCalculado - totalPagadoHastaAhora
    
    // Limpiar campos y actualizar monto restante
    setMetodoPagoActual('efectivo')
    setMontoPagoActual(nuevoMontoRestante > 0 ? nuevoMontoRestante.toFixed(1) : '0')
    setMontoPagoManual(false) // Permitir que el useEffect actualice el campo
    setError(null)
  }

  // Eliminar método de pago
  const eliminarMetodoPago = (index) => {
    const nuevosPagos = metodosPago.filter((_, i) => i !== index)
    setMetodosPago(nuevosPagos)
    
    // Recalcular monto restante
    const totalPagado = nuevosPagos.reduce((sum, mp) => sum + mp.monto_pagado, 0)
    const nuevoMontoRestante = totalCalculado - totalPagado
    setMontoPagoActual(nuevoMontoRestante > 0 ? nuevoMontoRestante.toFixed(1) : '0')
    setMontoPagoManual(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validaciones
    const errores = []

    if (!proveedorId) {
      errores.push('Debes seleccionar un proveedor')
    }

    if (!fechaOrden) {
      errores.push('Debes seleccionar una fecha de orden')
    }

    if (items.length === 0) {
      errores.push('Debes agregar al menos un producto a la compra')
    }

    if (errores.length > 0) {
      setError(errores.join('. '))
      return
    }

    const compraData = {
      proveedor_id: parseInt(proveedorId),
      fecha_orden: fechaOrden,
      estado: estado,
      observaciones: observaciones.trim() || null,
      subtotal: items.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad_solicitada), 0),
      descuento: totalDescuento,
      impuestos: totalImpuesto,
      total: totalCalculado,
      items: items.map(item => ({
        producto_id: item.producto_id,
        cantidad_solicitada: item.cantidad_solicitada,
        precio_unitario: item.precio_unitario,
        descuento: item.descuento || 0,
        impuesto: item.impuesto || 0,
        subtotal: item.subtotal,
      })),
      pagos: metodosPago.map(mp => ({
        metodo_pago: mp.metodo,
        monto_pagado: mp.monto_pagado,
        fecha_pago: mp.fecha_pago,
        observaciones: null
      }))
    }

    setValidatedData(compraData)
    setShowConfirmModal(true)
  }

  // Guardar después de confirmación
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
          message: isEditing ? 'Compra actualizada correctamente' : 'Orden de compra creada correctamente' 
        } 
      })
    } catch (err) {
      console.error('Error inesperado:', err)
      setError(err.message || 'Error inesperado al guardar la compra')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando compra...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div>
            <h1>{isEditing ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}</h1>
            <p className="text-secondary">
              {isEditing ? 'Modifica la información de la orden de compra' : 'Completa los datos de la nueva orden de compra'}
            </p>
          </div>
          <Link to="/compras">
            <Button variant="outline">← Volver a Compras</Button>
          </Link>
        </div>

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="compra-form">
            {/* Datos básicos */}
            <div className="form-section">
              <h3>Datos de la Orden</h3>
              <div className="form-row">
                <div className="form-col">
                  <label className="form-label">
                    Proveedor *
                    <select
                      name="proveedor_id"
                      value={proveedorId}
                      onChange={(e) => setProveedorId(e.target.value)}
                      className="form-control"
                      required
                    >
                      <option value="">Seleccionar proveedor</option>
                      {proveedores.map(prov => (
                        <option key={prov.id} value={prov.id}>{prov.nombre_razon_social}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="form-col">
                  <label className="form-label">
                    Fecha de Orden *
                    <input
                      type="date"
                      name="fecha_orden"
                      value={fechaOrden}
                      onChange={(e) => setFechaOrden(e.target.value)}
                      className="form-control"
                      required
                    />
                  </label>
                </div>
                <div className="form-col">
                  <label className="form-label">
                    Estado
                    <select
                      name="estado"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      className="form-control"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="recibida">Recibida</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-col form-col-full">
                  <label className="form-label">
                    Observaciones
                    <textarea
                      name="observaciones"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      className="form-control"
                      rows="3"
                      placeholder="Observaciones adicionales (opcional)"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Items de la compra */}
            <div className="form-section">
              <h3>Productos</h3>
              
              {/* Formulario para agregar item */}
              <div className="add-item-form">
                <div className="form-row">
                  <div className="form-col autocomplete-wrapper">
                    <label className="form-label">
                      Producto
                      <input
                        ref={productoInputRef}
                        type="text"
                        value={productoSearch}
                        onChange={(e) => buscarProducto(e.target.value)}
                        onKeyDown={handleProductoKeyDown}
                        onFocus={() => {
                          if (productoSuggestions.length > 0) setShowProductoSuggestions(true)
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowProductoSuggestions(false), 150)
                        }}
                        className="form-control"
                        autoComplete="off"
                        placeholder="Buscar por código de barras, código interno o nombre"
                      />
                    </label>
                    {showProductoSuggestions && productoSuggestions.length > 0 && (
                      <ul className="autocomplete-list" ref={productoListRef}>
                        {productoSuggestions.map((p, idx) => (
                          <li
                            key={p.id}
                            data-index={idx}
                            className={idx === productoActiveIndex ? 'active' : ''}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              aplicarProductoSeleccionado(p)
                              setShowProductoSuggestions(false)
                            }}
                            onMouseEnter={() => setProductoActiveIndex(idx)}
                          >
                            <strong>{p.nombre}</strong>
                            {p.codigo_barras ? ` — ${p.codigo_barras}` : p.codigo_interno ? ` — ${p.codigo_interno}` : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                    {productoSeleccionado && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--color-success)' }}>
                        Producto seleccionado: {productoSeleccionado.nombre}
                      </div>
                    )}
                  </div>
                  <div className="form-col">
                    <Input
                      label="Cantidad"
                      name="cantidad"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={cantidadSolicitada}
                      onChange={(e) => setCantidadSolicitada(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div className="form-col">
                    <label className="form-label">
                      Precio Unitario
                      <input
                        type="number"
                        name="precio_unitario"
                        step="0.01"
                        min="0"
                        value={precioUnitario}
                        onChange={(e) => setPrecioUnitario(e.target.value)}
                        className="form-control"
                        placeholder="0.00"
                      />
                    </label>
                  </div>
                  <div className="form-col">
                    <label className="form-label">
                      Descuento (%)
                      <input
                        type="number"
                        name="descuento_item"
                        step="0.01"
                        min="0"
                        max="100"
                        value={descuentoItem}
                        onChange={(e) => setDescuentoItem(e.target.value)}
                        className="form-control"
                        placeholder="0"
                      />
                    </label>
                  </div>
                  <div className="form-col">
                    <label className="form-label">
                      Impuesto (%)
                      <input
                        type="number"
                        name="impuesto_item"
                        step="0.01"
                        min="0"
                        max="100"
                        value={impuestoItem}
                        onChange={(e) => setImpuestoItem(e.target.value)}
                        className="form-control"
                        placeholder="0"
                      />
                    </label>
                  </div>
                  <div className="form-col">
                    <label className="form-label">
                      Precio Final
                      <input
                        type="number"
                        name="precio_final"
                        step="0.01"
                        value={(() => {
                          const precio = parseFloat(precioUnitario || 0)
                          const descuento = parseFloat(descuentoItem || 0)
                          const impuesto = parseFloat(impuestoItem || 0)
                          const precioConDescuento = precio * (1 - descuento / 100)
                          return (precioConDescuento * (1 + impuesto / 100)).toFixed(2)
                        })()}
                        className="form-control"
                        disabled
                        readOnly
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      />
                    </label>
                  </div>
                  <div className="form-col">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={agregarItem}
                      style={{ marginTop: '1.75rem' }}
                    >
                      Agregar Producto
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabla de items */}
              {items.length > 0 && (
                <div className="items-table-container" style={{ marginTop: '1.5rem' }}>
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Desc. %</th>
                        <th>Imp. %</th>
                        <th>Precio Final</th>
                        <th>Subtotal</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.producto_nombre}</td>
                          <td>{item.cantidad_solicitada}</td>
                          <td>{formatearMoneda(item.precio_unitario)}</td>
                          <td>{parseFloat(item.descuento || 0).toFixed(2)}%</td>
                          <td>{parseFloat(item.impuesto || 0).toFixed(2)}%</td>
                          <td>{formatearMoneda(item.precio_unitario_final || item.precio_unitario)}</td>
                          <td>{formatearMoneda(item.subtotal)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editarItem(index)}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => eliminarItem(index)}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Totales */}
            <div className="form-section">
              <h3>Totales</h3>
              <div className="form-row">
                <div className="form-col">
                  <Input
                    label="Subtotal Base"
                    name="subtotal_base"
                    type="text"
                    value={formatearMoneda(items.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad_solicitada), 0))}
                    disabled
                    readOnly
                  />
                </div>
                <div className="form-col">
                  <Input
                    label="Total Descuentos"
                    name="total_descuentos"
                    type="text"
                    value={formatearMoneda(totalDescuento)}
                    disabled
                    readOnly
                  />
                </div>
                <div className="form-col">
                  <Input
                    label="Total Impuestos"
                    name="total_impuestos"
                    type="text"
                    value={formatearMoneda(totalImpuesto)}
                    disabled
                    readOnly
                  />
                </div>
                <div className="form-col">
                  <Input
                    label="Total"
                    name="total"
                    type="text"
                    value={formatearMoneda(totalCalculado)}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Métodos de Pago */}
            <div className="form-section">
              <h3>Métodos de Pago</h3>
              
              <div>
                <div className="form-row">
                  <div className="form-col">
                    <label className="form-label">
                      Método de Pago
                      <select
                        className="form-control"
                        value={metodoPagoActual}
                        onChange={(e) => setMetodoPagoActual(e.target.value)}
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="qr">QR</option>
                        <option value="debito">Débito</option>
                        <option value="credito">Crédito</option>
                        <option value="cheque">Cheque</option>
                        <option value="otro">Otro método</option>
                      </select>
                    </label>
                  </div>
                  <div className="form-col">
                    <label className="form-label">
                      Monto a Pagar
                      <input
                        type="number"
                        name="metodoPago"
                        min="0"
                        step="0.1"
                        value={montoPagoActual}
                        onChange={(e) => {
                          setMontoPagoManual(true)
                          // Permitir escribir libremente, solo validar que sea un número
                          const valor = e.target.value
                          if (valor === '' || /^\d*\.?\d*$/.test(valor)) {
                            setMontoPagoActual(valor)
                          }
                        }}
                        onBlur={(e) => {
                          // Formatear solo al perder el foco, pero mantener montoPagoManual en true
                          // para que el useEffect no sobrescriba el valor hasta que se cargue el pago
                          const valorStr = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.')
                          const valor = parseFloat(valorStr) || 0
                          if (valor > 0) {
                            setMontoPagoActual(valor.toFixed(1))
                          }
                          // NO cambiar montoPagoManual aquí, se cambiará cuando se cargue el pago
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            cargarMetodoPago()
                          }
                        }}
                        className="form-control"
                        placeholder={formatearMoneda(totalCalculado)}
                      />
                    </label>
                  </div>
                  <div className="form-col">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={cargarMetodoPago}
                      style={{ marginTop: '1.75rem' }}
                    >
                      Cargar Método Pago
                    </Button>
                  </div>
                </div>
              </div>

              {metodosPago.length > 0 && (
                <div className="items-table-container" style={{ marginTop: '1.5rem' }}>
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Método Pago</th>
                        <th>Fecha Pago</th>
                        <th>Monto Pagado</th>
                        <th>Monto Deuda</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metodosPago.map((mp, index) => {
                        const pagadoHastaAhora = metodosPago.slice(0, index + 1).reduce((sum, m) => sum + m.monto_pagado, 0)
                        const deuda = totalCalculado - pagadoHastaAhora
                        return (
                          <tr key={index}>
                            <td>{mp.metodo}</td>
                            <td>{formatDateShort(mp.fecha_pago)}</td>
                            <td>{formatearMoneda(mp.monto_pagado)}</td>
                            <td>{deuda > 0 ? formatearMoneda(deuda) : '-'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarMetodoPago(index)}
                                >
                                  Eliminar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ fontWeight: 'bold', backgroundColor: 'var(--bg-secondary)' }}>
                        <td>TOTAL</td>
                        <td></td>
                        <td>{formatearMoneda(totalPagado)}</td>
                        <td>{montoRestante > 0 ? formatearMoneda(montoRestante) : '-'}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <div className="form-actions">
              <Link to="/compras">
                <Button type="button" variant="outline" disabled={saving}>
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" variant="primary" loading={saving} disabled={saving}>
                {isEditing ? 'Actualizar Compra' : 'Crear Orden de Compra'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Modal de Confirmación */}
        <Modal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false)
            setValidatedData(null)
          }}
          title="Confirmar Guardado"
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
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmSave}
                loading={saving}
              >
                {isEditing ? 'Actualizar Compra' : 'Crear Orden de Compra'}
              </Button>
            </>
          }
        >
          <p>
            {isEditing 
              ? '¿Estás seguro de que deseas actualizar esta orden de compra?'
              : '¿Estás seguro de que deseas crear esta orden de compra con los datos ingresados?'
            }
          </p>
          {validatedData && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <p><strong>Proveedor:</strong> {proveedores.find(p => p.id === parseInt(validatedData.proveedor_id))?.nombre_razon_social || 'N/A'}</p>
              <p><strong>Fecha de Orden:</strong> {fechaOrden}</p>
              <p><strong>Estado:</strong> {estado}</p>
              <p><strong>Subtotal Base:</strong> {formatearMoneda(validatedData.subtotal)}</p>
              {validatedData.descuento > 0 && (
                <p><strong>Total Descuentos:</strong> {formatearMoneda(validatedData.descuento)}</p>
              )}
              {validatedData.impuestos > 0 && (
                <p><strong>Total Impuestos:</strong> {formatearMoneda(validatedData.impuestos)}</p>
              )}
              <p><strong>Total:</strong> {formatearMoneda(validatedData.total)}</p>
              <p><strong>Items:</strong> {validatedData.items.length} producto(s)</p>
              {validatedData.items.length > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  <strong>Productos:</strong>
                  <ul style={{ marginTop: '0.25rem', paddingLeft: '1.5rem' }}>
                    {validatedData.items.slice(0, 5).map((item, idx) => (
                      <li key={idx}>
                        {productos.find(p => p.id === item.producto_id)?.nombre || 'Producto'} - 
                        Cantidad: {item.cantidad_solicitada} - 
                        {formatearMoneda(item.subtotal)}
                      </li>
                    ))}
                    {validatedData.items.length > 5 && (
                      <li>... y {validatedData.items.length - 5} producto(s) más</li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* Información de Pagos */}
              {validatedData.pagos && validatedData.pagos.length > 0 && (
                <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  <strong>Métodos de Pago:</strong>
                  <div style={{ marginTop: '0.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ textAlign: 'left', padding: '0.5rem', fontWeight: 'bold' }}>Método</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem', fontWeight: 'bold' }}>Fecha</th>
                          <th style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 'bold' }}>Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validatedData.pagos.map((pago, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.5rem', textTransform: 'capitalize' }}>{pago.metodo_pago}</td>
                            <td style={{ padding: '0.5rem' }}>{formatDateShort(pago.fecha_pago)}</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatearMoneda(pago.monto_pagado)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--border-color)' }}>
                          <td colSpan="2" style={{ padding: '0.5rem', textAlign: 'right' }}>Total Pagado:</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                            {formatearMoneda(validatedData.pagos.reduce((sum, p) => sum + p.monto_pagado, 0))}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="2" style={{ padding: '0.5rem', textAlign: 'right' }}>Deuda Restante:</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                            {formatearMoneda(Math.max(0, validatedData.total - validatedData.pagos.reduce((sum, p) => sum + p.monto_pagado, 0)))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
              {(!validatedData.pagos || validatedData.pagos.length === 0) && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>Métodos de Pago:</strong> Sin pagos registrados
                </p>
              )}
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  )
}

export default CompraForm

