/** Códigos de barras de un producto, como texto, sin convertirlos a número. */
export function codigosDeProducto(producto) {
  const vistos = new Set()
  const salida = []

  const agregar = (codigo, observacion) => {
    const texto = String(codigo ?? '').trim()
    if (!texto || vistos.has(texto)) return
    vistos.add(texto)
    const nota = String(observacion ?? '').trim()
    salida.push({ codigo: texto, observacion: nota })
  }

  const filas = Array.isArray(producto?.codigos_barras) ? producto.codigos_barras : []
  for (const fila of filas) {
    agregar(fila?.codigo, fila?.observacion)
  }

  agregar(producto?.codigo_barras, '')
  return salida
}

export function observacionesDeProducto(producto) {
  return codigosDeProducto(producto).filter((fila) => fila.observacion)
}

/** Si el término coincide con algún código u observación, deja solo esas filas. */
export function observacionesFiltradas(producto, termino) {
  const term = String(termino ?? '').trim().toLowerCase()
  const todas = observacionesDeProducto(producto)
  if (!term) return todas

  const coinciden = codigosDeProducto(producto).filter(
    (fila) =>
      fila.codigo.toLowerCase().includes(term) ||
      (fila.observacion !== '' && fila.observacion.toLowerCase().includes(term)),
  )
  if (coinciden.length === 0) return todas
  return coinciden.filter((fila) => fila.observacion)
}

export function textoCodigosProducto(producto) {
  const filas = codigosDeProducto(producto)
  if (filas.length === 0) return ''
  return filas
    .map((fila) => (fila.observacion ? `${fila.codigo} (${fila.observacion})` : fila.codigo))
    .join(' · ')
}

export function productoCoincideCodigo(producto, termino, { exacto = false } = {}) {
  const consulta = String(termino ?? '').trim().toLowerCase()
  if (!consulta) return false

  const codigos = codigosDeProducto(producto).map((fila) => fila.codigo.toLowerCase())
  const notas = codigosDeProducto(producto).map((fila) => fila.observacion.toLowerCase())
  const interno = String(producto?.codigo_interno ?? '').trim().toLowerCase()

  if (exacto) {
    return codigos.some((codigo) => codigo === consulta) || interno === consulta
  }

  return (
    codigos.some((codigo) => codigo.includes(consulta)) ||
    notas.some((nota) => nota && nota.includes(consulta)) ||
    (interno !== '' && interno.includes(consulta))
  )
}
