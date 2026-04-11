/**
 * Lee sql/productos.sql (phpMyAdmin) y escribe sql/seed_productos_comercio_4.sql
 * para ejecutar en Supabase SQL Editor.
 *
 * Uso: node generate-productos-seed-sql.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function parseSqlQuotedString(s, start) {
  let i = start
  while (i < s.length && /\s/.test(s[i])) i++
  if (s[i] !== "'") throw new Error(`Comilla esperada en ${start}`)
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
  if (s[i] !== "'") throw new Error(`String sin cerrar en ${i}`)
  i++
  return { value: out, next: i }
}

function parseIntField(s, start) {
  let i = start
  while (i < s.length && /\s/.test(s[i])) i++
  let num = ''
  while (i < s.length && /\d/.test(s[i])) num += s[i++]
  if (!num) throw new Error(`Entero esperado en ${i}`)
  return { value: parseInt(num, 10), next: i }
}

function parseNullOrInt(s, start) {
  let i = start
  while (i < s.length && /\s/.test(s[i])) i++
  if (s.slice(i, i + 4).toLowerCase() === 'null') return { value: null, next: i + 4 }
  return parseIntField(s, i)
}

function parseDecimal(s, start) {
  let i = start
  while (i < s.length && /\s/.test(s[i])) i++
  let num = ''
  while (i < s.length && /[\d.]/.test(s[i])) num += s[i++]
  if (!num) throw new Error(`Decimal esperado en ${i}`)
  return { value: num, next: i }
}

function parseNullOrQuotedDate(s, start) {
  let i = start
  while (i < s.length && /\s/.test(s[i])) i++
  if (s.slice(i, i + 4).toLowerCase() === 'null') return { value: null, next: i + 4 }
  return parseSqlQuotedString(s, i)
}

function expectComma(s, i) {
  let j = i
  while (j < s.length && /\s/.test(s[j])) j++
  if (s[j] !== ',') throw new Error(`',' esperada en ${j}`)
  return j + 1
}

function parseProductoRow(s, start) {
  let i = start
  const idProd = parseIntField(s, i)
  i = expectComma(s, idProd.next)
  const codigo = parseSqlQuotedString(s, i)
  i = expectComma(s, codigo.next)
  const nombre = parseSqlQuotedString(s, i)
  i = expectComma(s, nombre.next)
  const idCat = parseNullOrInt(s, i)
  i = expectComma(s, idCat.next)
  const idMarca = parseNullOrInt(s, i)
  i = expectComma(s, idMarca.next)
  const pv = parseDecimal(s, i)
  i = expectComma(s, pv.next)
  const desc = parseDecimal(s, i)
  i = expectComma(s, desc.next)
  const pfinal = parseDecimal(s, i)
  i = expectComma(s, pfinal.next)
  const fechaDesc = parseNullOrQuotedDate(s, i)
  i = expectComma(s, fechaDesc.next)
  const stock = parseIntField(s, i)
  i = expectComma(s, stock.next)
  const fechaAct = parseSqlQuotedString(s, i)
  i = fechaAct.next
  while (i < s.length && /\s/.test(s[i])) i++
  if (s[i] !== ')') throw new Error(`')' esperada en ${i}`)
  i++
  return {
    row: {
      idProducto: idProd.value,
      codigoBarras: codigo.value,
      nombreProducto: nombre.value,
      idCategoria: idCat.value,
      idMarca: idMarca.value,
      precioFinal: pfinal.value,
      stockActual: stock.value,
    },
    nextIndex: i,
  }
}

function parseAllProductos(content) {
  const re =
    /INSERT\s+INTO\s+`productos`\s*\(\s*`idProducto`\s*,\s*`codigoBarras`\s*,\s*`nombreProducto`\s*,\s*`idCategoria`\s*,\s*`idMarca`\s*,\s*`precioVenta`\s*,\s*`descuento`\s*,\s*`precioFinal`\s*,\s*`fechaFinalDescuento`\s*,\s*`stockActual`\s*,\s*`fechaActualizacion`\s*\)\s*VALUES\s*/is
  const m = content.match(re)
  if (!m) throw new Error('No se encontró el INSERT de productos')
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
    if (rest[i] !== '(') throw new Error(`'(' esperada en ${i}`)
    i++
    const { row, nextIndex } = parseProductoRow(rest, i)
    i = nextIndex
    rows.push(row)
  }
  return rows
}

