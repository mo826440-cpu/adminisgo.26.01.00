// Formulario para crear/editar producto
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Input, Alert, Spinner, Modal } from '../../components/common'
import { getProducto, createProducto, updateProducto, getCategorias, getMarcas, verificarCodigoBarras, verificarNombreProducto, reemplazarCodigosBarras, liberarCodigosDeProductosInactivos } from '../../services/productos'
import './ProductoForm.css'

function ProductoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEditing = !!id

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [validatedData, setValidatedData] = useState(null)

  const [categorias, setCategorias] = useState([])
  const [marcas, setMarcas] = useState([])
  const codigoKey = useRef(1)
  const filaCodigo = (codigo = '', observacion = '') => {
    codigoKey.current += 1
    return { key: codigoKey.current, codigo, observacion }
  }

  const [codigos, setCodigos] = useState(() => [{ key: 1, codigo: '', observacion: '' }])
  const [stockTocado, setStockTocado] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria_id: '',
    marca_id: '',
    precio_venta: '',
    precio_compra: '',
    stock_actual: '',
    stock_minimo: '',
    unidad_medida: 'unidad',
    activo: true,
    preferible: false
  })

  useEffect(() => {
    loadCategorias()
    loadMarcas()
    
    if (isEditing) {
      loadProducto()
    }
  }, [id])

  // Alta desde ventas rápidas (u otra pantalla): ?codigo_barras=...
  useEffect(() => {
    if (isEditing) return
    const cb = searchParams.get('codigo_barras')
    if (cb != null && String(cb).trim() !== '') {
      setCodigos((prev) => {
        if (prev.some((fila) => String(fila.codigo).trim() !== '')) return prev
        return [{ ...prev[0], codigo: String(cb).trim() }]
      })
    }
  }, [isEditing, searchParams])

  const loadProducto = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getProducto(id)
    
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    
    if (data) {
      const filas = (data.codigos_barras || [])
        .map((fila) => filaCodigo(String(fila.codigo ?? ''), String(fila.observacion ?? '')))
        .filter((fila) => fila.codigo)
      setCodigos(filas.length > 0 ? filas : [filaCodigo()])
      setStockTocado(false)
      setFormData({
        nombre: data.nombre || '',
        descripcion: data.descripcion || '',
        categoria_id: data.categoria_id || '',
        marca_id: data.marca_id || '',
        precio_venta: data.precio_venta ?? '',
        precio_compra: data.precio_compra ?? '',
        stock_actual: data.stock_actual == null ? '' : String(data.stock_actual),
        stock_minimo: data.stock_minimo ?? '',
        unidad_medida: data.unidad_medida || 'unidad',
        activo: data.activo ?? true,
        preferible: data.preferible ?? false
      })
    }
    setLoading(false)
  }

  const loadCategorias = async () => {
    const { data } = await getCategorias()
    if (data) setCategorias(data)
  }

  const loadMarcas = async () => {
    const { data } = await getMarcas()
    if (data) setMarcas(data)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name === 'stock_actual') setStockTocado(true)
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const actualizarCodigo = (key, campo, valor) => {
    setCodigos((prev) => prev.map((fila) => (fila.key === key ? { ...fila, [campo]: valor } : fila)))
  }

  const quitarCodigo = (key) => {
    setCodigos((prev) => {
      const siguientes = prev.filter((fila) => fila.key !== key)
      return siguientes.length > 0 ? siguientes : [filaCodigo()]
    })
  }

  const agregarCodigo = () => {
    setCodigos((prev) => [...prev, filaCodigo()])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validación completa: recopilar todos los errores a la vez
    const errores = []

    if (!formData.nombre.trim()) {
      errores.push('El nombre es obligatorio')
    }

    const filasCodigo = codigos.map((fila) => ({
      codigo: String(fila.codigo ?? '').trim(),
      observacion: String(fila.observacion ?? '').trim(),
    }))
    if (filasCodigo.some((fila) => !fila.codigo && fila.observacion)) {
      errores.push('Hay una observación sin código de barras. Completá el código o quitá esa fila.')
    }
    const codigosUtiles = filasCodigo.filter((fila) => fila.codigo)
    if (codigosUtiles.length === 0) {
      errores.push('El código de barras es obligatorio')
    }
    const vistos = new Set()
    for (const fila of codigosUtiles) {
      const clave = fila.codigo.toLowerCase()
      if (vistos.has(clave)) {
        errores.push(`El código ${fila.codigo} está repetido en este producto.`)
        break
      }
      vistos.add(clave)
    }

    const categoriaId = String(formData.categoria_id || '')
    if (!categoriaId || !categorias.some((cat) => String(cat.id) === categoriaId)) {
      errores.push(
        categorias.length === 0
          ? 'No hay categorías cargadas. Creá una categoría antes de guardar el producto.'
          : 'La categoría es obligatoria.',
      )
    }

    const stockTexto = String(formData.stock_actual ?? '').trim()
    let stockPayload
    if (!isEditing) {
      stockPayload = stockTexto === '' ? 0 : Number(stockTexto)
      if (!Number.isFinite(stockPayload) || stockPayload < 0) {
        errores.push('El stock actual debe ser mayor o igual a 0')
      }
    } else if (stockTocado && stockTexto !== '') {
      stockPayload = Number(stockTexto)
      if (!Number.isFinite(stockPayload) || stockPayload < 0) {
        errores.push('El stock actual debe ser mayor o igual a 0')
      }
    }

    if (!formData.precio_venta || parseFloat(formData.precio_venta) < 0) {
      errores.push('El precio de venta debe ser mayor o igual a 0')
    }

    if (!formData.stock_minimo || formData.stock_minimo === '' || parseFloat(formData.stock_minimo) < 0) {
      errores.push('El stock mínimo es obligatorio y debe ser mayor o igual a 0')
    }

    // Si hay errores de validación, mostrarlos todos
    if (errores.length > 0) {
      setError(errores.join('. '))
      return
    }

    try {
      // Validar nombre único antes de enviar
      const { existe: existeNombre, error: errorNombre } = await verificarNombreProducto(
        formData.nombre.trim(), 
        isEditing ? id : null
      )
      
      if (errorNombre) {
        setError('Error al verificar el nombre del producto. Por favor, intenta nuevamente.')
        return
      }
      
      if (existeNombre) {
        setError('Ya existe un producto con este nombre. Por favor, usa un nombre diferente.')
        return
      }

      const { error: errorLiberar } = await liberarCodigosDeProductosInactivos(
        codigosUtiles.map((fila) => fila.codigo),
        isEditing ? id : null,
      )
      if (errorLiberar) {
        setError('No se pudieron liberar los códigos de productos dados de baja. Intentá nuevamente.')
        return
      }

      for (const fila of codigosUtiles) {
        const { existe, error: errorBarras } = await verificarCodigoBarras(fila.codigo, isEditing ? id : null)
        if (errorBarras) {
          setError('Error al verificar el código de barras. Por favor, intenta nuevamente.')
          return
        }
        if (existe) {
          setError(`El código ${fila.codigo} ya identifica a otro producto.`)
          return
        }
      }

      const productoData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || null,
        categoria_id: Number(categoriaId),
        marca_id: formData.marca_id ? Number(formData.marca_id) : null,
        precio_venta: parseFloat(formData.precio_venta) || 0,
        precio_compra: formData.precio_compra ? parseFloat(formData.precio_compra) : null,
        stock_minimo: parseFloat(formData.stock_minimo) || 0,
        unidad_medida: formData.unidad_medida || 'unidad',
        activo: formData.activo,
        preferible: formData.preferible,
        codigo_barras: codigosUtiles[0].codigo,
        codigos_barras: codigosUtiles,
      }
      if (stockPayload !== undefined) {
        productoData.stock_actual = stockPayload
      }

      // Guardar datos validados y mostrar confirmación
      setValidatedData(productoData)
      setShowConfirmModal(true)
    } catch (err) {
      // Capturar errores inesperados
      console.error('Error inesperado:', err)
      setError(err.message || 'Error inesperado al validar los datos')
    }
  }

  // Función para guardar después de confirmación
  const handleConfirmSave = async () => {
    setShowConfirmModal(false)
    setSaving(true)
    setError(null)

    try {
      const { codigos_barras: codigosAGuardar, ...payload } = validatedData
      const { error: errorLiberar } = await liberarCodigosDeProductosInactivos(
        (codigosAGuardar || []).map((fila) => fila.codigo),
        isEditing ? id : null,
      )
      if (errorLiberar) {
        setError('No se pudieron liberar los códigos de productos dados de baja. Intentá nuevamente.')
        setSaving(false)
        return
      }
      let productoId = isEditing ? id : null
      if (isEditing) {
        const { error: err } = await updateProducto(id, payload)
        if (err) {
          setError(err.message || 'Error al actualizar el producto')
          setSaving(false)
          return
        }
      } else {
        const { data, error: err } = await createProducto(payload)
        if (err) {
          setError(err.message || 'Error al crear el producto')
          setSaving(false)
          return
        }
        productoId = data?.id
      }

      const { error: errorCodigos } = await reemplazarCodigosBarras(productoId, codigosAGuardar)
      if (errorCodigos) {
        setError(errorCodigos.message)
        setSaving(false)
        if (!isEditing && productoId) {
          navigate(`/productos/${productoId}`, { replace: true })
        }
        return
      }

      setSaving(false)
      navigate('/productos', { 
        replace: true,
        state: { 
          success: true, 
          message: isEditing ? 'Producto actualizado correctamente' : 'Producto creado correctamente' 
        } 
      })
    } catch (err) {
      console.error('Error inesperado:', err)
      setError(err.message || 'Error inesperado al guardar el producto')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando producto...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="producto-form">
            <div className="form-row">
              <div className="form-col form-col-full">
                <Input
                  label="Nombre del Producto"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Producto ejemplo"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-col form-col-full">
                <label className="form-label">
                  Descripción
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    className="form-control"
                    rows="3"
                    placeholder="Descripción del producto (opcional)"
                  />
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-col form-col-full">
                <div className="producto-codigos">
                  <span className="form-label">
                    Códigos de barras <span className="required">*</span>
                  </span>
                  {codigos.map((fila) => (
                    <div className="producto-codigos__fila" key={fila.key}>
                      <input
                        type="text"
                        className="form-control"
                        value={fila.codigo}
                        onChange={(e) => actualizarCodigo(fila.key, 'codigo', e.target.value)}
                        placeholder="Código de barras"
                        autoComplete="off"
                        inputMode="text"
                      />
                      <input
                        type="text"
                        className="form-control"
                        value={fila.observacion}
                        onChange={(e) => actualizarCodigo(fila.key, 'observacion', e.target.value)}
                        placeholder="Observación (opcional)"
                        autoComplete="off"
                      />
                      <Button type="button" variant="outline" onClick={() => quitarCodigo(fila.key)}>
                        Quitar
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={agregarCodigo}>
                    Agregar código de barras
                  </Button>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-col">
                <label className="form-label">
                  <span>
                    Categoría <span className="required">*</span>
                  </span>
                  <select
                    name="categoria_id"
                    value={formData.categoria_id}
                    onChange={handleChange}
                    className="form-control"
                  >
                    <option value="">Seleccioná una categoría</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-col">
                <label className="form-label">
                  Marca
                  <select
                    name="marca_id"
                    value={formData.marca_id}
                    onChange={handleChange}
                    className="form-control"
                  >
                    <option value="">Sin marca</option>
                    {marcas.map(marca => (
                      <option key={marca.id} value={marca.id}>{marca.nombre}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-col">
                <Input
                  label="Precio de Venta"
                  name="precio_venta"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio_venta}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="form-col">
                <Input
                  label="Precio de Compra"
                  name="precio_compra"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio_compra}
                  onChange={handleChange}
                  placeholder="0.00 (opcional)"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-col">
                <Input
                  label="Stock Actual"
                  name="stock_actual"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.stock_actual}
                  onChange={handleChange}
                  placeholder={isEditing ? 'Sin cambio si lo dejás vacío' : 'Vacío = 0'}
                />
              </div>
              <div className="form-col">
                <Input
                  label="Stock Mínimo"
                  name="stock_minimo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.stock_minimo}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
              <div className="form-col">
                <label className="form-label">
                  Unidad de Medida
                  <select
                    name="unidad_medida"
                    value={formData.unidad_medida}
                    onChange={handleChange}
                    className="form-control"
                  >
                    <option value="unidad">Unidad</option>
                    <option value="kg">Kilogramo (kg)</option>
                    <option value="g">Gramo (g)</option>
                    <option value="litro">Litro</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="m">Metro</option>
                    <option value="cm">Centímetro (cm)</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-col">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleChange}
                  />
                  <span>Producto activo</span>
                </label>
              </div>
              <div className="form-col">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    name="preferible"
                    checked={formData.preferible}
                    onChange={handleChange}
                  />
                  <span>Producto preferible (default en ventas)</span>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <Link to="/productos">
                <Button type="button" variant="outline" disabled={saving}>
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" variant="primary" loading={saving} disabled={saving}>
                {isEditing ? 'Actualizar Producto' : 'Crear Producto'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Modal de Confirmación antes de Guardar */}
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
              {isEditing ? 'Actualizar Producto' : 'Crear Producto'}
            </Button>
          </>
        }
      >
        <p>
          {isEditing 
            ? '¿Estás seguro de que deseas actualizar los datos del producto?'
            : '¿Estás seguro de que deseas crear este producto con los datos ingresados?'
          }
        </p>
      </Modal>
    </Layout>
  )
}

export default ProductoForm

