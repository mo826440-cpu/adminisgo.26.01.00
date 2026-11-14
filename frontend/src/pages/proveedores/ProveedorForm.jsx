// Formulario para crear/editar proveedor
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Input, Alert, Spinner, Modal } from '../../components/common'
import { getProveedor, createProveedor, updateProveedor, verificarEmailProveedor, verificarCuitProveedor, verificarNombreProveedor } from '../../services/proveedores'
import { readProveedoresListState } from './proveedoresListState'
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

  const [fieldErrors, setFieldErrors] = useState({})
  const [fiscalAbierta, setFiscalAbierta] = useState(false)
  const [comercialAbierta, setComercialAbierta] = useState(false)
  const [baseline, setBaseline] = useState('')
  const nombreRef = useRef(null)
  const emailRef = useRef(null)
  const cuitRef = useRef(null)
  const condicionesRef = useRef(null)

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
      setBaseline(JSON.stringify({
        nombre_razon_social: data.nombre_razon_social || '',
        email: data.email || '',
        telefono: data.telefono || '',
        direccion: data.direccion || '',
        cuit_rut: data.cuit_rut || '',
        contacto_principal: data.contacto_principal || '',
        condiciones_pago: data.condiciones_pago || '',
        plazo_entrega: data.plazo_entrega || '',
        notas: data.notas || '',
        activo: data.activo ?? true,
      }))
    }
    setLoading(false)
  }

  const sucio = baseline !== '' && JSON.stringify(formData) !== baseline

  useEffect(() => {
    if (!isEditing) setBaseline(JSON.stringify(formData))
    // Solo la base inicial del alta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  useEffect(() => {
    const avisar = (event) => {
      if (!sucio || saving) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [sucio, saving])

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
      const siguientes = {}
      if (!formData.nombre_razon_social.trim()) siguientes.nombre = 'El nombre del proveedor es obligatorio.'
      if (formData.email && formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        siguientes.email = 'El email no tiene un formato válido.'
        setFiscalAbierta(true)
      }
      setFieldErrors(siguientes)
      setError(errores.join('. '))
      window.setTimeout(() => {
        if (siguientes.nombre) nombreRef.current?.focus()
        else if (siguientes.email) emailRef.current?.focus()
      }, 0)
      return
    }
    setFieldErrors({})

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
          setFiscalAbierta(true)
          setFieldErrors({ cuit: 'El CUIT ya está registrado.' })
          setError('El CUIT/RUT ya está registrado. Por favor, verifica los datos.')
          window.setTimeout(() => cuitRef.current?.focus(), 0)
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
          setFiscalAbierta(true)
          setFieldErrors({ email: 'El email ya está en uso.' })
          setError('El email ya está en uso. Por favor, usa un email diferente.')
          window.setTimeout(() => emailRef.current?.focus(), 0)
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
      const guardado = isEditing
        ? await updateProveedor(id, validatedData)
        : await createProveedor(validatedData)
      if (guardado.error) {
        setError(guardado.error.message || 'Error al guardar el proveedor')
        setSaving(false)
        return
      }

      setBaseline(JSON.stringify(formData))
      setSaving(false)
      navigate('/proveedores', {
        replace: true,
        state: {
          success: true,
          highlightId: guardado.data?.id || id,
          restoreList: readProveedoresListState(),
          message: isEditing ? 'Proveedor actualizado correctamente' : 'Proveedor creado correctamente',
        },
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
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="proveedor-form">
            <p className="prov-form__intro">
              {isEditing ? 'Actualizá los datos del proveedor.' : 'Cargá los datos principales del proveedor.'}
            </p>
            <Input
              ref={nombreRef}
              label="Nombre del proveedor"
              name="nombre_razon_social"
              value={formData.nombre_razon_social}
              onChange={handleChange}
              required
              error={fieldErrors.nombre}
              placeholder="Nombre o razón social"
            />
            <div className="form-row">
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
              <div className="form-col">
                <Input
                  label="Contacto"
                  name="contacto_principal"
                  value={formData.contacto_principal}
                  onChange={handleChange}
                  placeholder="Nombre del contacto (opcional)"
                />
              </div>
            </div>
            <label className="prov-switch">
              <input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} />
              <span>Proveedor activo</span>
            </label>

            <details className="prov-seccion" open={fiscalAbierta} onToggle={(e) => setFiscalAbierta(e.currentTarget.open)}>
              <summary>Datos fiscales y dirección</summary>
              <div className="form-row">
                <div className="form-col">
                  <Input
                    ref={cuitRef}
                    label="CUIT / RUT"
                    name="cuit_rut"
                    value={formData.cuit_rut}
                    onChange={handleChange}
                    error={fieldErrors.cuit}
                    placeholder="Opcional"
                  />
                </div>
                <div className="form-col">
                  <Input
                    ref={emailRef}
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={fieldErrors.email}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <label className="form-label">
                Dirección
                <textarea name="direccion" value={formData.direccion} onChange={handleChange} className="form-control" rows="2" placeholder="Opcional" />
              </label>
            </details>

            <details className="prov-seccion" open={comercialAbierta} onToggle={(e) => setComercialAbierta(e.currentTarget.open)}>
              <summary>Condiciones comerciales</summary>
              <div className="form-row">
                <div className="form-col">
                  <Input
                    ref={condicionesRef}
                    label="Condiciones de pago"
                    name="condiciones_pago"
                    value={formData.condiciones_pago}
                    onChange={handleChange}
                    placeholder="Ej: Contado, 30 días"
                  />
                </div>
                <div className="form-col">
                  <Input
                    label="Plazo de entrega (días)"
                    name="plazo_entrega"
                    type="number"
                    min="0"
                    value={formData.plazo_entrega}
                    onChange={handleChange}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <label className="form-label">
                Notas
                <textarea name="notas" value={formData.notas} onChange={handleChange} className="form-control" rows="2" placeholder="Opcional" />
              </label>
            </details>

            <div className="form-actions">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  if (sucio && !window.confirm('Hay cambios sin guardar. ¿Salir de todos modos?')) return
                  navigate('/proveedores', { state: { restoreList: readProveedoresListState() } })
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={saving} disabled={saving}>
                {isEditing ? 'Guardar cambios' : 'Crear proveedor'}
              </Button>
            </div>
          </form>
        </Card>

        <Modal
          className="prov-modal"
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
          className="prov-modal"
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

