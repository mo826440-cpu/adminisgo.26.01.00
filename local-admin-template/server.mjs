/**
 * Módulo de seguimiento (local) — corre solo en tu máquina.
 * Usa SERVICE ROLE: no exponer este servidor a internet.
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const PORT = Number(process.env.PORT || 3847)
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const publicDir = path.join(__dirname, 'public')

function projectRefFromUrl(url) {
  try {
    const host = new URL(url).hostname
    const m = host.match(/^([^.]+)\.supabase\.co$/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

async function countAuthUsers(supabase) {
  try {
    let total = 0
    let page = 1
    const perPage = 1000
    for (;;) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
      if (error) return { count: null, error: error.message }
      const users = data?.users ?? []
      total += users.length
      if (users.length < perPage) break
      page += 1
      if (page > 5000) break
    }
    return { count: total, error: null }
  } catch (e) {
    return { count: null, error: String(e?.message || e) }
  }
}

async function fetchDbOverview(supabase) {
  const { data, error } = await supabase.rpc('local_admin_db_overview')
  if (error) return { overview: null, error: error.message }
  const o = typeof data === 'string' ? JSON.parse(data) : data
  return {
    overview: {
      publicTableCount: o?.public_table_count ?? null,
      databaseSizeBytes: o?.database_size_bytes != null ? Number(o.database_size_bytes) : null,
    },
    error: null,
  }
}

async function fetchTableBreakdown(supabase) {
  const { data, error } = await supabase.rpc('local_admin_table_breakdown')
  if (error) return { tablas: null, error: error.message }
  const raw = typeof data === 'string' ? JSON.parse(data) : data
  const arr = Array.isArray(raw) ? raw : []
  const tablas = arr.map((r) => ({
    tableName: r.table_name,
    rowEstimate: r.row_estimate != null ? Number(r.row_estimate) : null,
    totalBytes: r.total_bytes != null ? Number(r.total_bytes) : null,
  }))
  return { tablas, error: null }
}

async function fetchStats(supabase) {
  const errors = []

  const countTable = async (table, filters) => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true })
    if (filters) q = filters(q)
    const { count, error } = await q
    if (error) errors.push(`${table}: ${error.message}`)
    return count ?? null
  }

  const [
    comerciosTotal,
    comerciosActivos,
    usuariosTotal,
    usuariosActivos,
    ventasNoEliminadas,
    comprasNoEliminadas,
    productosTotal,
    authUsers,
    dbOverview,
    tableBreakdown,
  ] = await Promise.all([
    countTable('comercios'),
    countTable('comercios', (q) => q.eq('activo', true)),
    countTable('usuarios'),
    countTable('usuarios', (q) => q.is('deleted_at', null)),
    countTable('ventas', (q) => q.is('deleted_at', null)),
    countTable('compras', (q) => q.is('deleted_at', null)),
    countTable('productos', (q) => q.is('deleted_at', null)),
    countAuthUsers(supabase),
    fetchDbOverview(supabase),
    fetchTableBreakdown(supabase),
  ])

  if (authUsers.error) errors.push(`auth.users (cuentas registradas): ${authUsers.error}`)
  if (dbOverview.error) {
    errors.push(
      `Indicadores de BD (tablas / tamaño): ${dbOverview.error}. Si falta la función, ejecutá en Supabase la migración database/migrations/033_local_admin_db_overview_rpc.sql.`
    )
  }
  if (tableBreakdown.error) {
    errors.push(
      `Desglose por tabla: ${tableBreakdown.error}. Si falta la función, ejecutá database/migrations/034_local_admin_table_breakdown_rpc.sql.`
    )
  }

  const indicadores = {
    comerciosTotal,
    comerciosActivos,
    usuariosRegistradosAuth: authUsers.count,
    tablasSchemaPublic: dbOverview.overview?.publicTableCount ?? null,
    tamanoBaseDatosBytes: dbOverview.overview?.databaseSizeBytes ?? null,
  }

  const { data: planes, error: ePlanes } = await supabase
    .from('planes')
    .select('id, nombre, descripcion, limite_productos, limite_usuarios, precio_mensual')
    .eq('activo', true)
    .order('id')

  if (ePlanes) errors.push(`planes: ${ePlanes.message}`)

  const { data: comerciosPorPlan, error: eCp } = await supabase
    .from('comercios')
    .select('id, nombre, activo, plan_id, planes:plan_id ( id, nombre )')
    .order('id')

  if (eCp) errors.push(`comercios detalle: ${eCp.message}`)

  return {
    indicadores,
    counts: {
      usuariosTotal,
      usuariosActivos,
      ventasNoEliminadas,
      comprasNoEliminadas,
      productosTotal,
    },
    planes: planes || [],
    comercios: comerciosPorPlan || [],
    tablasDetalle: tableBreakdown.tablas || [],
    errors,
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.ico': 'image/x-icon',
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1`)

  if (url.pathname === '/api/stats') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    if (!SUPABASE_URL || !SERVICE_KEY) {
      res.writeHead(503)
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env',
        })
      )
      return
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    try {
      const stats = await fetchStats(supabase)
      res.writeHead(200)
      res.end(JSON.stringify({ ok: true, ...stats, fetchedAt: new Date().toISOString() }))
    } catch (e) {
      res.writeHead(500)
      res.end(JSON.stringify({ ok: false, error: String(e?.message || e) }))
    }
    return
  }

  if (url.pathname === '/api/meta') {
    const ref = projectRefFromUrl(SUPABASE_URL)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.writeHead(200)
    res.end(
      JSON.stringify({
        supabaseConfigured: Boolean(SUPABASE_URL && SERVICE_KEY),
        projectRef: ref,
        dashboardUrl: ref ? `https://supabase.com/dashboard/project/${ref}` : null,
        billingUrl: ref ? `https://supabase.com/dashboard/project/${ref}/settings/billing` : null,
        databaseUrl: ref ? `https://supabase.com/dashboard/project/${ref}/database/settings` : null,
        pricingUrl: 'https://supabase.com/pricing',
      })
    )
    return
  }

  let filePath = path.join(publicDir, url.pathname === '/' ? 'index.html' : url.pathname)
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(publicDir, 'index.html')
  }
  const ext = path.extname(filePath)
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
  res.writeHead(200)
  fs.createReadStream(filePath).pipe(res)
})

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.warn('\n⚠️  Creá .env desde .env.example con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY\n')
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Panel local:  http://127.0.0.1:${PORT}\n  Solo este equipo. Ctrl+C para salir.\n`)
})
