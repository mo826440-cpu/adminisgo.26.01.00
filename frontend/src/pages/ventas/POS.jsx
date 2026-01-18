// Página de Punto de Venta (POS) - Formulario de Registro de Venta
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Input, Alert, Spinner, Modal } from '../../components/common'
import { getProductos, getProducto } from '../../services/productos'
import { getClientes } from '../../services/clientes'
import { createVenta, getVentaById, updateVenta } from '../../services/ventas'
import { useAuthContext } from '../../context/AuthContext'
import './POS.css'

function POS() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const { user } = useAuthContext()
  const productoInputRef = useRef(null)
  const clienteListRef = useRef(null)
  const productoListRef = useRef(null)
  
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Estados del formulario
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 16))
  const [facturacion, setFacturacion] = useState('')
  const [facturacionesUsadas, setFacturacionesUsadas] = useState([])
  const [clienteSearch, setClienteSearch] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [productoSearch, setProductoSearch] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [categoria, setCategoria] = useState('')
  const [marca, setMarca] = useState('')
  const [unidades, setUnidades] = useState('1')
  const [precioUnitario, setPrecioUnitario] = useState('0')
  const [descuento, setDescuento] = useState('0')
  const [stockActual, setStockActual] = useState(null)

  // Autocompletado cliente
  const [clienteSuggestions, setClienteSuggestions] = useState([])
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false)
  const [clienteActiveIndex, setClienteActiveIndex] = useState(-1)

  // Autocompletado producto
  const [productoSuggestions, setProductoSuggestions] = useState([])
  const [showProductoSuggestions, setShowProductoSuggestions] = useState(false)
  const [productoActiveIndex, setProductoActiveIndex] = useState(-1)
  
  // Estado del carrito
  const [carrito, setCarrito] = useState([])
  const [metodosPago, setMetodosPago] = useState([])
  const [metodoPagoActual, setMetodoPagoActual] = useState('efectivo')
  const [montoPagoActual, setMontoPagoActual] = useState('0')
  const [montoPagoManual, setMontoPagoManual] = useState(false)
  
  // Estados para modales
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const formatCurrency = (value) => {
    const num = Number(value || 0)
    return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDateShort = (value) => {
    if (!value) return '-'
    const d = new Date(value)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  useEffect(() => {
    loadData()
    // Posicionar cursor en campo producto al cargar
    if (productoInputRef.current) {
      productoInputRef.current.focus()
    }
  }, [id])

  useEffect(() => {
    // Auto-focus en campo producto después de cargar al carrito
    if (productoInputRef.current && productoSeleccionado === null) {
      productoInputRef.current.focus()
    }
  }, [productoSeleccionado])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [productosData, clientesData] = await Promise.all([
        getProductos(),
        getClientes()
      ])
      
      if (productosData.error) throw productosData.error
      if (clientesData.error) throw clientesData.error
      
      setProductos(productosData.data || [])
      setClientes(clientesData.data || [])

      if (isEditing) {
        const { data: ventaData, error: errVenta } = await getVentaById(id)
        if (errVenta) throw errVenta

        setFecha(ventaData.fecha_hora ? new Date(ventaData.fecha_hora).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16))
        setFacturacion(ventaData.facturacion || '')
        if (ventaData.clientes?.nombre) {
          setClienteSeleccionado({ id: ventaData.cliente_id, nombre: ventaData.clientes.nombre })
          setClienteSearch(ventaData.clientes.nombre)
        }

        const items = (ventaData.items || []).map(item => ({
          producto_id: item.producto_id,
          nombre: item.productos?.nombre || 'Producto',
          cantidad: parseInt(item.cantidad || 0, 10),
          precio_unitario: parseFloat(item.precio_unitario || 0),
          descuento: parseInt(item.descuento || 0, 10),
          precio_unitario_final: parseFloat(item.precio_unitario || 0) * (1 - parseFloat(item.descuento || 0) / 100),
          subtotal: parseFloat(item.subtotal || 0)
        }))
        setCarrito(items)

        const pagos = (ventaData.pagos || []).map(p => ({
          metodo: p.metodo_pago,
          fecha_pago: p.fecha_pago,
          monto_pagado: parseFloat(p.monto_pagado || 0),
          monto_deuda: 0
        }))
        setMetodosPago(pagos)
      }
      setLoading(false)
    } catch (err) {
      setError(err.message || 'Error al cargar datos')
      setLoading(false)
    }
  }

  const aplicarProductoSeleccionado = (producto) => {
    setProductoSeleccionado(producto)
    setProductoSearch(producto.nombre || '')
    setCategoria(producto.categorias?.nombre || '')
    setMarca(producto.marcas?.nombre || '')
    setPrecioUnitario((producto.precio_venta || 0).toString())
    setStockActual(producto.stock_actual || 0)
    setUnidades('1')
    setDescuento('0')
  }

  const filtrarProductos = (termino) => {
    if (!termino.trim()) return []
    const lower = termino.toLowerCase()
    return productos.filter(p =>
      p.nombre?.toLowerCase().includes(lower) ||
      p.codigo_barras?.toLowerCase().includes(lower) ||
      p.codigo_interno?.toLowerCase().includes(lower)
    ).slice(0, 8)
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
      setCategoria('')
      setMarca('')
      setPrecioUnitario('0')
      setStockActual(null)
      return
    }

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

  const filtrarClientes = (termino) => {
    if (!termino.trim()) return []
    const lower = termino.toLowerCase()
    return clientes.filter(c =>
      c.nombre?.toLowerCase().includes(lower) ||
      c.numero_documento?.toLowerCase().includes(lower)
    ).slice(0, 8)
  }

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente)
    setClienteSearch(cliente.nombre || '')
    setShowClienteSuggestions(false)
    setClienteSuggestions([])
    setClienteActiveIndex(-1)
  }

  // Buscar cliente
  const buscarCliente = (termino) => {
    setClienteSearch(termino)
    const sugerencias = filtrarClientes(termino)
    setClienteSuggestions(sugerencias)
    setShowClienteSuggestions(sugerencias.length > 0)
    setClienteActiveIndex(sugerencias.length > 0 ? 0 : -1)

    if (!termino.trim()) {
      setClienteSeleccionado(null)
      setShowClienteSuggestions(false)
    }
  }

  const handleClienteKeyDown = (e) => {
    if (clienteSuggestions.length === 0) return
    if (!showClienteSuggestions && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setShowClienteSuggestions(true)
      setClienteActiveIndex(0)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setClienteActiveIndex((prev) => (prev + 1) % clienteSuggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setClienteActiveIndex((prev) => (prev - 1 + clienteSuggestions.length) % clienteSuggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (clienteActiveIndex >= 0) {
        seleccionarCliente(clienteSuggestions[clienteActiveIndex])
      }
    } else if (e.key === 'Escape') {
      setShowClienteSuggestions(false)
    }
  }

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

  useEffect(() => {
    if (!clienteListRef.current) return
    const el = clienteListRef.current.querySelector(`li[data-index="${clienteActiveIndex}"]`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [clienteActiveIndex, clienteSuggestions.length])

  useEffect(() => {
    if (!productoListRef.current) return
    const el = productoListRef.current.querySelector(`li[data-index="${productoActiveIndex}"]`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [productoActiveIndex, productoSuggestions.length])

  const handleUnidadesChange = (value) => {
    const clean = value.replace(/[^\d]/g, '')
    setUnidades(clean)
  }

  const handleDescuentoChange = (value) => {
    const clean = value.replace(/[^\d]/g, '')
    const num = Math.min(100, parseInt(clean || '0', 10))
    setDescuento(Number.isNaN(num) ? '0' : num.toString())
  }

  // Calcular precios
  const precioUnitarioFinal = parseFloat(precioUnitario) * (1 - parseFloat(descuento || 0) / 100)
  const precioFinal = precioUnitarioFinal * parseInt(unidades || 0, 10)

  // Cargar al carrito
  const cargarAlCarrito = (e) => {
    e?.preventDefault()
    
    if (!productoSeleccionado) {
      setError('Debes seleccionar un producto')
      return
    }

    const cantidad = parseInt(unidades || 0, 10)
    if (cantidad <= 0) {
      setError('Las unidades deben ser mayor a 0')
      return
    }

    if (cantidad > (stockActual || 0)) {
      setError('No hay suficiente stock disponible')
      return
    }

    const nuevoItem = {
      producto_id: productoSeleccionado.id,
      nombre: productoSeleccionado.nombre,
      cantidad: cantidad,
      precio_unitario: parseFloat(precioUnitario),
      descuento: parseInt(descuento || 0, 10),
      precio_unitario_final: precioUnitarioFinal,
      subtotal: precioFinal
    }

    setCarrito([...carrito, nuevoItem])
    
    // Limpiar campos
    setProductoSearch('')
    setProductoSeleccionado(null)
    setCategoria('')
    setMarca('')
    setUnidades('1')
    setPrecioUnitario('0')
    setDescuento('0')
    setStockActual(null)
    setError(null)
    
    // Reposicionar cursor en campo producto
    if (productoInputRef.current) {
      productoInputRef.current.focus()
    }
  }

  // Eliminar del carrito
  const eliminarDelCarrito = (index) => {
    setCarrito(carrito.filter((_, i) => i !== index))
  }

  // Editar item del carrito
  const editarItemCarrito = (index) => {
    const item = carrito[index]
    const producto = productos.find(p => p.id === item.producto_id)
    if (producto) {
      setProductoSeleccionado(producto)
      setProductoSearch(producto.nombre)
      setCategoria(producto.categorias?.nombre || '')
      setMarca(producto.marcas?.nombre || '')
      setUnidades(Math.round(item.cantidad).toString())
      setPrecioUnitario(item.precio_unitario.toString())
      setDescuento(item.descuento.toString())
      setStockActual(producto.stock_actual || 0)
      eliminarDelCarrito(index)
      if (productoInputRef.current) {
        productoInputRef.current.focus()
      }
    }
  }

  // Cargar método de pago
  const cargarMetodoPago = (e) => {
    e?.preventDefault()
    
    const monto = parseFloat(montoPagoActual || 0)
    if (monto <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }

    const nuevoMetodo = {
      metodo: metodoPagoActual,
      fecha_pago: new Date().toISOString().slice(0, 10),
      monto_pagado: monto,
      monto_deuda: 0 // Se calculará después
    }

    setMetodosPago([...metodosPago, nuevoMetodo])
    
    // Calcular monto restante
    const totalPagadoHastaAhora = [...metodosPago, nuevoMetodo].reduce((sum, mp) => sum + mp.monto_pagado, 0)
    const montoRestante = totalFinal - totalPagadoHastaAhora
    
    // Limpiar campos
    setMetodoPagoActual('efectivo')
    setMontoPagoActual(montoRestante > 0 ? montoRestante.toString() : '0')
    setError(null)
    
    // Reposicionar cursor en campo método de pago
    setTimeout(() => {
      const metodoPagoInput = document.querySelector('input[name="metodoPago"]')
      if (metodoPagoInput) {
        metodoPagoInput.focus()
        metodoPagoInput.select()
      }
    }, 100)
  }

  // Eliminar método de pago
  const eliminarMetodoPago = (index) => {
    setMetodosPago(metodosPago.filter((_, i) => i !== index))
  }

  // Calcular totales del carrito
  const totalUnidades = carrito.reduce((sum, item) => sum + item.cantidad, 0)
  const totalDescuento = carrito.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad * item.descuento / 100), 0)
  const totalFinal = carrito.reduce((sum, item) => sum + item.subtotal, 0)
  const baseTotal = totalFinal + totalDescuento
  const totalDescuentoPorcentaje = baseTotal > 0 ? (totalDescuento / baseTotal) * 100 : 0

  // Calcular totales de métodos de pago
  const totalPagado = metodosPago.reduce((sum, mp) => sum + mp.monto_pagado, 0)

  useEffect(() => {
    if (montoPagoManual) return
    const deuda = Math.max(0, totalFinal - totalPagado)
    setMontoPagoActual(deuda > 0 ? deuda.toFixed(2) : '0')
  }, [totalFinal, totalPagado, montoPagoManual])

  // Confirmar venta
  const handleConfirmarVenta = () => {
    if (carrito.length === 0) {
      setError('El carrito está vacío')
      return
    }

    if (facturacion && facturacionesUsadas.includes(facturacion.trim())) {
      setError('Esta facturación ya fue utilizada anteriormente')
      return
    }

    if (metodosPago.length === 0) {
      setError('Debes agregar al menos un método de pago')
      return
    }

    setShowConfirmModal(true)
  }

  // Guardar venta
  const guardarVenta = async () => {
    setShowConfirmModal(false)
    setSaving(true)
    setError(null)

    try {
      const ventaData = {
        cliente_id: clienteSeleccionado?.id || null,
        fecha_hora: fecha ? new Date(fecha).toISOString() : undefined,
        facturacion: facturacion?.trim() || null,
        subtotal: totalFinal,
        descuento: totalDescuento,
        impuestos: 0,
        total: totalFinal,
        metodo_pago: metodosPago.map(mp => mp.metodo).join(', '),
        // Los pagos reales se guardan en venta_pagos (migración 011)
        pagos: metodosPago.map(mp => ({
          metodo_pago: mp.metodo,
          monto_pagado: mp.monto_pagado,
          fecha_pago: mp.fecha_pago ? new Date(mp.fecha_pago).toISOString() : new Date().toISOString()
        })),
        observaciones: null,
        items: carrito.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento: item.descuento,
          subtotal: item.subtotal
        }))
      }

      const { data, error: errorVenta } = isEditing
        ? await updateVenta(id, ventaData)
        : await createVenta(ventaData)

      if (errorVenta) {
        throw errorVenta
      }

      // Agregar facturación a la lista de usadas
      if (facturacion) {
        setFacturacionesUsadas([...facturacionesUsadas, facturacion.trim()])
      }

      setSaving(false)
      
      // Limpiar todo
      setCarrito([])
      setMetodosPago([])
      setFacturacion('')
      setClienteSearch('')
      setClienteSeleccionado(null)
      setProductoSearch('')
      setProductoSeleccionado(null)
      setCategoria('')
      setMarca('')
      setUnidades('1')
      setPrecioUnitario('0')
      setDescuento('0')
      setStockActual(null)
      setMetodoPagoActual('efectivo')
      setMontoPagoActual('0')
      setMontoPagoManual(false)
      
      // Redirigir
      navigate('/ventas', {
        state: {
          success: true,
          message: isEditing
            ? 'Venta actualizada correctamente'
            : `Venta realizada correctamente. Ticket: ${data.numero_ticket}`
        }
      })
    } catch (err) {
      setError(err.message || 'Error al guardar la venta')
      setSaving(false)
    }
  }

  // Cancelar venta
  const handleCancelarVenta = () => {
    if (carrito.length > 0 || metodosPago.length > 0) {
      setShowCancelModal(true)
    } else {
      navigate('/ventas')
    }
  }

  const confirmarCancelar = () => {
    setShowCancelModal(false)
    navigate('/ventas')
  }

  // Manejar teclas
  const handleKeyPress = (e) => {
    if (e.ctrlKey && e.altKey && e.key === 'Enter') {
      handleConfirmarVenta()
      return
    }
    if (e.ctrlKey && e.key === 'Enter') {
      cargarAlCarrito(e)
      return
    }
    if (e.key === 'Enter' && e.target.name === 'metodoPago') {
      cargarMetodoPago(e)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando punto de venta...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        <div className="pos-header">
          <div>
            <h1>{isEditing ? 'Editar Venta' : 'Formulario Registrar Venta'}</h1>
            <p className="text-secondary">
              {isEditing ? 'Modifica los datos de la venta' : 'Completa los datos para registrar una nueva venta'}
            </p>
          </div>
          <Button variant="outline" onClick={handleCancelarVenta}>
            Cancelar Venta
          </Button>
        </div>

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className="pos-form-grid">
          {/* Formulario a la izquierda */}
          <Card className="pos-formulario">
            <h3>Datos de la Venta</h3>
            
            <form onSubmit={(e) => e.preventDefault()} onKeyDown={handleKeyPress}>
              <div className="form-row">
                <div className="form-col">
                  <label className="form-label">
                    FECHA
                    <Input
                      type="datetime-local"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                    />
                  </label>
                </div>
                <div className="form-col">
                  <label className="form-label">
                    RESPONSABLE CARGA
                    <Input
                      type="text"
                      value={user?.email || ''}
                      disabled
                      readOnly
                    />
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label className="form-label">
                    FACTURACIÓN
                    <Input
                      type="text"
                      value={facturacion}
                      onChange={(e) => setFacturacion(e.target.value)}
                      placeholder="Número de factura (opcional)"
                    />
                  </label>
                  {facturacion && facturacionesUsadas.includes(facturacion.trim()) && (
                    <span className="text-danger" style={{ fontSize: '0.875rem' }}>
                      Esta facturación ya fue utilizada
                    </span>
                  )}
                </div>
                <div className="form-col autocomplete-wrapper">
                  <label className="form-label">
                    CLIENTE
                    <Input
                      type="text"
                      value={clienteSearch}
                      onChange={(e) => buscarCliente(e.target.value)}
                      onKeyDown={handleClienteKeyDown}
                      onFocus={() => {
                        if (clienteSuggestions.length > 0) setShowClienteSuggestions(true)
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowClienteSuggestions(false), 150)
                      }}
                      autoComplete="off"
                      placeholder="Buscar por nombre o documento"
                    />
                  </label>
                  {showClienteSuggestions && clienteSuggestions.length > 0 && (
                    <ul className="autocomplete-list" ref={clienteListRef}>
                      {clienteSuggestions.map((c, idx) => (
                        <li
                          key={c.id}
                          data-index={idx}
                          className={idx === clienteActiveIndex ? 'active' : ''}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            seleccionarCliente(c)
                          }}
                          onMouseEnter={() => setClienteActiveIndex(idx)}
                        >
                          <strong>{c.nombre}</strong>
                          {c.numero_documento ? ` — ${c.numero_documento}` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                  {clienteSeleccionado && (
                    <span className="text-success" style={{ fontSize: '0.875rem' }}>
                      Cliente: {clienteSeleccionado.nombre}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-col form-col-full autocomplete-wrapper">
                  <label className="form-label">
                    PRODUCTO
                    <Input
                      ref={productoInputRef}
                      type="text"
                      name="producto"
                      value={productoSearch}
                      onChange={(e) => buscarProducto(e.target.value)}
                      onKeyDown={handleProductoKeyDown}
                      onFocus={() => {
                        if (productoSuggestions.length > 0) setShowProductoSuggestions(true)
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowProductoSuggestions(false), 150)
                      }}
                      autoComplete="off"
                      placeholder="Buscar por código de barras, código interno o nombre"
                      autoFocus
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
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                      <span className="text-success">Producto seleccionado: {productoSeleccionado.nombre}</span>
                      {stockActual !== null && (
                        <span className="text-info" style={{ marginLeft: '1rem' }}>
                          Stock actual: {stockActual}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label className="form-label">
                    CATEGORÍA
                    <Input
                      type="text"
                      value={categoria}
                      disabled
                      readOnly
                    />
                  </label>
                </div>
                <div className="form-col">
                  <label className="form-label">
                    MARCA
                    <Input
                      type="text"
                      value={marca}
                      disabled
                      readOnly
                    />
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label className="form-label">
                    UNIDADES
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={unidades}
                      onChange={(e) => handleUnidadesChange(e.target.value)}
                    />
                  </label>
                </div>
                <div className="form-col">
                  <label className="form-label">
                    PRECIO UNITARIO
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={precioUnitario}
                      onChange={(e) => setPrecioUnitario(e.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label className="form-label">
                    DESCUENTO (%)
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={descuento}
                      onChange={(e) => handleDescuentoChange(e.target.value)}
                    />
                  </label>
                </div>
                <div className="form-col">
                  <label className="form-label">
                    PRECIO UNITARIO FINAL
                    <Input
                      type="number"
                      value={precioUnitarioFinal.toFixed(2)}
                      disabled
                      readOnly
                    />
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label className="form-label">
                    PRECIO FINAL
                    <Input
                      type="number"
                      value={precioFinal.toFixed(2)}
                      disabled
                      readOnly
                    />
                  </label>
                </div>
                <div className="form-col">
                  <Button
                    type="button"
                    variant="primary"
                    fullWidth
                    style={{ marginTop: '1.75rem' }}
                    onClick={cargarAlCarrito}
                  >
                    Cargar al Carrito (Ctrl + Enter)
                  </Button>
                </div>
              </div>
            </form>
          </Card>

          {/* Carrito a la derecha */}
          <Card className="pos-carrito">
            <h3>CARRITO</h3>
            
            {carrito.length === 0 ? (
              <p className="text-secondary">El carrito está vacío</p>
            ) : (
              <>
                <div className="carrito-table-container">
                  <table className="carrito-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Unidades</th>
                        <th>$ Unitario</th>
                        <th>% Descuento</th>
                        <th>$ Final</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {carrito.map((item, index) => (
                        <tr key={index}>
                          <td>{item.nombre}</td>
                          <td>{item.cantidad}</td>
                        <td>{formatCurrency(item.precio_unitario)}</td>
                          <td>{item.descuento}%</td>
                        <td>{formatCurrency(item.subtotal)}</td>
                          <td>
                            <div className="carrito-actions">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editarItemCarrito(index)}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => eliminarDelCarrito(index)}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="total-row">
                        <td>TOTAL</td>
                        <td>{totalUnidades}</td>
                        <td>-</td>
                        <td>{totalDescuentoPorcentaje.toFixed(2)}%</td>
                        <td>{formatCurrency(totalFinal)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="metodos-pago-section">
                  <h4>Métodos de Pago</h4>
                  
                  <form onSubmit={cargarMetodoPago} onKeyPress={handleKeyPress}>
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
                          <Input
                            type="number"
                            name="metodoPago"
                            min="0"
                            step="0.01"
                            value={montoPagoActual}
                            onChange={(e) => {
                              setMontoPagoManual(true)
                              setMontoPagoActual(e.target.value)
                            }}
                            onBlur={() => setMontoPagoManual(false)}
                            placeholder={formatCurrency(totalFinal)}
                          />
                        </label>
                      </div>
                      <div className="form-col">
                        <Button
                          type="submit"
                          variant="primary"
                          style={{ marginTop: '1.75rem' }}
                        >
                          Cargar Método Pago (Enter)
                        </Button>
                      </div>
                    </div>
                  </form>

                  {metodosPago.length > 0 && (
                    <div className="metodos-pago-table-container" style={{ marginTop: '1rem' }}>
                      <table className="carrito-table">
                        <thead>
                          <tr>
                            <th>Método Pago</th>
                            <th>Fecha Pago</th>
                            <th>Monto Pagado $</th>
                            <th>Monto Deuda $</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metodosPago.map((mp, index) => {
                            const pagadoHastaAhora = metodosPago.slice(0, index + 1).reduce((sum, m) => sum + m.monto_pagado, 0)
                            const deuda = totalFinal - pagadoHastaAhora
                            return (
                              <tr key={index}>
                                <td>{mp.metodo}</td>
                                <td>{formatDateShort(mp.fecha_pago)}</td>
                                <td>{formatCurrency(mp.monto_pagado)}</td>
                                <td>{deuda > 0 ? formatCurrency(deuda) : '-'}</td>
                                <td>
                                  <div className="carrito-actions">
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
                          <tr className="total-row">
                            <td>TOTAL</td>
                            <td></td>
                            <td>{formatCurrency(totalPagado)}</td>
                            <td>-</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                <div className="carrito-actions-final">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleConfirmarVenta}
                    loading={saving}
                    disabled={saving}
                  >
                    Confirmar Venta (Ctrl + Alt + Enter)
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={handleCancelarVenta}
                    disabled={saving}
                  >
                    Cancelar Venta
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Modal de Confirmación */}
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirmar Venta"
          closeOnOverlayClick={false}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={guardarVenta}
                loading={saving}
              >
                Confirmar
              </Button>
            </>
          }
        >
          <p>¿Estás seguro de que deseas confirmar esta venta?</p>
          <div style={{ marginTop: '1rem' }}>
            <strong>Total: ${totalFinal.toFixed(2)}</strong>
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Cliente: {clienteSeleccionado ? clienteSeleccionado.nombre : 'Cliente Genérico'}
          </div>
          {facturacion && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Facturación: {facturacion}
            </div>
          )}
        </Modal>

        {/* Modal de Cancelación */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancelar Venta"
          closeOnOverlayClick={false}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
              >
                Continuar Editando
              </Button>
              <Button
                variant="primary"
                onClick={confirmarCancelar}
              >
                Sí, Cancelar
              </Button>
            </>
          }
        >
          <p>¿Estás seguro de que deseas cancelar esta venta?</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Se perderán todos los datos cargados sin guardar.
          </p>
        </Modal>
      </div>
    </Layout>
  )
}

export default POS