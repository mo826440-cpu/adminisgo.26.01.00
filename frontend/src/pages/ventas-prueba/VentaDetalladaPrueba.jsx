// Página de Punto de Venta (POS) - Formulario de Registro de Venta
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Button, Alert, Spinner, Modal } from '../../components/common'
import { getProductos, getProductoPreferible } from '../../services/productos'
import { getClientes, getClientePreferible } from '../../services/clientes'
import { getFormasPago } from '../../services/formasPago'
import { createVenta, getVentaById, updateVenta } from '../../services/ventas'
import { ventaEstaCancelada } from '../../utils/ventaEstado'
import { formatMoneyAR, parseMoneyAR, parseMoneyARNumeric } from '../reportes/reporteVentasUtils'
import { useDateTime } from '../../context/DateTimeContext'
import { useAuthContext } from '../../context/AuthContext'
import { utcToLocalDateTime, getCurrentLocalDateTime, formatDateTime } from '../../utils/dateFormat'
import VentasPruebaToolbar, { VENTAS_PRUEBA_BASE } from '../../components/ventas-prueba/VentasPruebaToolbar'
import '../../components/ventas-prueba/ventasPrueba.css'
import './VentaDetalladaPrueba.css'

function VentaDetalladaPrueba() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const { timezone } = useDateTime()
  const { usuario, user } = useAuthContext()
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
  const [editingPrecioIdx, setEditingPrecioIdx] = useState(null)
  const [precioRaw, setPrecioRaw] = useState('')
  const [editingPagoIdx, setEditingPagoIdx] = useState(null)
  const [pagoMontoRaw, setPagoMontoRaw] = useState('')
  const [descuentoGlobal, setDescuentoGlobal] = useState('')

  const formatCurrency = formatMoneyAR

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

  /** Resuelve producto para Enter / lector (código exacto, selección o única sugerencia). */
  const resolverProductoParaCarga = (terminoOverride = null) => {
    if (
      showProductoSuggestions &&
      productoActiveIndex >= 0 &&
      productoSuggestions[productoActiveIndex]
    ) {
      return productoSuggestions[productoActiveIndex]
    }
    if (productoSeleccionado) return productoSeleccionado

    const termino = (terminoOverride ?? productoSearch).trim()
    if (!termino) return null

    const exact = productos.find(
      (p) =>
        p.codigo_barras?.toLowerCase() === termino.toLowerCase() ||
        p.codigo_interno?.toLowerCase() === termino.toLowerCase()
    )
    if (exact) return exact

    if (productoSuggestions.length === 1) return productoSuggestions[0]
    return null
  }

  const handleProductoKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      if (productoSuggestions.length === 0) return
      e.preventDefault()
      if (!showProductoSuggestions) {
        setShowProductoSuggestions(true)
        setProductoActiveIndex(0)
        return
      }
      setProductoActiveIndex((prev) => (prev + 1) % productoSuggestions.length)
      return
    }
    if (e.key === 'ArrowUp') {
      if (productoSuggestions.length === 0) return
      e.preventDefault()
      if (!showProductoSuggestions) {
        setShowProductoSuggestions(true)
        setProductoActiveIndex(0)
        return
      }
      setProductoActiveIndex(
        (prev) => (prev - 1 + productoSuggestions.length) % productoSuggestions.length
      )
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      // e.target.value refleja lo que ya escribió el lector, aunque React aún no haya re-renderizado
      const terminoInput = e.target?.value ?? productoSearch
      const producto = resolverProductoParaCarga(terminoInput)
      if (!producto) {
        if (String(terminoInput || '').trim()) {
          setError('No se encontró un producto para cargar. Seleccioná uno de la lista.')
        }
        return
      }
      setShowProductoSuggestions(false)
      setProductoSuggestions([])
      setProductoActiveIndex(-1)
      cargarAlCarrito(e, producto)
      return
    }
    if (e.key === 'Escape') {
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

  // Cargar al carrito (productoOverride: Enter desde campo producto / lector de barras)
  const cargarAlCarrito = (e, productoOverride = null) => {
    e?.preventDefault()

    const producto = productoOverride || productoSeleccionado
    if (!producto) {
      setError('Debes seleccionar un producto')
      return
    }

    const cantidad = parseInt(unidades || 0, 10)
    if (cantidad <= 0) {
      setError('Las unidades deben ser mayor a 0')
      return
    }

    const disponible = getStockDisponible(producto.id)
    if (cantidad > disponible) {
      setError(`Stock insuficiente (disponible: ${disponible})`)
      return
    }

    const precioBase = parseFloat(producto.precio_venta || 0)
    const nuevoItem = recalcCarritoItem({
      producto_id: producto.id,
      nombre: producto.nombre,
      cantidad,
      precio_unitario: precioBase,
      descuento: 0,
    })

    setCarrito([...carrito, nuevoItem])

    setProductoSearch('')
    setProductoSeleccionado(null)
    setUnidades('1')
    setStockActual(null)
    setShowProductoSuggestions(false)
    setProductoSuggestions([])
    setProductoActiveIndex(-1)
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
    const precio = parseMoneyARNumeric(raw)
    actualizarItemCarrito(index, { precio_unitario: precio })
  }

  const handleCarritoDescuentoChange = (index, raw) => {
    const desc = Math.min(100, Math.max(0, parseInt(String(raw).replace(/[^\d]/g, '') || '0', 10)))
    actualizarItemCarrito(index, { descuento: desc })
  }

  const aplicarDescuentoGlobal = () => {
    if (carrito.length === 0) return
    const desc = Math.min(
      100,
      Math.max(0, parseInt(String(descuentoGlobal).replace(/[^\d]/g, '') || '0', 10))
    )
    setCarrito((prev) => prev.map((item) => recalcCarritoItem({ ...item, descuento: desc })))
    setDescuentoGlobal(String(desc))
    setError(null)
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
    const monto = parseMoneyARNumeric(raw)
    setMetodosPago((prev) =>
      prev.map((mp, i) => (i === index ? { ...mp, monto_pagado: monto, _autoMonto: false } : mp))
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
      navigate(VENTAS_PRUEBA_BASE)
    }
  }

  const confirmarCancelar = () => {
    setShowCancelModal(false)
    navigate(VENTAS_PRUEBA_BASE)
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
    setDescuentoGlobal('')
  }

  const finalizarSinImprimir = () => {
    setShowPrintOfferModal(false)
    limpiarFormularioPos()
    navigate(VENTAS_PRUEBA_BASE, {
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
      navigate(VENTAS_PRUEBA_BASE, {
        state: { success: true, message: 'Venta registrada correctamente' },
      })
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

  const totalSubtotalBruto = carrito.reduce(
    (sum, item) => sum + (item.precio_unitario * item.cantidad),
    0
  )
  const diferenciaPago = totalPagado - totalFinal

  const getMetodoIcono = (codigo) => {
    const map = {
      efectivo: 'bi-cash-stack',
      transferencia: 'bi-arrow-left-right',
      qr: 'bi-qr-code',
      debito: 'bi-credit-card-2-front',
      credito: 'bi-credit-card',
      cheque: 'bi-bank',
      pendiente: 'bi-clock-history',
      otro: 'bi-wallet2',
    }
    return map[codigo] || 'bi-wallet2'
  }

  const getMetodoNombre = (codigo) => {
    const f = formasPagoList.find((x) => x.codigo === codigo)
    return f?.nombre || codigo
  }

  if (loading) {
    return (
      <Layout>
        <div className="vp-vd-loading">
          <Spinner size="lg" />
          <p>Cargando venta detallada...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container vp-module vp-vd-page">
        <VentasPruebaToolbar showNuevaVenta showClientes />

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)} className="vp-vd-alert">
            {error}
          </Alert>
        )}

        <div className="vp-vd-grid" onKeyDown={handleKeyPress}>
          <div className="vp-vd-col-left">
            <section className="vp-vd-card">
              <h2 className="vp-vd-card__title">1. Cliente</h2>
              <div className="vp-vd-cliente-controls">
                <div className="autocomplete-wrapper vp-vd-cliente-field">
                  <i className="bi bi-person vp-vd-cliente-field__icon" aria-hidden />
                  <input
                    type="text"
                    className="form-control vp-vd-input"
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
                    placeholder="Cliente genérico / Consumidor final"
                  />
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
                </div>
                <Link
                  to="/clientes"
                  className="vp-vd-icon-btn"
                  title="Gestión de clientes"
                  aria-label="Gestión de clientes"
                >
                  <i className="bi bi-person-plus" aria-hidden />
                </Link>
              </div>
            </section>

            <section className="vp-vd-card">
              <h2 className="vp-vd-card__title">2. Buscar y agregar productos</h2>
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
                    onBlur={() => {
                      setTimeout(() => setShowProductoSuggestions(false), 150)
                    }}
                    autoComplete="off"
                    placeholder="Escaneá código de barras o buscá producto..."
                    autoFocus
                  />
                  {productoSeleccionado && stockActual !== null ? (
                    <span className="vp-vd-search-stock">Stock: {stockActual}</span>
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
                          setShowProductoSuggestions(false)
                          setProductoSuggestions([])
                          setProductoActiveIndex(-1)
                          cargarAlCarrito(e, p)
                        }}
                        onMouseEnter={() => setProductoActiveIndex(idx)}
                      >
                        <strong>{p.nombre}</strong>
                        {p.codigo_barras
                          ? ` — ${p.codigo_barras}`
                          : p.codigo_interno
                            ? ` — ${p.codigo_interno}`
                            : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="vp-vd-card vp-vd-cart">
              <div className="vp-vd-card__head">
                <h2 className="vp-vd-card__title">3. Carrito de compras</h2>
                <div className="vp-vd-cart__actions">
                  <div className="vp-vd-desc-global">
                    <label htmlFor="vp-vd-desc-global" className="vp-vd-desc-global__label">
                      % Desc. a todos
                    </label>
                    <input
                      id="vp-vd-desc-global"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      className="vp-vd-inline-input vp-vd-inline-input--desc"
                      value={descuentoGlobal}
                      onChange={(e) => {
                        const valor = e.target.value.replace(/[^\d]/g, '')
                        setDescuentoGlobal(valor)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          aplicarDescuentoGlobal()
                        }
                      }}
                      disabled={carrito.length === 0}
                      placeholder="0"
                      aria-label="Descuento porcentual para todos los productos"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="vp-vd-desc-global__btn"
                      onClick={aplicarDescuentoGlobal}
                      disabled={carrito.length === 0}
                      title="Aplicar el mismo descuento a todos los productos del carrito"
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
                      setCarrito([])
                      setDescuentoGlobal('')
                      setError(null)
                    }}
                    disabled={carrito.length === 0}
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
                      <th>Unid.</th>
                      <th>% Desc.</th>
                      <th>Subtotal</th>
                      <th aria-label="Acciones" />
                    </tr>
                  </thead>
                  <tbody>
                    {carrito.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="vp-vd-empty">
                          Agregá productos con el buscador superior
                        </td>
                      </tr>
                    ) : (
                      carrito.map((item, index) => (
                        <tr key={`${item.producto_id}-${index}`}>
                          <td className="vp-vd-table__nombre">{item.nombre}</td>
                          <td>
                            <input
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              className="vp-vd-inline-input vp-vd-inline-input--money"
                              placeholder="$0,00"
                              value={
                                editingPrecioIdx === index
                                  ? precioRaw
                                  : formatCurrency(item.precio_unitario)
                              }
                              onChange={(e) => {
                                const valor = e.target.value
                                if (/^[\d.,$]*$/.test(valor) || valor === '') {
                                  setPrecioRaw(valor)
                                  handleCarritoPrecioChange(index, valor === '' ? '0' : valor)
                                }
                              }}
                              onFocus={() => {
                                setEditingPrecioIdx(index)
                                const raw = parseMoneyAR(item.precio_unitario)
                                setPrecioRaw(raw === '0' ? '' : raw)
                              }}
                              onBlur={() => {
                                let valor = precioRaw
                                if (!valor || valor.trim() === '' || valor === '$') valor = '0'
                                else valor = parseMoneyAR(valor)
                                handleCarritoPrecioChange(index, valor)
                                setEditingPrecioIdx(null)
                                setPrecioRaw('')
                              }}
                              aria-label={`Precio unitario de ${item.nombre}`}
                            />
                          </td>
                          <td>
                            <div className="vp-vd-qty">
                              <button
                                type="button"
                                className="vp-vd-qty__btn"
                                onClick={() =>
                                  handleCarritoCantidadChange(index, String(item.cantidad - 1))
                                }
                                disabled={item.cantidad <= 1}
                                aria-label="Restar unidad"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                className="vp-vd-inline-input vp-vd-inline-input--qty"
                                value={item.cantidad}
                                onChange={(e) => handleCarritoCantidadChange(index, e.target.value)}
                                aria-label={`Unidades de ${item.nombre}`}
                              />
                              <button
                                type="button"
                                className="vp-vd-qty__btn"
                                onClick={() =>
                                  handleCarritoCantidadChange(index, String(item.cantidad + 1))
                                }
                                aria-label="Sumar unidad"
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
                              onChange={(e) => handleCarritoDescuentoChange(index, e.target.value)}
                              aria-label={`Descuento de ${item.nombre}`}
                            />
                          </td>
                          <td className="vp-vd-table__subtotal">{formatCurrency(item.subtotal)}</td>
                          <td>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="vp-vd-trash"
                              onClick={() => eliminarDelCarrito(index)}
                              title="Quitar del carrito"
                              aria-label={`Quitar ${item.nombre}`}
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
                <span>{totalUnidades} {totalUnidades === 1 ? 'ítem' : 'ítems'}</span>
                <span>Subtotal: {formatCurrency(totalSubtotalBruto)}</span>
                <span>% Descuento: {formatCurrency(totalDescuento)}</span>
              </div>
            </section>
          </div>

          <aside className="vp-vd-col-right">
            <section className="vp-vd-card vp-vd-resumen">
              <h2 className="vp-vd-card__title">4. Resumen y pago</h2>

              <div className="vp-vd-resumen__hero">
                <span className="vp-vd-resumen__hero-label">Total de la venta</span>
                <div className="vp-vd-resumen__hero-value">{formatCurrency(totalFinal)}</div>
              </div>

              <div className="vp-vd-pagos__head">
                <h3 className="vp-vd-pagos__title">Formas de pago</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="vp-vd-add-pago"
                  onClick={agregarLineaPago}
                  disabled={carrito.length === 0 || (deudaRestantePago <= 0.01 && metodosPago.length > 0)}
                >
                  + Agregar pago
                </Button>
              </div>

              <div className="vp-vd-pagos" role="group" aria-label="Formas de pago">
                {carrito.length === 0 ? (
                  <p className="vp-vd-pagos__empty">Cargá productos primero</p>
                ) : (
                  metodosPago.map((mp, index) => {
                    const formasOpciones =
                      formasPagoList.length > 0
                        ? formasPagoList
                        : [{ codigo: 'efectivo', nombre: 'Efectivo' }]
                    return (
                      <div key={index} className="vp-vd-pagos__row">
                        <div className="vp-vd-pagos__metodo">
                          <i
                            className={`bi ${getMetodoIcono(mp.metodo)}`}
                            aria-hidden
                            title={getMetodoNombre(mp.metodo)}
                          />
                          <select
                            className="form-control vp-vd-input"
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
                        </div>
                        <input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          className="form-control vp-vd-input vp-vd-pagos__monto"
                          placeholder="$0,00"
                          value={
                            editingPagoIdx === index
                              ? pagoMontoRaw
                              : formatCurrency(mp.monto_pagado)
                          }
                          onChange={(e) => {
                            const valor = e.target.value
                            if (/^[\d.,$]*$/.test(valor) || valor === '') {
                              setPagoMontoRaw(valor)
                              handlePagoMontoChange(index, valor === '' ? '0' : valor)
                            }
                          }}
                          onFocus={() => {
                            setEditingPagoIdx(index)
                            const raw = parseMoneyAR(mp.monto_pagado)
                            setPagoMontoRaw(raw === '0' ? '' : raw)
                          }}
                          onBlur={() => {
                            let valor = pagoMontoRaw
                            if (!valor || valor.trim() === '' || valor === '$') valor = '0'
                            else valor = parseMoneyAR(valor)
                            handlePagoMontoChange(index, valor)
                            setEditingPagoIdx(null)
                            setPagoMontoRaw('')
                          }}
                          aria-label={`Monto pagado línea ${index + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="vp-vd-trash"
                          onClick={() => eliminarMetodoPago(index)}
                          title={metodosPago.length <= 1 ? 'Restablecer línea' : 'Quitar línea'}
                          aria-label={`Quitar forma de pago línea ${index + 1}`}
                        >
                          <i className="bi bi-trash" aria-hidden />
                        </Button>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="vp-vd-resumen__rows">
                <div className="vp-vd-resumen__row">
                  <span>Total pagos</span>
                  <strong>{formatCurrency(totalPagado)}</strong>
                </div>
                <div className="vp-vd-resumen__row vp-vd-resumen__row--warn">
                  <span>Pendiente</span>
                  <strong>{formatCurrency(deudaRestantePago)}</strong>
                </div>
                <div
                  className={`vp-vd-resumen__row${
                    Math.abs(diferenciaPago) < 0.01
                      ? ' vp-vd-resumen__row--ok'
                      : diferenciaPago > 0
                        ? ' vp-vd-resumen__row--over'
                        : ''
                  }`}
                >
                  <span>Diferencia</span>
                  <strong>{formatCurrency(diferenciaPago)}</strong>
                </div>
              </div>

              <div className="vp-vd-hint">
                <i className="bi bi-info-circle-fill" aria-hidden />
                <p>
                  El total de pagos debe coincidir con el total de la venta. Si pagás de menos, la
                  diferencia quedará registrada como deuda pendiente.
                </p>
              </div>
            </section>

            <div className="vp-vd-footer">
              <Button
                variant="outline"
                className="vp-vd-footer__cancel"
                onClick={handleCancelarVenta}
                disabled={saving}
              >
                <i className="bi bi-x-lg" aria-hidden /> CANCELAR VENTA
              </Button>
              <Button
                variant="primary"
                className="vp-vd-footer__finish"
                onClick={handleConfirmarVenta}
                loading={saving}
                disabled={saving || carrito.length === 0}
              >
                <i className="bi bi-receipt" aria-hidden /> FINALIZAR VENTA
              </Button>
            </div>
          </aside>
        </div>

        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Finalizar venta"
          closeOnOverlayClick={false}
          footer={
            <>
              <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={guardarVenta} loading={saving}>
                Confirmar
              </Button>
            </>
          }
        >
          <p className="vp-vd-confirm__intro">¿Confirmás el registro de esta venta?</p>
          <dl className="vp-vd-confirm">
            <div className="vp-vd-confirm__row">
              <dt>Cliente</dt>
              <dd>{clienteSeleccionado ? clienteSeleccionado.nombre : 'Cliente Genérico'}</dd>
            </div>
            <div className="vp-vd-confirm__row">
              <dt>Total de la venta</dt>
              <dd className="vp-vd-confirm__total">{formatCurrency(totalFinal)}</dd>
            </div>
            <div className="vp-vd-confirm__row vp-vd-confirm__row--block">
              <dt>Formas de pago</dt>
              <dd>
                {metodosPago.length === 0 ? (
                  <span className="vp-vd-confirm__muted">Sin formas de pago</span>
                ) : (
                  <ul className="vp-vd-confirm__pagos">
                    {metodosPago.map((mp, index) => (
                      <li key={index}>
                        <span>{getMetodoNombre(mp.metodo)}</span>
                        <strong>{formatCurrency(mp.monto_pagado)}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
            <div className="vp-vd-confirm__row">
              <dt>Monto total pagado</dt>
              <dd>{formatCurrency(totalPagado)}</dd>
            </div>
            <div className="vp-vd-confirm__row">
              <dt>Monto pendiente</dt>
              <dd className={deudaRestantePago > 0.01 ? 'vp-vd-confirm__pendiente' : undefined}>
                {formatCurrency(deudaRestantePago)}
              </dd>
            </div>
            <div className="vp-vd-confirm__row">
              <dt>Fecha del registro</dt>
              <dd>
                {formatDateTime(
                  isEditing && fecha
                    ? new Date(fecha).toISOString()
                    : new Date().toISOString(),
                  'DD/MM/YYYY HH:mm',
                  timezone
                )}
              </dd>
            </div>
            <div className="vp-vd-confirm__row">
              <dt>Usuario</dt>
              <dd>{usuario?.nombre || user?.email || 'Usuario'}</dd>
            </div>
          </dl>
        </Modal>

        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancelar Venta"
          closeOnOverlayClick={false}
          footer={
            <>
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>
                Continuar Editando
              </Button>
              <Button variant="primary" onClick={confirmarCancelar}>
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
      </div>
    </Layout>
  )
}

export default VentaDetalladaPrueba
