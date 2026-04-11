/**
 * Importa categorías desde un volcado phpMyAdmin (MySQL) hacia Supabase (PostgreSQL).
 * Formato esperado: INSERT INTO `categorias` (`idCategoria`, `nombreCategoria`, `descripcion`) VALUES ...
 *
 * Uso:
 *   cd scripts
 *   npm install
 *   cp .env.example .env   # y completar variables
 *   node import-categorias.mjs
 *
 * Solo lectura del dump: node import-categorias.mjs --dry-run
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Quita comillas/BOM/espacios finales que suelen romper el JWT. */
function normalizeEnvValue(val) {
  if (val == null) return ''
  let s = String(val).trim()
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1)
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1).trim()
  return s
}

/** Rol dentro del JWT (sin verificar firma). */
function jwtRole(jwt) {
  try {
    const parts = jwt.split('.')
    if (parts.length < 2) return null
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(b64, 'base64').toString('utf8')
    return JSON.parse(json).role ?? null
  } catch {
    return null
  }
}

/** @returns {Record<string, string>} */
function parseEnvFile(envPath) {
  const out = {}
  if (!existsSync(envPath)) return out
  let text = readFileSync(envPath, 'utf8')
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    out[key] = normalizeEnvValue(t.slice(eq + 1))
  }
  return out
}

function isPlaceholderServiceKey(val) {
  if (!val) return true
  const v = val.toLowerCase()
  return v.includes('reemplazar') || v.includes('placeholder') || v.includes('tu_service_role')
}

function loadAllEnv() {
  const fe = parseEnvFile(join(__dirname, '..', 'frontend', '.env'))
  const sc = parseEnvFile(join(__dirname, '.env'))
  const merged = { ...fe, ...sc }
  if (isPlaceholderServiceKey(merged.SUPABASE_SERVICE_ROLE_KEY) && fe.SUPABASE_SERVICE_ROLE_KEY) {
    merged.SUPABASE_SERVICE_ROLE_KEY = fe.SUPABASE_SERVICE_ROLE_KEY
  }
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== '') process.env[k] = v
  }
  if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
    process.env.SUPABASE_URL = normalizeEnvValue(process.env.VITE_SUPABASE_URL)
  }
  if (process.env.SUPABASE_URL) process.env.SUPABASE_URL = normalizeEnvValue(process.env.SUPABASE_URL)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)
  }
}

/** @param {string} s @param {number} start */
function parseSqlQuotedString(s, start) {
  let i = start
  while (i < s.length && /\s/.test(s[i])) i++
  if (s[i] !== "'") throw new Error(`Se esperaba comilla simple en posición ${i}`)
  i++
  let out = ''
  while (i < s.length) {
    const c = s[i]
    if (c === "'") {
      if (s[i + 1] === "'") {
        out += "'"
        i += 2
        continue
      }
      break
    }
    out += c
    i++
  }
  if (s[i] !== "'") throw new Error(`String sin cerrar cerca de posición ${i}`)
  i++
  return { value: out, next: i }
}

/** @param {string} s @param {number} start */
function parseIntField(s, start) {
  let i = start
  while (i < s.length && /\s/.test(s[i])) i++
  let num = ''
  while (i < s.length && /\d/.test(s[i])) num += s[i++]
  if (!num) throw new Error(`Entero esperado en posición ${i}`)
  return { value: parseInt(num, 10), next: i }
}

/**
 * Una fila: (id, 'nombre', 'desc')
 * @param {string} s
 * @param {number} start index después de '('
 */
function parseRow(s, start) {
  let i = start
  const id = parseIntField(s, i)
  i = id.next
  while (i < s.length && /\s/.test(s[i])) i++
  if (s[i] !== ',') throw new Error(`Se esperaba ',' después del id`)
  i++
  const nombre = parseSqlQuotedString(s, i)
  i = nombre.next
  while (i < s.length && /\s/.test(s[i])) i++
  if (s[i] !== ',') throw new Error(`Se esperaba ',' después del nombre`)
  i++
  const desc = parseSqlQuotedString(s, i)
  i = desc.next
  while (i < s.length && /\s/.test(s[i])) i++
  if (s[i] !== ')') throw new Error(`Se esperaba ')' al cerrar fila`)
  i++
  return {
    values: {
      idCategoria: id.value,
      nombreCategoria: nombre.value,
      descripcion: desc.value === '' ? null : desc.value,
    },
    nextIndex: i,
  }
}

/**
 * @param {string} content
 * @returns {{ idCategoria: number, nombreCategoria: string, descripcion: string | null }[]}
 */
