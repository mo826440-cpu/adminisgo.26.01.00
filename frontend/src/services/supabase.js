// Cliente de Supabase
import { createClient } from '@supabase/supabase-js'

// Obtener las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validar que las variables estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase: Variables de entorno no configuradas. Por favor, configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env')
}

// Crear y exportar el cliente de Supabase
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Función para verificar la conexión (opcional, útil para testing)
export const testConnection = async () => {
  try {
    // Intentar hacer una petición simple a Supabase
    // Usamos auth.getSession() que es una operación básica que no requiere tablas
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      // Si hay error pero es de autenticación (esperado sin usuario), la conexión funciona
      if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
        return { success: false, message: 'Credenciales inválidas. Verifica tu API Key.' }
      }
      throw error
    }
    
    return { success: true, message: '✅ Conexión a Supabase exitosa! Las credenciales son válidas.' }
  } catch (error) {
    console.error('Error de conexión a Supabase:', error)
    
    if (error.message?.includes('fetch')) {
      return { success: false, message: '❌ No se pudo conectar. Verifica tu URL de Supabase.' }
    }
    
    return { success: false, message: `❌ Error: ${error.message || 'Error desconocido'}` }
  }
}

