import { useEffect, useState } from 'react'
import { Card, Button, Alert, Spinner, Input } from '../../components/common'
import {
  getFormasPago,
  createFormaPago,
  updateFormaPago,
  setFormaPagoPreferible,
  deleteFormaPago,
} from '../../services/formasPago'
import './ConfigFormasPagoSection.css'

export default function ConfigFormasPagoSection() {
  const [loading, setLoading] = useState(true)
  const [formas, setFormas] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [savingId, setSavingId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getFormasPago()
    if (err) setError(err.message || 'Error al cargar formas de pago')
    else setFormas(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handlePreferible = async (id) => {
    setSavingId(id)
    const { error: err } = await setFormaPagoPreferible(id)
    setSavingId(null)
    if (err) {
      setError(err.message || 'No se pudo marcar como preferible')
      return
    }
    await load()
    setSuccess('Forma de pago preferible actualizada')
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleToggleActivo = async (forma) => {
    setSavingId(forma.id)
    const { error: err } = await updateFormaPago(forma.id, { activo: !forma.activo })
    setSavingId(null)
    if (err) {
      setError(err.message || 'No se pudo actualizar')
      return
    }
    await load()
  }

  const handleAgregar = async (e) => {
    e.preventDefault()
    if (!nuevoNombre.trim()) return
    setSavingId('new')
    const { error: err } = await createFormaPago({ nombre: nuevoNombre.trim() })
    setSavingId(null)
    if (err) {
      setError(err.message || 'No se pudo crear la forma de pago')
      return
    }
    setNuevoNombre('')
    await load()
    setSuccess('Forma de pago agregada')
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleDesactivar = async (id) => {
    setSavingId(id)
    const { error: err } = await deleteFormaPago(id)
    setSavingId(null)
    if (err) {
      setError(err.message || 'No se pudo desactivar')
      return
    }
    await load()
  }

  return (
    <Card
      id="formas-pago"
      title="Formas de pago"
      className="config-section config-formas-pago-section"
    >
      <p className="text-secondary config-formas-pago-intro">
        Gestioná las formas de pago disponibles al registrar ventas. Marcá una como{' '}
        <strong>preferible</strong> para que aparezca por defecto en el formulario de venta.
      </p>

      {error ? (
        <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      ) : null}

      {loading ? (
        <div className="config-formas-pago-loading">
          <Spinner size="sm" /> Cargando…
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Código</th>
                  <th>Preferible</th>
                  <th>Activa</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {formas.map((f) => (
                  <tr key={f.id}>
                    <td>{f.nombre}</td>
                    <td className="text-secondary">{f.codigo}</td>
                    <td>
                      <input
                        type="radio"
                        name="forma-pago-preferible"
                        checked={Boolean(f.preferible)}
                        disabled={savingId === f.id || !f.activo}
                        onChange={() => handlePreferible(f.id)}
                        aria-label={`Preferible: ${f.nombre}`}
                      />
                    </td>
                    <td>{f.activo ? 'Sí' : 'No'}</td>
                    <td>
                      <div className="config-formas-pago-actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActivo(f)}
                          disabled={savingId === f.id}
                        >
                          {f.activo ? 'Desactivar' : 'Activar'}
                        </Button>
                        {f.activo ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="btn-link-danger"
                            onClick={() => handleDesactivar(f.id)}
                            disabled={savingId === f.id}
                          >
                            Ocultar
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form className="config-formas-pago-add" onSubmit={handleAgregar}>
            <Input
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Nueva forma de pago (ej. Mercado Pago)"
            />
            <Button type="submit" variant="primary" loading={savingId === 'new'} disabled={!nuevoNombre.trim()}>
              Agregar
            </Button>
          </form>
        </>
      )}
    </Card>
  )
}
