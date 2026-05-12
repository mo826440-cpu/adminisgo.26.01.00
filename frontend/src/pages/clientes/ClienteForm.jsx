// Formulario para crear/editar cliente
import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Input, Alert, Spinner, Modal } from '../../components/common'
import { getCliente, createCliente, updateCliente, verificarEmailCliente, verificarNumeroDocumentoCliente, verificarNombreCliente } from '../../services/clientes'
import { useAuthContext } from '../../context/AuthContext'
import './ClienteForm.css'

function ClienteForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const isEditing = !!id

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  
  // Estados para modales
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showNombreWarningModal, setShowNombreWarningModal] = useState(false)
  const [validatedData, setValidatedData] = useState(null) // Datos validados para guardar

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    tipo_documento: 'DNI',
    numero_documento: '',
    activo: true
  })

  useEffect(() => {
    if (isEditing) {
      loadCliente()
    }
  }, [id])

  const loadCliente = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getCliente(id)
    
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    
    if (data) {
      setFormData({
        nombre: data.nombre || '',
        email: data.email || '',
        telefono: data.telefono || '',
        direccion: data.direccion || '',
        tipo_documento: data.tipo_documento || 'DNI',
        numero_documento: data.numero_documento || '',
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
    setError(null)

    // Validación completa: recopilar todos los errores a la vez
    const errores = []

    if (!formData.nombre.trim()) {
      errores.push('El nombre es obligatorio')
    }

    if (!formData.numero_documento || !formData.numero_documento.trim()) {
      errores.push('El número de documento es obligatorio')
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        errores.push('El email no tiene un formato válido')
      }
    }

    // Si hay errores de validación, mostrarlos todos
    if (errores.length > 0) {
      setError(errores.join('. '))
      return
    }

    try {
      // 1. Validar número de documento duplicado (BLOQUEAR si existe)
      const { existe: existeDocumento, error: errorDocumento } = await verificarNumeroDocumentoCliente(
        formData.numero_documento.trim(),
        isEditing ? id : null
      )
      
      if (errorDocumento) {
        setError('Error al verificar el número de documento. Por favor, intenta nuevamente.')
        return
      }
      
      if (existeDocumento) {
        setError('El número de documento ya está registrado. Por favor, verifica los datos.')
        return
      }

      // 2. Validar email único (si tiene valor)
      if (formData.email && formData.email.trim()) {
        const { existe: existeEmail, error: errorEmail } = await verificarEmailCliente(
          formData.email.trim(), 
          isEditing ? id : null
        )
        
        if (errorEmail) {
          setError('Error al verificar el email. Por favor, intenta nuevamente.')
          return
        }
        
        if (existeEmail) {
          setError('El email ya está en uso. Por favor, usa un email diferente.')
          return
        }
      }

      // 3. Validar nombre duplicado (ADVERTENCIA, no bloquear)
      const { existe: existeNombre, error: errorNombre } = await verificarNombreCliente(
        formData.nombre.trim(),
        isEditing ? id : null
      )
      
      if (errorNombre) {
        setError('Error al verificar el nombre. Por favor, intenta nuevamente.')
        return
      }

      // Preparar datos validados
      const clienteData = {
        ...formData,
        nombre: formData.nombre.trim(),
        email: formData.email?.trim() || null,
        telefono: formData.telefono?.trim() || null,
        direccion: formData.direccion?.trim() || null,
        numero_documento: formData.numero_documento.trim(),
        tipo_documento: formData.tipo_documento || 'DNI'
      }

      // Si el nombre está duplicado, mostrar ADVERTENCIA con confirmación
      if (existeNombre) {
        setValidatedData(clienteData)
        setShowNombreWarningModal(true)
        return
      }

      // Si no hay nombre duplicado, mostrar confirmación antes de guardar
      setValidatedData(clienteData)
      setShowConfirmModal(true)
    } catch (err) {
      console.error('Error inesperado:', err)
      setError(err.message || 'Error inesperado al validar los datos')
    }
  }

  // Función para guardar después de confirmación
  const handleConfirmSave = async () => {
    setShowConfirmModal(false)
    setShowNombreWarningModal(false)
    setSaving(true)
    setError(null)

    try {
      if (isEditing) {
        const { error: err } = await updateCliente(id, validatedData)
        if (err) {
          setError(err.message || 'Error al actualizar el cliente')
          setSaving(false)
          return
        }
      } else {
        const { error: err } = await createCliente(validatedData)
        if (err) {
          setError(err.message || 'Error al crear el cliente')
          setSaving(false)
          return
        }
      }

      setSaving(false)
      navigate('/clientes', { 
        replace: true,
        state: { 
          success: true, 
          message: isEditing ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente' 
        } 
      })
    } catch (err) {
      console.error('Error inesperado:', err)
      setError(err.message || 'Error inesperado al guardar el cliente')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando cliente...</p>
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
          <form onSubmit={handleSubmit} className="cliente-form">
            <div className="form-row">
              <div className="form-col form-col-full">
                <Input
                  label="Nombre Completo"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Nombre completo del cliente"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-col">
                <label className="form-label">
                  Tipo de Documento
                  <span className="required">*</span>
                  <select
                    name="tipo_documento"
                    value={formData.tipo_documento}
                    onChange={handleChange}
                    className="form-control"
                    required
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
                  label="Número de Documento"
                  name="numero_documento"
                  value={formData.numero_documento}
                  onChange={handleChange}
                  required
                  placeholder="Número de documento"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-col">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="cliente@email.com (opcional)"
                />
              </div>
              <div className="form-col">
                <Input
                  label="Teléfono"
                  name="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="Teléfono (opcional)"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-col form-col-full">
                <label className="form-label">
                  Dirección
                  <textarea
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className="form-control"
                    rows="3"
                    placeholder="Dirección completa (opcional)"
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
                  <span>Cliente Activo</span>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <Link to="/clientes">
                <Button type="button" variant="outline" disabled={saving}>
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" variant="primary" loading={saving} disabled={saving}>
                {isEditing ? 'Actualizar Cliente' : 'Crear Cliente'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Modal de Advertencia para Nombre Duplicado */}
      <Modal
        isOpen={showNombreWarningModal}
        onClose={() => {
          setShowNombreWarningModal(false)
          setValidatedData(null)
        }}
        title="Advertencia: Nombre Duplicado"
        variant="warning"
        closeOnOverlayClick={false}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowNombreWarningModal(false)
                setValidatedData(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowNombreWarningModal(false)
                setShowConfirmModal(true)
              }}
            >
              Continuar de todos modos
            </Button>
          </>
        }
      >
        <p>
          Ya existe un cliente registrado con el nombre <strong>"{formData.nombre}"</strong>.
        </p>
        <p style={{ marginTop: '1rem' }}>
          ¿Deseas continuar con la carga de todos modos?
        </p>
      </Modal>

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
              {isEditing ? 'Actualizar Cliente' : 'Crear Cliente'}
            </Button>
          </>
        }
      >
        <p>
          {isEditing 
            ? '¿Estás seguro de que deseas actualizar los datos del cliente?'
            : '¿Estás seguro de que deseas crear este cliente con los datos ingresados?'
          }
        </p>
      </Modal>
    </Layout>
  )
}

export default ClienteForm
