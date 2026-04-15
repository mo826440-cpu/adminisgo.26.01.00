// Módulo Otros costos — solo dueño (ruta AdminRoute + RLS en Supabase)
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Spinner, Alert, Badge } from '../../components/common'
import { useAuthContext } from '../../context/AuthContext'
import {
  getOtrosCostos,
  createOtroCosto,
  deleteOtroCosto,
  OTROS_COSTOS_TIPOS,
} from '../../services/otrosCostos'
import '../../styles/registros-seccion.css'
import './OtrosCostosPage.css'

function formatMoneyAR(n) {
  const num = Number(n || 0)
  return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatFechaCorta(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function badgeVariantTipo(tipo) {
  if (tipo === 'Fijo') return 'secondary'
  if (tipo === 'Variable') return 'info'
  if (tipo === 'Inversión') return 'primary'
  return 'secondary'
}

function defaultFechaDesde() {
  const a = new Date()
  const d = new Date(a.getFullYear(), a.getMonth() - 1, a.getDate())
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function defaultFechaHasta() {
  const a = new Date()
  const y = a.getFullYear()
  const m = String(a.getMonth() + 1).padStart(2, '0')
  const d = String(a.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function OtrosCostosPage() {
  const { usuario, isAdmin, loading: authLoading } = useAuthContext()

  const [registros, setRegistros] = useState([])
  const [loadingLista, setLoadingLista] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroDesde, setFiltroDesde] = useState(defaultFechaDesde)
  const [filtroHasta, setFiltroHasta] = useState(defaultFechaHasta)

  const [tipo, setTipo] = useState('Variable')
  const [descripcion, setDescripcion] = useState('')
  const [costoStr, setCostoStr] = useState('')
  const [formErrors, setFormErrors] = useState([])

  const puedeUsar = isAdmin && usuario?.comercio_id != null && usuario?.id

  const cargar = useCallback(async () => {
    if (!puedeUsar) {
      setRegistros([])
      setLoadingLista(false)
      return
    }
    setLoadingLista(true)
    setError(null)
    const { data, error: err } = await getOtrosCostos({
      tipo: filtroTipo,
      fechaDesde: filtroDesde || undefined,
      fechaHasta: filtroHasta || undefined,
    })
    if (err) {
      setError(err.message || 'No se pudieron cargar los registros.')
      setRegistros([])
    } else {
      setRegistros(data || [])
    }
    setLoadingLista(false)
  }, [puedeUsar, filtroTipo, filtroDesde, filtroHasta])

  useEffect(() => {
    if (!authLoading) {
      void cargar()
    }
  }, [authLoading, cargar])

  const validarCosto = (s) => {
    const t = String(s || '').trim().replace(',', '.')
    if (t === '') return { ok: false, msg: 'Ingresá un importe.' }
    const n = Number(t)
    if (!Number.isFinite(n)) return { ok: false, msg: 'El importe debe ser numérico.' }
    if (n < 0) return { ok: false, msg: 'El importe no puede ser negativo.' }
    if (n > 99999999999999.99) return { ok: false, msg: 'Importe fuera del rango permitido.' }
    return { ok: true, value: Math.round(n * 100) / 100 }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormErrors([])
    setSuccess(null)
    const errs = []
    const desc = descripcion.trim()
    if (!desc) errs.push('La descripción es obligatoria.')
    const c = validarCosto(costoStr)
    if (!c.ok) errs.push(c.msg)
    if (!OTROS_COSTOS_TIPOS.includes(tipo)) errs.push('Seleccioná un tipo válido.')
    if (errs.length) {
      setFormErrors(errs)
      return
    }
    setSaving(true)
    setError(null)
    const { error: err } = await createOtroCosto({
      comercio_id: usuario.comercio_id,
      usuario_id: usuario.id,
      tipo,
      descripcion: desc,
      costo: c.value,
    })
    setSaving(false)
    if (err) {
      setError(err.message || 'No se pudo guardar el registro.')
      return
    }
    setSuccess('Costo registrado correctamente.')
    setDescripcion('')
    setCostoStr('')
    setTipo('Variable')
    void cargar()
  }

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este registro de otros costos?')) return
    setDeletingId(id)
    setError(null)
    const { error: err } = await deleteOtroCosto(id)
    setDeletingId(null)
    if (err) {
      setError(err.message || 'No se pudo eliminar.')
      return
    }
    setSuccess('Registro eliminado.')
    void cargar()
  }

  const tituloSeccion = useMemo(
    () => (
      <div className="otros-costos-filtros-bar">
        <div className="otros-costos-filtros-grid">
          <label className="otros-costos-field">
            <span className="otros-costos-field-label">Tipo</span>
            <select
              className="form-control otros-costos-select"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="todos">Todos</option>
              {OTROS_COSTOS_TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="otros-costos-field">
            <span className="otros-costos-field-label">Desde</span>
            <input
              type="date"
              className="form-control"
              value={filtroDesde}
              onChange={(e) => setFiltroDesde(e.target.value)}
            />
          </label>
          <label className="otros-costos-field">
            <span className="otros-costos-field-label">Hasta</span>
            <input
              type="date"
              className="form-control"
              value={filtroHasta}
              min={filtroDesde}
              onChange={(e) => setFiltroHasta(e.target.value)}
            />
          </label>
          <div className="otros-costos-filtros-actions">
            <Button type="button" variant="outline" size="sm" onClick={() => void cargar()} disabled={loadingLista}>
              Aplicar filtros
            </Button>
          </div>
        </div>
      </div>
    ),
    [filtroTipo, filtroDesde, filtroHasta, loadingLista, cargar]
  )

  if (authLoading) {
    return (
      <Layout>
        <div className="otros-costos-loading">
          <Spinner size="lg" />
          <p>Cargando…</p>
        </div>
      </Layout>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <Layout>
      <div className="container otros-costos-page">
        <div className="page-header otros-costos-header">
          <div>
            <div className="section-label">MÓDULO</div>
            <h1 className="registros-seccion-titulo otros-costos-title">Otros costos</h1>
            <p className="text-secondary otros-costos-subtitle">
              Registrá gastos fijos, variables o inversiones. Visible solo para el dueño del comercio.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="danger" className="otros-costos-alert" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" className="otros-costos-alert" dismissible onDismiss={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Card className="otros-costos-card otros-costos-card--form">
          <h2 className="otros-costos-card-title">Nuevo registro</h2>
          <form className="otros-costos-form" onSubmit={handleSubmit} noValidate>
            <div className="otros-costos-form-grid">
              <label className="otros-costos-field">
                <span className="otros-costos-field-label">Tipo *</span>
                <select className="form-control otros-costos-select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {OTROS_COSTOS_TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="otros-costos-field otros-costos-field--grow">
                <span className="otros-costos-field-label">Descripción *</span>
                <input
                  type="text"
                  className="form-control"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalle del costo"
                  maxLength={2000}
                  autoComplete="off"
                />
              </label>
              <label className="otros-costos-field">
                <span className="otros-costos-field-label">Costo (ARS) *</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="form-control"
                  value={costoStr}
                  onChange={(e) => setCostoStr(e.target.value)}
                  placeholder="0,00"
                />
              </label>
            </div>
            {formErrors.length > 0 && (
              <ul className="otros-costos-form-errors">
                {formErrors.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            )}
            <div className="otros-costos-form-actions">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar costo'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="otros-costos-card">
          <div className="section-label">SECCIÓN</div>
          <h3 className="registros-seccion-titulo">REGISTROS DE OTROS COSTOS</h3>
          {tituloSeccion}

          {loadingLista ? (
            <div className="otros-costos-loading-inline">
              <Spinner />
              <span>Cargando registros…</span>
            </div>
          ) : registros.length === 0 ? (
            <p className="otros-costos-empty text-secondary">No hay registros con los filtros actuales.</p>
          ) : (
            <div className="table-container otros-costos-table-wrap">
              <table className="table table-sticky-header otros-costos-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Descripción</th>
                    <th className="otros-costos-th-monto">Costo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => (
                    <tr key={r.id}>
                      <td>{formatFechaCorta(r.created_at)}</td>
                      <td>
                        <Badge variant={badgeVariantTipo(r.tipo)}>{r.tipo}</Badge>
                      </td>
                      <td>{r.descripcion}</td>
                      <td className="otros-costos-td-monto">{formatMoneyAR(r.costo)}</td>
                      <td>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleEliminar(r.id)}
                          disabled={deletingId === r.id}
                        >
                          {deletingId === r.id ? '…' : 'Eliminar'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}
