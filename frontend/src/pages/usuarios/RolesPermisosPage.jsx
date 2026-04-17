// Matriz de permisos por rol (solo dueño; por comercio)
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { Card, Button, Spinner, Alert } from '../../components/common'
import { getRoles } from '../../services/usuarios'
import { getAppModulosCatalog, getPermisosPorRol, upsertPermisosRol } from '../../services/permisos'
import { useAuthContext } from '../../context/AuthContext'
import { MODULO_LABELS } from '../../constants/modulosPermiso'
import '../../styles/registros-seccion.css'
import './RolesPermisosPage.css'

function RolesPermisosPage() {
  const { usuario, refreshPermisos } = useAuthContext()
  const [roles, setRoles] = useState([])
  const [modulos, setModulos] = useState([])
  const [rolId, setRolId] = useState('')
  const [checks, setChecks] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [okMsg, setOkMsg] = useState(null)

  const rolesEditables = useMemo(
    () => roles.filter((r) => (r.nombre || '').toLowerCase().trim() !== 'dueño'),
    [roles]
  )

  const cargarCatalogos = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [rRes, mRes] = await Promise.all([getRoles(), getAppModulosCatalog()])
    if (rRes.error) {
      setError(rRes.error.message || 'No se pudieron cargar los roles.')
      setLoading(false)
      return
    }
    if (mRes.error) {
      setError(mRes.error.message || 'No se pudieron cargar los módulos.')
      setLoading(false)
      return
    }
    setRoles(rRes.data || [])
    setModulos(mRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void cargarCatalogos()
  }, [cargarCatalogos])

  const cargarMatriz = useCallback(async (rid) => {
    if (!rid) {
      setChecks({})
      return
    }
    setError(null)
    const { data, error: err } = await getPermisosPorRol(Number(rid))
    if (err) {
      setError(err.message || 'No se pudo cargar la matriz.')
      setChecks({})
      return
    }
    const next = {}
    for (const row of data || []) {
      if (row.codigo) next[row.codigo] = !!row.permitido
    }
    for (const m of modulos) {
      if (next[m.codigo] === undefined) next[m.codigo] = true
    }
    setChecks(next)
  }, [modulos])

  useEffect(() => {
    if (rolId && modulos.length) void cargarMatriz(rolId)
  }, [rolId, modulos.length, cargarMatriz])

  useEffect(() => {
    if (!rolId && rolesEditables.length) {
      setRolId(String(rolesEditables[0].id))
    }
  }, [rolId, rolesEditables])

  const toggle = (codigo) => {
    setChecks((prev) => ({ ...prev, [codigo]: !prev[codigo] }))
  }

  const guardar = async () => {
    if (!rolId || !usuario?.comercio_id) return
    setSaving(true)
    setError(null)
    setOkMsg(null)
    try {
      const filas = modulos.map((m) => ({
        modulo_id: m.id,
        permitido: !!checks[m.codigo],
      }))
      const { error: err } = await upsertPermisosRol(Number(rolId), filas, usuario.comercio_id)
      if (err) throw new Error(err.message || 'Error al guardar')
      setOkMsg('Permisos guardados.')
      await refreshPermisos()
    } catch (e) {
      setError(e.message || 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container roles-permisos-page" style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p>Cargando…</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container roles-permisos-page">
        <div className="page-header roles-permisos-header">
          <div>
            <div className="section-label">SECCIÓN</div>
            <h1 className="registros-seccion-titulo">Permisos por rol</h1>
            <p className="text-secondary">
              Definí qué módulos puede usar cada rol en tu comercio. El rol <strong>dueño</strong> siempre tiene
              acceso total y no se configura aquí.
            </p>
          </div>
          <Link to="/usuarios">
            <Button variant="outline">Volver a usuarios</Button>
          </Link>
        </div>

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        {okMsg && (
          <Alert variant="success" dismissible onDismiss={() => setOkMsg(null)}>
            {okMsg}
          </Alert>
        )}

        <Card className="roles-permisos-card">
          <div className="roles-permisos-toolbar">
            <label htmlFor="rol-permisos-select" className="roles-permisos-label">
              Rol a configurar
            </label>
            <select
              id="rol-permisos-select"
              className="form-control roles-permisos-select"
              value={rolId}
              onChange={(e) => setRolId(e.target.value)}
            >
              {rolesEditables.length === 0 ? (
                <option value="">No hay roles editables</option>
              ) : (
                rolesEditables.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))
              )}
            </select>
            <Button type="button" variant="primary" onClick={() => void guardar()} disabled={saving || !rolId}>
              {saving ? 'Guardando…' : 'Guardar permisos'}
            </Button>
          </div>

          <div className="roles-permisos-table-wrap">
            <table className="table roles-permisos-table">
              <thead>
                <tr>
                  <th>Módulo</th>
                  <th className="roles-permisos-th-check">Permitido</th>
                </tr>
              </thead>
              <tbody>
                {modulos.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span className="roles-permisos-nombre">{m.nombre || MODULO_LABELS[m.codigo] || m.codigo}</span>
                      <span className="roles-permisos-codigo text-secondary">{m.codigo}</span>
                    </td>
                    <td className="roles-permisos-td-check">
                      <input
                        type="checkbox"
                        checked={!!checks[m.codigo]}
                        onChange={() => toggle(m.codigo)}
                        aria-label={`Permitir ${m.nombre}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  )
}

export default RolesPermisosPage
