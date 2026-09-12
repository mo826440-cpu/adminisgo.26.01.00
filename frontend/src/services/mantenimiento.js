import { supabase } from './supabase'

function normalizeCatalog(raw) {
  let list = raw
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list)
    } catch {
      return []
    }
  }
  if (!Array.isArray(list)) return []

  return list
    .map((row) => {
      const tableName = String(row?.table_name || '').trim()
      if (!tableName) return null
      const columns = Array.isArray(row.columns)
        ? row.columns
            .map((col) => ({
              column_name: String(col?.column_name || '').trim(),
              data_type: String(col?.data_type || '').trim(),
              ordinal_position: Number(col?.ordinal_position) || 0,
            }))
            .filter((col) => col.column_name)
            .sort((a, b) => a.ordinal_position - b.ordinal_position)
        : []
      const rowCount = row?.row_count == null ? null : Number(row.row_count)
      return {
        table_name: tableName,
        row_count: Number.isFinite(rowCount) ? rowCount : null,
        columns,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.table_name.localeCompare(b.table_name, 'es'))
}

function isMissingRpc(error) {
  const code = error?.code || ''
  const msg = (error?.message || '').toLowerCase()
  return (
    code === 'PGRST202' ||
    msg.includes('could not find the function') ||
    msg.includes('schema cache')
  )
}

function parseOpenApiCatalog(spec) {
  if (!spec || typeof spec !== 'object') return []
  const schemas = spec.definitions || spec.components?.schemas || {}
  const pathNames = Object.keys(spec.paths || {})
    .map((path) => path.replace(/^\//, '').split('/')[0])
    .filter((name) => name && name !== 'rpc')

  const tableNames = [...new Set(pathNames)]
    .filter((name) => schemas[name]?.properties)
    .sort((a, b) => a.localeCompare(b, 'es'))

  return tableNames.map((table_name) => {
    const props = schemas[table_name].properties || {}
    const columns = Object.keys(props).map((column_name, index) => {
      const prop = props[column_name] || {}
      return {
        column_name,
        data_type: String(prop.format || prop.type || '').trim(),
        ordinal_position: index + 1,
      }
    })
    return { table_name, row_count: null, columns }
  })
}

async function getEsquemaDesdeOpenApi() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Faltan las variables de entorno de Supabase.')
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData?.session?.access_token || key
  const response = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      Accept: 'application/openapi+json',
    },
  })

  if (!response.ok) {
    throw new Error('No se pudo leer el catálogo de tablas de la base de datos.')
  }

  const spec = await response.json()
  return parseOpenApiCatalog(spec)
}

/**
 * Tablas base del schema public con sus columnas.
 * Prefiere la RPC de mantenimiento; si aún no está aplicada, usa el OpenAPI de PostgREST.
 * @returns {Promise<{ data: Array<{ table_name: string, row_count: number | null, columns: Array<{ column_name: string, data_type: string, ordinal_position: number }> }>, error: Error | null, source: 'rpc' | 'openapi' | null }>}
 */
export async function getEsquemaTablas() {
  try {
    const { data, error } = await supabase.rpc('mantenimiento_listar_esquema')
    if (!error) {
      const payload = data && !Array.isArray(data) ? data : {}
      const tables = normalizeCatalog(payload.tables ?? data)
      return {
        data: tables,
        tableCount: Number(payload.table_count) || tables.length,
        databaseSizeBytes:
          payload.database_size_bytes == null ? null : Number(payload.database_size_bytes),
        error: null,
        source: 'rpc',
      }
    }
    if (!isMissingRpc(error)) {
      throw error
    }

    const fallback = await getEsquemaDesdeOpenApi()
    return {
      data: fallback,
      tableCount: fallback.length,
      databaseSizeBytes: null,
      error: null,
      source: 'openapi',
    }
  } catch (error) {
    return {
      data: [],
      tableCount: 0,
      databaseSizeBytes: null,
      error,
      source: null,
    }
  }
}
