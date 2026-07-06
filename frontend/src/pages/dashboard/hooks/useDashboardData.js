import { useState, useEffect, useCallback, useMemo } from 'react'
import { getVentasPorRangoFechas } from '../../../services/ventas'
import { getComprasPorRangoFechas } from '../../../services/compras'
import { getProductos } from '../../../services/productos'
import { getClientes, getClientesPorRangoFechas } from '../../../services/clientes'
import { getProveedores } from '../../../services/proveedores'
import { getCategorias } from '../../../services/categorias'
import { getMarcas } from '../../../services/marcas'
import { DEFAULT_FILTERS, filterVentas, filterCompras, filterProductos } from '../utils/dashboardFilters'
import { getDefaultDateRange, getPreviousPeriod, resolveFilterDates } from '../utils/dashboardFormat'
import {
  buildKpis,
  buildEvolutionSeries,
  buildPaymentDonut,
  buildCategoryDonut,
  buildTopProducts,
  buildTopClientes,
  buildTopProveedores,
  buildVentaEstados,
  buildCompraEstados,
  buildStockIndicators,
  buildAlerts,
  buildLatestVentas,
  buildLatestCompras,
  buildFeaturedProducts,
  buildComparisons,
} from '../utils/dashboardCalculations'

function dateRangeBounds(desdeStr, hastaStr) {
  const desde = new Date(desdeStr)
  const hasta = new Date(hastaStr)
  desde.setHours(0, 0, 0, 0)
  hasta.setHours(23, 59, 59, 999)
  return { desde, hasta }
}

