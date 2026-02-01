// Formulario para invitar un nuevo usuario al comercio (solo admin)
// Campos: Nombre, Rol, Celular, Dirección, Mail. No contraseña: se envía invitación por correo.
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Input, Alert, Spinner } from '../../components/common'
import { getRoles, invitarUsuario } from '../../services/usuarios'
import './UsuarioForm.css'

function UsuarioForm() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [roles, setRoles] = useState([])
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    rol_id: '',
    telefono: '',
    direccion: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data, error: err } = await getRoles()
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      setRoles(data || [])
      if (data?.length) {
        const defaultRol = data.find((r) => r.nombre !== 'dueño') || data[0]
        setFormData((prev) => ({ ...prev, rol_id: String(defaultRol?.id ?? '') }))
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const errores = []
    if (!formData.nombre?.trim()) errores.push('El nombre es obligatorio.')
    if (!formData.email?.trim()) errores.push('El correo es obligatorio.')
    if (!formData.rol_id) errores.push('Debes elegir un rol.')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email?.trim() && !emailRegex.test(formData.email.trim())) {
      errores.push('El correo no tiene un formato válido.')
    }
    if (errores.length) {
      setError(errores.join(' '))
      return
    }

    setSaving(true)
    const { data, error: err } = await invitarUsuario({
      nombre: formData.nombre.trim(),
      email: formData.email.trim(),
      rol_id: Number(formData.rol_id),
      telefono: formData.telefono?.trim() || null,
      direccion: formData.direccion?.trim() || null,
    })
    setSaving(false)

    if (err) {
      setError(err.message)
      return
    }
    navigate('/usuarios', {
      replace: true,
      state: {
        success: true,
        message: 'Invitación enviada. El usuario debe confirmar su correo y establecer su contraseña.',
      },
    })
  }

  if (loading) {
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
      <div className="container usuario-form-container">
        <div className="page-header">
          <div>
            <h1>Invitar usuario</h1>
            <p className="text-secondary">
              Se enviará un correo para que el usuario confirme y defina su contraseña. Entrará al mismo comercio con el rol elegido.
            </p>
          </div>
          <Link to="/usuarios">
            <Button variant="secondary">Volver a usuarios</Button>
          </Link>
        </div>

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="usuario-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nombre">Nombre *</label>
                <Input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Nombre completo"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Correo (mail) *</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="rol_id">Rol *</label>
                <select
                  id="rol_id"
                  name="rol_id"
                  value={formData.rol_id}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="">Seleccionar rol</option>
                  {roles
                    .filter((r) => r.nombre !== 'dueño')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre} {r.descripcion ? `– ${r.descripcion}` : ''}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="telefono">Celular</label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="Ej. +54 11 1234-5678"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="direccion">Dirección (donde vive)</label>
              <Input
                id="direccion"
                name="direccion"
                type="text"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Dirección del usuario"
              />
            </div>

            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Enviando invitación...' : 'Enviar invitación'}
              </Button>
              <Link to="/usuarios">
                <Button type="button" variant="ghost">Cancelar</Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  )
}

export default UsuarioForm
