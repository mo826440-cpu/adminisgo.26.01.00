import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Input, Modal, Spinner } from '../common'
import { consultarProductoStockPrecio, getProductos, updateProducto } from '../../services/productos'
import { formatMoneyAR } from '../../pages/reportes/reporteVentasUtils'
import './ConsultaProductoStockModal.css'

function parsePrecioInput(valor) {
  const normalizado = String(valor ?? '').trim().replace(/\s/g, '').replace(',', '.')
  if (!normalizado) return NaN
  const numero = Number(normalizado)
  return Number.isFinite(numero) ? numero : NaN
}

function filtrarProductos(productos, termino) {
  const lower = String(termino || '').trim().toLowerCase()
  if (!lower) return []
  return productos
    .filter(
      (p) =>
        p.nombre?.toLowerCase().includes(lower) ||
        p.codigo_barras?.toLowerCase().includes(lower) ||
        p.codigo_interno?.toLowerCase().includes(lower),
    )
    .slice(0, 8)
}

function buscarExactoPorCodigo(productos, termino) {
  const lower = String(termino || '').trim().toLowerCase()
  if (!lower) return null
  return (
    productos.find(
      (p) =>
        p.codigo_barras?.toLowerCase() === lower ||
        p.codigo_interno?.toLowerCase() === lower,
    ) || null
  )
}

