// Página de Punto de Venta (POS) - Formulario de Registro de Venta
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Alert, Spinner, Modal } from '../../components/common'
import { getProductos, getProductoPreferible } from '../../services/productos'
import { getClientes, getClientePreferible } from '../../services/clientes'
import { getFormasPago } from '../../services/formasPago'
import { createVenta, getVentaById, updateVenta } from '../../services/ventas'
import { ventaEstaCancelada } from '../../utils/ventaEstado'
import { useDateTime } from '../../context/DateTimeContext'
import { utcToLocalDateTime, getCurrentLocalDateTime } from '../../utils/dateFormat'
import './POS.css'

function POS() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const { timezone } = useDateTime()
  const productoInputRef = useRef(null)
  const clienteListRef = useRef(null)
  const productoListRef = useRef(null)
  
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Estados del formulario (fecha/facturación solo para persistencia al guardar)
  const [fecha, setFecha] = useState(getCurrentLocalDateTime(timezone))
  const [facturacion, setFacturacion] = useState('')
  const [clienteSearch, setClienteSearch] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [productoSearch, setProductoSearch] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [unidades, setUnidades] = useState('1')
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
  const [formasPagoList, setFormasPagoList] = useState([])
  
  // Estados para modales
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showPrintOfferModal, setShowPrintOfferModal] = useState(false)
  const [savedVentaId, setSavedVentaId] = useState(null)
  const [saving, setSaving] = useState(false)

  const formatCurrency = (value) => {
    const num = Number(value || 0)
    return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const recalcCarritoItem = (item) => {
    const precio = parseFloat(item.precio_unitario) || 0
    const desc = Math.min(100, Math.max(0, parseInt(item.descuento || 0, 10)))
    const cant = Math.max(0, parseInt(item.cantidad || 0, 10))
    const precioUnitarioFinal = precio * (1 - desc / 100)
    return {
      ...item,
      cantidad: cant,
      descuento: desc,
      precio_unitario: precio,
      precio_unitario_final: precioUnitarioFinal,
      subtotal: precioUnitarioFinal * cant,
    }
  }

  const getStockDisponible = (productoId, excludeIndex = null) => {
    const producto = productos.find((p) => p.id === productoId)
    const stock = producto?.stock_actual ?? 0
    const enCarrito = carrito.reduce((sum, item, i) => {
      if (item.producto_id === productoId && i !== excludeIndex) {
        return sum + (parseInt(item.cantidad, 10) || 0)
      }
      return sum
    }, 0)
    return Math.max(0, stock - enCarrito)
  }

  const actualizarItemCarrito = (index, patch) => {
    setCarrito((prev) =>
      prev.map((item, i) => (i === index ? recalcCarritoItem({ ...item, ...patch }) : item))
    )
    setError(null)
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
      const [productosData, clientesData, formasData] = await Promise.all([
        getProductos(),
        getClientes(),
        getFormasPago({ soloActivas: true }),
      ])
      
      if (productosData.error) throw productosData.error
      if (clientesData.error) throw clientesData.error
      
      setProductos(productosData.data || [])
      setClientes(clientesData.data || [])
      const formas = formasData.data || []
      setFormasPagoList(formas)

      if (isEditing) {
        const { data: ventaData, error: errVenta } = await getVentaById(id)
        if (errVenta) throw errVenta
        if (ventaEstaCancelada(ventaData)) {
          setError('Esta venta está cancelada y no puede editarse.')
          setLoading(false)
          return
        }

        setFecha(ventaData.fecha_hora ? utcToLocalDateTime(ventaData.fecha_hora, timezone) : getCurrentLocalDateTime(timezone))
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
          monto_deuda: 0,
          _autoMonto: false,
        }))
        setMetodosPago(pagos)
      } else {
        const [{ data: prefCliente }, { data: prefProducto }] = await Promise.all([
          getClientePreferible(),
          getProductoPreferible(),
        ])
        if (prefCliente) {
          setClienteSeleccionado({ id: prefCliente.id, nombre: prefCliente.nombre })
          setClienteSearch(prefCliente.nombre || '')
        }
        if (prefProducto) {
          aplicarProductoSeleccionado(prefProducto)
        }
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
    setStockActual(producto.stock_actual ?? 0)
    setUnidades('1')
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
      } else if (productoSeleccionado) {
        cargarAlCarrito(e)
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
    setUnidades(clean || '1')
  }

  const handleUnidadesKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      cargarAlCarrito(e)
    }
  }

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

    const disponible = getStockDisponible(productoSeleccionado.id)
    if (cantidad > disponible) {
      setError(`Stock insuficiente (disponible: ${disponible})`)
      return
    }

    const precioBase = parseFloat(productoSeleccionado.precio_venta || 0)
    const nuevoItem = recalcCarritoItem({
      producto_id: productoSeleccionado.id,
      nombre: productoSeleccionado.nombre,
      cantidad,
      precio_unitario: precioBase,
      descuento: 0,
    })

    setCarrito([...carrito, nuevoItem])

    setProductoSearch('')
    setProductoSeleccionado(null)
    setUnidades('1')
    setStockActual(null)
    setError(null)

    if (productoInputRef.current) {
      productoInputRef.current.focus()
    }
  }

  const eliminarDelCarrito = (index) => {
    setCarrito(carrito.filter((_, i) => i !== index))
  }

  const handleCarritoCantidadChange = (index, raw) => {
    const cantidad = parseInt(String(raw).replace(/[^\d]/g, '') || '0', 10)
    if (cantidad <= 0) return
    const item = carrito[index]
    const disponible = getStockDisponible(item.producto_id, index)
    if (cantidad > disponible) {
      setError(`Stock insuficiente para "${item.nombre}" (máx. ${disponible})`)
      return
    }
    actualizarItemCarrito(index, { cantidad })
  }

  const handleCarritoPrecioChange = (index, raw) => {
    const normalized = String(raw).trim().replace(',', '.')
    const precio = parseFloat(normalized)
    if (Number.isNaN(precio) || precio < 0) return
    actualizarItemCarrito(index, { precio_unitario: precio })
  }

  const handleCarritoDescuentoChange = (index, raw) => {
    const desc = Math.min(100, Math.max(0, parseInt(String(raw).replace(/[^\d]/g, '') || '0', 10)))
    actualizarItemCarrito(index, { descuento: desc })
  }

  const getMetodoPagoPreferido = () => {
    const pref = formasPagoList.find((f) => f.preferible) || formasPagoList[0]
    return pref?.codigo || 'efectivo'
  }

  const crearLineaPago = (monto, autoMonto = true) => ({
    metodo: getMetodoPagoPreferido(),
    fecha_pago: new Date().toISOString().slice(0, 10),
    monto_pagado: Math.max(0, Number(monto) || 0),
    monto_deuda: 0,
    _autoMonto: autoMonto,
  })

  const handlePagoMetodoChange = (index, metodo) => {
    setMetodosPago((prev) => prev.map((mp, i) => (i === index ? { ...mp, metodo } : mp)))
    setError(null)
  }

  const handlePagoMontoChange = (index, raw) => {
    const monto = parseFloat(String(raw).replace(',', '.')) || 0
    setMetodosPago((prev) =>
      prev.map((mp, i) => (i === index ? { ...mp, monto_pagado: Math.max(0, monto), _autoMonto: false } : mp))
    )
    setError(null)
  }

  const agregarLineaPago = () => {
    const pagado = metodosPago.reduce((sum, mp) => sum + mp.monto_pagado, 0)
    const deuda = Math.max(0, totalFinal - pagado)
    if (deuda <= 0.01 && metodosPago.length > 0) {
      setError('No hay deuda pendiente para agregar otra forma de pago.')
      return
    }
    setMetodosPago((prev) => [...prev, crearLineaPago(deuda, false)])
    setError(null)
  }

  const eliminarMetodoPago = (index) => {
    if (metodosPago.length <= 1) {
      if (carrito.length > 0) {
        setMetodosPago([crearLineaPago(totalFinal)])
      }
      return
    }
    setMetodosPago(metodosPago.filter((_, i) => i !== index))
    setError(null)
  }

  // Calcular totales del carrito
  const totalUnidades = carrito.reduce((sum, item) => sum + item.cantidad, 0)
  const totalDescuento = carrito.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad * item.descuento / 100), 0)
  const totalFinal = carrito.reduce((sum, item) => sum + item.subtotal, 0)

  // Calcular totales de métodos de pago
  const totalPagado = metodosPago.reduce((sum, mp) => sum + mp.monto_pagado, 0)

  useEffect(() => {
    if (carrito.length === 0) {
      setMetodosPago([])
      return
    }
    setMetodosPago((prev) => {
      if (prev.length === 0) {
        return [crearLineaPago(totalFinal)]
      }
      if (prev.length === 1 && prev[0]._autoMonto !== false) {
        return [{ ...prev[0], monto_pagado: totalFinal }]
      }
      return prev
    })
  }, [carrito.length, totalFinal])

  // Confirmar venta
  const handleConfirmarVenta = () => {
    if (carrito.length === 0) {
      setError('El carrito está vacío')
      return
    }

    if (metodosPago.length === 0) {
      setError('Debes agregar al menos un método de pago')
      return
    }

    if (totalPagado > totalFinal + 0.005) {
      setError('El total pagado supera el total de la venta')
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
        fecha_hora:
          isEditing && fecha
            ? new Date(fecha).toISOString()
            : new Date().toISOString(),
        facturacion: facturacion?.trim() || null,
        subtotal: totalFinal,
        descuento: totalDescuento,
        impuestos: 0,
        total: totalFinal,
        metodo_pago: metodosPago.map(mp => mp.metodo).join(', '),
        // Los pagos reales se guardan en venta_pagos (migración 011)
        pagos: metodosPago.map(({ _autoMonto, monto_deuda, metodo, monto_pagado, fecha_pago }) => ({
          metodo_pago: metodo,
          monto_pagado,
          fecha_pago: fecha_pago ? new Date(fecha_pago).toISOString() : new Date().toISOString()
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

      setSaving(false)

      const ventaId = isEditing ? id : data?.id
      setSavedVentaId(ventaId)
      setShowPrintOfferModal(true)
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

  const limpiarFormularioPos = () => {
    setCarrito([])
    setMetodosPago([])
    setFacturacion('')
    setClienteSearch('')
    setClienteSeleccionado(null)
    setProductoSearch('')
    setProductoSeleccionado(null)
    setUnidades('1')
    setStockActual(null)
  }

  const finalizarSinImprimir = () => {
    setShowPrintOfferModal(false)
    limpiarFormularioPos()
    navigate('/ventas', {
      state: {
        success: true,
        message: isEditing ? 'Venta actualizada correctamente' : 'Venta registrada correctamente',
      },
    })
  }

  const finalizarConImpresion = () => {
    const ventaId = savedVentaId
    setShowPrintOfferModal(false)
    limpiarFormularioPos()
    if (ventaId) {
      navigate(`/ventas/${ventaId}`, { state: { print: true } })
    } else {
      navigate('/ventas', { state: { success: true, message: 'Venta registrada correctamente' } })
    }
  }

  const deudaRestantePago = Math.max(0, totalFinal - totalPagado)

  // Manejar teclas
  const handleKeyPress = (e) => {
    if (e.ctrlKey && e.altKey && e.key === 'Enter') {
      handleConfirmarVenta()
      return
    }
    if (e.ctrlKey && e.key === 'Enter') {
      cargarAlCarrito(e)
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
      <div className="container pos-page">
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)} className="pos-page-alert">
            {error}
          </Alert>
        )}

        <div className="pos-page-body">
        <div className="pos-top-grid">
          <Card className="pos-formulario pos-sidebar">
            <div className="pos-sidebar-head">
              <h3>{isEditing ? 'Editar venta' : 'Nueva venta'}</h3>
              <Button variant="outline" size="sm" onClick={handleCancelarVenta}>
                Cancelar
              </Button>
            </div>

            <form className="pos-sidebar-form" onSubmit={(e) => e.preventDefault()} onKeyDown={handleKeyPress}>
              <div className="pos-sidebar-fields">
              <div className="pos-sidebar-field autocomplete-wrapper">
                <label className="form-label">
                  CLIENTE
                  <div className="pos-field-with-link">
                    <input
                      type="text"
                      className="form-control"
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
                    <Link to="/clientes" className="pos-mgmt-link" title="Gestión de clientes">
                      <i className="bi bi-people" />
                    </Link>
                  </div>
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
                  <span className="text-success pos-sidebar-hint">Cliente: {clienteSeleccionado.nombre}</span>
                )}
              </div>

              <div className="pos-sidebar-field autocomplete-wrapper">
                <label className="form-label">
                  PRODUCTO O CÓDIGO DE BARRAS
                  <div className="pos-field-with-link">
                    <input
                      ref={productoInputRef}
                      type="text"
                      name="producto"
                      className="form-control"
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
                      placeholder="Código de barras, interno o nombre"
                      autoFocus
                    />
                    <Link to="/productos" className="pos-mgmt-link" title="Gestión de productos">
                      <i className="bi bi-box-seam" />
                    </Link>
                  </div>
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
                {productoSeleccionado && stockActual !== null && (
                  <span className="text-info pos-sidebar-hint">Stock disponible: {stockActual}</span>
                )}
              </div>
              </div>

              <div className="pos-sidebar-carga">
                <label className="form-label pos-sidebar-carga-label" htmlFor="pos-unidades">
                  UNIDADES
                </label>
                <input
                  id="pos-unidades"
                  type="number"
                  className="form-control pos-sidebar-unidades-input"
                  min="1"
                  step="1"
                  value={unidades}
                  onChange={(e) => handleUnidadesChange(e.target.value)}
                  onKeyDown={handleUnidadesKeyDown}
                />
                <Button type="button" variant="primary" className="pos-sidebar-cargar" onClick={cargarAlCarrito}>
                  CARGAR
                </Button>
              </div>
            </form>
          </Card>

          <Card className="pos-carrito">
            <section className="pos-panel pos-panel--carrito">
              <h3 className="pos-panel-title">Carrito</h3>
              <div className="carrito-table-container pos-panel-scroll">
                <table className="carrito-table carrito-table--carrito">
                  <thead>
                    <tr>
                      <th className="col-producto">Producto</th>
                      <th className="col-unid">Unid.</th>
                      <th className="col-precio">P. unit.</th>
                      <th className="col-desc">% Desc.</th>
                      <th className="col-total">Total</th>
                      <th className="col-acciones" aria-label="Acciones" />
                    </tr>
                  </thead>
                  <tbody>
                    {carrito.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="pos-empty-row text-secondary">
                          Agregá productos con el panel de la izquierda
                        </td>
                      </tr>
                    ) : (
                      carrito.map((item, index) => (
                        <tr key={`${item.producto_id}-${index}`}>
                          <td className="pos-producto-nombre col-producto">{item.nombre}</td>
                          <td className="col-unid">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              className="carrito-inline-input"
                              value={item.cantidad}
                              onChange={(e) => handleCarritoCantidadChange(index, e.target.value)}
                              aria-label={`Unidades de ${item.nombre}`}
                            />
                          </td>
                          <td className="col-precio">
                            <input
                              type="text"
                              inputMode="decimal"
                              className="carrito-inline-input carrito-inline-input--precio"
                              defaultValue={item.precio_unitario}
                              key={`precio-${index}-${item.precio_unitario}`}
                              onBlur={(e) => handleCarritoPrecioChange(index, e.target.value)}
                              aria-label={`Precio unitario de ${item.nombre}`}
                            />
                          </td>
                          <td className="col-desc">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              className="carrito-inline-input carrito-inline-input--desc"
                              value={item.descuento}
                              onChange={(e) => handleCarritoDescuentoChange(index, e.target.value)}
                              aria-label={`Descuento de ${item.nombre}`}
                            />
                          </td>
                          <td className="carrito-total-cell col-total">{formatCurrency(item.subtotal)}</td>
                          <td className="col-acciones">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarDelCarrito(index)}
                              title="Quitar del carrito"
                              aria-label={`Quitar ${item.nombre}`}
                            >
                              <i className="bi bi-trash" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td className="col-producto">Total general</td>
                      <td className="col-unid">{totalUnidades}</td>
                      <td className="col-precio" colSpan={2}></td>
                      <td className="col-total">{formatCurrency(totalFinal)}</td>
                      <td className="col-acciones"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          </Card>
        </div>

        <Card className="pos-pagos-card">
          <section className="pos-panel pos-panel--pagos">
                <div className="metodos-pago-section__header">
                  <h4 className="pos-panel-title">Formas de pago</h4>
                  <div className="metodos-pago-section__actions">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="pos-pago-add-line"
                      onClick={agregarLineaPago}
                      disabled={carrito.length === 0 || (deudaRestantePago <= 0.01 && metodosPago.length > 0)}
                    >
                      + Agregar línea
                    </Button>
                    <Link to="/configuraciones#formas-pago" className="pos-mgmt-link" title="Gestión de formas de pago">
                      <i className="bi bi-credit-card" />
                    </Link>
                  </div>
                </div>

                <div className="metodos-pago-table-container pos-pagos-table-wrap">
                  <table className="carrito-table carrito-table--pagos">
                    <thead>
                      <tr>
                        <th className="col-pago-metodo">Forma de pago</th>
                        <th className="col-pago-monto">Pagado</th>
                        <th className="col-pago-deuda">Deuda</th>
                        <th className="col-acciones" aria-label="Acciones" />
                      </tr>
                    </thead>
                    <tbody>
                      {carrito.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="pos-empty-row text-secondary">
                            Cargá productos primero
                          </td>
                        </tr>
                      ) : (
                        metodosPago.map((mp, index) => {
                          const pagadoHastaAhora = metodosPago
                            .slice(0, index + 1)
                            .reduce((sum, m) => sum + m.monto_pagado, 0)
                          const deuda = totalFinal - pagadoHastaAhora
                          const formasOpciones =
                            formasPagoList.length > 0
                              ? formasPagoList
                              : [{ codigo: 'efectivo', nombre: 'Efectivo' }]
                          return (
                            <tr key={index}>
                              <td className="col-pago-metodo">
                                <select
                                  className="carrito-inline-input pos-pago-select"
                                  value={mp.metodo}
                                  onChange={(e) => handlePagoMetodoChange(index, e.target.value)}
                                  aria-label={`Forma de pago línea ${index + 1}`}
                                >
                                  {formasOpciones.map((f) => (
                                    <option key={f.codigo} value={f.codigo}>
                                      {f.nombre}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="col-pago-monto">
                                <input
                                  type="number"
                                  className="carrito-inline-input pos-pago-monto-input"
                                  min="0"
                                  step="0.01"
                                  value={mp.monto_pagado}
                                  onChange={(e) => handlePagoMontoChange(index, e.target.value)}
                                  aria-label={`Monto pagado línea ${index + 1}`}
                                />
                              </td>
                              <td className="carrito-total-cell col-pago-deuda">
                                {deuda > 0.01 ? formatCurrency(deuda) : '-'}
                              </td>
                              <td className="col-acciones">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarMetodoPago(index)}
                                  title={metodosPago.length <= 1 ? 'Restablecer línea' : 'Quitar línea'}
                                  aria-label={`Quitar forma de pago línea ${index + 1}`}
                                >
                                  <i className="bi bi-trash" />
                                </Button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
        </Card>
        </div>

        <div className="carrito-actions-final pos-actions-bar">
          <Button
            variant="primary"
            onClick={handleConfirmarVenta}
            loading={saving}
            disabled={saving || carrito.length === 0}
          >
            FINALIZAR
          </Button>
          <Button variant="outline" onClick={handleCancelarVenta} disabled={saving}>
            CANCELAR
          </Button>
        </div>
      </div>

        {/* Modal de Confirmación */}
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Finalizar venta"
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
          <p>¿Confirmás el registro de esta venta?</p>
          <div style={{ marginTop: '1rem' }}>
            <strong>Total: ${totalFinal.toFixed(2)}</strong>
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Cliente: {clienteSeleccionado ? clienteSeleccionado.nombre : 'Cliente Genérico'}
          </div>
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

        <Modal
          isOpen={showPrintOfferModal}
          onClose={finalizarSinImprimir}
          title="Venta registrada"
          closeOnOverlayClick={false}
          footer={
            <>
              <Button variant="outline" onClick={finalizarSinImprimir}>
                No imprimir
              </Button>
              <Button variant="primary" onClick={finalizarConImpresion}>
                Imprimir ticket
              </Button>
            </>
          }
        >
          <p>¿Querés imprimir el ticket con el detalle de la venta?</p>
        </Modal>
    </Layout>
  )
}

export default POS