import { supabase } from './supabase'
import { getComercio } from './comercio'
import { mergeTicketPrintConfig } from '../constants/ticketPrintConfig'

/**
 * Obtiene la configuración de impresoras del comercio actual.
 */
export const getConfigImpresoras = async () => {
  try {
    const { data: comercio, error: errComercio } = await getComercio()
    if (errComercio) throw errComercio
    if (!comercio?.id) {
      return { data: mergeTicketPrintConfig(null), error: null }
    }

    const { data, error } = await supabase
      .from('configuracion_comercio')
      .select('config_impresoras')
      .eq('comercio_id', comercio.id)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') throw error

    return {
      data: mergeTicketPrintConfig(data?.config_impresoras),
      error: null,
    }
  } catch (error) {
    console.error('Error al obtener config impresoras:', error)
    return { data: mergeTicketPrintConfig(null), error }
  }
}

/**
 * Guarda la configuración de impresoras (upsert en configuracion_comercio).
 */
export const saveConfigImpresoras = async (config) => {
  try {
    const merged = mergeTicketPrintConfig(config)
    const { data: comercio, error: errComercio } = await getComercio()
    if (errComercio) throw errComercio
    if (!comercio?.id) throw new Error('No se encontró el comercio')

    const payload = { config_impresoras: merged }

    const { data: existing, error: errGet } = await supabase
      .from('configuracion_comercio')
      .select('id')
      .eq('comercio_id', comercio.id)
      .maybeSingle()

    if (errGet && errGet.code !== 'PGRST116') throw errGet

    if (existing?.id) {
      const { data, error } = await supabase
        .from('configuracion_comercio')
        .update(payload)
        .eq('id', existing.id)
        .select('config_impresoras')
        .single()
      if (error) throw error
      return { data: mergeTicketPrintConfig(data?.config_impresoras), error: null }
    }

    const { data, error } = await supabase
      .from('configuracion_comercio')
      .insert([{ comercio_id: comercio.id, ...payload }])
      .select('config_impresoras')
      .single()

    if (error) throw error
    return { data: mergeTicketPrintConfig(data?.config_impresoras), error: null }
  } catch (error) {
    console.error('Error al guardar config impresoras:', error)
    return { data: null, error }
  }
}