function ConsultaProductoStockModal({ isOpen, onClose, onPrecioActualizado }) {
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const reqIdRef = useRef(0)
  const [termino, setTermino] = useState('')
  const [catalogo, setCatalogo] = useState([])
  const [sugerencias, setSugerencias] = useState([])
  const [showSugerencias, setShowSugerencias] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState(null)
  const [producto, setProducto] = useState(null)
  const [editandoPrecio, setEditandoPrecio] = useState(false)
  const [precioDraft, setPrecioDraft] = useState('')
  const [guardandoPrecio, setGuardandoPrecio] = useState(false)
  const [mensajeExito, setMensajeExito] = useState(null)

  useEffect(() => {
    if (!isOpen) return undefined
    setTermino('')
    setError(null)
    setProducto(null)
    setEditandoPrecio(false)
    setPrecioDraft('')
    setGuardandoPrecio(false)
    setMensajeExito(null)
    setSugerencias([])
    setShowSugerencias(false)
    setActiveIndex(-1)
    setCatalogo([])

    let cancelled = false
    ;(async () => {
      const { data, error: err } = await getProductos()
      if (cancelled) return
      if (err) {
        setCatalogo([])
        return
      }
      setCatalogo(data || [])
    })()

    const t = window.setTimeout(() => inputRef.current?.focus(), 80)

    const bloquearAtajosDeVentas = (e) => {
      if (e.key === 'F2' || e.key === 'F4') {
        e.preventDefault()
        e.stopPropagation()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', bloquearAtajosDeVentas, true)

    return () => {
      cancelled = true
      window.clearTimeout(t)
      window.removeEventListener('keydown', bloquearAtajosDeVentas, true)
    }
  }, [isOpen])

  useEffect(() => {
    if (!listRef.current || activeIndex < 0) return
    const el = listRef.current.querySelector(`li[data-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, sugerencias.length])

  useEffect(() => {
    if (!isOpen || catalogo.length === 0) return
    const texto = String(inputRef.current?.value || '').trim()
    if (!texto) return
    const lista = filtrarProductos(catalogo, texto)
    setSugerencias(lista)
    setShowSugerencias(lista.length > 0)
    setActiveIndex(lista.length > 0 ? 0 : -1)
    const exacto = buscarExactoPorCodigo(catalogo, texto)
    if (exacto) {
      setProducto(exacto)
      setSugerencias([])
      setShowSugerencias(false)
      setActiveIndex(-1)
    }
  }, [catalogo, isOpen])

  const enfocarInput = (seleccionar = true) => {
    window.setTimeout(() => {
      inputRef.current?.focus()
      if (seleccionar) inputRef.current?.select()
    }, 40)
  }

  const aplicarProducto = (item, textoCampo = null) => {
    setProducto(item)
    setEditandoPrecio(false)
    setPrecioDraft('')
    setMensajeExito(null)
    setTermino(textoCampo ?? item.nombre ?? '')
    setSugerencias([])
    setShowSugerencias(false)
    setActiveIndex(-1)
    setError(null)
    enfocarInput()
  }

  const consultar = async (valor) => {
    const texto = String(valor ?? inputRef.current?.value ?? '').trim()
    if (!texto) {
      setError('Escaneá el código o buscá el producto por nombre.')
      setProducto(null)
      enfocarInput(false)
      return
    }

    const exacto = buscarExactoPorCodigo(catalogo, texto)
    if (exacto) {
      aplicarProducto(exacto, texto)
      return
    }

    if (showSugerencias && activeIndex >= 0 && sugerencias[activeIndex]) {
      aplicarProducto(sugerencias[activeIndex])
      return
    }

    if (sugerencias.length === 1) {
      aplicarProducto(sugerencias[0])
      return
    }

    const reqId = ++reqIdRef.current
    setBuscando(true)
    setError(null)
    const { data, error: err } = await consultarProductoStockPrecio(texto)
    if (reqId !== reqIdRef.current) return
    setBuscando(false)

    if (err) {
      setProducto(null)
      setError(err.message || 'No se pudo consultar el producto.')
      enfocarInput()
      return
    }
    if (data) {
      aplicarProducto(data, texto)
      return
    }

    if (sugerencias.length > 0) {
      setShowSugerencias(true)
      setError('Elegí un producto de la lista.')
      enfocarInput(false)
      return
    }

    setProducto(null)
    setError('No hay un producto activo con ese código o nombre.')
    enfocarInput()
  }

  const handleChange = (valor) => {
    setTermino(valor)
    if (error) setError(null)

    const lista = filtrarProductos(catalogo, valor)
    setSugerencias(lista)
    setShowSugerencias(lista.length > 0)
    setActiveIndex(lista.length > 0 ? 0 : -1)

    const exacto = buscarExactoPorCodigo(catalogo, valor)
    if (exacto) {
      setProducto(exacto)
      setSugerencias([])
      setShowSugerencias(false)
      setActiveIndex(-1)
      return
    }

    setProducto(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    void consultar(inputRef.current?.value ?? termino)
  }

  const comenzarEdicionPrecio = () => {
    setPrecioDraft(String(Number(producto?.precio_venta ?? 0)))
    setEditandoPrecio(true)
    setError(null)
    setMensajeExito(null)
  }

  const guardarPrecio = async () => {
    if (!producto || guardandoPrecio) return
    const nuevoPrecio = parsePrecioInput(precioDraft)
    if (!Number.isFinite(nuevoPrecio) || nuevoPrecio < 0) {
      setError('Ingresá un precio válido mayor o igual a 0.')
      return
    }

    setGuardandoPrecio(true)
    setError(null)
    setMensajeExito(null)
    const { data, error: err } = await updateProducto(producto.id, { precio_venta: nuevoPrecio })
    setGuardandoPrecio(false)

    if (err) {
      setError(err.message || 'No se pudo actualizar el precio.')
      return
    }

    const precioActualizado = data?.precio_venta ?? nuevoPrecio
    setProducto((actual) => (actual ? { ...actual, precio_venta: precioActualizado } : actual))
    setCatalogo((actual) =>
      actual.map((item) => (item.id === producto.id ? { ...item, precio_venta: precioActualizado } : item)),
    )
    onPrecioActualizado?.(producto.id, precioActualizado)
    setEditandoPrecio(false)
    setPrecioDraft('')
    setMensajeExito(`Precio de "${producto.nombre}" actualizado correctamente.`)
  }

  const handlePrecioKeyDown = (e) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      e.preventDefault()
      void guardarPrecio()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditandoPrecio(false)
      setPrecioDraft('')
      setError(null)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      if (sugerencias.length === 0) return
      e.preventDefault()
      if (!showSugerencias) {
        setShowSugerencias(true)
        setActiveIndex(0)
        return
      }
      setActiveIndex((prev) => (prev + 1) % sugerencias.length)
      return
    }
    if (e.key === 'ArrowUp') {
      if (sugerencias.length === 0) return
      e.preventDefault()
      if (!showSugerencias) {
        setShowSugerencias(true)
        setActiveIndex(0)
        return
      }
      setActiveIndex((prev) => (prev - 1 + sugerencias.length) % sugerencias.length)
      return
    }
    if (e.key === 'Escape' && showSugerencias) {
      e.preventDefault()
      e.stopPropagation()
      setShowSugerencias(false)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      void consultar(e.currentTarget.value)
    }
  }

  const stock = Number(producto?.stock_actual ?? 0)
  const minimo = Number(producto?.stock_minimo ?? 0)
  const stockBajo = Boolean(producto) && stock <= minimo
  const unidad = producto?.unidad_medida || 'unidad'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Consultar stock y precio"
      footer={
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <form className="consulta-stock" onSubmit={handleSubmit}>
        <div className="consulta-stock__field">
          <div className="consulta-stock__row">
            <Input
              ref={inputRef}
              id="consulta-producto-codigo"
              label="Producto"
              type="text"
              value={termino}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (sugerencias.length > 0) setShowSugerencias(true)
              }}
              onBlur={() => {
                window.setTimeout(() => setShowSugerencias(false), 150)
              }}
              placeholder="Escaneá el código o buscá por nombre"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <Button type="submit" variant="primary">
              Consultar
            </Button>
          </div>
          {showSugerencias && sugerencias.length > 0 ? (
            <ul className="consulta-stock__suggestions" ref={listRef} role="listbox">
              {sugerencias.map((p, idx) => (
                <li
                  key={p.id}
                  data-index={idx}
                  className={idx === activeIndex ? 'is-active' : ''}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    aplicarProducto(p)
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <strong>{p.nombre}</strong>
                  <span>
                    {p.codigo_barras || p.codigo_interno || 'Sin código'}
                    {' · '}
                    {formatMoneyAR(p.precio_venta)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <p className="consulta-stock__hint">
          Escaneá el código de barras o escribí el nombre y elegí el producto de la lista.
        </p>

        {error ? (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        ) : null}
        {mensajeExito ? (
          <Alert variant="success" dismissible onDismiss={() => setMensajeExito(null)}>
            {mensajeExito}
          </Alert>
        ) : null}

        {buscando && !producto ? (
          <div className="consulta-stock__loading">
            <Spinner size="sm" />
            <span>Buscando producto…</span>
          </div>
        ) : null}

        {producto ? (
          <div className="consulta-stock__result">
            <p className="consulta-stock__nombre">{producto.nombre}</p>
            <p className="consulta-stock__codigo">
              {producto.codigo_barras || producto.codigo_interno || 'Sin código'}
            </p>
            <div className="consulta-stock__kpis">
              <article className="consulta-stock__kpi consulta-stock__kpi--precio">
                <span>Precio</span>
                <strong>{formatMoneyAR(producto.precio_venta)}</strong>
              </article>
              <article
                className={`consulta-stock__kpi ${stockBajo ? 'consulta-stock__kpi--stock-bajo' : 'consulta-stock__kpi--stock'}`}
              >
                <span>{stockBajo ? 'Stock bajo' : 'Stock'}</span>
                <strong>
                  {stock.toLocaleString('es-AR')} {unidad}
                </strong>
              </article>
            </div>
            {editandoPrecio ? (
              <div className="consulta-stock__precio-editor">
                <Input
                  id="consulta-producto-nuevo-precio"
                  label="Nuevo precio"
                  type="text"
                  inputMode="decimal"
                  value={precioDraft}
                  onChange={(e) => setPrecioDraft(e.target.value)}
                  onKeyDown={handlePrecioKeyDown}
                  autoFocus
                  disabled={guardandoPrecio}
                  placeholder="0,00"
                />
                <div className="consulta-stock__precio-actions">
                  <Button type="button" variant="primary" onClick={() => void guardarPrecio()} disabled={guardandoPrecio}>
                    {guardandoPrecio ? 'Guardando…' : 'Guardar precio'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditandoPrecio(false)
                      setPrecioDraft('')
                      setError(null)
                    }}
                    disabled={guardandoPrecio}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="consulta-stock__cambiar-precio"
                onClick={comenzarEdicionPrecio}
              >
                Cambiar precio
              </Button>
            )}
          </div>
        ) : null}
      </form>
    </Modal>
  )
}

export default ConsultaProductoStockModal
