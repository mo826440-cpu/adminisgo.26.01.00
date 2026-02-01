// Página de Dashboard
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuthContext } from '../../context/AuthContext'
import { useDateTime } from '../../context/DateTimeContext'
import { Layout } from '../../components/layout'
import { Card, Spinner, Badge, Button } from '../../components/common'
import { usePWAInstall } from '../../hooks/usePWAInstall'
import { formatDateTime } from '../../utils/dateFormat'
import { getEstadoSuscripcion } from '../../services/planes'
import { getVentasPorRangoFechas } from '../../services/ventas'
import { getComprasPorRangoFechas } from '../../services/compras'
import { getProductos } from '../../services/productos'
import { getClientesPorRangoFechas } from '../../services/clientes'
import { getCategorias } from '../../services/categorias'
import { getMarcas } from '../../services/marcas'
import { getClientes } from '../../services/clientes'
import { getProveedores } from '../../services/proveedores'
import { TABLAS_CONFIG, TABLAS_IDS_CHART, METODOS_PAGO } from './chartConfig'
import './Dashboard.css'

const formatearMoneda = (valor) => {
  const num = parseFloat(valor)
  if (isNaN(num)) return '$0,00'
  return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getDefaultRango() {
  const hoy = new Date()
  const desde = new Date(hoy)
  desde.setDate(desde.getDate() - 6)
  return {
    desde: desde.toISOString().slice(0, 10),
    hasta: hoy.toISOString().slice(0, 10)
  }
}

function Dashboard() {
  const { user, loading } = useAuthContext()
  const { isInstallable, isInstalled, install } = usePWAInstall()
  const { currentDateTime, timezone, dateFormat } = useDateTime()
  const [suscripcion, setSuscripcion] = useState(null)
  const [loadingSuscripcion, setLoadingSuscripcion] = useState(true)
  const [chartData, setChartData] = useState([])
  const [loadingChart, setLoadingChart] = useState(true)
  const [verticalChartCollapsed, setVerticalChartCollapsed] = useState(true)

  // Gráfico horizontal: Referencia, tabla, fechas (7 días por defecto), etiquetas, rango eje X
  const REFERENCIAS_H = [
    { id: 'categoria', label: 'Categorías' },
    { id: 'marca', label: 'Marcas' },
    { id: 'cliente', label: 'Clientes' },
    { id: 'proveedor', label: 'Proveedores' },
    { id: 'producto', label: 'Productos' }
  ]
  const getDefaultRango7Dias = () => {
    const hoy = new Date()
    const desde = new Date(hoy)
    desde.setDate(desde.getDate() - 6)
    return { desde: desde.toISOString().slice(0, 10), hasta: hoy.toISOString().slice(0, 10) }
  }
  const [refHorizontal, setRefHorizontal] = useState('categoria')
  const [tablaHorizontal, setTablaHorizontal] = useState('ventas')
  const [fechaDesdeH, setFechaDesdeH] = useState(() => getDefaultRango7Dias().desde)
  const [fechaHastaH, setFechaHastaH] = useState(() => getDefaultRango7Dias().hasta)
  const [etiquetasHorizontal, setEtiquetasHorizontal] = useState(['fechaRango', 'total'])
  const [rangoEjeXHorizontal, setRangoEjeXHorizontal] = useState(10000)
  const [chartDataHorizontal, setChartDataHorizontal] = useState([])
  const [loadingChartHorizontal, setLoadingChartHorizontal] = useState(false)

  // Estado del gráfico (valores por defecto según pedido)
  const [tabla, setTabla] = useState('ventas')
  const [fechaDesde, setFechaDesde] = useState(() => getDefaultRango().desde)
  const [fechaHasta, setFechaHasta] = useState(() => getDefaultRango().hasta)
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState(['fechaRango', 'total', 'cantidad'])
  const [ejeX, setEjeX] = useState('fecha')
  const [rangoEjeX, setRangoEjeX] = useState(1)
  const [ejeY, setEjeY] = useState('total')
  const [rangoEjeY, setRangoEjeY] = useState(10000)

  // Filtros (según tabla)
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroMarca, setFiltroMarca] = useState('')
  const [filtroProducto, setFiltroProducto] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroProveedor, setFiltroProveedor] = useState('')
  const [filtroMetodoPago, setFiltroMetodoPago] = useState('')

  // Opciones para los filtros (cargadas una vez)
  const [opcionesCategorias, setOpcionesCategorias] = useState([])
  const [opcionesMarcas, setOpcionesMarcas] = useState([])
  const [opcionesProductos, setOpcionesProductos] = useState([])
  const [opcionesClientes, setOpcionesClientes] = useState([])
  const [opcionesProveedores, setOpcionesProveedores] = useState([])

  const configTabla = TABLAS_CONFIG[tabla] || TABLAS_CONFIG.ventas
  const labelOptions = configTabla.labelOptions || []
  const axisOptionsX = configTabla.axisOptionsX || configTabla.axisOptions || []
  const axisOptionsY = configTabla.axisOptionsY || configTabla.axisOptions || []
  const axisOptions = configTabla.axisOptions || []
  const filtersTabla = configTabla.filters || []
  const usaFechas = configTabla.usaFechas !== false

  // Si la tabla actual no está en las opciones del gráfico (solo ventas/compras), usar ventas
  useEffect(() => {
    if (!TABLAS_IDS_CHART.includes(tabla)) setTabla('ventas')
  }, [tabla])

  // Sincronizar ejes/etiquetas al cambiar tabla (mantener solo opciones válidas)
  useEffect(() => {
    const idsX = axisOptionsX.map((o) => o.id)
    const idsY = axisOptionsY.map((o) => o.id)
    if (idsX.length && !idsX.includes(ejeX)) setEjeX(idsX[0])
    if (idsY.length && !idsY.includes(ejeY)) setEjeY(idsY[idsY.length > 1 ? 1 : 0])
    const labelIds = labelOptions.map((o) => o.id)
    const defaultLabelIds = labelOptions.filter((o) => o.defaultSelected).map((o) => o.id)
    setEtiquetasSeleccionadas((prev) => {
      const next = prev.filter((id) => labelIds.includes(id))
      if (next.length) return next
      if (defaultLabelIds.length) return defaultLabelIds
      if (labelIds.includes('cantidad') && labelIds.includes('total')) return ['cantidad', 'total']
      return labelIds.slice(0, 2)
    })
  }, [tabla])

  // Cargar estado de suscripción
  useEffect(() => {
    const cargarSuscripcion = async () => {
      if (!user) return
      setLoadingSuscripcion(true)
      try {
        const { data, error } = await getEstadoSuscripcion()
        if (error) console.error('Error al obtener suscripción:', error)
        else setSuscripcion(data)
      } catch (err) {
        console.error('Error al cargar suscripción:', err)
      } finally {
        setLoadingSuscripcion(false)
      }
    }
    if (!loading && user) cargarSuscripcion()
  }, [user, loading])

  // Cargar opciones para filtros (categorías, marcas, productos, clientes, proveedores)
  useEffect(() => {
    const cargarOpciones = async () => {
      if (!user) return
      try {
        const [cat, mar, prod, cli, prov] = await Promise.all([
          getCategorias(),
          getMarcas(),
          getProductos(),
          getClientes(),
          getProveedores()
        ])
        setOpcionesCategorias(cat.data || [])
        setOpcionesMarcas(mar.data || [])
        setOpcionesProductos(prod.data || [])
        setOpcionesClientes(cli.data || [])
        setOpcionesProveedores(prov.data || [])
      } catch (err) {
        console.error('Error al cargar opciones de filtros:', err)
      }
    }
    if (!loading && user) cargarOpciones()
  }, [user, loading])

  // Unificar arrays/Set de etiquetas al fusionar buckets
  const mergeLabelSets = (bucket, porDia, chunk, field) => {
    const out = new Set()
    chunk.forEach((k) => {
      const d = porDia[k]
      const arr = d?.[field]
      if (Array.isArray(arr)) arr.forEach((x) => out.add(x))
      else if (arr instanceof Set) arr.forEach((x) => out.add(x))
    })
    return out.size ? Array.from(out) : []
  }

  // Agregar por buckets de N días (rangoEjeX)
  const agregarPorFechas = useCallback(
    (porDia, rangoDias) => {
      const fechas = Object.keys(porDia).sort()
      if (fechas.length === 0) return []
      const buckets = []
      const labelFields = ['categorias', 'marcas', 'productos', 'clientes', 'proveedores', 'metodosPago']
      for (let i = 0; i < fechas.length; i += rangoDias) {
        const chunk = fechas.slice(i, i + rangoDias)
        const first = porDia[chunk[0]]
        const label =
          rangoDias === 1
            ? first.labelFecha
            : `${porDia[chunk[0]].labelFecha} - ${porDia[chunk[chunk.length - 1]].labelFecha}`
        const bucket = {
          key: chunk[0],
          labelFecha: label,
          total: 0,
          unidades: 0,
          cantidad: 0
        }
        chunk.forEach((k) => {
          const d = porDia[k]
          if (d) {
            bucket.total += d.total || 0
            bucket.unidades += d.unidades || 0
            bucket.cantidad += d.cantidad || 0
          }
        })
        labelFields.forEach((field) => {
          const merged = mergeLabelSets(bucket, porDia, chunk, field)
          if (merged.length) bucket[field] = merged
        })
        buckets.push(bucket)
      }
      return buckets
    },
    []
  )

  const cargarGrafico = useCallback(async () => {
    if (!user) return
    setLoadingChart(true)
    try {
      const desde = new Date(fechaDesde)
      const hasta = new Date(fechaHasta)
      if (usaFechas && desde > hasta) {
        setChartData([])
        setLoadingChart(false)
        return
      }

      if (tabla === 'ventas') {
        const { data: lista } = await getVentasPorRangoFechas(desde, hasta)
        let ventas = lista || []
        if (filtroCliente) ventas = ventas.filter((v) => String(v.cliente_id || '') === filtroCliente)
        if (filtroProducto) ventas = ventas.filter((v) => (v.venta_items || []).some((item) => item.producto_id == filtroProducto))
        if (filtroCategoria) ventas = ventas.filter((v) => (v.venta_items || []).some((item) => opcionesProductos.find((p) => p.id === item.producto_id)?.categoria_id == filtroCategoria))
        if (filtroMarca) ventas = ventas.filter((v) => (v.venta_items || []).some((item) => opcionesProductos.find((p) => p.id === item.producto_id)?.marca_id == filtroMarca))
        if (filtroMetodoPago) {
          const metodoNorm = String(filtroMetodoPago).trim().toLowerCase()
          ventas = ventas.filter((v) => (v.venta_pagos || []).some((p) => String(p.metodo_pago || '').trim().toLowerCase() === metodoNorm))
        }
        if (ejeX === 'estado') {
          const porEstado = {}
          ventas.forEach((v) => {
            const totalVenta = parseFloat(v.total) || 0
            const pagado = parseFloat(v.monto_pagado) || 0
            const deuda = parseFloat(v.monto_deuda) || 0
            const key = totalVenta <= 0 || pagado >= totalVenta ? 'pagado' : 'debe'
            const label = key === 'pagado' ? 'Pagado' : 'Debe'
            if (!porEstado[key]) porEstado[key] = { key, labelFecha: label, total: 0, unidades: 0, cantidad: 0, categorias: new Set(), marcas: new Set(), productos: new Set(), clientes: new Set(), metodosPago: new Set() }
            porEstado[key].total += key === 'debe' ? deuda : totalVenta
            porEstado[key].unidades += parseFloat(v.unidades_totales) || 0
            porEstado[key].cantidad += 1
            ;(v.venta_items || []).forEach((item) => {
              const p = opcionesProductos.find((pr) => pr.id === item.producto_id)
              const cat = opcionesCategorias.find((c) => c.id === p?.categoria_id)
              if (cat?.nombre) porEstado[key].categorias.add(cat.nombre)
              const marca = opcionesMarcas.find((m) => m.id === p?.marca_id)
              if (marca?.nombre) porEstado[key].marcas.add(marca.nombre)
              if (p?.nombre) porEstado[key].productos.add(p.nombre)
            })
            const cli = opcionesClientes.find((c) => c.id === v.cliente_id)
            if (cli?.nombre) porEstado[key].clientes.add(cli.nombre)
            ;(v.venta_pagos || []).forEach((p) => { const mp = String(p.metodo_pago || '').trim(); if (mp) porEstado[key].metodosPago.add(mp) })
          })
          const orden = { pagado: 0, debe: 1 }
          const rows = Object.values(porEstado).sort((a, b) => (orden[a.key] ?? 2) - (orden[b.key] ?? 2))
          rows.forEach((r) => { r.categorias = Array.from(r.categorias); r.marcas = Array.from(r.marcas); r.productos = Array.from(r.productos); r.clientes = Array.from(r.clientes); r.metodosPago = Array.from(r.metodosPago) })
          setChartData(rows)
          return
        }
        const porDia = {}
        let d = new Date(desde)
        d.setHours(0, 0, 0, 0)
        const fin = new Date(hasta)
        fin.setHours(23, 59, 59, 999)
        while (d <= fin) {
          const key = d.toISOString().slice(0, 10)
          porDia[key] = {
            fecha: key,
            total: 0,
            unidades: 0,
            cantidad: 0,
            labelFecha: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            categorias: new Set(),
            marcas: new Set(),
            productos: new Set(),
            clientes: new Set(),
            metodosPago: new Set()
          }
          d.setDate(d.getDate() + 1)
        }
        ventas.forEach((v) => {
          const key = new Date(v.fecha_hora).toISOString().slice(0, 10)
          if (porDia[key]) {
            porDia[key].total += parseFloat(v.total) || 0
            porDia[key].unidades += parseFloat(v.unidades_totales) || 0
            porDia[key].cantidad += 1
            ;(v.venta_items || []).forEach((item) => {
              const p = opcionesProductos.find((pr) => pr.id === item.producto_id)
              const cat = opcionesCategorias.find((c) => c.id === p?.categoria_id)
              if (cat?.nombre) porDia[key].categorias.add(cat.nombre)
              const marca = opcionesMarcas.find((m) => m.id === p?.marca_id)
              if (marca?.nombre) porDia[key].marcas.add(marca.nombre)
              if (p?.nombre) porDia[key].productos.add(p.nombre)
            })
            const cli = opcionesClientes.find((c) => c.id === v.cliente_id)
            if (cli?.nombre) porDia[key].clientes.add(cli.nombre)
            ;(v.venta_pagos || []).forEach((p) => { const mp = String(p.metodo_pago || '').trim(); if (mp) porDia[key].metodosPago.add(mp) })
          }
        })
        const rangoDias = Math.max(1, parseInt(rangoEjeX, 10) || 1)
        const buckets = agregarPorFechas(porDia, rangoDias)
        setChartData(buckets)
        return
      }

      if (tabla === 'compras') {
        const { data: lista } = await getComprasPorRangoFechas(desde, hasta)
        let compras = lista || []
        if (filtroProveedor) compras = compras.filter((c) => String(c.proveedor_id || '') === filtroProveedor)
        if (filtroProducto) compras = compras.filter((c) => (c.compra_items || []).some((item) => item.producto_id == filtroProducto))
        if (filtroCategoria) compras = compras.filter((c) => (c.compra_items || []).some((item) => opcionesProductos.find((p) => p.id === item.producto_id)?.categoria_id == filtroCategoria))
        if (filtroMarca) compras = compras.filter((c) => (c.compra_items || []).some((item) => opcionesProductos.find((p) => p.id === item.producto_id)?.marca_id == filtroMarca))
        if (filtroMetodoPago) {
          const metodoNorm = String(filtroMetodoPago).trim().toLowerCase()
          compras = compras.filter((c) => (c.compra_pagos || []).some((p) => String(p.metodo_pago || '').trim().toLowerCase() === metodoNorm))
        }
        if (ejeX === 'estado') {
          const porEstado = {}
          compras.forEach((c) => {
            const totalCompra = parseFloat(c.total) || 0
            const pagado = parseFloat(c.monto_pagado) || 0
            const deuda = parseFloat(c.monto_deuda) || 0
            const key = totalCompra <= 0 || pagado >= totalCompra ? 'pagado' : 'debe'
            const label = key === 'pagado' ? 'Pagado' : 'Debe'
            if (!porEstado[key]) porEstado[key] = { key, labelFecha: label, total: 0, unidades: 0, cantidad: 0, categorias: new Set(), marcas: new Set(), productos: new Set(), proveedores: new Set(), metodosPago: new Set() }
            porEstado[key].total += key === 'debe' ? deuda : totalCompra
            porEstado[key].unidades += parseFloat(c.unidades_totales) || 0
            porEstado[key].cantidad += 1
            ;(c.compra_items || []).forEach((item) => {
              const p = opcionesProductos.find((pr) => pr.id === item.producto_id)
              const cat = opcionesCategorias.find((c2) => c2.id === p?.categoria_id)
              if (cat?.nombre) porEstado[key].categorias.add(cat.nombre)
              const marca = opcionesMarcas.find((m) => m.id === p?.marca_id)
              if (marca?.nombre) porEstado[key].marcas.add(marca.nombre)
              if (p?.nombre) porEstado[key].productos.add(p.nombre)
            })
            const prov = opcionesProveedores.find((p) => p.id === c.proveedor_id)
            if (prov?.nombre_razon_social) porEstado[key].proveedores.add(prov.nombre_razon_social)
            ;(c.compra_pagos || []).forEach((p) => { const mp = String(p.metodo_pago || '').trim(); if (mp) porEstado[key].metodosPago.add(mp) })
          })
          const orden = { pagado: 0, debe: 1 }
          const rows = Object.values(porEstado).sort((a, b) => (orden[a.key] ?? 2) - (orden[b.key] ?? 2))
          rows.forEach((r) => { r.categorias = Array.from(r.categorias); r.marcas = Array.from(r.marcas); r.productos = Array.from(r.productos); r.proveedores = Array.from(r.proveedores); r.metodosPago = Array.from(r.metodosPago) })
          setChartData(rows)
          return
        }
        const porDia = {}
        let d = new Date(desde)
        d.setHours(0, 0, 0, 0)
        const fin = new Date(hasta)
        fin.setHours(23, 59, 59, 999)
        while (d <= fin) {
          const key = d.toISOString().slice(0, 10)
          porDia[key] = {
            fecha: key,
            total: 0,
            unidades: 0,
            cantidad: 0,
            labelFecha: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            categorias: new Set(),
            marcas: new Set(),
            productos: new Set(),
            proveedores: new Set(),
            metodosPago: new Set()
          }
          d.setDate(d.getDate() + 1)
        }
        compras.forEach((c) => {
          const key = (c.fecha_orden || '').toString().slice(0, 10)
          if (porDia[key]) {
            porDia[key].total += parseFloat(c.total) || 0
            porDia[key].unidades += parseFloat(c.unidades_totales) || 0
            porDia[key].cantidad += 1
            ;(c.compra_items || []).forEach((item) => {
              const p = opcionesProductos.find((pr) => pr.id === item.producto_id)
              const cat = opcionesCategorias.find((c2) => c2.id === p?.categoria_id)
              if (cat?.nombre) porDia[key].categorias.add(cat.nombre)
              const marca = opcionesMarcas.find((m) => m.id === p?.marca_id)
              if (marca?.nombre) porDia[key].marcas.add(marca.nombre)
              if (p?.nombre) porDia[key].productos.add(p.nombre)
            })
            const prov = opcionesProveedores.find((p) => p.id === c.proveedor_id)
            if (prov?.nombre_razon_social) porDia[key].proveedores.add(prov.nombre_razon_social)
            ;(c.compra_pagos || []).forEach((p) => { const mp = String(p.metodo_pago || '').trim(); if (mp) porDia[key].metodosPago.add(mp) })
          }
        })
        const rangoDias = Math.max(1, parseInt(rangoEjeX, 10) || 1)
        const buckets = agregarPorFechas(porDia, rangoDias)
        setChartData(buckets)
        return
      }

      if (tabla === 'clientes') {
        const { data: lista } = await getClientesPorRangoFechas(desde, hasta)
        const clientes = lista || []
        const porDia = {}
        let d = new Date(desde)
        d.setHours(0, 0, 0, 0)
        const fin = new Date(hasta)
        fin.setHours(23, 59, 59, 999)
        while (d <= fin) {
          const key = d.toISOString().slice(0, 10)
          porDia[key] = {
            fecha: key,
            total: 0,
            unidades: 0,
            cantidad: 0,
            labelFecha: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
          }
          d.setDate(d.getDate() + 1)
        }
        clientes.forEach((c) => {
          const key = new Date(c.created_at).toISOString().slice(0, 10)
          if (porDia[key]) {
            porDia[key].cantidad += 1
          }
        })
        const rangoDias = Math.max(1, parseInt(rangoEjeX, 10) || 1)
        const buckets = agregarPorFechas(porDia, rangoDias)
        setChartData(buckets)
        return
      }

      if (tabla === 'productos') {
        const { data: productos } = await getProductos()
        let lista = productos || []
        if (filtroCategoria) lista = lista.filter((p) => String(p.categoria_id || '') === filtroCategoria)
        if (filtroMarca) lista = lista.filter((p) => String(p.marca_id || '') === filtroMarca)
        const agruparPor = ejeX === 'marca' ? 'marca_id' : 'categoria_id'
        const grupos = {}
        lista.forEach((p) => {
          const key = p[agruparPor] || 'sin'
          const nombre =
            agruparPor === 'categoria_id'
              ? (p.categorias?.nombre || 'Sin categoría')
              : (p.marcas?.nombre || 'Sin marca')
          if (!grupos[key]) {
            grupos[key] = { key, labelFecha: nombre, total: 0, unidades: 0, cantidad: 0, stock: 0 }
          }
          grupos[key].cantidad += 1
          grupos[key].stock += parseFloat(p.stock_actual) || 0
        })
        setChartData(Object.values(grupos).sort((a, b) => (a.labelFecha || '').localeCompare(b.labelFecha || '')))
      }
    } catch (err) {
      console.error('Error al cargar gráfico:', err)
      setChartData([])
    } finally {
      setLoadingChart(false)
    }
  }, [
    user,
    tabla,
    fechaDesde,
    fechaHasta,
    ejeX,
    rangoEjeX,
    usaFechas,
    agregarPorFechas,
    filtroCategoria,
    filtroMarca,
    filtroProducto,
    filtroCliente,
    filtroProveedor,
    filtroMetodoPago,
    opcionesProductos,
    opcionesCategorias,
    opcionesMarcas,
    opcionesClientes,
    opcionesProveedores
  ])

  useEffect(() => {
    if (!loading && user) cargarGrafico()
  }, [user, loading, cargarGrafico])

  // Cargar datos del gráfico horizontal (agrupar por referencia: categoría, marca, etc.)
  const cargarGraficoHorizontal = useCallback(async () => {
    if (!user) return
    setLoadingChartHorizontal(true)
    try {
      const desde = new Date(fechaDesdeH)
      const hasta = new Date(fechaHastaH)
      desde.setHours(0, 0, 0, 0)
      hasta.setHours(23, 59, 59, 999)
      const grupos = {}
      const getOrCreate = (key, label) => {
        if (!grupos[key]) grupos[key] = { key, label, total: 0, cantidad: 0, unidades: 0 }
        return grupos[key]
      }
      if (tablaHorizontal === 'ventas') {
        const { data: lista } = await getVentasPorRangoFechas(desde, hasta)
        const ventas = lista || []
        ventas.forEach((v) => {
          const total = parseFloat(v.total) || 0
          const unidades = parseFloat(v.unidades_totales) || 0
          if (refHorizontal === 'cliente') {
            const key = v.cliente_id || 'sin'
            const label = opcionesClientes.find((c) => c.id === key)?.nombre || 'Sin cliente'
            const g = getOrCreate(key, label)
            g.total += total
            g.cantidad += 1
            g.unidades += unidades
            return
          }
          if (refHorizontal === 'proveedor') return // ventas no tienen proveedor
          ;(v.venta_items || []).forEach((item) => {
            const p = opcionesProductos.find((pr) => pr.id === item.producto_id)
            const cant = parseFloat(item.cantidad) || 0
            if (refHorizontal === 'categoria') {
              const key = p?.categoria_id || 'sin'
              const label = opcionesCategorias.find((c) => c.id === key)?.nombre || 'Sin categoría'
              const g = getOrCreate(key, label)
              g.total += (item.precio_unitario != null ? parseFloat(item.precio_unitario) * cant : 0) || (total / Math.max(1, (v.venta_items || []).length))
              g.unidades += cant
              if (!g._counted) g._counted = new Set()
              if (!g._counted.has(v.id)) { g._counted.add(v.id); g.cantidad += 1 }
            } else if (refHorizontal === 'marca') {
              const key = p?.marca_id || 'sin'
              const label = opcionesMarcas.find((m) => m.id === key)?.nombre || 'Sin marca'
              const g = getOrCreate(key, label)
              g.total += (item.precio_unitario != null ? parseFloat(item.precio_unitario) * cant : 0) || (total / Math.max(1, (v.venta_items || []).length))
              g.unidades += cant
              if (!g._counted) g._counted = new Set()
              if (!g._counted.has(v.id)) { g._counted.add(v.id); g.cantidad += 1 }
            } else if (refHorizontal === 'producto') {
              const key = item.producto_id || 'sin'
              const label = p?.nombre || 'Sin producto'
              const g = getOrCreate(key, label)
              g.total += (item.precio_unitario != null ? parseFloat(item.precio_unitario) * cant : 0) || (total / Math.max(1, (v.venta_items || []).length))
              g.unidades += cant
              if (!g._counted) g._counted = new Set()
              if (!g._counted.has(v.id)) { g._counted.add(v.id); g.cantidad += 1 }
            }
          })
          if (refHorizontal === 'categoria' || refHorizontal === 'marca' || refHorizontal === 'producto') {
            // ya sumado por items; para cantidad por venta podemos repartir en el loop de items
          }
        })
        if (refHorizontal === 'categoria' || refHorizontal === 'marca' || refHorizontal === 'producto') {
          ventas.forEach((v) => {
            ;(v.venta_items || []).forEach((item) => {
              const p = opcionesProductos.find((pr) => pr.id === item.producto_id)
              let key, label
              if (refHorizontal === 'categoria') { key = p?.categoria_id || 'sin'; label = opcionesCategorias.find((c) => c.id === key)?.nombre || 'Sin categoría' }
              else if (refHorizontal === 'marca') { key = p?.marca_id || 'sin'; label = opcionesMarcas.find((m) => m.id === key)?.nombre || 'Sin marca' }
              else { key = item.producto_id || 'sin'; label = p?.nombre || 'Sin producto' }
              const g = grupos[key]
              if (g && g._counted) g.cantidad = Array.from(g._counted).length
            })
          })
        }
      } else {
        const { data: lista } = await getComprasPorRangoFechas(desde, hasta)
        const compras = lista || []
        compras.forEach((c) => {
          const total = parseFloat(c.total) || 0
          const unidades = parseFloat(c.unidades_totales) || 0
          if (refHorizontal === 'proveedor') {
            const key = c.proveedor_id || 'sin'
            const label = opcionesProveedores.find((p) => p.id === key)?.nombre_razon_social || 'Sin proveedor'
            const g = getOrCreate(key, label)
            g.total += total
            g.cantidad += 1
            g.unidades += unidades
            return
          }
          if (refHorizontal === 'cliente') return
          ;(c.compra_items || []).forEach((item) => {
            const p = opcionesProductos.find((pr) => pr.id === item.producto_id)
            const cant = parseFloat(item.cantidad_solicitada) || 0
            if (refHorizontal === 'categoria') {
              const key = p?.categoria_id || 'sin'
              const label = opcionesCategorias.find((c2) => c2.id === key)?.nombre || 'Sin categoría'
              const g = getOrCreate(key, label)
              g.total += total / Math.max(1, c.compra_items.length)
              g.unidades += cant
              if (!g._counted) g._counted = new Set()
              if (!g._counted.has(c.id)) { g._counted.add(c.id); g.cantidad += 1 }
            } else if (refHorizontal === 'marca') {
              const key = p?.marca_id || 'sin'
              const label = opcionesMarcas.find((m) => m.id === key)?.nombre || 'Sin marca'
              const g = getOrCreate(key, label)
              g.total += total / Math.max(1, c.compra_items.length)
              g.unidades += cant
              if (!g._counted) g._counted = new Set()
              if (!g._counted.has(c.id)) { g._counted.add(c.id); g.cantidad += 1 }
            } else if (refHorizontal === 'producto') {
              const key = item.producto_id || 'sin'
              const label = p?.nombre || 'Sin producto'
              const g = getOrCreate(key, label)
              g.total += total / Math.max(1, c.compra_items.length)
              g.unidades += cant
              if (!g._counted) g._counted = new Set()
              if (!g._counted.has(c.id)) { g._counted.add(c.id); g.cantidad += 1 }
            }
          })
        })
      }
      const rows = Object.values(grupos)
        .filter((g) => g.key && g.key !== 'sin')
        .map((g) => ({ key: g.key, label: g.label, total: g.total || 0, cantidad: (g._counted && g._counted.size) || g.cantidad || 0, unidades: g.unidades || 0 }))
        .sort((a, b) => (b.total || 0) - (a.total || 0))
      setChartDataHorizontal(rows)
    } catch (err) {
      console.error('Error al cargar gráfico horizontal:', err)
      setChartDataHorizontal([])
    } finally {
      setLoadingChartHorizontal(false)
    }
  }, [user, tablaHorizontal, refHorizontal, fechaDesdeH, fechaHastaH, opcionesCategorias, opcionesMarcas, opcionesProductos, opcionesClientes, opcionesProveedores])

  useEffect(() => {
    if (!loading && user) cargarGraficoHorizontal()
  }, [user, loading, cargarGraficoHorizontal])

  const handleAplicarFiltro = (e) => {
    e?.preventDefault()
    cargarGrafico()
  }

  const handleAplicarHorizontal = (e) => {
    e?.preventDefault()
    cargarGraficoHorizontal()
  }

  const toggleEtiquetaHorizontal = (id) => {
    setEtiquetasHorizontal((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const LABEL_OPTIONS_H = [
    { id: 'fechaRango', label: 'Fecha desde-hasta' },
    { id: 'total', label: '$ Total' },
    { id: 'cantidad', label: 'Cantidad operaciones' },
    { id: 'unidades', label: 'Unidades' }
  ]

  const maxEjeXHorizontal = useMemo(() => {
    const max = Math.max(0, ...chartDataHorizontal.map((r) => r.total || 0))
    const rango = parseFloat(rangoEjeXHorizontal) || 10000
    const base = Math.ceil(max / rango) * rango
    return (base <= max ? base + rango : base) || rango
  }, [chartDataHorizontal, rangoEjeXHorizontal])

  const formatLabelValorH = (row, id) => {
    if (id === 'fechaRango') return `${fechaDesdeH} — ${fechaHastaH}`
    if (id === 'total') return formatearMoneda(row.total)
    if (id === 'cantidad') return String(row.cantidad || 0)
    if (id === 'unidades') return Number(row.unidades || 0).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    return ''
  }

  const toggleEtiqueta = (id) => {
    setEtiquetasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // Valor a mostrar en el eje Y (altura de la barra)
  const getValorEjeY = (row) => {
    if (ejeY === 'total') return row.total || 0
    if (ejeY === 'unidades') return row.unidades || 0
    if (ejeY === 'cantidad') return row.cantidad || 0
    if (ejeY === 'stock') return row.stock != null ? row.stock : 0
    return row.total || 0
  }

  const maxValor = useMemo(() => Math.max(0, ...chartData.map(getValorEjeY)), [chartData, ejeY])
  const rangoYNum = parseFloat(rangoEjeY) || 10000
  // Eje Y: máximo = valor máximo de datos + un rango más (ej. máx $50.000 + rango $5.000 → eje hasta $55.000)
  // Para unidades/cantidad/stock con valores pequeños usar escala entera (1, 2, 3...)
  const maxEjeY = useMemo(() => {
    if (ejeY === 'total') {
      const base = Math.ceil(maxValor / rangoYNum) * rangoYNum
      return (base <= maxValor ? base + rangoYNum : base) || rangoYNum
    }
    if (ejeY === 'unidades') {
      if (maxValor <= 0) return 1
      if (maxValor <= 100) return Math.ceil(maxValor) + 1
      return Math.ceil(maxValor / rangoYNum) * rangoYNum + rangoYNum
    }
    if (ejeY === 'cantidad' || ejeY === 'stock') {
      return Math.max(1, Math.ceil(maxValor)) + 1
    }
    return Math.max(1, Math.ceil(maxValor))
  }, [maxValor, rangoYNum, ejeY])
  const pasosEjeY = useMemo(() => {
    const isMoneda = ejeY === 'total' || (ejeY === 'unidades' && maxValor > 100)
    const step = isMoneda ? rangoYNum : 1
    const n = Math.ceil(maxEjeY / step)
    return Array.from({ length: n + 1 }, (_, i) => i * step).filter((v) => v <= maxEjeY)
  }, [maxEjeY, rangoYNum, ejeY, maxValor])

  const getNombrePlan = (tipo) => {
    const nombres = { gratis: 'Plan Gratuito', pago: 'Plan Pago', basico: 'Plan Pago', personalizado: 'Plan Personalizado' }
    return nombres[tipo] || tipo || 'Sin plan'
  }
  const getColorPlan = (tipo) => {
    const colores = { gratis: 'info', pago: 'primary', basico: 'primary', personalizado: 'warning' }
    return colores[tipo] || 'secondary'
  }

  const formatLabelValor = (row, id) => {
    if (id === 'fechaRango') return `${fechaDesde} — ${fechaHasta}`
    if (id === 'total') return formatearMoneda(row.total)
    if (id === 'unidades') return Number(row.unidades || 0).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    if (id === 'cantidad') return String(row.cantidad || 0)
    if (id === 'stock') return String(row.stock != null ? row.stock : 0)
    if (id === 'categoria') return (row.categorias && row.categorias.length) ? row.categorias.join(', ') : '—'
    if (id === 'marca') return (row.marcas && row.marcas.length) ? row.marcas.join(', ') : '—'
    if (id === 'producto') return (row.productos && row.productos.length) ? row.productos.join(', ') : '—'
    if (id === 'cliente') return (row.clientes && row.clientes.length) ? row.clientes.join(', ') : (row.proveedores && row.proveedores.length) ? row.proveedores.join(', ') : '—'
    if (id === 'metodoPago') return (row.metodosPago && row.metodosPago.length) ? row.metodosPago.join(', ') : '—'
    return ''
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p className="text-secondary">Bienvenido, {user?.email}</p>
            <div className="dashboard-clock">
              <span className="clock-label">Fecha y Hora:</span>
              <span className="clock-time">{formatDateTime(currentDateTime, dateFormat, timezone)}</span>
            </div>
            {!loadingSuscripcion && suscripcion?.plan && (
              <div style={{ marginTop: '0.5rem' }}>
                <Badge variant={getColorPlan(suscripcion.plan.tipo)}>📦 {getNombrePlan(suscripcion.plan.tipo)}</Badge>
                {suscripcion.periodo_gratis?.activo && suscripcion.periodo_gratis.dias_restantes !== null && (
                  <Badge variant="success" style={{ marginLeft: '0.5rem' }}>
                    ⏰ Período gratis: {suscripcion.periodo_gratis.dias_restantes} días restantes
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {isInstallable && !isInstalled && (
              <Button onClick={install} variant="primary" className="install-pwa-btn">
                📱 Instalar App
              </Button>
            )}
            {isInstalled && <Badge variant="success">App instalada</Badge>}
          </div>
        </div>

        <div className="dashboard-chart-vertical-wrapper">
          <button
            type="button"
            className="dashboard-chart-toggle"
            onClick={() => setVerticalChartCollapsed((c) => !c)}
            aria-expanded={!verticalChartCollapsed}
          >
            <span className="dashboard-chart-toggle-title">Gráfico de Barras Verticales (para análisis de ventas y compras)</span>
            <span className="dashboard-chart-toggle-icon" aria-hidden>{verticalChartCollapsed ? '▶' : '▼'}</span>
          </button>
          {!verticalChartCollapsed && (
        <Card className="dashboard-card dashboard-chart-card">
          <div className="chart-config">
            <div className="chart-config-row">
              <label className="chart-config-label">Tabla a analizar:</label>
              <select
                className="chart-config-input chart-config-select"
                value={tabla}
                onChange={(e) => setTabla(e.target.value)}
                aria-label="Tabla a analizar"
              >
                {TABLAS_IDS_CHART.map((id) => (
                  <option key={id} value={id}>
                    {TABLAS_CONFIG[id].label}
                  </option>
                ))}
              </select>
            </div>

            {usaFechas && (
              <div className="chart-config-row chart-config-fechas">
                <div>
                  <label className="chart-config-label">Filtrar desde:</label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="chart-config-date"
                    aria-label="Fecha desde"
                  />
                </div>
                <div>
                  <label className="chart-config-label">Hasta:</label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="chart-config-date"
                    aria-label="Fecha hasta"
                  />
                </div>
              </div>
            )}

            {filtersTabla.length > 0 && (
              <div className="chart-config-row chart-config-filtros">
                {filtersTabla.includes('categoria') && (
                  <div className="chart-config-filtro">
                    <label className="chart-config-label">Categoría:</label>
                    <select
                      className="chart-config-input chart-config-select chart-config-filtro-select"
                      value={filtroCategoria}
                      onChange={(e) => setFiltroCategoria(e.target.value)}
                      aria-label="Filtrar por categoría"
                    >
                      <option value="">Todos</option>
                      {opcionesCategorias.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
                {filtersTabla.includes('marca') && (
                  <div className="chart-config-filtro">
                    <label className="chart-config-label">Marca:</label>
                    <select
                      className="chart-config-input chart-config-select chart-config-filtro-select"
                      value={filtroMarca}
                      onChange={(e) => setFiltroMarca(e.target.value)}
                      aria-label="Filtrar por marca"
                    >
                      <option value="">Todos</option>
                      {opcionesMarcas.map((m) => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
                {filtersTabla.includes('producto') && (
                  <div className="chart-config-filtro">
                    <label className="chart-config-label">Producto:</label>
                    <select
                      className="chart-config-input chart-config-select chart-config-filtro-select"
                      value={filtroProducto}
                      onChange={(e) => setFiltroProducto(e.target.value)}
                      aria-label="Filtrar por producto"
                    >
                      <option value="">Todos</option>
                      {opcionesProductos.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
                {filtersTabla.includes('cliente') && (
                  <div className="chart-config-filtro">
                    <label className="chart-config-label">Cliente:</label>
                    <select
                      className="chart-config-input chart-config-select chart-config-filtro-select"
                      value={filtroCliente}
                      onChange={(e) => setFiltroCliente(e.target.value)}
                      aria-label="Filtrar por cliente"
                    >
                      <option value="">Todos</option>
                      {opcionesClientes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
                {filtersTabla.includes('proveedor') && (
                  <div className="chart-config-filtro">
                    <label className="chart-config-label">Proveedor:</label>
                    <select
                      className="chart-config-input chart-config-select chart-config-filtro-select"
                      value={filtroProveedor}
                      onChange={(e) => setFiltroProveedor(e.target.value)}
                      aria-label="Filtrar por proveedor"
                    >
                      <option value="">Todos</option>
                      {opcionesProveedores.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre_razon_social}</option>
                      ))}
                    </select>
                  </div>
                )}
                {filtersTabla.includes('metodoPago') && (
                  <div className="chart-config-filtro">
                    <label className="chart-config-label">Métodos de pago:</label>
                    <select
                      className="chart-config-input chart-config-select chart-config-filtro-select"
                      value={filtroMetodoPago}
                      onChange={(e) => setFiltroMetodoPago(e.target.value)}
                      aria-label="Filtrar por método de pago"
                    >
                      <option value="">Todos</option>
                      {METODOS_PAGO.map((mp) => (
                        <option key={mp} value={mp}>{mp}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="chart-config-row">
              <label className="chart-config-label">Información en etiquetas:</label>
              <div className="chart-config-checkboxes">
                {labelOptions.map((opt) => (
                  <label key={opt.id} className="chart-config-checkbox-label">
                    <input
                      type="checkbox"
                      checked={etiquetasSeleccionadas.includes(opt.id)}
                      onChange={() => toggleEtiqueta(opt.id)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="chart-config-row chart-config-ejes">
              <div className="chart-config-eje">
                <label className="chart-config-label">Eje (X):</label>
                <select
                  className="chart-config-input chart-config-select"
                  value={ejeX}
                  onChange={(e) => setEjeX(e.target.value)}
                  aria-label="Eje X"
                >
                  {axisOptionsX.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {axisOptionsX.find((o) => o.id === ejeX)?.rangeType && (
                  <>
                    <label className="chart-config-label chart-config-rango-label">Rango eje (X):</label>
                    <input
                      type="number"
                      min="1"
                      step={axisOptionsX.find((o) => o.id === ejeX)?.rangeType === 'moneda' ? 1000 : 1}
                      value={rangoEjeX}
                      onChange={(e) => setRangoEjeX(parseFloat(e.target.value) || 1)}
                      className="chart-config-input chart-config-rango"
                      placeholder={axisOptionsX.find((o) => o.id === ejeX)?.rangePlaceholder}
                    />
                  </>
                )}
              </div>
              <div className="chart-config-eje">
                <label className="chart-config-label">Eje (Y):</label>
                <select
                  className="chart-config-input chart-config-select"
                  value={ejeY}
                  onChange={(e) => setEjeY(e.target.value)}
                  aria-label="Eje Y"
                >
                  {axisOptionsY.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {axisOptionsY.find((o) => o.id === ejeY)?.rangeType && (
                  <>
                    <label className="chart-config-label chart-config-rango-label">Rango eje (Y):</label>
                    <input
                      type="number"
                      min="1"
                      step={axisOptionsY.find((o) => o.id === ejeY)?.rangeType === 'moneda' ? 1000 : 1}
                      value={rangoEjeY}
                      onChange={(e) => setRangoEjeY(parseFloat(e.target.value) || 10000)}
                      className="chart-config-input chart-config-rango"
                      placeholder={axisOptionsY.find((o) => o.id === ejeY)?.rangePlaceholder}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="chart-config-row">
              <Button type="button" variant="primary" size="sm" onClick={handleAplicarFiltro}>
                Aplicar
              </Button>
            </div>
          </div>

          {loadingChart ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <Spinner size="md" />
            </div>
          ) : (
            <div className="chart-vertical-wrap">
              <div className="chart-vertical-y-axis">
                <span className="chart-vertical-y-title">Eje (Y)</span>
                <div className="chart-vertical-y-ticks">
                  {pasosEjeY.map((v) => (
                    <span key={v} className="chart-vertical-y-tick">
                      {ejeY === 'total' || (ejeY === 'unidades' && maxValor > 100) ? (v === 0 ? '$-' : formatearMoneda(v)) : v}
                    </span>
                  ))}
                </div>
              </div>
              <div className="chart-vertical-content">
                <div className="chart-vertical-bars">
                  {chartData.map((row) => {
                    const valor = getValorEjeY(row)
                    const pct = maxEjeY ? (valor / maxEjeY) * 100 : 0
                    const tooltipText = [row.labelFecha, ...etiquetasSeleccionadas.map((id) => `${labelOptions.find((o) => o.id === id)?.label || id}: ${formatLabelValor(row, id)}`)].join(' — ')
                    return (
                      <div key={row.key || row.labelFecha} className="chart-vertical-bar-wrap">
                        <div className="chart-vertical-bar-container" title={tooltipText}>
                          <div className="chart-vertical-bar-tooltip" role="tooltip">
                            <span className="chart-vertical-bar-tooltip-title">{row.labelFecha}</span>
                            {etiquetasSeleccionadas.map((id) => (
                              <span key={id} className="chart-vertical-bar-tooltip-line">
                                {labelOptions.find((o) => o.id === id)?.label || id}: {formatLabelValor(row, id)}
                              </span>
                            ))}
                          </div>
                          <div
                            className="chart-vertical-bar"
                            style={{ height: `${pct}%` }}
                          />
                        </div>
                        <span className="chart-vertical-x-label">{row.labelFecha}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="chart-vertical-x-axis">
                  <span className="chart-vertical-x-title">Eje (X)</span>
                </div>
              </div>
            </div>
          )}
        </Card>
          )}
        </div>

        {/* Gráfico de barras horizontales */}
        <Card title="Gráfico de Barras Horizontales" className="dashboard-card dashboard-chart-card">
          <div className="chart-config">
            <div className="chart-config-row">
              <label className="chart-config-label">Referencia:</label>
              <select
                className="chart-config-input chart-config-select"
                value={refHorizontal}
                onChange={(e) => setRefHorizontal(e.target.value)}
                aria-label="Referencia"
              >
                {REFERENCIAS_H.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="chart-config-row">
              <label className="chart-config-label">Tabla a analizar:</label>
              <select
                className="chart-config-input chart-config-select"
                value={tablaHorizontal}
                onChange={(e) => setTablaHorizontal(e.target.value)}
                aria-label="Tabla a analizar"
              >
                <option value="ventas">Registro de ventas</option>
                <option value="compras">Registro de compras</option>
              </select>
            </div>
            <div className="chart-config-row chart-config-fechas">
              <div>
                <label className="chart-config-label">Filtrar desde:</label>
                <input
                  type="date"
                  value={fechaDesdeH}
                  onChange={(e) => setFechaDesdeH(e.target.value)}
                  className="chart-config-date"
                  aria-label="Fecha desde"
                />
              </div>
              <div>
                <label className="chart-config-label">Hasta:</label>
                <input
                  type="date"
                  value={fechaHastaH}
                  onChange={(e) => setFechaHastaH(e.target.value)}
                  className="chart-config-date"
                  aria-label="Fecha hasta"
                />
              </div>
            </div>
            <div className="chart-config-row">
              <label className="chart-config-label">Información en etiquetas:</label>
              <div className="chart-config-checkboxes">
                {LABEL_OPTIONS_H.map((opt) => (
                  <label key={opt.id} className="chart-config-checkbox-label">
                    <input
                      type="checkbox"
                      checked={etiquetasHorizontal.includes(opt.id)}
                      onChange={() => toggleEtiquetaHorizontal(opt.id)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="chart-config-row chart-config-ejes">
              <div className="chart-config-eje">
                <label className="chart-config-label">Eje (Y):</label>
                <span className="chart-config-readonly">{REFERENCIAS_H.find((o) => o.id === refHorizontal)?.label || refHorizontal}</span>
              </div>
              <div className="chart-config-eje">
                <label className="chart-config-label">Eje (X):</label>
                <span className="chart-config-readonly">$ Total</span>
              </div>
              <div className="chart-config-eje">
                <label className="chart-config-label chart-config-rango-label">Rango eje (X):</label>
                <input
                  type="number"
                  min="1000"
                  step={1000}
                  value={rangoEjeXHorizontal}
                  onChange={(e) => setRangoEjeXHorizontal(parseFloat(e.target.value) || 10000)}
                  className="chart-config-input chart-config-rango"
                  placeholder="10000"
                />
              </div>
            </div>
            <div className="chart-config-row">
              <Button type="button" variant="primary" size="sm" onClick={handleAplicarHorizontal}>
                Aplicar
              </Button>
            </div>
          </div>

          {loadingChartHorizontal ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <Spinner size="md" />
            </div>
          ) : (
            <div className="chart-horizontal-wrap">
              <div className="chart-horizontal-x-axis">
                <span className="chart-horizontal-x-title">Eje (X) $ Total</span>
              </div>
              <div className="chart-horizontal-content chart-horizontal-bars-layout">
                {chartDataHorizontal.map((row) => {
                  const valor = row.total || 0
                  const pct = maxEjeXHorizontal ? (valor / maxEjeXHorizontal) * 100 : 0
                  const tooltipText = [row.label, ...etiquetasHorizontal.map((id) => `${LABEL_OPTIONS_H.find((o) => o.id === id)?.label || id}: ${formatLabelValorH(row, id)}`)].join(' — ')
                  return (
                    <div key={row.key} className="chart-horizontal-bar-row">
                      <span className="chart-horizontal-y-label-text" title={row.label}>{row.label}</span>
                      <div className="chart-horizontal-bar-cell-inner">
                        <div
                          className="chart-horizontal-bar-fill"
                          style={{ width: `${pct}%` }}
                          title={tooltipText}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="chart-horizontal-x-ticks">
                <span>$-</span>
                <span>{formatearMoneda(maxEjeXHorizontal)}</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}

export default Dashboard
