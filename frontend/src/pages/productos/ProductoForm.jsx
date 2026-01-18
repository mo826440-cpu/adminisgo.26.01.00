// Formulario para crear/editar producto
import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Input, Alert, Spinner, Modal } from '../../components/common'
import { getProducto, createProducto, updateProducto, getCategorias, getMarcas, verificarCodigoBarras, verificarCodigoInterno, verificarNombreProducto } from '../../services/productos'
import { useAuthContext } from '../../context/AuthContext'
import './ProductoForm.css'

function ProductoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const isEditing = !!id

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [validatedData, setValidatedData] = useState(null)

  const [categorias, setCategorias] = useState([])
  const [marcas, setMarcas] = useState([])

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    codigo_barras: '',
    codigo_interno: '',
    categoria_id: '',
    marca_id: '',
    precio_venta: '',
    precio_compra: '',
    stock_actual: '',
    stock_minimo: '',
    unidad_medida: 'unidad',
    activo: true
  })

  useEffect(() => {
    loadCategorias()
    loadMarcas()
    
    if (isEditing) {
      loadProducto()
    }
  }, [id])

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
      setFormData({
        nombre: data.nombre || '',
        descripcion: data.descripcion || '',
        codigo_barras: data.codigo_barras || '',
        codigo_interno: data.codigo_interno || '',
        categoria_id: data.categoria_id || '',
        marca_id: data.marca_id || '',
        precio_venta: data.precio_venta || '',
        precio_compra: data.precio_compra || '',
        stock_actual: data.stock_actual || '',
        stock_minimo: data.stock_minimo || '',
        unidad_medida: data.unidad_medida || 'unidad',
        activo: data.activo ?? true
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validación completa: recopilar todos los errores a la vez
    const errores = []

    if (!formData.nombre.trim()) {
      errores.push('El nombre es obligatorio')
    }

    if (!formData.codigo_barras || !formData.codigo_barras.trim()) {
      errores.push('El código de barras es obligatorio')
    }

    if (!formData.codigo_interno || !formData.codigo_interno.trim()) {
      errores.push('El código interno es obligatorio')
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

      // Validar códigos únicos antes de enviar
      const { existe: existeBarras, error: errorBarras } = await verificarCodigoBarras(
        formData.codigo_barras.trim(), 
        isEditing ? id : null
      )
      
      if (errorBarras) {
        setError('Error al verificar el código de barras. Por favor, intenta nuevamente.')
        return
      }
      
      if (existeBarras) {
        setError('El código de barras ya está en uso. Por favor, usa un código diferente.')
        return
      }

      const { existe: existeInterno, error: errorInterno } = await verificarCodigoInterno(
        formData.codigo_interno.trim(), 
        isEditing ? id : null
      )
      
      if (errorInterno) {
        setError('Error al verificar el código interno. Por favor, intenta nuevamente.')
        return
      }
      
      if (existeInterno) {
        setError('El código interno ya está en uso. Por favor, usa un código diferente.')
        return
      }

      const productoData = {
        ...formData,
        precio_venta: parseFloat(formData.precio_venta) || 0,
        precio_compra: formData.precio_compra ? parseFloat(formData.precio_compra) : null,
        stock_actual: parseFloat(formData.stock_actual) || 0,
        stock_minimo: parseFloat(formData.stock_minimo) || 0,
        categoria_id: formData.categoria_id || null,
        marca_id: formData.marca_id || null,
        codigo_barras: formData.codigo_barras.trim(),
        codigo_interno: formData.codigo_interno.trim()
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
      if (isEditing) {
        const { error: err } = await updateProducto(id, validatedData)
        if (err) {
          setError(err.message || 'Error al actualizar el producto')
          setSaving(false)
          return
        }
      } else {
        const { error: err } = await createProducto(validatedData)
        if (err) {
          setError(err.message || 'Error al crear el producto')
          setSaving(false)
          return
        }
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
        <div className="page-header">
          <div>
            <h1>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h1>
            <p className="text-secondary">
              {isEditing ? 'Modifica la información del producto' : 'Completa los datos del nuevo producto'}
            </p>
          </div>
          <Link to="/productos">
            <Button variant="outline">← Volver a Productos</Button>
          </Link>
        </div>

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
              <div className="form-col">
                <Input
                  label="Código de Barras"
                  name="codigo_barras"
                  value={formData.codigo_barras}
                  onChange={handleChange}
                  required
                  placeholder="Código de barras"
                />
              </div>
              <div className="form-col">
                <Input
                  label="Código Interno"
                  name="codigo_interno"
                  value={formData.codigo_interno}
                  onChange={handleChange}
                  required
                  placeholder="Código interno"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-col">
                <label className="form-label">
                  Categoría
                  <select
                    name="categoria_id"
                    value={formData.categoria_id}
                    onChange={handleChange}
                    className="form-control"
                  >
                    <option value="">Sin categoría</option>
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
                  required
                  placeholder="0"
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

