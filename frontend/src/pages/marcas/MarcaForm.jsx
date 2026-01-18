// Formulario para crear/editar marca
import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Input, Alert, Spinner, Modal } from '../../components/common'
import { getMarca, createMarca, updateMarca, verificarNombreMarca } from '../../services/marcas'
import './MarcaForm.css'

function MarcaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [validatedData, setValidatedData] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activo: true
  })

  useEffect(() => {
    if (isEditing) {
      loadMarca()
    }
  }, [id])

  const loadMarca = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getMarca(id)
    
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    
    if (data) {
      setFormData({
        nombre: data.nombre || '',
        descripcion: data.descripcion || '',
        activo: data.activo ?? true
      })
    }
    setLoading(false)
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
    setSaving(true)
    setError(null)

    const errores = []

    if (!formData.nombre.trim()) {
      errores.push('El nombre es obligatorio')
    }

    if (errores.length > 0) {
      setError(errores.join('. '))
      setSaving(false)
      return
    }

    try {
      // Validar nombre único
      const { existe: existeNombre, error: errorNombre } = await verificarNombreMarca(
        formData.nombre.trim(),
        isEditing ? id : null
      )
      
      if (errorNombre) {
        setError('Error al verificar el nombre de la marca. Por favor, intenta nuevamente.')
        setSaving(false)
        return
      }
      
      if (existeNombre) {
        setError('Ya existe una marca con este nombre. Por favor, usa un nombre diferente.')
        setSaving(false)
        return
      }

      const marcaData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || null,
        activo: formData.activo
      }

      setValidatedData(marcaData)
      setShowConfirmModal(true)
      setSaving(false)
    } catch (err) {
      console.error('Error inesperado:', err)
      setError(err.message || 'Error inesperado al validar los datos')
      setSaving(false)
    }
  }

  const handleConfirmSave = async () => {
    setShowConfirmModal(false)
    setSaving(true)
    setError(null)

    try {
      if (isEditing) {
        const { error: err } = await updateMarca(id, validatedData)
        if (err) {
          setError(err.message || 'Error al actualizar la marca')
          setSaving(false)
          return
        }
      } else {
        const { error: err } = await createMarca(validatedData)
        if (err) {
          setError(err.message || 'Error al crear la marca')
          setSaving(false)
          return
        }
      }

      setSaving(false)
      navigate('/marcas', { 
        replace: true,
        state: { 
          success: true, 
          message: isEditing ? 'Marca actualizada correctamente' : 'Marca creada correctamente' 
        } 
      })
    } catch (err) {
      console.error('Error inesperado:', err)
      setError(err.message || 'Error inesperado al guardar la marca')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando marca...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div>
            <h1>{isEditing ? 'Editar Marca' : 'Nueva Marca'}</h1>
            <p className="text-secondary">
              {isEditing ? 'Modifica la información de la marca' : 'Completa los datos de la nueva marca'}
            </p>
          </div>
          <Link to="/marcas">
            <Button variant="outline">← Volver a Marcas</Button>
          </Link>
        </div>

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="marca-form">
            <div className="form-row">
              <div className="form-col form-col-full">
                <Input
                  label="Nombre de la Marca"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Sony"
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
                    placeholder="Descripción de la marca (opcional)"
                  />
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
                  <span>Marca Activa</span>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <Link to="/marcas">
                <Button type="button" variant="outline" disabled={saving}>
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" variant="primary" loading={saving} disabled={saving}>
                {isEditing ? 'Actualizar Marca' : 'Crear Marca'}
              </Button>
            </div>
          </form>
        </Card>

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
                {isEditing ? 'Actualizar Marca' : 'Crear Marca'}
              </Button>
            </>
          }
        >
          <p>
            {isEditing 
              ? '¿Estás seguro de que deseas actualizar los datos de la marca?'
              : '¿Estás seguro de que deseas crear esta marca con los datos ingresados?'
            }
          </p>
        </Modal>
      </div>
    </Layout>
  )
}

export default MarcaForm

