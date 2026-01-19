// Context para manejar configuración de fecha/hora
import { createContext, useContext, useState, useEffect } from 'react'

const DateTimeContext = createContext(null)

// Timezones comunes para Argentina y región
const TIMEZONES = [
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (Argentina)' },
  { value: 'America/Argentina/Cordoba', label: 'Córdoba (Argentina)' },
  { value: 'America/Argentina/Mendoza', label: 'Mendoza (Argentina)' },
  { value: 'America/Argentina/Salta', label: 'Salta (Argentina)' },
  { value: 'America/Montevideo', label: 'Montevideo (Uruguay)' },
  { value: 'America/Santiago', label: 'Santiago (Chile)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' }
]

// Formatos de fecha comunes
const DATE_FORMATS = [
  { value: 'DD/MM/YYYY HH:mm', label: 'DD/MM/YYYY HH:mm (19/01/2026 21:24)' },
  { value: 'DD-MM-YYYY HH:mm', label: 'DD-MM-YYYY HH:mm (19-01-2026 21:24)' },
  { value: 'YYYY-MM-DD HH:mm', label: 'YYYY-MM-DD HH:mm (2026-01-19 21:24)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (19/01/2026)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (19-01-2026)' }
]

export const DateTimeProvider = ({ children }) => {
  // Obtener configuración desde localStorage o usar valores por defecto
  const getStoredTimezone = () => {
    return localStorage.getItem('datetime_timezone') || 'America/Argentina/Buenos_Aires'
  }
  
  const getStoredDateFormat = () => {
    return localStorage.getItem('datetime_format') || 'DD/MM/YYYY HH:mm'
  }
  
  const [timezone, setTimezone] = useState(getStoredTimezone)
  const [dateFormat, setDateFormat] = useState(getStoredDateFormat)
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  // Actualizar fecha/hora actual cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Guardar configuración en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem('datetime_timezone', timezone)
  }, [timezone])

  useEffect(() => {
    localStorage.setItem('datetime_format', dateFormat)
  }, [dateFormat])

  const updateTimezone = (newTimezone) => {
    setTimezone(newTimezone)
  }

  const updateDateFormat = (newFormat) => {
    setDateFormat(newFormat)
  }

  const value = {
    timezone,
    dateFormat,
    currentDateTime,
    updateTimezone,
    updateDateFormat,
    TIMEZONES,
    DATE_FORMATS
  }

  return (
    <DateTimeContext.Provider value={value}>
      {children}
    </DateTimeContext.Provider>
  )
}

export const useDateTime = () => {
  const context = useContext(DateTimeContext)
  if (!context) {
    throw new Error('useDateTime debe usarse dentro de DateTimeProvider')
  }
  return context
}

