// Componente de prueba para verificar la conexión con Supabase
import { useState, useEffect } from 'react'
import { supabase, testConnection } from '../../services/supabase'

function TestConnection() {
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [envStatus, setEnvStatus] = useState('checking')

  // Verificar variables de entorno al montar
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (url && key && url !== 'your-supabase-project-url' && key !== 'your-supabase-anon-key') {
      setEnvStatus('configured')
    } else {
      setEnvStatus('not-configured')
    }
  }, [])

  const handleTest = async () => {
    setStatus('testing')
    setMessage('Probando conexión...')
    
    const result = await testConnection()
    
    setStatus(result.success ? 'success' : 'error')
    setMessage(result.message)
  }

  return (
    <div style={{ 
      padding: '1rem', 
      margin: '1rem', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Prueba de Conexión - Supabase</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Estado de variables de entorno:</strong>{' '}
        {envStatus === 'checking' && '⏳ Verificando...'}
        {envStatus === 'configured' && '✅ Configuradas'}
        {envStatus === 'not-configured' && '❌ No configuradas - Completa el archivo .env'}
      </div>

      {envStatus === 'not-configured' && (
        <div style={{ 
          padding: '0.75rem', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffc107',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          <strong>⚠️ Acción requerida:</strong>
          <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li>Ve a tu proyecto en Supabase</li>
            <li>Copia la URL y la API Key (anon/public)</li>
            <li>Completa el archivo <code>frontend/.env</code> con esos valores</li>
          </ol>
        </div>
      )}

      <button 
        onClick={handleTest}
        disabled={status === 'testing' || envStatus === 'not-configured'}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: envStatus === 'not-configured' ? 'not-allowed' : 'pointer',
          opacity: envStatus === 'not-configured' ? 0.5 : 1
        }}
      >
        {status === 'testing' ? 'Probando...' : 'Probar Conexión'}
      </button>

      {message && (
        <div style={{ 
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: status === 'success' ? '#d4edda' : '#f8d7da',
          border: `1px solid ${status === 'success' ? '#28a745' : '#dc3545'}`,
          borderRadius: '4px',
          color: status === 'success' ? '#155724' : '#721c24'
        }}>
          <strong>{status === 'success' ? '✅' : '❌'}</strong> {message}
        </div>
      )}
    </div>
  )
}

export default TestConnection