export function parsePhpMyAdminCategorias(content) {
  const re =
    /INSERT\s+INTO\s+`categorias`\s*\(\s*`idCategoria`\s*,\s*`nombreCategoria`\s*,\s*`descripcion`\s*\)\s*VALUES\s*/is
  const m = content.match(re)
  if (!m) {
    throw new Error(
      'No se encontró INSERT INTO `categorias` (`idCategoria`, `nombreCategoria`, `descripcion`). ' +
        'Ajustá el parser si tu dump usa otros nombres de columnas.',
    )
  }
  let rest = content.slice(m.index + m[0].length)
  const semi = rest.indexOf(';')
  if (semi !== -1) rest = rest.slice(0, semi)

  const rows = []
  let i = 0
  while (i < rest.length) {
    while (i < rest.length && /\s/.test(rest[i])) i++
    if (i >= rest.length) break
    if (rest[i] === ',') {
      i++
      continue
    }
    if (rest[i] !== '(') {
      throw new Error(`Carácter inesperado '${rest[i]}' en posición ${i} del bloque VALUES`)
    }
    i++
    const row = parseRow(rest, i)
    i = row.nextIndex
    rows.push(row.values)
  }
  return rows
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  loadAllEnv()

  const sqlPath = resolve(
    process.env.CATEGORIAS_SQL || join(__dirname, '..', 'sql', 'categorias.sql'),
  )
  if (!existsSync(sqlPath)) {
    console.error('No existe el archivo:', sqlPath)
    process.exit(1)
  }

  const content = readFileSync(sqlPath, 'utf8')
  const parsed = parsePhpMyAdminCategorias(content)
  console.log(`Leídas ${parsed.length} categorías desde ${sqlPath}`)

  if (dryRun) {
    parsed.forEach((r) => {
      const d = r.descripcion ? `${r.descripcion.slice(0, 50)}…` : '(sin descripción)'
      console.log(`  ${r.idCategoria}: ${r.nombreCategoria} — ${d}`)
    })
    console.log('\nDry-run: no se insertó nada.')
    return
  }

  const url = normalizeEnvValue(process.env.SUPABASE_URL)
  let key = normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const comercioId = parseInt(normalizeEnvValue(process.env.COMERCIO_ID) || '', 10)

  if (!url) {
    console.error(
      'Falta la URL de Supabase.\n' +
        '  · Creá scripts/.env con SUPABASE_URL=... o usá frontend/.env con VITE_SUPABASE_URL (el script ya la reutiliza).',
    )
    process.exit(1)
  }
  if (!key) {
    const hasExample = existsSync(join(__dirname, '.env.example'))
    const hasDotEnv = existsSync(join(__dirname, '.env'))
    console.error(
      'Falta SUPABASE_SERVICE_ROLE_KEY.\n' +
        '  · El script lee variables desde scripts/.env (no desde .env.example).\n' +
        (hasExample && !hasDotEnv
          ? '  · En la carpeta scripts ejecutá: copy .env.example .env y editá .env con tu service_role.\n'
          : '') +
        '  · En Supabase: Project Settings → API → clave "service_role" (secreta).\n' +
        '  · En .env: SUPABASE_SERVICE_ROLE_KEY=eyJ...\n' +
        '  · No uses VITE_SUPABASE_ANON_KEY: RLS suele bloquear el insert masivo.\n' +
        '  · No subas scripts/.env a Git.',
    )
    process.exit(1)
  }

  const placeholderHints = ['reemplazar', 'placeholder', 'tu_service_role']
  if (
    key.length < 80 ||
    !key.startsWith('eyJ') ||
    placeholderHints.some((h) => key.toLowerCase().includes(h.toLowerCase()))
  ) {
    console.error(
      'SUPABASE_SERVICE_ROLE_KEY no parece una clave válida.\n' +
        '  · Abrí scripts/.env y pegá la clave "service_role" completa (Settings → API en Supabase).\n' +
        '  · Si copiaste .env.example sin editar, seguís con el texto placeholder: reemplazalo.\n' +
        '  · No pegues la clave "anon" ni la "publishable"; tiene que decir service_role en el panel.\n' +
        '  · Sin comillas alrededor del valor; una sola línea sin espacios al final.',
    )
    process.exit(1)
  }

  const role = jwtRole(key)
  if (role === 'anon') {
    console.error(
      'Estás usando la clave anon (JWT con role "anon"). Este script necesita la clave service_role.\n' +
        '  · Supabase Dashboard → Project Settings → API → sección "Project API keys" → service_role (Reveal).',
    )
    process.exit(1)
  }
  if (role && role !== 'service_role') {
    console.error(`El JWT tiene role "${role}". Se esperaba service_role.`)
    process.exit(1)
  }
  if (!Number.isFinite(comercioId) || comercioId < 1) {
    console.error(
      'Falta COMERCIO_ID (número entero, el id de tu fila en public.comercios).\n' +
        '  · Agregalo en scripts/.env: COMERCIO_ID=1',
    )
    process.exit(1)
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const payload = parsed.map((r) => ({
    comercio_id: comercioId,
    nombre: r.nombreCategoria.slice(0, 255),
    descripcion: r.descripcion,
    imagen_url: null,
    categoria_padre_id: null,
    activo: true,
  }))

  const { data, error } = await supabase.from('categorias').insert(payload).select('id, nombre')

  if (error) {
    console.error('Error de Supabase:', error.message, error)
    process.exit(1)
  }

  console.log(`Insertadas ${data?.length ?? payload.length} filas en public.categorias (comercio_id=${comercioId}).`)
  console.log(
    'Nota: los id en Supabase son nuevos (serial). Si importás productos desde el dump MySQL, ' +
      'necesitarás mapear idCategoria antiguo → id nuevo.',
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
