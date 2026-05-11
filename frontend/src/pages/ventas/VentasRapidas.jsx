// Página de Ventas Rápidas
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Input, Alert, Spinner, Modal, Badge } from '../../components/common'
import { abrirCaja, cerrarCaja, obtenerEstadoCaja } from '../../services/caja'
import {
  createVentaRapida,
  getVentasRapidas,
  getVentaRapidaById,
  deleteVentaRapida,
  updateVentaRapida,
} from '../../services/ventasRapidas'
import { getClientes } from '../../services/clientes'
import { getProductoPorCodigoBarras } from '../../services/productos'
import { CODIGO_BARRAS_PRODUCTO_VENTA_RAPIDA } from '../../constants/ventaRapida'
import { useAuthContext } from '../../context/AuthContext'
import { useDateTime } from '../../context/DateTimeContext'
import { formatDate, formatDateTime } from '../../utils/dateFormat'
import './VentasRapidas.css'
import '../../styles/registros-seccion.css'
import VentasRapidasActionsMenu from './VentasRapidasActionsMenu'

const METODOS_PAGO_OPCIONES = [
  ['efectivo', 'Efectivo'],
  ['transferencia', 'Transferencia'],
  ['qr', 'QR'],
  ['debito', 'Débito'],
  ['credito', 'Crédito'],
  ['cheque', 'Cheque'],
  ['pendiente', 'Pendiente'],
  ['otro', 'Otro método'],
]

function nuevaFilaPago() {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    metodo_pago: 'efectivo',
    monto: '0',
  }
}

