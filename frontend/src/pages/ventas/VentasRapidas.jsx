// Página de Ventas Rápidas
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Input, Alert, Spinner, Modal, Badge } from '../../components/common'
import { abrirCaja, cerrarCaja, obtenerEstadoCaja } from '../../services/caja'
import { createVentaRapida, getVentasRapidas } from '../../services/ventasRapidas'
import { getClientes } from '../../services/clientes'
import { useAuthContext } from '../../context/AuthContext'
import { useDateTime } from '../../context/DateTimeContext'
import { formatDate, formatDateTime } from '../../utils/dateFormat'
import './VentasRapidas.css'

function VentasRapidas() {
  const navigate = useNavigate()
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
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [montoPagado, setMontoPagado] = useState('0')
  const [montoPagadoEditando, setMontoPagadoEditando] = useState(false)
  const [montoPagadoValorRaw, setMontoPagadoValorRaw] = useState('')
  const [montoPagadoManual, setMontoPagadoManual] = useState(false)
  const [observaciones, setObservaciones] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Estados de tabla de ventas rápidas
  const [ventasRapidas, setVentasRapidas] = useState([])
  const [loadingVentas, setLoadingVentas] = useState(false)
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [usarFiltroAutomatico, setUsarFiltroAutomatico] = useState(true)

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

  // Actualizar monto pagado automáticamente cuando cambia el total (solo si no se editó manualmente)
  useEffect(() => {
    if (!montoPagadoManual && !montoPagadoEditando) {
      setMontoPagado(total)
    }
  }, [total, montoPagadoManual, montoPagadoEditando])

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

    const montoPagadoNum = parseFloat(parsearMoneda(montoPagado))
    if (montoPagadoNum < 0) {
      setError('El monto pagado no puede ser negativo')
      return
    }

    if (!estadoCaja?.cajaAbierta) {
      setError('Debes abrir la caja antes de registrar una venta')
      return
    }

    setSaving(true)

    const ventaData = {
      cliente_id: clienteSeleccionado?.id || null,
      fecha_hora: new Date().toISOString(),
      total: totalNum,
      metodo_pago: metodoPago,
      monto_pagado: montoPagadoNum,
      observaciones: observaciones.trim() || null
    }

    const { error: err } = await createVentaRapida(ventaData)

    if (err) {
      setError(err.message || 'Error al registrar la venta')
      setSaving(false)
      return
    }

    // Limpiar formulario (incluir estados de edición para que al enviar con Enter también se limpien los campos)
    setClienteSeleccionado(null)
    setClienteSearch('')
    setTotal('0')
    setTotalEditando(false)
    setTotalValorRaw('')
    setMontoPagado('0')
    setMontoPagadoEditando(false)
    setMontoPagadoValorRaw('')
    setMontoPagadoManual(false)
    setMetodoPago('efectivo')
    setObservaciones('')
    
    setSuccessMessage('Venta registrada correctamente')
    await loadVentasRapidas()
    await loadEstadoCaja()
    setSaving(false)

    // Enfocar campo total para siguiente venta
    setTimeout(() => {
      document.querySelector('input[name="total"]')?.focus()
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
        <Card style={{ marginTop: '1.5rem' }}>
          <h2>Cargar Venta (F2)</h2>
          <form onSubmit={handleRegistrarVenta}>
            <div className="venta-rapida-form">
              <div className="form-row">
                <div className="form-col autocomplete-wrapper">
                  <label className="form-label">
                    Cliente (opcional)
                    <input
                      ref={clienteInputRef}
                      type="text"
                      className="form-control"
                      placeholder="Buscar clientes cargados"
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
                  </label>
                </div>

                <div className="form-col">
                  <label className="form-label">
                    $Total
                    <input
                      type="text"
                      name="total"
                      className="form-control"
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
                  </label>
                </div>

                <div className="form-col">
                  <label className="form-label">
                    Forma de Pago
                    <select
                      className="form-control"
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
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
                    $Pagado
                    <input
                      type="text"
                      name="monto_pagado"
                      className="form-control"
                      value={montoPagadoEditando ? montoPagadoValorRaw : formatearNumeroMoneda(montoPagado)}
                      onChange={(e) => {
                        const valor = e.target.value
                        // Permitir números, puntos, comas y símbolo $
                        if (/^[\d.,$]*$/.test(valor) || valor === '') {
                          setMontoPagadoEditando(true)
                          setMontoPagadoManual(true)
                          setMontoPagadoValorRaw(valor)
                          // Actualizar el estado montoPagado con el valor parseado
                          const valorParseado = parsearMoneda(valor)
                          setMontoPagado(valorParseado)
                        }
                      }}
                      onFocus={(e) => {
                        setMontoPagadoEditando(true)
                        setMontoPagadoManual(true)
                        // Mostrar el valor sin formato cuando se enfoca
                        const valorSinFormato = parsearMoneda(e.target.value)
                        setMontoPagadoValorRaw(valorSinFormato)
                      }}
                      onBlur={(e) => {
                        const valor = parsearMoneda(e.target.value)
                        setMontoPagado(valor)
                        setMontoPagadoEditando(false)
                        setMontoPagadoValorRaw('')
                        // NO resetear montoPagadoManual aquí - mantenerlo en true para respetar el valor manual
                        // montoPagadoManual se reseteará solo cuando el usuario cambie $Total y quiera sincronizar
                      }}
                      placeholder="$0,00"
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                  disabled={saving || !estadoCaja?.cajaAbierta}
                >
                  Registrar Venta
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Tabla de Registros de Ventas Rápidas */}
        <Card style={{ marginTop: '1.5rem' }}>
          <h2>Registros de Ventas Rápidas</h2>
          
          {/* Filtros de fecha */}
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="filtro-automatico"
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
                    <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      Fecha Desde
                      <input
                        type="date"
                        className="form-control"
                        value={filtroFechaDesde}
                        onChange={(e) => setFiltroFechaDesde(e.target.value)}
                        style={{ fontSize: '0.9rem' }}
                      />
                    </label>
                  </div>
                  
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      Fecha Hasta
                      <input
                        type="date"
                        className="form-control"
                        value={filtroFechaHasta}
                        onChange={(e) => setFiltroFechaHasta(e.target.value)}
                        style={{ fontSize: '0.9rem' }}
                      />
                    </label>
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
                    <th>$Total</th>
                    <th>Forma de Pago</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasRapidas.map((venta) => (
                    <tr key={venta.id}>
                      <td>{formatearFechaHora(venta.fecha_hora)}</td>
                      <td>{formatearMoneda(venta.total)}</td>
                      <td>{venta.metodo_pago}</td>
                      <td>
                        <Badge variant={venta.estado === 'PAGADO' ? 'success' : 'warning'}>
                          {venta.estado}
                        </Badge>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/ventas-rapidas/${venta.id}`}>
                            <Button variant="ghost" size="sm" title="Ver detalle">
                              <i className="bi bi-eye" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Imprimir Ticket"
                            onClick={() => navigate(`/ventas-rapidas/${venta.id}`, { state: { print: true } })}
                          >
                            <i className="bi bi-printer" />
                          </Button>
                        </div>
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
            <label className="form-label">
              Fecha y Hora (Automático)
              <input
                type="text"
                className="form-control"
                value={formatDateTime(new Date().toISOString(), dateFormat, timezone)}
                disabled
              />
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">
              Usuario (Automático)
              <input
                type="text"
                className="form-control"
                value={user?.nombre || '-'}
                disabled
              />
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">
              Caja efectivo ($)
              <input
                type="text"
                className="form-control"
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
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">
              Caja virtual ($) — QR, transferencia, débito
              <input
                type="text"
                className="form-control"
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
            </label>
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
                <label className="form-label">
                  Caja crédito ($)
                  <input
                    type="text"
                    className="form-control"
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
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Caja otros métodos ($) — cheque, otro
                  <input
                    type="text"
                    className="form-control"
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
                </label>
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label">
              Observaciones (opcional)
              <textarea
                className="form-control"
                rows="3"
                value={observacionesApertura}
                onChange={(e) => setObservacionesApertura(e.target.value)}
              />
            </label>
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
              <label className="form-label">
                Observaciones (opcional)
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Ingresá observaciones sobre el cierre de caja..."
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                />
              </label>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}

export default VentasRapidas

