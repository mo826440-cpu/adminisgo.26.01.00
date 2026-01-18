// Formulario para crear/editar proveedor
import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Input, Alert, Spinner, Modal } from '../../components/common'
import { getProveedor, createProveedor, updateProveedor, verificarEmailProveedor, verificarCuitProveedor, verificarNombreProveedor } from '../../services/proveedores'
import './ProveedorForm.css'

function ProveedorForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showNombreWarningModal, setShowNombreWarningModal] = useState(false)
  const [validatedData, setValidatedData] = useState(null)

  const [formData, setFormData] = useState({
    nombre_razon_social: '',
    email: '',
    telefono: '',
    direccion: '',
    cuit_rut: '',
    contacto_principal: '',
    condiciones_pago: '',
    plazo_entrega: '',
    notas: '',
    activo: true
  })

  useEffect(() => {
    if (isEditing) {
      loadProveedor()
    }
  }, [id])

  const loadProveedor = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getProveedor(id)
    
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    
    if (data) {
      setFormData({
        nombre_razon_social: data.nombre_razon_social || '',
        email: data.email || '',
        telefono: data.telefono || '',
        direccion: data.direccion || '',
        cuit_rut: data.cuit_rut || '',
        contacto_principal: data.contacto_principal || '',
        condiciones_pago: data.condiciones_pago || '',
        plazo_entrega: data.plazo_entrega || '',
        notas: data.notas || '',
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

    const errores = []

    if (!formData.nombre_razon_social.trim()) {
      errores.push('El nombre o razón social es obligatorio')
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        errores.push('El email no tiene un formato válido')
      }
    }

    if (errores.length > 0) {
      setError(errores.join('. '))
      return
    }

    try {
      // 1. Validar CUIT/RUT único (si tiene valor)
      if (formData.cuit_rut && formData.cuit_rut.trim()) {
        const { existe: existeCuit, error: errorCuit } = await verificarCuitProveedor(
          formData.cuit_rut.trim(),
          isEditing ? id : null
        )
        
        if (errorCuit) {
          setError('Error al verificar el CUIT/RUT. Por favor, intenta nuevamente.')
          return
        }
        
        if (existeCuit) {
          setError('El CUIT/RUT ya está registrado. Por favor, verifica los datos.')
          return
        }
      }

      // 2. Validar email único (si tiene valor)
      if (formData.email && formData.email.trim()) {
        const { existe: existeEmail, error: errorEmail } = await verificarEmailProveedor(
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
      const { existe: existeNombre, error: errorNombre } = await verificarNombreProveedor(
        formData.nombre_razon_social.trim(),
        isEditing ? id : null
      )
      
      if (errorNombre) {
        setError('Error al verificar el nombre. Por favor, intenta nuevamente.')
        return
      }

      const proveedorData = {
        nombre_razon_social: formData.nombre_razon_social.trim(),
        email: formData.email?.trim() || null,
        telefono: formData.telefono?.trim() || null,
        direccion: formData.direccion?.trim() || null,
        cuit_rut: formData.cuit_rut?.trim() || null,
        contacto_principal: formData.contacto_principal?.trim() || null,
        condiciones_pago: formData.condiciones_pago?.trim() || null,
        plazo_entrega: formData.plazo_entrega ? parseInt(formData.plazo_entrega) : null,
        notas: formData.notas?.trim() || null,
        activo: formData.activo
      }

      setValidatedData(proveedorData)

      if (existeNombre) {
        setShowNombreWarningModal(true)
        return
      }

      setShowConfirmModal(true)
    } catch (err) {
      console.error('Error inesperado:', err)
      setError(err.message || 'Error inesperado al validar los datos')
    }
  }

  const handleConfirmSave = async () => {
    setShowConfirmModal(false)
    setShowNombreWarningModal(false)
    setSaving(true)
    setError(null)

    try {
      if (isEditing) {
        const { error: err } = await updateProveedor(id, validatedData)
        if (err) {
          setError(err.message || 'Error al actualizar el proveedor')
          setSaving(false)
          return
        }
      } else {
        const { error: err } = await createProveedor(validatedData)
        if (err) {
          setError(err.message || 'Error al crear el proveedor')
          setSaving(false)
          return
        }
      }

      setSaving(false)
      navigate('/proveedores', { 
        replace: true,
        state: { 
          success: true, 
          message: isEditing ? 'Proveedor actualizado correctamente' : 'Proveedor creado correctamente' 
        } 
      })
    } catch (err) {
      console.error('Error inesperado:', err)
      setError(err.message || 'Error inesperado al guardar el proveedor')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando proveedor...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div>
            <h1>{isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h1>
            <p className="text-secondary">
              {isEditing ? 'Modifica la información del proveedor' : 'Completa los datos del nuevo proveedor'}
            </p>
          </div>
          <Link to="/proveedores">
            <Button variant="outline">← Volver a Proveedores</Button>
          </Link>
        </div>

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="proveedor-form">
            <div className="form-row">
              <div className="form-col form-col-full">
                <Input
                  label="Nombre / Razón Social"
                  name="nombre_razon_social"
                  value={formData.nombre_razon_social}
                  onChange={handleChange}
                  required
                  placeholder="Nombre o razón social del proveedor"
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
                  placeholder="proveedor@email.com (opcional)"
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
              <div className="form-col">
                <Input
                  label="CUIT / RUT"
                  name="cuit_rut"
                  value={formData.cuit_rut}
                  onChange={handleChange}
                  placeholder="CUIT/RUT (opcional)"
                />
              </div>
              <div className="form-col">
                <Input
                  label="Contacto Principal"
                  name="contacto_principal"
                  value={formData.contacto_principal}
                  onChange={handleChange}
                  placeholder="Nombre del contacto (opcional)"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-col">
                <Input
                  label="Condiciones de Pago"
                  name="condiciones_pago"
                  value={formData.condiciones_pago}
                  onChange={handleChange}
                  placeholder="Ej: Contado, 30 días (opcional)"
                />
              </div>
              <div className="form-col">
                <Input
                  label="Plazo de Entrega (días)"
                  name="plazo_entrega"
                  type="number"
                  min="0"
                  value={formData.plazo_entrega}
                  onChange={handleChange}
                  placeholder="Días (opcional)"
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
              <div className="form-col form-col-full">
                <label className="form-label">
                  Notas
                  <textarea
                    name="notas"
                    value={formData.notas}
                    onChange={handleChange}
                    className="form-control"
                    rows="3"
                    placeholder="Notas adicionales (opcional)"
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
                  <span>Proveedor Activo</span>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <Link to="/proveedores">
                <Button type="button" variant="outline" disabled={saving}>
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" variant="primary" loading={saving} disabled={saving}>
                {isEditing ? 'Actualizar Proveedor' : 'Crear Proveedor'}
              </Button>
            </div>
          </form>
        </Card>

        <Modal
          isOpen={showNombreWarningModal}
          onClose={() => {
            setShowNombreWarningModal(false)
            setValidatedData(null)
          }}
          title="Advertencia: Nombre Duplicado"
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
            Ya existe un proveedor registrado con el nombre <strong>"{formData.nombre_razon_social}"</strong>.
          </p>
          <p style={{ marginTop: '1rem' }}>
            ¿Deseas continuar con la carga de todos modos?
          </p>
        </Modal>

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
                {isEditing ? 'Actualizar Proveedor' : 'Crear Proveedor'}
              </Button>
            </>
          }
        >
          <p>
            {isEditing 
              ? '¿Estás seguro de que deseas actualizar los datos del proveedor?'
              : '¿Estás seguro de que deseas crear este proveedor con los datos ingresados?'
            }
          </p>
        </Modal>
      </div>
    </Layout>
  )
}

export default ProveedorForm