function VentasRapidas() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthContext()
  const { timezone, dateFormat } = useDateTime()
  const clienteInputRef = useRef(null)

  // Estados de caja
  const [estadoCaja, setEstadoCaja] = useState(null)
  const [loadingCaja, setLoadingCaja] = useState(true)
  const [showAbrirCajaModal, setShowAbrirCajaModal] = useState(false)
  const [showCerrarCajaModal, setShowCerrarCajaModal] = useState(false)
  const [aperturaEfectivo, setAperturaEfectivo] = useState('0')
  const [aperturaVirtual, setAperturaVirtual] = useState('0')
  const [aperturaCredito, setAperturaCredito] = useState('0')
  const [aperturaOtros, setAperturaOtros] = useState('0')
  const [aperturaEditandoCampo, setAperturaEditandoCampo] = useState(null) // 'efectivo' | 'virtual' | 'credito' | 'otros'
  const [aperturaValorRaw, setAperturaValorRaw] = useState('')
  const [showVerMasApertura, setShowVerMasApertura] = useState(false)
  const [observacionesApertura, setObservacionesApertura] = useState('')
  const [observacionesCierre, setObservacionesCierre] = useState('')
  const [procesandoCaja, setProcesandoCaja] = useState(false)
  const [showMasCaja, setShowMasCaja] = useState(false) // Ver crédito y otros en indicadores

  // Estados del formulario de venta
  const [clientes, setClientes] = useState([])
  const [clienteSearch, setClienteSearch] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [clienteSuggestions, setClienteSuggestions] = useState([])
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false)
  const [clienteActiveIndex, setClienteActiveIndex] = useState(-1)
  const [total, setTotal] = useState('0')
  const [totalEditando, setTotalEditando] = useState(false)
  const [totalValorRaw, setTotalValorRaw] = useState('')
  const [filasPago, setFilasPago] = useState(() => [nuevaFilaPago()])
  const [editingPagoIdx, setEditingPagoIdx] = useState(null)
  const [pagoMontoRaw, setPagoMontoRaw] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  /** Edición en esta misma página (null = alta nueva) */
  const [edicionVenta, setEdicionVenta] = useState(null)

  const [productoVentaRapida, setProductoVentaRapida] = useState(null)
  const [loadingProducto, setLoadingProducto] = useState(true)

  // Estados de tabla de ventas rápidas
  const [ventasRapidas, setVentasRapidas] = useState([])
  const [loadingVentas, setLoadingVentas] = useState(false)
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [usarFiltroAutomatico, setUsarFiltroAutomatico] = useState(true)
  const [ventaRapidaToDelete, setVentaRapidaToDelete] = useState(null)
  const [showDeleteVentaRapidaModal, setShowDeleteVentaRapidaModal] = useState(false)
  const [deletingVentaRapida, setDeletingVentaRapida] = useState(false)

  // Formatear moneda
  const formatearMoneda = (valor) => {
    const num = Number(valor || 0)
    return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Formatear fecha y hora
  const formatearFechaHora = (fecha) => {
    if (!fecha) return '-'
    return formatDateTime(fecha, 'DD/MM/YYYY HH:mm', timezone)
  }

  // Cargar estado de caja
  const loadEstadoCaja = async () => {
    setLoadingCaja(true)
    const { data, error: err } = await obtenerEstadoCaja()
    if (err) {
      setError(err.message || 'Error al cargar estado de caja')
    } else {
      setEstadoCaja(data)
    }
    setLoadingCaja(false)
  }

  const loadProductoVentaRapida = useCallback(async () => {
    setLoadingProducto(true)
    const { data, error: err } = await getProductoPorCodigoBarras(CODIGO_BARRAS_PRODUCTO_VENTA_RAPIDA)
    if (err) {
      console.error('Error al cargar producto venta rápida:', err)
      setProductoVentaRapida(null)
    } else {
      setProductoVentaRapida(data)
    }
    setLoadingProducto(false)
  }, [])

  useEffect(() => {
    loadProductoVentaRapida()
  }, [loadProductoVentaRapida, location.key])

  // Cargar clientes
  const loadClientes = async () => {
    const { data, error: err } = await getClientes()
    if (err) {
      console.error('Error al cargar clientes:', err)
    } else {
      setClientes(data || [])
    }
  }

  // Cargar ventas rápidas
  const loadVentasRapidas = useCallback(async () => {
    setLoadingVentas(true)
    
    let fechaDesde = null
    let fechaHasta = null
    
    if (usarFiltroAutomatico && estadoCaja?.inicioCaja?.fecha_hora) {
      // Usar filtro automático: desde la última apertura de caja
      fechaDesde = estadoCaja.inicioCaja.fecha_hora
      fechaHasta = null // Hasta el momento actual (no se limita)
    } else if (filtroFechaDesde || filtroFechaHasta) {
      // Usar filtros manuales
      fechaDesde = filtroFechaDesde ? `${filtroFechaDesde}T00:00:00` : null
      fechaHasta = filtroFechaHasta ? `${filtroFechaHasta}T23:59:59` : null
    }
    
    const { data, error: err } = await getVentasRapidas(fechaDesde, fechaHasta)
    if (err) {
      console.error('Error al cargar ventas rápidas:', err)
    } else {
      setVentasRapidas(data || [])
    }
    setLoadingVentas(false)
  }, [estadoCaja, filtroFechaDesde, filtroFechaHasta, usarFiltroAutomatico])

  useEffect(() => {
    loadEstadoCaja()
    loadClientes()
  }, [])

  // Cargar ventas rápidas cuando cambia el estado de caja o los filtros
  useEffect(() => {
    if (estadoCaja !== null) {
      loadVentasRapidas()
    }
  }, [loadVentasRapidas])

  // Filtrar clientes para autocompletado
  useEffect(() => {
    if (!clienteSearch.trim()) {
      setClienteSuggestions([])
      setShowClienteSuggestions(false)
      return
    }

    const termino = clienteSearch.toLowerCase()
    const filtrados = clientes.filter(c =>
      c.nombre?.toLowerCase().includes(termino) ||
      c.email?.toLowerCase().includes(termino) ||
      c.telefono?.includes(termino)
    )
    setClienteSuggestions(filtrados.slice(0, 10))
    setShowClienteSuggestions(filtrados.length > 0)
  }, [clienteSearch, clientes])

  // Función para formatear número a formato de moneda (con símbolo $)
  const formatearNumeroMoneda = (valor) => {
    if (!valor || valor === '0' || valor === '' || valor === '0.00' || valor === '0.0') return '$0,00'
    // Si el valor ya tiene formato con $, parsearlo primero
    let num
    if (typeof valor === 'string' && valor.includes('$')) {
      num = parseFloat(valor.replace(/\$/g, '').replace(/\./g, '').replace(',', '.')) || 0
    } else {
      // Remover cualquier carácter no numérico excepto punto y coma
      const cleaned = valor.toString().replace(/[^\d,.-]/g, '').replace(',', '.')
      num = parseFloat(cleaned) || 0
    }
    if (isNaN(num) || num === 0) return '$0,00'
    return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Función para parsear formato de moneda a número
  const parsearMoneda = (valor) => {
    if (!valor || valor === '') return '0'
    // Remover símbolo $, puntos (separadores de miles) y reemplazar coma por punto
    const numStr = valor.toString().replace(/\$/g, '').replace(/\./g, '').replace(',', '.')
    const num = parseFloat(numStr) || 0
    return num.toString()
  }

  /** Monto que impacta cobro (excluye filas «pendiente»). */
  const montoCuentaParaCobro = (row) => {
    if (!row || row.metodo_pago === 'pendiente') return 0
    return Math.max(0, parseFloat(parsearMoneda(row.monto)) || 0)
  }

  const saldoAntesDeFila = (idx) => {
    const totalNum = parseFloat(parsearMoneda(total)) || 0
    let acum = 0
    for (let j = 0; j < idx; j++) acum += montoCuentaParaCobro(filasPago[j])
    return Math.max(0, totalNum - acum)
  }

  const agregarFilaPago = () => {
    setFilasPago((prev) => [...prev, nuevaFilaPago()])
  }

  const quitarFilaPago = (idx) => {
    setFilasPago((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)))
    setEditingPagoIdx((cur) => (cur === idx ? null : cur))
  }

  const actualizarFilaPago = (idx, patch) => {
    setFilasPago((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
  }

  const normalizeMetodoPagoFila = (m) => {
    const x = String(m || '').trim().toLowerCase()
    return METODOS_PAGO_OPCIONES.some(([v]) => v === x) ? x : 'otro'
  }

  const ventaDetalleToFilasPago = (venta) => {
    const rows = []
    for (const p of venta.pagos || []) {
      rows.push({
        key: `ed-${p.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
        metodo_pago: normalizeMetodoPagoFila(p.metodo_pago),
        monto: String(parseFloat(p.monto_pagado) || 0),
      })
    }
    const deuda = parseFloat(venta.monto_deuda) || 0
    if (deuda > 0.009) {
      rows.push({
        key: `ed-pend-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        metodo_pago: 'pendiente',
        monto: String(deuda),
      })
    }
    return rows.length > 0 ? rows : [nuevaFilaPago()]
  }

  const limpiarFormularioVentaRapida = () => {
    setEdicionVenta(null)
    setClienteSeleccionado(null)
    setClienteSearch('')
    setTotal('0')
    setTotalEditando(false)
    setTotalValorRaw('')
    setFilasPago([nuevaFilaPago()])
    setEditingPagoIdx(null)
    setPagoMontoRaw('')
    setObservaciones('')
  }

  const iniciarEdicionVenta = async (ventaId) => {
    setError(null)
    setSuccessMessage(null)
    const { data, error: err } = await getVentaRapidaById(ventaId)
    if (err || !data) {
      setError(err?.message || 'No se pudo cargar la venta')
      return
    }
    const items = data.items || []
    if (items.length !== 1) {
      setError(
        'Esta venta tiene varios productos. Editála desde el menú Ventas (formulario POS).'
      )
      return
    }
    const codigo = String(items[0].productos?.codigo_barras || '').trim()
    if (codigo !== String(CODIGO_BARRAS_PRODUCTO_VENTA_RAPIDA).trim()) {
      setError(
        'Solo podés editar aquí ventas del producto genérico de venta rápida. Las demás se editan en Ventas.'
      )
      return
    }
    setEdicionVenta({
      id: data.id,
      fecha_hora: data.fecha_hora,
      facturacion: data.facturacion ?? null,
      numero_ticket: data.numero_ticket,
    })
    setTotal(String(parseFloat(data.total) || 0))
    setTotalEditando(false)
    setTotalValorRaw('')
    const cid = data.cliente_id
    if (cid && data.clientes) {
      setClienteSeleccionado({
        id: cid,
        nombre: data.clientes.nombre,
        email: data.clientes.email,
      })
      setClienteSearch(data.clientes.nombre || '')
    } else {
      setClienteSeleccionado(null)
      setClienteSearch('')
    }
    setObservaciones(data.observaciones || '')
    setFilasPago(ventaDetalleToFilasPago(data))
    setEditingPagoIdx(null)
    setPagoMontoRaw('')
    setTimeout(() => {
      document.getElementById('venta-rapida-card-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  }

  const cancelarEdicionVenta = () => {
    limpiarFormularioVentaRapida()
    setError(null)
  }

  // Abrir caja con desglose efectivo / virtual / crédito / otros
  const handleAbrirCaja = async () => {
    const efectivoStr = aperturaEditandoCampo === 'efectivo' ? aperturaValorRaw : aperturaEfectivo
    const virtualStr = aperturaEditandoCampo === 'virtual' ? aperturaValorRaw : aperturaVirtual
    const creditoStr = aperturaEditandoCampo === 'credito' ? aperturaValorRaw : aperturaCredito
    const otrosStr = aperturaEditandoCampo === 'otros' ? aperturaValorRaw : aperturaOtros
    const efectivo = parseFloat(parsearMoneda(efectivoStr) || 0)
    const virtual = parseFloat(parsearMoneda(virtualStr) || 0)
    const credito = parseFloat(parsearMoneda(creditoStr) || 0)
    const otros = parseFloat(parsearMoneda(otrosStr) || 0)
    if (efectivo < 0 || virtual < 0 || credito < 0 || otros < 0) {
      setError('Ningún importe puede ser negativo')
      return
    }
    if (efectivo === 0 && virtual === 0 && credito === 0 && otros === 0) {
      setError('Ingresá al menos un importe (efectivo y/o virtual)')
      return
    }

    setProcesandoCaja(true)
    setError(null)
    const { error: err } = await abrirCaja(
      { efectivo, virtual, credito, otros },
      observacionesApertura
    )
    
    if (err) {
      setError(err.message || 'Error al abrir caja')
      setProcesandoCaja(false)
      return
    }

    setShowAbrirCajaModal(false)
    setAperturaEfectivo('0')
    setAperturaVirtual('0')
    setAperturaCredito('0')
    setAperturaOtros('0')
    setAperturaEditandoCampo(null)
    setAperturaValorRaw('')
    setShowVerMasApertura(false)
    setObservacionesApertura('')
    await loadEstadoCaja()
    setProcesandoCaja(false)
  }

  // Cerrar caja
  const handleCerrarCaja = async () => {
    setProcesandoCaja(true)
    setError(null)
    const { error: err } = await cerrarCaja(observacionesCierre)
    
    if (err) {
      setError(err.message || 'Error al cerrar caja')
      setProcesandoCaja(false)
      return
    }

    setShowCerrarCajaModal(false)
    setObservacionesCierre('')
    await loadEstadoCaja()
    setProcesandoCaja(false)
  }

  // Eliminar venta rápida (también quita el registro de la tabla Ventas)
  const handleEliminarVentaRapida = async () => {
    if (!ventaRapidaToDelete) return
    setDeletingVentaRapida(true)
    setError(null)
    const { error: err } = await deleteVentaRapida(ventaRapidaToDelete.id)
    if (err) {
      setError(err.message || 'Error al eliminar el registro')
      setDeletingVentaRapida(false)
      return
    }
    setShowDeleteVentaRapidaModal(false)
    setVentaRapidaToDelete(null)
    setSuccessMessage('Registro eliminado. También se quitó de la tabla de Ventas.')
    await loadVentasRapidas()
    await loadEstadoCaja()
    setDeletingVentaRapida(false)
  }

  // Aplicar cliente seleccionado
  const aplicarClienteSeleccionado = (cliente) => {
    setClienteSeleccionado(cliente)
    setClienteSearch(cliente.nombre)
    setShowClienteSuggestions(false)
    setClienteActiveIndex(-1)
  }

  // Manejar teclado en autocompletado de cliente
  const handleClienteKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setClienteActiveIndex((prev) => (prev + 1) % clienteSuggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setClienteActiveIndex((prev) => (prev - 1 + clienteSuggestions.length) % clienteSuggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (clienteActiveIndex >= 0) {
        aplicarClienteSeleccionado(clienteSuggestions[clienteActiveIndex])
      }
    } else if (e.key === 'Escape') {
      setShowClienteSuggestions(false)
    }
  }

  // Registrar venta rápida
  const handleRegistrarVenta = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    const totalNum = parseFloat(parsearMoneda(total))
    if (totalNum <= 0) {
      setError('El total debe ser mayor a 0')
      return
    }

    let sumPagado = 0
    for (const row of filasPago) {
      sumPagado += montoCuentaParaCobro(row)
    }

    if (sumPagado > totalNum + 0.02) {
      setError('La suma de los montos pagados no puede superar el total de la venta.')
      return
    }

    const pagosPayload = filasPago
      .map((row) => ({
        metodo_pago: row.metodo_pago,
        monto_pagado: Math.max(0, parseFloat(parsearMoneda(row.monto)) || 0),
        fecha_pago: new Date().toISOString(),
      }))
      .filter((p) => p.metodo_pago && p.metodo_pago !== 'pendiente' && p.monto_pagado > 0)

    if (!estadoCaja?.cajaAbierta) {
      setError('Debes abrir la caja antes de registrar una venta')
      return
    }

    if (loadingProducto) {
      setError('Esperá a que termine de verificarse el producto.')
      return
    }

    if (!productoVentaRapida?.id) {
      setError(
        `No hay producto activo con código de barras ${CODIGO_BARRAS_PRODUCTO_VENTA_RAPIDA}. Registralo antes de cargar la venta (ícono al lado del mensaje).`
      )
      return
    }

    setSaving(true)

    const eraEdicion = Boolean(edicionVenta?.id)

    const ventaData = {
      cliente_id: clienteSeleccionado?.id || null,
      fecha_hora: edicionVenta?.fecha_hora || new Date().toISOString(),
      total: totalNum,
      pagos: pagosPayload,
      observaciones: observaciones.trim() || null,
      producto_id: productoVentaRapida.id,
      facturacion: edicionVenta?.facturacion ?? null,
    }

    const { error: err } = eraEdicion
      ? await updateVentaRapida(edicionVenta.id, ventaData)
      : await createVentaRapida(ventaData)

    if (err) {
      setError(err.message || (eraEdicion ? 'Error al actualizar la venta' : 'Error al registrar la venta'))
      setSaving(false)
      return
    }

    limpiarFormularioVentaRapida()

    setSuccessMessage(eraEdicion ? 'Venta actualizada correctamente' : 'Venta registrada correctamente')
    await loadVentasRapidas()
    await loadEstadoCaja()
    setSaving(false)

    // Enfocar campo total para siguiente venta
    setTimeout(() => {
      document.querySelector('#venta-rapida-total')?.focus()
    }, 100)
  }

  if (loadingCaja) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Ventas Rápidas</h1>
            <p className="text-secondary">Gestión de caja y ventas rápidas</p>
          </div>
          <Link to="/ventas">
            <Button variant="outline">← Volver a Ventas</Button>
          </Link>
        </div>

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" dismissible onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {/* Sección de Gestión de Caja */}
        <div className="ventas-rapidas-caja-section">
          <Card>
            <div className="caja-header">
              <h2>Gestión de Caja</h2>
              <div className="caja-buttons">
                <Button
                  variant="primary"
                  onClick={() => setShowAbrirCajaModal(true)}
                  disabled={estadoCaja?.cajaAbierta || procesandoCaja}
                >
                  Abrir Caja
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/ventas-rapidas/historial')}
                >
                  Ver Historial
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setShowCerrarCajaModal(true)}
                  disabled={!estadoCaja?.cajaAbierta || procesandoCaja}
                >
                  Cerrar Caja
                </Button>
              </div>
            </div>

            <div className="caja-indicators">
              <div className="caja-indicator caja-indicator-inicio">
                <h3>Inicio de Caja</h3>
                {estadoCaja?.inicioCaja ? (
                  <>
                    <div className="indicator-value">{formatearMoneda(estadoCaja.inicioCaja.importe)}</div>
                    {estadoCaja.inicioCaja.desglose && (
                      <div className="indicator-desglose">
                        Efectivo {formatearMoneda(estadoCaja.inicioCaja.desglose.efectivo)} · Virtual {formatearMoneda(estadoCaja.inicioCaja.desglose.virtual)}
                        {(estadoCaja.inicioCaja.desglose.credito > 0 || estadoCaja.inicioCaja.desglose.otros > 0) && (
                          <> · Crédito {formatearMoneda(estadoCaja.inicioCaja.desglose.credito)} · Otros {formatearMoneda(estadoCaja.inicioCaja.desglose.otros)}</>
                        )}
                      </div>
                    )}
                    <div className="indicator-info">
                      Usuario: {estadoCaja.inicioCaja.usuarios?.nombre || user?.nombre || '-'}
                    </div>
                    <div className="indicator-info">
                      {formatearFechaHora(estadoCaja.inicioCaja.fecha_hora)}
                    </div>
                  </>
                ) : (
                  <div className="indicator-value">$0,00</div>
                )}
              </div>

              {estadoCaja?.estadoActual?.desglose ? (
                <>
                  <div className="caja-indicator">
                    <h3>Caja efectivo</h3>
                    <div className="indicator-value">{formatearMoneda(estadoCaja.estadoActual.desglose.efectivo)}</div>
                  </div>
                  <div className="caja-indicator">
                    <h3>Caja virtual</h3>
                    <div className="indicator-value">{formatearMoneda(estadoCaja.estadoActual.desglose.virtual)}</div>
                    <div className="indicator-info" style={{ fontSize: '0.75rem' }}>QR, transferencia, débito</div>
                  </div>
                  {showMasCaja && (
                    <>
                      <div className="caja-indicator">
                        <h3>Caja crédito</h3>
                        <div className="indicator-value">{formatearMoneda(estadoCaja.estadoActual.desglose.credito)}</div>
                      </div>
                      <div className="caja-indicator">
                        <h3>Caja otros métodos</h3>
                        <div className="indicator-value">{formatearMoneda(estadoCaja.estadoActual.desglose.otros)}</div>
                        <div className="indicator-info" style={{ fontSize: '0.75rem' }}>Cheque, otro</div>
                      </div>
                    </>
                  )}
                  <div className="caja-indicators-ver-mas">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMasCaja((v) => !v)}
                    >
                      {showMasCaja ? 'Ocultar crédito y otros' : 'Ver crédito y otros'}
                    </Button>
                  </div>
                </>
              ) : estadoCaja?.estadoActual ? (
                <div className="caja-indicator">
                  <h3>Estado actual</h3>
                  <div className="indicator-value">{formatearMoneda(estadoCaja.estadoActual.importe)}</div>
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        {/* Sección de Formulario de Venta */}
        <Card id="venta-rapida-card-form" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>{edicionVenta ? 'Editar venta rápida' : 'Cargar Venta (F2)'}</h2>
            {edicionVenta && (
              <Button type="button" variant="outline" size="sm" onClick={cancelarEdicionVenta}>
                Cancelar edición
              </Button>
            )}
          </div>
          {edicionVenta && (
            <div className="venta-rapida-edicion-banner" role="status">
              Editando venta
              {edicionVenta.numero_ticket ? (
                <>
                  {' '}
                  — Ticket <strong>{edicionVenta.numero_ticket}</strong>
                </>
              ) : null}
              . Los cambios reemplazan ítems y pagos de esta venta.
            </div>
          )}
          <form onSubmit={handleRegistrarVenta}>
            <div className="venta-rapida-form">
              <div className="form-row venta-rapida-producto-row">
                <div className="form-col" style={{ flex: '1 1 100%' }}>
                  <span className="form-label">Producto</span>
                  {loadingProducto ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '2.25rem' }}>
                      <Spinner size="sm" />
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Buscando producto con código {CODIGO_BARRAS_PRODUCTO_VENTA_RAPIDA}…
                      </span>
                    </div>
                  ) : productoVentaRapida ? (
                    <div className="venta-rapida-producto-ok">
                      <span className="bi bi-check-circle-fill venta-rapida-producto-ok-icon" aria-hidden />
                      <span>
                        <strong>{productoVentaRapida.nombre}</strong>
                        {' · '}
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          Cód. barras {productoVentaRapida.codigo_barras || CODIGO_BARRAS_PRODUCTO_VENTA_RAPIDA}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div className="venta-rapida-producto-error" role="alert">
                      <span className="venta-rapida-producto-error-text">
                        No hay producto activo con código de barras <strong>{CODIGO_BARRAS_PRODUCTO_VENTA_RAPIDA}</strong>.
                        Registrá el producto para poder cargar ventas rápidas.
                      </span>
                      <Link
                        to={`/productos/nuevo?codigo_barras=${encodeURIComponent(CODIGO_BARRAS_PRODUCTO_VENTA_RAPIDA)}`}
                        className="venta-rapida-producto-error-link"
                        title="Ir al formulario de producto (código precargado)"
                      >
                        <i className="bi bi-box-seam" aria-hidden />
                        <span className="sr-only">Registrar producto</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-col autocomplete-wrapper">
                  <label className="form-label" htmlFor="venta-rapida-cliente-search">
                    Cliente (opcional)
                  </label>
                  <input
                    id="venta-rapida-cliente-search"
                    name="venta_rapida_cliente_search"
                    ref={clienteInputRef}
                    type="text"
                    className="form-control"
                    placeholder="Buscar clientes cargados"
                    autoComplete="off"
                    value={clienteSearch}
                    onChange={(e) => {
                      setClienteSearch(e.target.value)
                      if (!e.target.value) {
                        setClienteSeleccionado(null)
                      }
                    }}
                    onKeyDown={handleClienteKeyDown}
                    onFocus={() => {
                      if (clienteSearch && clienteSuggestions.length > 0) {
                        setShowClienteSuggestions(true)
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowClienteSuggestions(false), 200)
                    }}
                  />
                  {showClienteSuggestions && clienteSuggestions.length > 0 && (
                    <ul className="autocomplete-list">
                      {clienteSuggestions.map((c, idx) => (
                        <li
                          key={c.id}
                          data-index={idx}
                          className={idx === clienteActiveIndex ? 'active' : ''}
                          onClick={() => aplicarClienteSeleccionado(c)}
                        >
                          {c.nombre} {c.email && `(${c.email})`}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="form-col">
                  <label className="form-label" htmlFor="venta-rapida-total">
                    $Total
                  </label>
                  <input
                    id="venta-rapida-total"
                    type="text"
                    name="venta_rapida_total"
                    className="form-control"
                    autoComplete="off"
                    inputMode="decimal"
                    value={totalEditando ? (totalValorRaw || '') : formatearNumeroMoneda(total)}
                      onChange={(e) => {
                        const valor = e.target.value
                        // Permitir números, puntos, comas y símbolo $
                        if (/^[\d.,$]*$/.test(valor) || valor === '') {
                          setTotalEditando(true)
                          setTotalValorRaw(valor)
                          // Actualizar el estado total con el valor parseado
                          const valorParseado = parsearMoneda(valor)
                          setTotal(valorParseado)
                        }
                      }}
                      onFocus={(e) => {
                        setTotalEditando(true)
                        // Mostrar el valor sin formato cuando se enfoca
                        const valorSinFormato = parsearMoneda(e.target.value)
                        setTotalValorRaw(valorSinFormato === '0' ? '' : valorSinFormato)
                      }}
                      onBlur={(e) => {
                        let valor = e.target.value
                        // Si está vacío o solo tiene $, usar 0
                        if (!valor || valor.trim() === '' || valor === '$') {
                          valor = '0'
                        } else {
                          valor = parsearMoneda(valor)
                        }
                        setTotal(valor)
                        setTotalEditando(false)
                        setTotalValorRaw('')
                      }}
                      placeholder="$0,00"
                      required
                      autoFocus
                    />
                </div>

              </div>

              <div className="venta-rapida-pagos-section">
                <span className="form-label" id="venta-rapida-pagos-label">
                  Pagos (varios métodos como en Ventas)
                </span>
                <p className="venta-rapida-pagos-hint text-secondary" style={{ fontSize: '0.85rem', margin: '0.25rem 0 0.75rem' }}>
                  Saldo: lo que queda por cobrar antes de cada fila. Las filas «Pendiente» no suman al cobrado; si no cargás pagos o el total cobrado es menor al total, la venta queda en estado DEBE.
                </p>
                <div className="venta-rapida-pagos-grid" role="group" aria-labelledby="venta-rapida-pagos-label">
                  <div className="venta-rapida-pagos-head venta-rapida-pagos-row">
                    <span className="venta-rapida-pagos-cell venta-rapida-pagos-cell--saldo">Saldo</span>
                    <span className="venta-rapida-pagos-cell">Forma de pago</span>
                    <span className="venta-rapida-pagos-cell">$Pagado</span>
                    <span className="venta-rapida-pagos-cell venta-rapida-pagos-cell--accion" aria-hidden />
                  </div>
                  {filasPago.map((row, idx) => (
                    <div key={row.key} className="venta-rapida-pagos-row">
                      <div
                        className="venta-rapida-pagos-cell venta-rapida-pagos-cell--saldo venta-rapida-saldo-readonly"
                        title="Saldo pendiente antes de aplicar esta fila"
                      >
                        {formatearMoneda(String(saldoAntesDeFila(idx)))}
                      </div>
                      <div className="venta-rapida-pagos-cell">
                        <select
                          id={`venta-rapida-metodo-${row.key}`}
                          name={`venta_rapida_metodo_pago_${idx}`}
                          className="form-control"
                          autoComplete="off"
                          aria-label={`Forma de pago, fila ${idx + 1}`}
                          value={row.metodo_pago}
                          onChange={(e) => actualizarFilaPago(idx, { metodo_pago: e.target.value })}
                        >
                          {METODOS_PAGO_OPCIONES.map(([val, label]) => (
                            <option key={val} value={val}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="venta-rapida-pagos-cell">
                        <input
                          id={`venta-rapida-monto-${row.key}`}
                          type="text"
                          name={`venta_rapida_monto_pagado_${idx}`}
                          className="form-control"
                          autoComplete="off"
                          inputMode="decimal"
                          aria-label={`Monto pagado, fila ${idx + 1}`}
                          placeholder="$0,00"
                          value={
                            editingPagoIdx === idx ? pagoMontoRaw : formatearNumeroMoneda(row.monto)
                          }
                          onChange={(e) => {
                            const valor = e.target.value
                            if (/^[\d.,$]*$/.test(valor) || valor === '') {
                              setPagoMontoRaw(valor)
                              const valorParseado = parsearMoneda(valor === '' ? '0' : valor)
                              actualizarFilaPago(idx, { monto: valorParseado })
                            }
                          }}
                          onFocus={() => {
                            setEditingPagoIdx(idx)
                            const raw = parsearMoneda(row.monto)
                            setPagoMontoRaw(raw === '0' ? '' : raw)
                          }}
                          onBlur={() => {
                            let valor = pagoMontoRaw
                            if (!valor || valor.trim() === '' || valor === '$') valor = '0'
                            else valor = parsearMoneda(valor)
                            actualizarFilaPago(idx, { monto: valor })
                            setEditingPagoIdx(null)
                            setPagoMontoRaw('')
                          }}
                        />
                      </div>
                      <div className="venta-rapida-pagos-cell venta-rapida-pagos-cell--accion">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={filasPago.length <= 1}
                          onClick={() => quitarFilaPago(idx)}
                          title={filasPago.length <= 1 ? 'Debe haber al menos una fila' : 'Quitar fila'}
                        >
                          Quitar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <Button type="button" variant="outline" size="sm" onClick={agregarFilaPago}>
                    + Agregar forma de pago
                  </Button>
                </div>
              </div>

              <div className="form-actions">
                <div className="venta-rapida-form-submit">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={saving}
                    disabled={
                      saving ||
                      !estadoCaja?.cajaAbierta ||
                      loadingProducto ||
                      !productoVentaRapida?.id
                    }
                    title={
                      saving || loadingProducto
                        ? undefined
                        : !productoVentaRapida?.id
                          ? 'No hay producto activo con el código de venta rápida. Creá o activá el producto en Referencias.'
                          : !estadoCaja?.cajaAbierta
                            ? 'Primero abrí la caja con el botón «Abrir Caja» arriba (sin caja abierta no se pueden registrar ventas rápidas).'
                            : undefined
                    }
                  >
                    {edicionVenta ? 'Guardar cambios' : 'Registrar Venta'}
                  </Button>
                  {!estadoCaja?.cajaAbierta && !loadingProducto && productoVentaRapida?.id && (
                    <p className="venta-rapida-aviso-caja" role="status">
                      Abrí la caja desde «Gestión de Caja» para poder registrar ventas.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </Card>

        {/* Tabla de Registros de Ventas Rápidas */}
        <Card style={{ marginTop: '1.5rem' }}>
          <div className="section-label">SECCIÓN</div>
          <h3 className="registros-seccion-titulo">REGISTROS DE VENTAS RAPIDAS</h3>

          {/* Filtros de fecha */}
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="filtro-automatico"
                  name="ventas_rapidas_filtro_desde_apertura_caja"
                  checked={usarFiltroAutomatico}
                  onChange={(e) => {
                    setUsarFiltroAutomatico(e.target.checked)
                    if (e.target.checked) {
                      setFiltroFechaDesde('')
                      setFiltroFechaHasta('')
                    }
                  }}
                />
                <label htmlFor="filtro-automatico" style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Filtrar desde última apertura de caja
                </label>
              </div>
              
              {!usarFiltroAutomatico && (
                <>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label
                      className="form-label"
                      htmlFor="ventas-rapidas-fecha-desde"
                      style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}
                    >
                      Fecha Desde
                    </label>
                    <input
                      id="ventas-rapidas-fecha-desde"
                      name="ventas_rapidas_fecha_desde"
                      type="date"
                      className="form-control"
                      autoComplete="off"
                      value={filtroFechaDesde}
                      onChange={(e) => setFiltroFechaDesde(e.target.value)}
                      style={{ fontSize: '0.9rem' }}
                    />
                  </div>
                  
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label
                      className="form-label"
                      htmlFor="ventas-rapidas-fecha-hasta"
                      style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}
                    >
                      Fecha Hasta
                    </label>
                    <input
                      id="ventas-rapidas-fecha-hasta"
                      name="ventas_rapidas_fecha_hasta"
                      type="date"
                      className="form-control"
                      autoComplete="off"
                      value={filtroFechaHasta}
                      onChange={(e) => setFiltroFechaHasta(e.target.value)}
                      style={{ fontSize: '0.9rem' }}
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFiltroFechaDesde('')
                      setFiltroFechaHasta('')
                    }}
                    disabled={!filtroFechaDesde && !filtroFechaHasta}
                  >
                    Limpiar Filtros
                  </Button>
                </>
              )}
            </div>
            
            {usarFiltroAutomatico && estadoCaja?.inicioCaja && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Mostrando ventas desde: {formatearFechaHora(estadoCaja.inicioCaja.fecha_hora)}
              </div>
            )}
          </div>
          
          {loadingVentas ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spinner />
            </div>
          ) : ventasRapidas.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              No hay ventas rápidas registradas
            </p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th className="ventas-rapidas-th-num">$Total</th>
                    <th className="ventas-rapidas-th-num">$ Pagado</th>
                    <th className="ventas-rapidas-th-num">$ Pendiente</th>
                    <th>Forma de Pago</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasRapidas.map((venta) => (
                    <tr key={venta.id}>
                      <td>{formatearFechaHora(venta.fecha_hora)}</td>
                      <td className="ventas-rapidas-td-num">{formatearMoneda(venta.total)}</td>
                      <td className="ventas-rapidas-td-num">{formatearMoneda(venta.monto_pagado)}</td>
                      <td className="ventas-rapidas-td-num">
                        {formatearMoneda(
                          venta.monto_pendiente ??
                            Math.max(0, Number(venta.total || 0) - Number(venta.monto_pagado || 0))
                        )}
                      </td>
                      <td>{venta.metodo_pago}</td>
                      <td>
                        <Badge variant={venta.estado === 'PAGADO' ? 'success' : 'warning'}>
                          {venta.estado}
                        </Badge>
                      </td>
                      <td>
                        <VentasRapidasActionsMenu
                          ventaRapidaId={venta.id}
                          onEditar={iniciarEdicionVenta}
                          onDelete={() => {
                            setVentaRapidaToDelete(venta)
                            setShowDeleteVentaRapidaModal(true)
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Modal Abrir Caja */}
        <Modal
          isOpen={showAbrirCajaModal}
          onClose={() => {
            setShowAbrirCajaModal(false)
            setAperturaEfectivo('0')
            setAperturaVirtual('0')
            setAperturaCredito('0')
            setAperturaOtros('0')
            setAperturaEditandoCampo(null)
            setAperturaValorRaw('')
            setShowVerMasApertura(false)
            setObservacionesApertura('')
          }}
          title="Abrir Caja"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAbrirCajaModal(false)
                  setAperturaEfectivo('0')
                  setAperturaVirtual('0')
                  setAperturaCredito('0')
                  setAperturaOtros('0')
                  setAperturaEditandoCampo(null)
                  setAperturaValorRaw('')
                  setShowVerMasApertura(false)
                  setObservacionesApertura('')
                }}
                disabled={procesandoCaja}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleAbrirCaja}
                loading={procesandoCaja}
                disabled={procesandoCaja}
              >
                Abrir Caja
              </Button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label" htmlFor="modal-apertura-fecha-hora">
              Fecha y Hora (Automático)
            </label>
            <input
              id="modal-apertura-fecha-hora"
              name="modal_apertura_fecha_hora"
              type="text"
              className="form-control"
              autoComplete="off"
              value={formatDateTime(new Date().toISOString(), dateFormat, timezone)}
              disabled
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="modal-apertura-usuario">
              Usuario (Automático)
            </label>
            <input
              id="modal-apertura-usuario"
              name="modal_apertura_usuario"
              type="text"
              className="form-control"
              autoComplete="off"
              value={user?.nombre || '-'}
              disabled
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="modal-apertura-efectivo">
              Caja efectivo ($)
            </label>
            <input
              id="modal-apertura-efectivo"
              name="modal_apertura_efectivo"
              type="text"
              className="form-control"
              autoComplete="off"
              inputMode="decimal"
              value={aperturaEditandoCampo === 'efectivo' ? aperturaValorRaw : (aperturaEfectivo === '0' ? '' : formatearNumeroMoneda(aperturaEfectivo))}
                onFocus={() => {
                  setAperturaEditandoCampo('efectivo')
                  setAperturaValorRaw(aperturaEfectivo === '0' ? '' : aperturaEfectivo)
                }}
                onChange={(e) => {
                  const valor = e.target.value
                  if (/^[\d.,$]*$/.test(valor) || valor === '') {
                    setAperturaValorRaw(valor)
                  }
                }}
                onBlur={() => {
                  const v = parsearMoneda(aperturaValorRaw) || '0'
                  setAperturaEfectivo(v)
                  setAperturaEditandoCampo(null)
                  setAperturaValorRaw('')
                }}
                placeholder="$0,00"
                autoFocus
              />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="modal-apertura-virtual">
              Caja virtual ($) — QR, transferencia, débito
            </label>
            <input
              id="modal-apertura-virtual"
              name="modal_apertura_virtual"
              type="text"
              className="form-control"
              autoComplete="off"
              inputMode="decimal"
              value={aperturaEditandoCampo === 'virtual' ? aperturaValorRaw : (aperturaVirtual === '0' ? '' : formatearNumeroMoneda(aperturaVirtual))}
                onFocus={() => {
                  setAperturaEditandoCampo('virtual')
                  setAperturaValorRaw(aperturaVirtual === '0' ? '' : aperturaVirtual)
                }}
                onChange={(e) => {
                  const valor = e.target.value
                  if (/^[\d.,$]*$/.test(valor) || valor === '') {
                    setAperturaValorRaw(valor)
                  }
                }}
                onBlur={() => {
                  const v = parsearMoneda(aperturaValorRaw) || '0'
                  setAperturaVirtual(v)
                  setAperturaEditandoCampo(null)
                  setAperturaValorRaw('')
                }}
                placeholder="$0,00"
              />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowVerMasApertura((v) => !v)}
            >
              {showVerMasApertura ? 'Ocultar crédito y otros' : 'Ver crédito y otros'}
            </Button>
          </div>
          {showVerMasApertura && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="modal-apertura-credito">
                  Caja crédito ($)
                </label>
                <input
                  id="modal-apertura-credito"
                  name="modal_apertura_credito"
                  type="text"
                  className="form-control"
                  autoComplete="off"
                  inputMode="decimal"
                  value={aperturaEditandoCampo === 'credito' ? aperturaValorRaw : (aperturaCredito === '0' ? '' : formatearNumeroMoneda(aperturaCredito))}
                    onFocus={() => {
                      setAperturaEditandoCampo('credito')
                      setAperturaValorRaw(aperturaCredito === '0' ? '' : aperturaCredito)
                    }}
                    onChange={(e) => {
                      const valor = e.target.value
                      if (/^[\d.,$]*$/.test(valor) || valor === '') {
                        setAperturaValorRaw(valor)
                      }
                    }}
                    onBlur={() => {
                      const v = parsearMoneda(aperturaValorRaw) || '0'
                      setAperturaCredito(v)
                      setAperturaEditandoCampo(null)
                      setAperturaValorRaw('')
                    }}
                    placeholder="$0,00"
                  />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="modal-apertura-otros">
                  Caja otros métodos ($) — cheque, otro
                </label>
                <input
                  id="modal-apertura-otros"
                  name="modal_apertura_otros"
                  type="text"
                  className="form-control"
                  autoComplete="off"
                  inputMode="decimal"
                  value={aperturaEditandoCampo === 'otros' ? aperturaValorRaw : (aperturaOtros === '0' ? '' : formatearNumeroMoneda(aperturaOtros))}
                    onFocus={() => {
                      setAperturaEditandoCampo('otros')
                      setAperturaValorRaw(aperturaOtros === '0' ? '' : aperturaOtros)
                    }}
                    onChange={(e) => {
                      const valor = e.target.value
                      if (/^[\d.,$]*$/.test(valor) || valor === '') {
                        setAperturaValorRaw(valor)
                      }
                    }}
                    onBlur={() => {
                      const v = parsearMoneda(aperturaValorRaw) || '0'
                      setAperturaOtros(v)
                      setAperturaEditandoCampo(null)
                      setAperturaValorRaw('')
                    }}
                    placeholder="$0,00"
                  />
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="modal-apertura-observaciones">
              Observaciones (opcional)
            </label>
            <textarea
              id="modal-apertura-observaciones"
              name="modal_apertura_observaciones"
              className="form-control"
              rows="3"
              autoComplete="off"
              value={observacionesApertura}
              onChange={(e) => setObservacionesApertura(e.target.value)}
            />
          </div>
        </Modal>

        {/* Modal Cerrar Caja */}
        <Modal
          isOpen={showCerrarCajaModal}
          onClose={() => {
            setShowCerrarCajaModal(false)
            setObservacionesCierre('')
          }}
          title="Cerrar Caja"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCerrarCajaModal(false)
                  setObservacionesCierre('')
                }}
                disabled={procesandoCaja}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleCerrarCaja}
                loading={procesandoCaja}
                disabled={procesandoCaja}
              >
                Cerrar Caja
              </Button>
            </>
          }
        >
          <div>
            <p style={{ marginBottom: '0.5rem' }}>¿Estás seguro de que deseas cerrar la caja?</p>
            {estadoCaja?.estadoActual?.desglose && (
              <div className="caja-cierre-desglose" style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem 1.5rem', fontSize: '0.95rem' }}>
                  <div><strong>Caja efectivo:</strong> {formatearMoneda(estadoCaja.estadoActual.desglose.efectivo)}</div>
                  <div><strong>Caja virtual:</strong> {formatearMoneda(estadoCaja.estadoActual.desglose.virtual)}</div>
                  <div><strong>Caja crédito:</strong> {formatearMoneda(estadoCaja.estadoActual.desglose.credito)}</div>
                  <div><strong>Caja otros métodos:</strong> {formatearMoneda(estadoCaja.estadoActual.desglose.otros)}</div>
                </div>
                <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>
                  Total: {formatearMoneda(estadoCaja.estadoActual.importe)}
                </div>
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="modal-cierre-observaciones">
                Observaciones (opcional)
              </label>
              <textarea
                id="modal-cierre-observaciones"
                name="modal_cierre_observaciones"
                className="form-control"
                rows="3"
                autoComplete="off"
                placeholder="Ingresá observaciones sobre el cierre de caja..."
                value={observacionesCierre}
                onChange={(e) => setObservacionesCierre(e.target.value)}
              />
            </div>
          </div>
        </Modal>

        {/* Modal confirmar eliminar venta rápida */}
        <Modal
          isOpen={showDeleteVentaRapidaModal}
          onClose={() => {
            setShowDeleteVentaRapidaModal(false)
            setVentaRapidaToDelete(null)
          }}
          title="Eliminar registro"
          variant="danger"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteVentaRapidaModal(false)
                  setVentaRapidaToDelete(null)
                }}
                disabled={deletingVentaRapida}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleEliminarVentaRapida}
                loading={deletingVentaRapida}
                disabled={deletingVentaRapida}
              >
                Eliminar
              </Button>
            </>
          }
        >
          <p>¿Eliminar este registro de venta rápida?</p>
          {ventaRapidaToDelete && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              {formatearFechaHora(ventaRapidaToDelete.fecha_hora)} — {formatearMoneda(ventaRapidaToDelete.total)}
            </p>
          )}
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
            También se quitará de la Tabla de Registros en la página de Ventas.
          </p>
        </Modal>
      </div>
    </Layout>
  )
}

export default VentasRapidas