function sqlStr(s) {
  return "'" + String(s).replace(/'/g, "''") + "'"
}

/** Misma lista que sql/seed_marcas_comercio_4.sql (id MySQL → nombre). */
const MAP_MARCA_MYSQL = [
  [153, 'Marlboro'],
  [154, 'Parliament'],
  [155, 'Philip Morris'],
  [156, 'Milenio'],
  [157, 'Pier'],
  [158, 'Liverpool'],
  [159, 'Kiel'],
  [160, 'Mil'],
  [161, 'Master'],
  [162, 'Red Point'],
  [163, 'Golden'],
  [164, 'Lucky Strike'],
  [165, 'Chesterfield'],
  [166, 'Chacabuco'],
  [167, 'Las Perdices'],
  [168, 'Perro Callejero'],
  [169, 'Vi??as de Balbo'],
  [170, 'Oveja Black'],
  [171, 'Huelga de Amores'],
  [172, 'Col??n'],
  [173, 'La Iride'],
  [174, 'Chanchullo'],
  [175, 'Conejo Negro'],
  [176, 'Sin Palabras'],
  [177, 'Portillo'],
]

const COMERCIO_ID = 4
/** Categorías importadas: MySQL id 1..20 → Supabase id 14..33 */
const CAT_OFFSET = 13

function main() {
  const sqlPath = join(__dirname, '..', 'sql', 'productos.sql')
  const outPath = join(__dirname, '..', 'sql', 'seed_productos_comercio_4.sql')
  const content = readFileSync(sqlPath, 'utf8')
  const rows = parseAllProductos(content)

  const marcaValues = MAP_MARCA_MYSQL.map(
    ([id, nom]) => `(${id}, ${sqlStr(nom)})`,
  ).join(',\n  ')

  const rawValues = rows
    .map(
      (r) =>
        `(${sqlStr(r.codigoBarras)}, ${sqlStr(r.nombreProducto)}, ${r.idCategoria === null ? 'NULL' : r.idCategoria}, ${r.idMarca === null ? 'NULL' : r.idMarca}, ${r.precioFinal}::numeric, ${r.stockActual}::numeric, ${r.idProducto})`,
    )
    .join(',\n  ')

  const catValues = Array.from({ length: 20 }, (_, k) => {
    const mysql = k + 1
    const supa = mysql + CAT_OFFSET
    return `(${mysql}, ${supa})`
  }).join(',\n  ')

  const sql = `-- =============================================================================
-- Supabase SQL Editor: pegar TODO y Run.
-- Generado por scripts/generate-productos-seed-sql.mjs (${rows.length} filas).
-- Requiere: comercio_id = ${COMERCIO_ID}, categorías 14–33, marcas seed_marcas_comercio_4.sql.
-- codigo_interno = mig-{id MySQL}. Import a medias (solo números): sql/delete_productos_import_parcial_comercio_4.sql
-- idMarca fuera del mapa 153–177 → marca_id NULL.
-- =============================================================================

WITH
cat_map (mysql_id, supa_id) AS (
  VALUES
  ${catValues}
),
marca_nombre (mysql_id, nombre) AS (
  VALUES
  ${marcaValues}
),
raw (codigo_barras, nombre, id_cat_mysql, id_marca_mysql, precio_final, stock, id_prod_mysql) AS (
  VALUES
  ${rawValues}
)
INSERT INTO public.productos (
  comercio_id,
  codigo_barras,
  codigo_interno,
  nombre,
  descripcion,
  categoria_id,
  marca_id,
  precio_venta,
  precio_compra,
  stock_actual,
  stock_minimo,
  unidad_medida,
  proveedor_id,
  activo
)
SELECT
  ${COMERCIO_ID},
  LEFT(r.codigo_barras, 100),
  ('mig-' || r.id_prod_mysql::text),
  LEFT(r.nombre, 255),
  NULL::text,
  c.supa_id,
  m.id,
  r.precio_final,
  NULL::numeric,
  r.stock,
  0::numeric,
  'unidad',
  NULL::integer,
  true
FROM raw r
LEFT JOIN cat_map c ON c.mysql_id = r.id_cat_mysql
LEFT JOIN marca_nombre mn ON mn.mysql_id = r.id_marca_mysql
LEFT JOIN public.marcas m ON m.comercio_id = ${COMERCIO_ID} AND m.nombre = mn.nombre;
`

  writeFileSync(outPath, sql, 'utf8')
  console.log(`Escrito ${outPath} (${rows.length} productos)`)
}

main()
