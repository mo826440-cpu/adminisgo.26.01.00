// Funciones helper para formatear fechas usando la configuración del usuario

/**
 * Formatea una fecha usando el formato y timezone configurados
 * @param {Date|string} date - Fecha a formatear
 * @param {string} format - Formato deseado (ej: 'DD/MM/YYYY HH:mm')
 * @param {string} timezone - Timezone (ej: 'America/Argentina/Buenos_Aires')
 * @returns {string} - Fecha formateada
 */
export const formatDateTime = (date, format = 'DD/MM/YYYY HH:mm', timezone = 'America/Argentina/Buenos_Aires') => {
  if (!date) return '-'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) return '-'

    // Crear formateador con timezone
    const formatter = new Intl.DateTimeFormat('es-AR', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })

    const parts = formatter.formatToParts(dateObj)
    
    // Mapear partes
    const day = parts.find(p => p.type === 'day')?.value || ''
    const month = parts.find(p => p.type === 'month')?.value || ''
    const year = parts.find(p => p.type === 'year')?.value || ''
    const hour = parts.find(p => p.type === 'hour')?.value || ''
    const minute = parts.find(p => p.type === 'minute')?.value || ''

    // Reemplazar según el formato
    let formatted = format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year)
      .replace('HH', hour)
      .replace('mm', minute)

    return formatted
  } catch (error) {
    console.error('Error al formatear fecha:', error)
    return '-'
  }
}

/**
 * Formatea solo la fecha (sin hora)
 */
export const formatDate = (date, format = 'DD/MM/YYYY', timezone = 'America/Argentina/Buenos_Aires') => {
  if (!date) return '-'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) return '-'

    const formatter = new Intl.DateTimeFormat('es-AR', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })

    const parts = formatter.formatToParts(dateObj)
    
    const day = parts.find(p => p.type === 'day')?.value || ''
    const month = parts.find(p => p.type === 'month')?.value || ''
    const year = parts.find(p => p.type === 'year')?.value || ''

    let formatted = format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year)

    return formatted
  } catch (error) {
    console.error('Error al formatear fecha:', error)
    return '-'
  }
}

/**
 * Formatea solo la hora (sin fecha)
 */
export const formatTime = (date, timezone = 'America/Argentina/Buenos_Aires') => {
  if (!date) return '-'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) return '-'

    const formatter = new Intl.DateTimeFormat('es-AR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })

    return formatter.format(dateObj)
  } catch (error) {
    console.error('Error al formatear hora:', error)
    return '-'
  }
}

/**
 * Convierte fecha UTC a formato datetime-local para inputs
 */
export const utcToLocalDateTime = (utcString, timezone = 'America/Argentina/Buenos_Aires') => {
  if (!utcString) return null
  
  try {
    const date = new Date(utcString)
    if (isNaN(date.getTime())) return null

    // Usar Intl para obtener componentes en el timezone especificado
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })

    const parts = formatter.formatToParts(date)
    const year = parts.find(p => p.type === 'year')?.value || ''
    const month = parts.find(p => p.type === 'month')?.value || ''
    const day = parts.find(p => p.type === 'day')?.value || ''
    const hour = parts.find(p => p.type === 'hour')?.value || ''
    const minute = parts.find(p => p.type === 'minute')?.value || ''

    return `${year}-${month}-${day}T${hour}:${minute}`
  } catch (error) {
    console.error('Error al convertir fecha:', error)
    return null
  }
}

/**
 * Obtiene fecha/hora actual en formato datetime-local para inputs
 */
export const getCurrentLocalDateTime = (timezone = 'America/Argentina/Buenos_Aires') => {
  const now = new Date()
  return utcToLocalDateTime(now.toISOString(), timezone) || ''
}

