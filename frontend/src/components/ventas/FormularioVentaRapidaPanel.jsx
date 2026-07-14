import {
  forwardRef,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useImperativeHandle,
} from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Card, Button, Input, Alert, Spinner, Modal } from '../common'
import {
  createVentaRapida,
  getVentaRapidaById,
  updateVentaRapida,
} from '../../services/ventasRapidas'
import {
  createCliente,
  getClientes,
  verificarEmailCliente,
  verificarNombreCliente,
  verificarNumeroDocumentoCliente,
} from '../../services/clientes'
import { getProductoPorCodigoBarras } from '../../services/productos'
import { CODIGO_BARRAS_PRODUCTO_VENTA_RAPIDA } from '../../constants/ventaRapida'
import { useDateTime } from '../../context/DateTimeContext'
import { formatDateTime } from '../../utils/dateFormat'
import ThermalPrintPreviewModal from '../common/ThermalPrintPreviewModal'
import TicketPrintBlock from '../common/TicketPrintBlock'
import { getComercio } from '../../services/comercio'
import { useTicketPrintFormat } from '../../hooks/useTicketPrintFormat'
import { useTicketPrintConfig } from '../../context/TicketPrintContext'
import { buildVentaRapidaThermalPlainText } from '../../utils/thermalPlainReceipt'
import '../../pages/ventas/VentasRapidas.css'
import '../../styles/ticketThermalPrint.css'
import './FormularioVentaRapidaPanel.css'

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

