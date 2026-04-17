// Permisos por comercio (comercio_rol_modulos + app_modulos)
import { supabase } from './supabase'

/**
 * Catálogo global de módulos (lectura para cualquier autenticado).
 * @returns {Promise<{ data: Array<{ id: number, codigo: string, nombre: string, orden: number }>, error: Error | null }>}
 */
export async function getAppModulosCatalog() {
  try {
    const { data, error } = await supabase.from('app_modulos').select('id, codigo, nombre, orden').order('orden')
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    return { data: [], error }
  }
}

/**
 * Matriz de permisos para un rol del comercio (el dueño puede leer todos los roles).
 * @param {number} rolId
 * @returns {Promise<{ data: Array<{ modulo_id: number, codigo: string, permitido: boolean }>, error: Error | null }>}
 */
export async function getPermisosPorRol(rolId) {
  try {
    const { data, error } = await supabase
      .from('comercio_rol_modulos')
      .select('modulo_id, permitido, app_modulos(codigo)')
      .eq('rol_id', rolId)

    if (error) throw error
    const rows = (data || []).map((r) => ({
      modulo_id: r.modulo_id,
      permitido: !!r.permitido,
      codigo: Array.isArray(r.app_modulos) ? r.app_modulos[0]?.codigo : r.app_modulos?.codigo,
    }))
    return { data: rows, error: null }
  } catch (error) {
    return { data: [], error }
  }
}

/**
 * Permisos del usuario (RLS devuelve solo las filas de su rol).
 * @param {{ rol_nombre?: string }} usuario - fila de getUsuario con rol_nombre
 * @returns {Promise<Record<string, boolean | true>>}
 */
export async function fetchPermisosMapForUser(usuario) {
  if (!usuario) return {}
  const nombre = (usuario.rol_nombre || '').toLowerCase().trim()
  if (nombre === 'dueño') {
    return { __dueno: true }
  }

  const { data, error } = await supabase
    .from('comercio_rol_modulos')
    .select('permitido, app_modulos(codigo)')

  if (error) throw error

  const map = {}
  for (const r of data || []) {
    const cod = Array.isArray(r.app_modulos) ? r.app_modulos[0]?.codigo : r.app_modulos?.codigo
    if (cod) map[cod] = !!r.permitido
  }
  return map
}

/**
 * Guardar permisos de un rol (solo filas existentes se actualizan vía upsert).
 * @param {number} rolId - no debe ser rol dueño
 * @param {Array<{ modulo_id: number, permitido: boolean }>} filas
 */
export async function upsertPermisosRol(rolId, filas, comercioId) {
  const rows = filas.map((f) => ({
    comercio_id: comercioId,
    rol_id: rolId,
    modulo_id: f.modulo_id,
    permitido: !!f.permitido,
  }))

  const { error } = await supabase.from('comercio_rol_modulos').upsert(rows, {
    onConflict: 'comercio_id,rol_id,modulo_id',
  })
  return { error }
}
