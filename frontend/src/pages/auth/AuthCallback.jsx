// Componente para manejar el callback de autenticación de Supabase
// Se ejecuta cuando el usuario confirma su email
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { getComercio } from '../../services/comercio'
import { Spinner } from '../../components/common'

function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, loading: authLoading } = useAuthContext()

  useEffect(() => {
    let isMounted = true
    let timeoutId = null

    const handleCallback = async () => {
      // Esperar un momento para que la sesión se establezca completamente
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (!isMounted) return

      // Esperar a que la autenticación se complete
      if (authLoading) {
        // Esperar un poco más si aún está cargando
        timeoutId = setTimeout(() => {
          if (isMounted && !authLoading) {
            handleCallback()
          }
        }, 1000)
        return
      }

      // Si no está autenticado después del callback, redirigir al login
      if (!isAuthenticated) {
        navigate('/auth/login', { 
          replace: true,
          state: { message: 'Por favor, inicia sesión para continuar.' }
        })
        return
      }

      // Verificar si el usuario ya tiene comercio
      try {
        const { data: comercio, error } = await getComercio()
        
        if (!isMounted) return
        
        // Log para depuración
        console.log('[AuthCallback] Verificando comercio:', { comercio, error })
        
        // Si hay error específico (no es "no encontrado"), loguearlo
        if (error && error.code !== 'PGRST116') {
          console.error('[AuthCallback] Error al verificar comercio:', error)
        }
        
        // Si tiene comercio, redirigir al dashboard
        if (comercio) {
          console.log('[AuthCallback] Usuario tiene comercio, redirigiendo a dashboard')
          navigate('/dashboard', { replace: true })
          return
        }
        
        // Si no tiene comercio, redirigir a selección de plan
        console.log('[AuthCallback] Usuario NO tiene comercio, redirigiendo a select-plan')
        navigate('/auth/select-plan', { replace: true })
      } catch (err) {
        // Error al verificar comercio, redirigir a selección de plan
        console.error('[AuthCallback] Excepción al verificar comercio:', err)
        if (isMounted) {
          navigate('/auth/select-plan', { replace: true })
        }
      }
    }

    handleCallback()

    return () => {
      isMounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isAuthenticated, authLoading, navigate])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-secondary)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <Spinner size="lg" />
        <p style={{ marginTop: '1rem' }}>Verificando tu cuenta...</p>
      </div>
    </div>
  )
}

export default AuthCallback