function formatearNumeroMoneda(valor) {
  if (!valor || valor === '0' || valor === '' || valor === '0.00' || valor === '0.0') return '$0,00'
  let num
  if (typeof valor === 'string' && valor.includes('$')) {
    num = parseFloat(valor.replace(/\$/g, '').replace(/\./g, '').replace(',', '.')) || 0
  } else {
    const cleaned = valor.toString().replace(/[^\d,.-]/g, '').replace(',', '.')
    num = parseFloat(cleaned) || 0
  }
  if (isNaN(num) || num === 0) return '$0,00'
  return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function parsearMoneda(valor) {
  if (!valor || valor === '') return '0'
  const numStr = valor.toString().replace(/\$/g, '').replace(/\./g, '').replace(',', '.')
  const num = parseFloat(numStr) || 0
  return num.toString()
}

/**
 * Panel de formulario de venta rápida (alta/edición + impresión ticket).
 * @param {{
 *   estadoCaja: object|null,
 *   onSuccess?: Function,
 *   onError?: (message: string) => void,
 *   onSuccessMessage?: (message: string) => void,
 * }} props
 */
const FormularioVentaRapidaPanel = forwardRef(function FormularioVentaRapidaPanel(
  { estadoCaja, onSuccess, onError, onSuccessMessage },
  ref
) {
  const location = useLocation()
  const { timezone } = useDateTime()
  const clienteInputRef = useRef(null)
  const ticketPrintRef = useRef(null)

  useTicketPrintFormat()
  const { config: printConfig } = useTicketPrintConfig()

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

  /** Edición (null = alta nueva) */
  const [edicionVenta, setEdicionVenta] = useState(null)

  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false)
  const [showNuevoClienteNombreWarningModal, setShowNuevoClienteNombreWarningModal] = useState(false)
  const [nuevoClienteSaving, setNuevoClienteSaving] = useState(false)
  const [nuevoClienteError, setNuevoClienteError] = useState(null)
  const [nuevoClienteForm, setNuevoClienteForm] = useState({
    nombre: '',
    tipo_documento: 'DNI',
    numero_documento: '',
    email: '',
    telefono: '',
    direccion: '',
    activo: true,
  })
  const [nuevoClienteValidated, setNuevoClienteValidated] = useState(null)

  const [thermalPreviewOpen, setThermalPreviewOpen] = useState(false)
  const [ventaParaImprimir, setVentaParaImprimir] = useState(null)
  const [comercioParaImprimir, setComercioParaImprimir] = useState(null)

  const [productoVentaRapida, setProductoVentaRapida] = useState(null)
  const [loadingProducto, setLoadingProducto] = useState(true)

  const formatearMoneda = (valor) => {
    const num = Number(valor || 0)
    return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatearFechaHoraTicket = (fecha) => {
    if (!fecha) return '-'
    return formatDateTime(fecha, 'DD/MM/YYYY HH:mm', timezone)
  }

  const ticketPlain = useMemo(() => {
    if (!ventaParaImprimir) return ''
    return buildVentaRapidaThermalPlainText({
      ventaRapida: ventaParaImprimir,
      comercio: comercioParaImprimir,
      formatearMoneda,
      formatearFechaHoraTicket,
      printConfig,
    })
  }, [ventaParaImprimir, comercioParaImprimir, timezone, printConfig])

  const reportError = (message) => {
    onError?.(message)
  }

  const reportSuccessMessage = (message) => {
    onSuccessMessage?.(message)
  }

  const clearPrintIntent = () => {
    // Ojo: ThermalPrintPreviewModal llama onClose() ANTES de window.print().
    // Si vaciamos el ticket acá, la vista de impresión queda en blanco.
    setThermalPreviewOpen(false)
  }

  const abrirModalImpresion = async (ventaId) => {
    const idNum = Number(ventaId)
    const id = Number.isFinite(idNum) ? idNum : ventaId
    const [ventaData, comercioData] = await Promise.all([getVentaRapidaById(id), getComercio()])
    if (ventaData.error || !ventaData.data) {
      throw ventaData.error || new Error('No se pudo cargar la venta para imprimir.')
    }
    setVentaParaImprimir(ventaData.data)
    setComercioParaImprimir(comercioData.data || null)
    setThermalPreviewOpen(true)
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

  const loadClientes = async () => {
    const { data, error: err } = await getClientes()
    if (err) {
      console.error('Error al cargar clientes:', err)
    } else {
      setClientes(data || [])
    }
  }

  useEffect(() => {
    loadClientes()
  }, [])

  useEffect(() => {
    if (!clienteSearch.trim()) {
      setClienteSuggestions([])
      setShowClienteSuggestions(false)
      return
    }

    const termino = clienteSearch.toLowerCase()
    const filtrados = clientes.filter(
      (c) =>
        c.nombre?.toLowerCase().includes(termino) ||
        c.email?.toLowerCase().includes(termino) ||
        c.telefono?.includes(termino)
    )
    setClienteSuggestions(filtrados.slice(0, 10))
    setShowClienteSuggestions(filtrados.length > 0)
  }, [clienteSearch, clientes])

  const montoCuentaParaCobro = (row) => {
    if (!row || row.metodo_pago === 'pendiente') return 0
    return Math.max(0, parseFloat(parsearMoneda(row.monto)) || 0)
  }

  const totalNumeroNoNegativo = (totalStr) =>
    Math.max(0, parseFloat(parsearMoneda(totalStr)) || 0)

  const saldoAntesDeFilaEnFilas = (rows, totalStr, idx) => {
    const totalNum = totalNumeroNoNegativo(totalStr)
    let acum = 0
    for (let j = 0; j < idx; j++) acum += montoCuentaParaCobro(rows[j])
    return Math.max(0, totalNum - acum)
  }

  const saldoAntesDeFila = (idx) => saldoAntesDeFilaEnFilas(filasPago, total, idx)

  const mirrorFilasPagoAlTotal = (prevFilas, totalStr) => {
    const totalNum = totalNumeroNoNegativo(totalStr)
    const mirrorIdx = prevFilas.findIndex((r) => r.metodo_pago !== 'pendiente')
    if (mirrorIdx < 0) return prevFilas
    const next = prevFilas.map((r) => ({ ...r }))
    next[mirrorIdx] = { ...next[mirrorIdx], monto: String(totalNum) }
    let acum = 0
    for (let i = 0; i < next.length; i++) {
      if (next[i].metodo_pago === 'pendiente') continue
      const saldo = Math.max(0, totalNum - acum)
      let m = Math.max(0, parseFloat(parsearMoneda(next[i].monto)) || 0)
      m = Math.min(m, saldo)
      next[i] = { ...next[i], monto: String(m) }
      acum += m
    }
    return next
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

  const scrollMensajes = () => {
    requestAnimationFrame(() => {
      document.getElementById('ventas-rapidas-mensajes')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const focusForm = () => {
    setTimeout(() => {
      document.querySelector('#venta-rapida-total')?.focus()
    }, 100)
  }

  const iniciarEdicionVenta = async (ventaId) => {
    onError?.(null)
    onSuccessMessage?.(null)
    const id = Number(ventaId)
    const { data, error: err } = await getVentaRapidaById(Number.isFinite(id) ? id : ventaId)
    if (err || !data) {
      reportError(err?.message || 'No se pudo cargar la venta')
      scrollMensajes()
      return
    }
    const items = data.items || []
    if (items.length !== 1) {
      reportError(
        'Esta venta tiene varios productos. Editála desde el menú Ventas (formulario POS).'
      )
      scrollMensajes()
      return
    }
    const codigo = String(items[0].productos?.codigo_barras || '').trim()
    if (codigo !== String(CODIGO_BARRAS_PRODUCTO_VENTA_RAPIDA).trim()) {
      reportError(
        'Solo podés editar aquí ventas del producto genérico de venta rápida. Las demás se editan en Ventas.'
      )
      scrollMensajes()
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
    onError?.(null)
  }

  useImperativeHandle(
    ref,
    () => ({
      iniciarEdicion: iniciarEdicionVenta,
      cancelarEdicion: cancelarEdicionVenta,
      limpiar: limpiarFormularioVentaRapida,
      focusForm,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- API estable; re-lee closures actuales
    [estadoCaja, productoVentaRapida, loadingProducto, filasPago, total, edicionVenta]
  )

  const aplicarClienteSeleccionado = (cliente) => {
    setClienteSeleccionado(cliente)
    setClienteSearch(cliente.nombre)
    setShowClienteSuggestions(false)
    setClienteActiveIndex(-1)
  }

  const openNuevoClienteModal = () => {
    setNuevoClienteError(null)
    setNuevoClienteValidated(null)
    setNuevoClienteForm((prev) => ({
      ...prev,
      nombre: (clienteSearch || '').trim(),
    }))
    setShowNuevoClienteModal(true)
  }

  const closeNuevoClienteModal = () => {
    if (nuevoClienteSaving) return
    setShowNuevoClienteModal(false)
    setShowNuevoClienteNombreWarningModal(false)
    setNuevoClienteError(null)
    setNuevoClienteValidated(null)
  }

  const validarNuevoCliente = async () => {
    const errores = []
    if (!nuevoClienteForm.nombre.trim()) errores.push('El nombre es obligatorio')

    if (nuevoClienteForm.email && nuevoClienteForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(nuevoClienteForm.email.trim())) {
        errores.push('El email no tiene un formato válido')
      }
    }

    if (errores.length) {
      setNuevoClienteError(errores.join('. '))
      return null
    }

    const clienteData = {
      nombre: nuevoClienteForm.nombre.trim(),
      email: nuevoClienteForm.email?.trim() || null,
      telefono: nuevoClienteForm.telefono?.trim() || null,
      direccion: nuevoClienteForm.direccion?.trim() || null,
      numero_documento: nuevoClienteForm.numero_documento?.trim() || null,
      tipo_documento: nuevoClienteForm.tipo_documento || 'DNI',
      activo: true,
    }

    if (clienteData.numero_documento) {
      const { existe: existeDoc, error: errDoc } = await verificarNumeroDocumentoCliente(
        clienteData.numero_documento
      )
      if (errDoc) {
        setNuevoClienteError('Error al verificar el número de documento. Por favor, intenta nuevamente.')
        return null
      }
      if (existeDoc) {
        setNuevoClienteError('El número de documento ya está registrado. Por favor, verifica los datos.')
        return null
      }
    }

    if (clienteData.email) {
      const { existe: existeEmail, error: errEmail } = await verificarEmailCliente(clienteData.email)
      if (errEmail) {
        setNuevoClienteError('Error al verificar el email. Por favor, intenta nuevamente.')
        return null
      }
      if (existeEmail) {
        setNuevoClienteError('El email ya está en uso. Por favor, usa un email diferente.')
        return null
      }
    }

    const { existe: existeNombre, error: errNom } = await verificarNombreCliente(clienteData.nombre)
    if (errNom) {
      setNuevoClienteError('Error al verificar el nombre. Por favor, intenta nuevamente.')
      return null
    }
    if (existeNombre) {
      setNuevoClienteValidated(clienteData)
      setShowNuevoClienteNombreWarningModal(true)
      return null
    }

    return clienteData
  }

  const handleGuardarNuevoCliente = async () => {
    if (nuevoClienteSaving) return
    setNuevoClienteError(null)

    const validated = nuevoClienteValidated || (await validarNuevoCliente())
    if (!validated) return

    setNuevoClienteSaving(true)
    const { data, error: err } = await createCliente(validated)
    if (err || !data) {
      setNuevoClienteError(err?.message || 'Error al crear cliente')
      setNuevoClienteSaving(false)
      return
    }

    const { data: clientesData } = await getClientes()
    if (clientesData) setClientes(clientesData)

    aplicarClienteSeleccionado(data)
    setShowNuevoClienteNombreWarningModal(false)
    setShowNuevoClienteModal(false)
    setNuevoClienteValidated(null)
    setNuevoClienteSaving(false)
  }

  const handleClienteKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setClienteActiveIndex((prev) => (prev + 1) % clienteSuggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setClienteActiveIndex(
        (prev) => (prev - 1 + clienteSuggestions.length) % clienteSuggestions.length
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (clienteActiveIndex >= 0) {
        aplicarClienteSeleccionado(clienteSuggestions[clienteActiveIndex])
      }
    } else if (e.key === 'Escape') {
      setShowClienteSuggestions(false)
    }
  }

  const handleRegistrarVenta = async (e) => {
    e.preventDefault()
    onError?.(null)
    onSuccessMessage?.(null)

    const totalNum = parseFloat(parsearMoneda(total))
    if (totalNum <= 0) {
      reportError('El total debe ser mayor a 0')
      return
    }

    let sumPagado = 0
    for (const row of filasPago) {
      sumPagado += montoCuentaParaCobro(row)
    }

    if (sumPagado > totalNum + 0.02) {
      reportError('La suma de los montos pagados no puede superar el total de la venta.')
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
      reportError('Debes abrir la caja antes de registrar una venta')
      return
    }

    if (loadingProducto) {
      reportError('Esperá a que termine de verificarse el producto.')
      return
    }

    if (!productoVentaRapida?.id) {
      reportError(
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

    const { data: ventaGuardada, error: err } = eraEdicion
      ? await updateVentaRapida(edicionVenta.id, ventaData)
      : await createVentaRapida(ventaData)

    if (err) {
      reportError(
        err.message || (eraEdicion ? 'Error al actualizar la venta' : 'Error al registrar la venta')
      )
      setSaving(false)
      return
    }

    limpiarFormularioVentaRapida()

    reportSuccessMessage(eraEdicion ? 'Venta actualizada correctamente' : 'Venta registrada correctamente')
    setSaving(false)

    const ventaId = !eraEdicion ? ventaGuardada?.id : null

    try {
      await onSuccess?.({ venta: ventaGuardada, eraEdicion })
    } catch (e2) {
      console.error(e2)
    }

    if (ventaId) {
      try {
        await abrirModalImpresion(ventaId)
      } catch (e2) {
        reportError(e2?.message || 'No se pudo preparar la impresión del ticket.')
      }
    }

    focusForm()
  }

  return (
    <div className="formulario-venta-rapida-panel">
      <Card id="venta-rapida-card-form">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
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
                      No hay producto activo con código de barras{' '}
                      <strong>{CODIGO_BARRAS_PRODUCTO_VENTA_RAPIDA}</strong>. Registrá el producto para
                      poder cargar ventas rápidas.
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
              <div className="form-col autocomplete-wrapper venta-rapida-cliente-col">
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

              <div className="venta-rapida-cliente-add-btn-col">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openNuevoClienteModal}
                  title="Agregar cliente"
                  aria-label="Agregar cliente"
                  className="venta-rapida-cliente-add-btn"
                >
                  <i className="bi bi-person-plus" aria-hidden />
                </Button>
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
                  value={totalEditando ? totalValorRaw || '' : formatearNumeroMoneda(total)}
                  onChange={(e) => {
                    const valor = e.target.value
                    if (/^[\d.,$]*$/.test(valor) || valor === '') {
                      setTotalEditando(true)
                      setTotalValorRaw(valor)
                      const valorParseado = parsearMoneda(valor === '' ? '0' : valor)
                      const totalClamped = String(totalNumeroNoNegativo(valorParseado))
                      setTotal(totalClamped)
                      setFilasPago((prev) => mirrorFilasPagoAlTotal(prev, totalClamped))
                      const mirrorIdx = filasPago.findIndex((r) => r.metodo_pago !== 'pendiente')
                      if (mirrorIdx >= 0 && editingPagoIdx === mirrorIdx) {
                        setPagoMontoRaw(totalClamped === '0' ? '' : totalClamped)
                      }
                    }
                  }}
                  onFocus={(e) => {
                    setTotalEditando(true)
                    const valorSinFormato = parsearMoneda(e.target.value)
                    setTotalValorRaw(valorSinFormato === '0' ? '' : valorSinFormato)
                  }}
                  onBlur={(e) => {
                    let valor = e.target.value
                    if (!valor || valor.trim() === '' || valor === '$') {
                      valor = '0'
                    } else {
                      valor = parsearMoneda(valor)
                    }
                    const totalClamped = String(totalNumeroNoNegativo(valor))
                    const prevNum = totalNumeroNoNegativo(total)
                    const nextNum = totalNumeroNoNegativo(totalClamped)
                    setTotal(totalClamped)
                    if (Math.abs(prevNum - nextNum) > 0.009) {
                      setFilasPago((prev) => mirrorFilasPagoAlTotal(prev, totalClamped))
                    }
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
              <p
                className="venta-rapida-pagos-hint text-secondary"
                style={{ fontSize: '0.85rem', margin: '0.25rem 0 0.75rem' }}
              >
                Saldo: lo que queda por cobrar antes de cada fila. Las filas «Pendiente» no suman al
                cobrado; si no cargás pagos o el total cobrado es menor al total, la venta queda en
                estado PENDIENTE.
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
                            const parsed = Math.max(
                              0,
                              parseFloat(parsearMoneda(valor === '' ? '0' : valor)) || 0
                            )
                            const saldo = saldoAntesDeFilaEnFilas(filasPago, total, idx)
                            const capped = Math.min(parsed, saldo)
                            setPagoMontoRaw(
                              valor === '' ? '' : capped === parsed ? valor : String(capped)
                            )
                            actualizarFilaPago(idx, { monto: String(capped) })
                          }
                        }}
                        onFocus={() => {
                          setEditingPagoIdx(idx)
                          const raw = parsearMoneda(row.monto)
                          setPagoMontoRaw(raw === '0' ? '' : raw)
                        }}
                        onBlur={() => {
                          setFilasPago((prev) => {
                            let valor = pagoMontoRaw
                            if (!valor || valor.trim() === '' || valor === '$') valor = '0'
                            else valor = parsearMoneda(valor)
                            let parsed = Math.max(0, parseFloat(valor) || 0)
                            const saldo = saldoAntesDeFilaEnFilas(prev, total, idx)
                            parsed = Math.min(parsed, saldo)
                            return prev.map((r, i) =>
                              i === idx ? { ...r, monto: String(parsed) } : r
                            )
                          })
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
                        title={
                          filasPago.length <= 1 ? 'Debe haber al menos una fila' : 'Quitar fila'
                        }
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
                          ? 'Abrí la caja desde el panel «Gestión de caja» (sin caja abierta no se pueden registrar ventas rápidas).'
                          : undefined
                  }
                >
                  {edicionVenta ? 'Guardar cambios' : 'Registrar Venta'}
                </Button>
                {!estadoCaja?.cajaAbierta && !loadingProducto && productoVentaRapida?.id && (
                  <p className="venta-rapida-aviso-caja" role="status">
                    Abrí la caja desde el panel «Gestión de caja» (etiqueta superior) para poder
                    registrar ventas.
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </Card>

      <Modal
        isOpen={showNuevoClienteModal}
        onClose={closeNuevoClienteModal}
        title="Nuevo cliente"
        closeOnOverlayClick={!nuevoClienteSaving}
        footer={
          <>
            <Button variant="outline" onClick={closeNuevoClienteModal} disabled={nuevoClienteSaving}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleGuardarNuevoCliente}
              loading={nuevoClienteSaving}
              disabled={nuevoClienteSaving}
            >
              Crear cliente
            </Button>
          </>
        }
      >
        {nuevoClienteError ? (
          <Alert variant="danger" dismissible onDismiss={() => setNuevoClienteError(null)}>
            {nuevoClienteError}
          </Alert>
        ) : null}

        <div className="form-row">
          <div className="form-col form-col-full">
            <Input
              label="Nombre completo"
              name="nuevo_cliente_nombre"
              value={nuevoClienteForm.nombre}
              onChange={(e) => setNuevoClienteForm((p) => ({ ...p, nombre: e.target.value }))}
              required
              placeholder="Nombre del cliente"
              disabled={nuevoClienteSaving}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-col">
            <label className="form-label">
              Tipo de documento
              <select
                className="form-control"
                value={nuevoClienteForm.tipo_documento}
                onChange={(e) =>
                  setNuevoClienteForm((p) => ({ ...p, tipo_documento: e.target.value }))
                }
                disabled={nuevoClienteSaving}
              >
                <option value="DNI">DNI</option>
                <option value="CUIT">CUIT</option>
                <option value="CUIL">CUIL</option>
                <option value="LC">LC</option>
                <option value="LE">LE</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </label>
          </div>
          <div className="form-col">
            <Input
              label="Número de documento"
              name="nuevo_cliente_numero_documento"
              value={nuevoClienteForm.numero_documento}
              onChange={(e) =>
                setNuevoClienteForm((p) => ({ ...p, numero_documento: e.target.value }))
              }
              placeholder="Número de documento (opcional)"
              disabled={nuevoClienteSaving}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-col">
            <Input
              label="Email"
              name="nuevo_cliente_email"
              type="email"
              value={nuevoClienteForm.email}
              onChange={(e) => setNuevoClienteForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="cliente@email.com (opcional)"
              disabled={nuevoClienteSaving}
            />
          </div>
          <div className="form-col">
            <Input
              label="Teléfono"
              name="nuevo_cliente_telefono"
              value={nuevoClienteForm.telefono}
              onChange={(e) => setNuevoClienteForm((p) => ({ ...p, telefono: e.target.value }))}
              placeholder="Teléfono (opcional)"
              disabled={nuevoClienteSaving}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-col form-col-full">
            <label className="form-label">
              Dirección
              <textarea
                className="form-control"
                rows="2"
                value={nuevoClienteForm.direccion}
                onChange={(e) => setNuevoClienteForm((p) => ({ ...p, direccion: e.target.value }))}
                placeholder="Dirección (opcional)"
                disabled={nuevoClienteSaving}
              />
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showNuevoClienteNombreWarningModal}
        onClose={() => {
          if (nuevoClienteSaving) return
          setShowNuevoClienteNombreWarningModal(false)
          setNuevoClienteValidated(null)
        }}
        title="Advertencia: nombre duplicado"
        variant="warning"
        closeOnOverlayClick={false}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowNuevoClienteNombreWarningModal(false)
                setNuevoClienteValidated(null)
              }}
              disabled={nuevoClienteSaving}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleGuardarNuevoCliente}
              loading={nuevoClienteSaving}
              disabled={nuevoClienteSaving}
            >
              Continuar y crear
            </Button>
          </>
        }
      >
        <p>
          Ya existe un cliente registrado con el nombre <strong>"{nuevoClienteForm.nombre}"</strong>.
        </p>
        <p style={{ marginTop: '0.75rem' }}>¿Deseas continuar con la carga de todos modos?</p>
      </Modal>

      <div className="ticket-print-host" aria-hidden="true">
        <TicketPrintBlock innerRef={ticketPrintRef} plainText={ticketPlain} />
      </div>

      <ThermalPrintPreviewModal
        isOpen={thermalPreviewOpen}
        onClose={clearPrintIntent}
        sourceRef={ticketPrintRef}
      />
    </div>
  )
})

export default FormularioVentaRapidaPanel