export function useDashboardData(user, authLoading) {
  const defaults = getDefaultDateRange(6)
  const [draftFilters, setDraftFilters] = useState({ ...DEFAULT_FILTERS, ...defaults })
  const [appliedFilters, setAppliedFilters] = useState({ ...DEFAULT_FILTERS, ...defaults })
  const [evolutionMetric, setEvolutionMetric] = useState('ventas')
  const [evolutionGranularity, setEvolutionGranularity] = useState('day')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [catalogos, setCatalogos] = useState({
    productos: [],
    categorias: [],
    marcas: [],
    clientes: [],
    proveedores: [],
  })

  const [raw, setRaw] = useState({
    ventas: [],
    ventasPrev: [],
    compras: [],
    comprasPrev: [],
    clientesNuevos: [],
    clientesNuevosPrev: [],
    ventasComparisons: { hoy: [], ayer: [], semana: [], semanaPrev: [], mes: [], mesPrev: [] },
  })

  const loadCatalogos = useCallback(async () => {
    const [prod, cat, mar, cli, prov] = await Promise.all([
      getProductos(),
      getCategorias(),
      getMarcas(),
      getClientes(),
      getProveedores(),
    ])
    setCatalogos({
      productos: prod.data || [],
      categorias: cat.data || [],
      marcas: mar.data || [],
      clientes: cli.data || [],
      proveedores: prov.data || [],
    })
  }, [])

  const loadData = useCallback(async () => {
    if (!user) return
    const { fechaDesde: dStr, fechaHasta: hStr } = resolveFilterDates(appliedFilters)
    if (!dStr || !hStr) {
      setError('Seleccioná un rango de fechas válido.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { desde, hasta } = dateRangeBounds(dStr, hStr)
      const prev = getPreviousPeriod(dStr, hStr)
      const prevBounds = dateRangeBounds(prev.desde, prev.hasta)

      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const ayer = new Date(hoy)
      ayer.setDate(ayer.getDate() - 1)
      const finAyer = new Date(ayer)
      finAyer.setHours(23, 59, 59, 999)
      const finHoy = new Date()
      finHoy.setHours(23, 59, 59, 999)

      const inicioSemana = new Date(hoy)
      inicioSemana.setDate(hoy.getDate() - hoy.getDay())
      const inicioSemPrev = new Date(inicioSemana)
      inicioSemPrev.setDate(inicioSemPrev.getDate() - 7)
      const finSemPrev = new Date(inicioSemana)
      finSemPrev.setMilliseconds(-1)

      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      const inicioMesPrev = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
      const finMesPrev = new Date(inicioMes)
      finMesPrev.setMilliseconds(-1)

      const [
        ventasRes,
        ventasPrevRes,
        comprasRes,
        comprasPrevRes,
        cliNuevosRes,
        cliNuevosPrevRes,
        ventasHoyRes,
        ventasAyerRes,
        ventasSemRes,
        ventasSemPrevRes,
        ventasMesRes,
        ventasMesPrevRes,
      ] = await Promise.all([
        getVentasPorRangoFechas(desde, hasta),
        getVentasPorRangoFechas(prevBounds.desde, prevBounds.hasta),
        getComprasPorRangoFechas(desde, hasta),
        getComprasPorRangoFechas(prevBounds.desde, prevBounds.hasta),
        getClientesPorRangoFechas(desde, hasta),
        getClientesPorRangoFechas(prevBounds.desde, prevBounds.hasta),
        getVentasPorRangoFechas(hoy, finHoy),
        getVentasPorRangoFechas(ayer, finAyer),
        getVentasPorRangoFechas(inicioSemana, finHoy),
        getVentasPorRangoFechas(inicioSemPrev, finSemPrev),
        getVentasPorRangoFechas(inicioMes, finHoy),
        getVentasPorRangoFechas(inicioMesPrev, finMesPrev),
      ])

      setRaw({
        ventas: ventasRes.data || [],
        ventasPrev: ventasPrevRes.data || [],
        compras: comprasRes.data || [],
        comprasPrev: comprasPrevRes.data || [],
        clientesNuevos: cliNuevosRes.data || [],
        clientesNuevosPrev: cliNuevosPrevRes.data || [],
        ventasComparisons: {
          hoy: ventasHoyRes.data || [],
          ayer: ventasAyerRes.data || [],
          semana: ventasSemRes.data || [],
          semanaPrev: ventasSemPrevRes.data || [],
          mes: ventasMesRes.data || [],
          mesPrev: ventasMesPrevRes.data || [],
        },
      })
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error al cargar datos del dashboard')
    } finally {
      setLoading(false)
    }
  }, [user, appliedFilters, refreshKey])

  useEffect(() => {
    if (!authLoading && user) loadCatalogos()
  }, [authLoading, user, loadCatalogos])

  useEffect(() => {
    if (!authLoading && user) loadData()
  }, [authLoading, user, loadData])

  const filtered = useMemo(() => {
    const cat = catalogos
    const ventas = filterVentas(raw.ventas, appliedFilters, cat)
    const ventasPrev = filterVentas(raw.ventasPrev, appliedFilters, cat)
    const compras = filterCompras(raw.compras, appliedFilters, cat)
    const comprasPrev = filterCompras(raw.comprasPrev, appliedFilters, cat)
    const productos = filterProductos(cat.productos, appliedFilters)
    return { ventas, ventasPrev, compras, comprasPrev, productos }
  }, [raw, appliedFilters, catalogos])

  const analytics = useMemo(() => {
    const { ventas, ventasPrev, compras, comprasPrev, productos } = filtered
    const { categorias, clientes, proveedores } = catalogos

    return {
      kpis: buildKpis({
        ventas,
        compras,
        productos: catalogos.productos,
        clientes,
        proveedores,
        ventasPrev,
        comprasPrev,
        clientesNuevos: raw.clientesNuevos.length,
        clientesNuevosPrev: raw.clientesNuevosPrev.length,
      }),
      evolution: buildEvolutionSeries({
        ventas,
        compras,
        clientesNuevos: raw.clientesNuevos,
        metric: evolutionMetric,
        granularity: evolutionGranularity,
        desde: appliedFilters.fechaDesde,
        hasta: appliedFilters.fechaHasta,
      }),
      paymentDonut: buildPaymentDonut(ventas),
      categoryDonut: buildCategoryDonut(ventas, catalogos.productos, categorias),
      topProducts: buildTopProducts(ventas, catalogos.productos),
      topClientes: buildTopClientes(ventas, clientes),
      topProveedores: buildTopProveedores(compras, proveedores),
      ventaEstados: buildVentaEstados(ventas),
      compraEstados: buildCompraEstados(compras),
      stock: buildStockIndicators(productos),
      alerts: buildAlerts({
        productos: catalogos.productos,
        ventas,
        compras,
        clientes,
      }),
      latestVentas: buildLatestVentas(ventas, clientes),
      latestCompras: buildLatestCompras(compras, proveedores),
      featured: buildFeaturedProducts(ventas, catalogos.productos),
      comparisons: buildComparisons({
        ventasHoy: filterVentas(raw.ventasComparisons.hoy, appliedFilters, catalogos),
        ventasAyer: filterVentas(raw.ventasComparisons.ayer, appliedFilters, catalogos),
        ventasSemana: filterVentas(raw.ventasComparisons.semana, appliedFilters, catalogos),
        ventasSemanaPrev: filterVentas(raw.ventasComparisons.semanaPrev, appliedFilters, catalogos),
        ventasMes: filterVentas(raw.ventasComparisons.mes, appliedFilters, catalogos),
        ventasMesPrev: filterVentas(raw.ventasComparisons.mesPrev, appliedFilters, catalogos),
      }),
    }
  }, [
    filtered,
    catalogos,
    raw,
    appliedFilters,
    evolutionMetric,
    evolutionGranularity,
  ])

  const applyFilters = useCallback(() => {
    const { fechaDesde, fechaHasta } = resolveFilterDates(draftFilters)
    if (!fechaDesde || !fechaHasta) {
      setError('Seleccioná un rango de fechas válido.')
      return
    }
    if (fechaDesde > fechaHasta) {
      setError('La fecha "Desde" no puede ser posterior a "Hasta".')
      return
    }
    setError(null)
    setAppliedFilters({
      ...draftFilters,
      fechaDesde,
      fechaHasta,
    })
  }, [draftFilters])

  const clearFilters = useCallback(() => {
    const next = { ...DEFAULT_FILTERS, ...getDefaultDateRange(6) }
    setDraftFilters(next)
    setAppliedFilters(next)
  }, [])

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const setFilter = useCallback((key, value) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setAppliedFilter = useCallback((key, value) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }))
    setAppliedFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  return {
    loading,
    error,
    draftFilters,
    appliedFilters,
    catalogos,
    analytics,
    evolutionMetric,
    setEvolutionMetric,
    evolutionGranularity,
    setEvolutionGranularity,
    setFilter,
    setAppliedFilter,
    applyFilters,
    clearFilters,
    refresh,
  }
}
