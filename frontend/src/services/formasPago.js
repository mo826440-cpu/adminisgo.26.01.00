import { supabase } from './supabase'

const DEFAULTS = [
  { nombre: 'Efectivo', codigo: 'efectivo', orden: 1 },
  { nombre: 'Transferencia', codigo: 'transferencia', orden: 2 },
  { nombre: 'QR', codigo: 'qr', orden: 3 },
  { nombre: 'Débito', codigo: 'debito', orden: 4 },
  { nombre: 'Crédito', codigo: 'credito', orden: 5 },
  { nombre: 'Cheque', codigo: 'cheque', orden: 6 },
  { nombre: 'Pendiente', codigo: 'pendiente', orden: 7 },
  { nombre: 'Otro', codigo: 'otro', orden: 8 },
]

async function seedDefaultsIfEmpty(comercioId) {
  const { count, error: countErr } = await supabase
    .from('formas_pago')
    .select('id', { count: 'exact', head: true })
    .eq('comercio_id', comercioId)

  if (countErr) throw countErr
  if ((count || 0) > 0) return

  const rows = DEFAULTS.map((d, i) => ({
    comercio_id: comercioId,
    nombre: d.nombre,
    codigo: d.codigo,
    activo: true,
    preferible: i === 0,
    orden: d.orden,
  }))

  const { error } = await supabase.from('formas_pago').insert(rows)
  if (error) throw error
}

async function getComercioId() {
  const { data, error } = await supabase.rpc('get_user_comercio_id')
  if (error) throw error
  return data
}

export const getFormasPago = async ({ soloActivas = false } = {}) => {
  try {
    const comercioId = await getComercioId()
    if (!comercioId) return { data: [], error: null }

    try {
      await seedDefaultsIfEmpty(comercioId)
    } catch (seedErr) {
      // Tabla aún no migrada: fallback a lista fija
      if (String(seedErr?.message || '').includes('formas_pago')) {
        return {
          data: DEFAULTS.map((d, i) => ({
            id: d.codigo,
            nombre: d.nombre,
            codigo: d.codigo,
            activo: true,
            preferible: i === 0,
            orden: d.orden,
          })),
          error: null,
        }
      }
      throw seedErr
    }

    let query = supabase
      .from('formas_pago')
      .select('*')
      .eq('comercio_id', comercioId)
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true })

    if (soloActivas) query = query.eq('activo', true)

    const { data, error } = await query
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error al obtener formas de pago:', error)
    return { data: null, error }
  }
}

export const getFormaPagoPreferible = async () => {
  const { data, error } = await getFormasPago({ soloActivas: true })
  if (error) return { data: null, error }
  const preferible = (data || []).find((f) => f.preferible)
  return { data: preferible || data?.[0] || null, error: null }
}

export const createFormaPago = async ({ nombre, codigo }) => {
  try {
    const comercioId = await getComercioId()
    const slug = (codigo || nombre)
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')

    const { data, error } = await supabase
      .from('formas_pago')
      .insert([
        {
          comercio_id: comercioId,
          nombre: nombre.trim(),
          codigo: slug || 'otro',
          activo: true,
          preferible: false,
          orden: 99,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al crear forma de pago:', error)
    return { data: null, error }
  }
}

export const updateFormaPago = async (id, patch) => {
  try {
    const { data, error } = await supabase
      .from('formas_pago')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al actualizar forma de pago:', error)
    return { data: null, error }
  }
}

export const setFormaPagoPreferible = async (id) => {
  return updateFormaPago(id, { preferible: true })
}

export const deleteFormaPago = async (id) => {
  try {
    const { data, error } = await supabase
      .from('formas_pago')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al desactivar forma de pago:', error)
    return { data: null, error }
  }
}
