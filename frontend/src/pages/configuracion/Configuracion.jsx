// Página de Configuración
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Input, Alert, Spinner, Modal, Badge } from '../../components/common'
import { getComercio, updateComercio } from '../../services/comercio'
import { getUsuario, updateUsuario, eliminarCuentaComercio } from '../../services/usuarios'
import { updatePassword, signOut } from '../../services/auth'
import { getEstadoSuscripcion } from '../../services/planes'
import { useAuthContext } from '../../context/AuthContext'
import { useDateTime } from '../../context/DateTimeContext'
import './Configuracion.css'

function Configuracion() {
  const { user } = useAuthContext()
  const { timezone, dateFormat, updateTimezone, updateDateFormat, TIMEZONES, DATE_FORMATS } = useDateTime()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Estados para comercio
  const [comercio, setComercio] = useState(null)
  const [comercioForm, setComercioForm] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    cuit_rut: ''
  })

  // Estados para usuario
  const [usuario, setUsuario] = useState(null)
  const [usuarioForm, setUsuarioForm] = useState({
    nombre: '',
    telefono: ''
  })

  // Estados para contraseña
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Estados para tema y formato de impresión
  const [tema, setTema] = useState(() => {
    return localStorage.getItem('tema') || 'claro'
  })
  const [formatoImpresion, setFormatoImpresion] = useState(() => {
    return localStorage.getItem('formatoImpresion') || 'pos80'
  })

  // Estado de suscripción (Tu plan actual)
  const [suscripcion, setSuscripcion] = useState(null)
  const [loadingSuscripcion, setLoadingSuscripcion] = useState(true)

  // Eliminar cuenta (solo admin)
  const [eliminarAceptado, setEliminarAceptado] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [showEliminarModal, setShowEliminarModal] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    loadData()
    // Aplicar tema al cargar usando data-theme attribute
    if (tema === 'oscuro') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [tema])

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
    if (user) cargarSuscripcion()
  }, [user])

  const getNombrePlan = (tipo) => {
    const nombres = { gratis: 'Plan Gratuito', pago: 'Plan Pago', basico: 'Plan Pago', personalizado: 'Plan Personalizado' }
    return nombres[tipo] || tipo || 'Sin plan'
  }
  const getColorPlan = (tipo) => {
    const colores = { gratis: 'info', pago: 'primary', basico: 'primary', personalizado: 'warning' }
    return colores[tipo] || 'secondary'
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Cargar comercio
      const { data: comercioData, error: comercioError } = await getComercio()
      if (comercioError) throw comercioError

      if (comercioData) {
        setComercio(comercioData)
        setComercioForm({
          nombre: comercioData.nombre || '',
          direccion: comercioData.direccion || '',
          telefono: comercioData.telefono || '',
          email: comercioData.email || '',
          cuit_rut: comercioData.cuit_rut || ''
        })
      }

      // Cargar usuario
      const { data: usuarioData, error: usuarioError } = await getUsuario()
      if (usuarioError) throw usuarioError

      if (usuarioData) {
        setUsuario(usuarioData)
        setUsuarioForm({
          nombre: usuarioData.nombre || '',
          telefono: usuarioData.telefono || ''
        })
      }
    } catch (err) {
      setError(err.message || 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleComercioChange = (e) => {
    const { name, value } = e.target
    setComercioForm(prev => ({ ...prev, [name]: value }))
  }

  const handleUsuarioChange = (e) => {
    const { name, value } = e.target
    setUsuarioForm(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveComercio = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const datosToUpdate = {
        nombre: comercioForm.nombre.trim(),
        direccion: comercioForm.direccion?.trim() || null,
        telefono: comercioForm.telefono?.trim() || null,
        email: comercioForm.email?.trim() || null,
        cuit_rut: comercioForm.cuit_rut?.trim() || null
      }

      if (!datosToUpdate.nombre) {
        setError('El nombre del comercio es obligatorio')
        setSaving(false)
        return
      }

      const { error: err } = await updateComercio(datosToUpdate)
      if (err) throw err

      setSuccessMessage('Información del comercio actualizada correctamente')
      await loadData()
    } catch (err) {
      setError(err.message || 'Error al actualizar el comercio')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveUsuario = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const datosToUpdate = {
        nombre: usuarioForm.nombre.trim(),
        telefono: usuarioForm.telefono?.trim() || null
      }

      if (!datosToUpdate.nombre) {
        setError('El nombre del usuario es obligatorio')
        setSaving(false)
        return
      }

      const { error: err } = await updateUsuario(datosToUpdate)
      if (err) throw err

      setSuccessMessage('Información del usuario actualizada correctamente')
      await loadData()
    } catch (err) {
      setError(err.message || 'Error al actualizar el usuario')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
        setError('La nueva contraseña debe tener al menos 6 caracteres')
        setSaving(false)
        return
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError('Las contraseñas no coinciden')
        setSaving(false)
        return
      }

      const { error: err } = await updatePassword(passwordForm.newPassword)
      if (err) throw err

      setShowPasswordModal(false)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setSuccessMessage('Contraseña actualizada correctamente')
    } catch (err) {
      setError(err.message || 'Error al actualizar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  const handleTemaChange = (newTema) => {
    setTema(newTema)
    localStorage.setItem('tema', newTema)
    // Aplicar tema usando data-theme attribute (el CSS usa [data-theme="dark"])
    if (newTema === 'oscuro') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  const handleFormatoImpresionChange = (newFormato) => {
    setFormatoImpresion(newFormato)
    localStorage.setItem('formatoImpresion', newFormato)
  }

  const handleEliminarCuenta = async () => {
    if (!eliminarAceptado) {
      setError('Debés aceptar que se eliminarán todos los datos y tu cuenta de forma permanente.')
      return
    }
    setEliminando(true)
    setError(null)
    try {
      const { error: err } = await eliminarCuentaComercio()
      if (err) throw err
      await signOut()
      navigate('/', { replace: true })
      window.location.reload()
    } catch (err) {
      setError(err?.message || 'Error al eliminar la cuenta')
    } finally {
      setEliminando(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem' }}>Cargando configuración...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Configuración</h1>
            <p className="text-secondary">Gestiona la configuración de tu comercio y perfil</p>
          </div>
        </div>

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" dismissible onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {/* Tu Plan Actual */}
        {!loadingSuscripcion && suscripcion?.plan && (
          <Card title="Tu Plan Actual" className="config-section">
            <div style={{ marginBottom: '1rem' }}>
              <Badge variant={getColorPlan(suscripcion.plan.tipo)} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                {getNombrePlan(suscripcion.plan.tipo)}
              </Badge>
            </div>
            {suscripcion.plan.tipo === 'gratis' && (
              <div style={{ marginBottom: '1rem' }}>
                <Button
                  variant="primary"
                  onClick={() => navigate('/configuracion/cambiar-plan')}
                  fullWidth
                >
                  ⬆️ Actualizar a Plan Pago
                </Button>
              </div>
            )}
            {suscripcion.ventas && (
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Ventas este mes:</strong> {suscripcion.ventas.actuales}
                {!suscripcion.ventas.ilimitado && suscripcion.ventas.limite && (
                  <span className="text-secondary"> / {suscripcion.ventas.limite}</span>
                )}
                {suscripcion.ventas.ilimitado && (
                  <Badge variant="success" style={{ marginLeft: '0.5rem' }}>Ilimitadas</Badge>
                )}
              </div>
            )}
            {suscripcion.usuarios && (
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Usuarios:</strong> {suscripcion.usuarios.actuales}
                {!suscripcion.usuarios.ilimitado && suscripcion.usuarios.limite && (
                  <span className="text-secondary"> / {suscripcion.usuarios.limite}</span>
                )}
                {suscripcion.usuarios.ilimitado && (
                  <Badge variant="success" style={{ marginLeft: '0.5rem' }}>Ilimitados</Badge>
                )}
              </div>
            )}
            {suscripcion.periodo_gratis?.activo && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>⏰ <strong>Período gratis activo</strong></p>
                {suscripcion.periodo_gratis.dias_restantes !== null && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {suscripcion.periodo_gratis.dias_restantes} días restantes
                  </p>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Información del Comercio */}
        <Card title="Información del Comercio" className="config-section">
          <form onSubmit={handleSaveComercio}>
            <div className="form-row">
              <div className="form-col form-col-full">
                <Input
                  label="Nombre del Comercio"
                  name="nombre"
                  value={comercioForm.nombre}
                  onChange={handleComercioChange}
                  required
                  placeholder="Nombre del comercio"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-col">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={comercioForm.email}
                  onChange={handleComercioChange}
                  placeholder="email@comercio.com"
                />
              </div>
              <div className="form-col">
                <Input
                  label="Teléfono"
                  name="telefono"
                  type="tel"
                  value={comercioForm.telefono}
                  onChange={handleComercioChange}
                  placeholder="Teléfono"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-col">
                <Input
                  label="CUIT/RUT"
                  name="cuit_rut"
                  value={comercioForm.cuit_rut}
                  onChange={handleComercioChange}
                  placeholder="CUIT/RUT"
                />
              </div>
              <div className="form-col">
                <Input
                  label="Dirección"
                  name="direccion"
                  value={comercioForm.direccion}
                  onChange={handleComercioChange}
                  placeholder="Dirección"
                />
              </div>
            </div>

            <div className="form-actions">
              <Button type="submit" variant="primary" loading={saving} disabled={saving}>
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Card>

        {/* Perfil de Usuario */}
        <Card title="Perfil de Usuario" className="config-section">
          <form onSubmit={handleSaveUsuario}>
            <div className="form-row">
              <div className="form-col">
                <Input
                  label="Nombre Completo"
                  name="nombre"
                  value={usuarioForm.nombre}
                  onChange={handleUsuarioChange}
                  required
                  placeholder="Tu nombre completo"
                />
              </div>
              <div className="form-col">
                <Input
                  label="Teléfono"
                  name="telefono"
                  type="tel"
                  value={usuarioForm.telefono}
                  onChange={handleUsuarioChange}
                  placeholder="Tu teléfono"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-col">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="text-secondary"
                />
                <small className="text-secondary">El email no se puede cambiar desde aquí</small>
              </div>
            </div>

            <div className="form-actions">
              <Button type="submit" variant="primary" loading={saving} disabled={saving}>
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Card>

        {/* Cambio de Contraseña */}
        <Card title="Cambio de Contraseña" className="config-section">
          <div className="password-section">
            <p className="text-secondary">Cambiá tu contraseña para mantener tu cuenta segura.</p>
            <Button
              variant="outline"
              onClick={() => setShowPasswordModal(true)}
            >
              Cambiar Contraseña
            </Button>
          </div>
        </Card>

        {/* Tema */}
        <Card title="Tema" className="config-section">
          <div className="theme-section">
            <p className="text-secondary">Elegí el tema de la aplicación.</p>
            <div className="theme-options">
              <button
                type="button"
                className={`theme-option ${tema === 'claro' ? 'active' : ''}`}
                onClick={() => handleTemaChange('claro')}
              >
                ☀️ Claro
              </button>
              <button
                type="button"
                className={`theme-option ${tema === 'oscuro' ? 'active' : ''}`}
                onClick={() => handleTemaChange('oscuro')}
              >
                🌙 Oscuro
              </button>
            </div>
          </div>
        </Card>

        {/* Formato de Impresión */}
        <Card title="Formato de Impresión" className="config-section">
          <div className="print-format-section">
            <p className="text-secondary">Elegí el formato de impresión para los tickets de venta.</p>
            <div className="form-row">
              <div className="form-col">
                <label className="form-label">
                  Formato de Ticket
                  <select
                    className="form-control"
                    value={formatoImpresion}
                    onChange={(e) => handleFormatoImpresionChange(e.target.value)}
                  >
                    <option value="pos80">POS 80mm (Ticket estándar)</option>
                    <option value="a4">A4 (Papel tamaño carta)</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Configuración de Fecha y Hora */}
        <Card title="Fecha y Hora" className="config-section">
          <div className="datetime-section">
            <p className="text-secondary">Configurá la zona horaria y el formato de fecha/hora que se mostrará en toda la aplicación.</p>
            <div className="form-row">
              <div className="form-col">
                <label className="form-label">
                  Zona Horaria
                  <select
                    className="form-control"
                    value={timezone}
                    onChange={(e) => updateTimezone(e.target.value)}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-col">
                <label className="form-label">
                  Formato de Fecha/Hora
                  <select
                    className="form-control"
                    value={dateFormat}
                    onChange={(e) => updateDateFormat(e.target.value)}
                  >
                    {DATE_FORMATS.map((fmt) => (
                      <option key={fmt.value} value={fmt.value}>
                        {fmt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Eliminar cuenta (solo dueño) */}
        <Card title="Eliminar cuenta" className="config-section config-section-danger">
          <div className="eliminar-cuenta-section">
            <p className="text-secondary">
              Esta acción es <strong>irreversible</strong>. Se eliminarán todos los datos del comercio (productos, ventas, compras, clientes, proveedores, etc.) y todas las cuentas de usuarios asociadas a este comercio, incluyendo la tuya.
            </p>
            <label className="eliminar-checkbox">
              <input
                type="checkbox"
                checked={eliminarAceptado}
                onChange={(e) => setEliminarAceptado(e.target.checked)}
              />
              <span>Acepto que se eliminarán todos los datos del comercio y mi cuenta de forma permanente.</span>
            </label>
            <div className="form-actions">
              <Button
                type="button"
                variant="danger"
                onClick={() => setShowEliminarModal(true)}
                disabled={!eliminarAceptado || eliminando}
                loading={eliminando}
              >
                Eliminar cuenta
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal de confirmación eliminar cuenta */}
      <Modal
        isOpen={showEliminarModal}
        onClose={() => setShowEliminarModal(false)}
        title="¿Eliminar cuenta?"
        closeOnOverlayClick={!eliminando}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowEliminarModal(false)}
              disabled={eliminando}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                setShowEliminarModal(false)
                await handleEliminarCuenta()
              }}
              loading={eliminando}
              disabled={eliminando}
            >
              Sí, eliminar todo
            </Button>
          </>
        }
      >
        <p>Se eliminarán todos los datos del comercio y todas las cuentas asociadas. No podés deshacer esta acción.</p>
        <p><strong>¿Estás seguro?</strong></p>
      </Modal>

      {/* Modal de Cambio de Contraseña */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false)
          setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          })
        }}
        title="Cambiar Contraseña"
        closeOnOverlayClick={false}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordModal(false)
                setPasswordForm({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                })
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleChangePassword}
              loading={saving}
              disabled={saving}
            >
              Cambiar Contraseña
            </Button>
          </>
        }
      >
        <div className="password-form-modal">
          <Input
            label="Nueva Contraseña"
            name="newPassword"
            type="password"
            value={passwordForm.newPassword}
            onChange={handlePasswordChange}
            required
            placeholder="Mínimo 6 caracteres"
            minLength={6}
          />
          <Input
            label="Confirmar Nueva Contraseña"
            name="confirmPassword"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={handlePasswordChange}
            required
            placeholder="Repite la contraseña"
          />
        </div>
      </Modal>
    </Layout>
  )
}

export default Configuracion

