// Componente para manejar el callback de autenticación de Supabase
// Se ejecuta cuando el usuario confirma su email
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { getComercio } from '../../services/comercio'
import { Spinner, Alert, Button, Card } from '../../components/common'
import { supabase } from '../../services/supabase'

function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, loading: authLoading } = useAuthContext()
  const [error, setError] = useState(null)
  const [resendingEmail, setResendingEmail] = useState(false)

  useEffect(() => {
    let isMounted = true
    let timeoutId = null

    // Verificar si hay errores en la URL
    const errorParam = searchParams.get('error')
    const errorCode = searchParams.get('error_code')
    const errorDescription = searchParams.get('error_description')

    if (errorParam || errorCode) {
      console.error('[AuthCallback] Error en URL:', { errorParam, errorCode, errorDescription })
      
      if (errorCode === 'otp_expired' || errorCode === 'email_link_expired') {
        setError({
          type: 'expired',
          message: 'El enlace de confirmación ha expirado. Por favor, solicita un nuevo enlace de confirmación.',
          description: errorDescription || 'El enlace de confirmación de email es inválido o ha expirado.'
        })
        return
      } else if (errorCode === 'access_denied') {
        setError({
          type: 'access_denied',
          message: 'Acceso denegado. Por favor, intenta confirmar tu email nuevamente.',
          description: errorDescription || 'No se pudo completar la confirmación de email.'
        })
        return
      } else {
        setError({
          type: 'unknown',
          message: 'Error al confirmar tu email. Por favor, intenta nuevamente.',
          description: errorDescription || errorParam || 'Error desconocido'
        })
        return
      }
    }

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

    // Solo ejecutar handleCallback si no hay errores
    if (!errorParam && !errorCode) {
      handleCallback()
    }

    return () => {
      isMounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isAuthenticated, authLoading, navigate, searchParams])

  // Función para reenviar email de confirmación
  const handleResendEmail = async () => {
    setResendingEmail(true)
    try {
      const email = searchParams.get('email') || prompt('Por favor, ingresa tu email:')
      if (!email) {
        setResendingEmail(false)
        return
      }

      // Usar la misma URL de redirección que en signUp
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const redirectUrl = isDevelopment 
        ? 'http://localhost:5173/auth/callback'
        : `${window.location.origin}/auth/callback`

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: redirectUrl
        }
      })

      if (error) throw error

      alert('✅ Email de confirmación reenviado. Por favor, revisa tu bandeja de entrada.')
      navigate('/auth/login', {
        state: { message: 'Email de confirmación reenviado. Por favor, revisa tu bandeja de entrada.' }
      })
    } catch (err) {
      console.error('Error al reenviar email:', err)
      alert('❌ Error al reenviar el email. Por favor, intenta registrarte nuevamente.')
    } finally {
      setResendingEmail(false)
    }
  }

  // Si hay error, mostrar mensaje de error
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-secondary)',
        padding: '2rem'
      }}>
        <Card style={{ maxWidth: '500px', width: '100%' }}>
          <Alert variant="error" style={{ marginBottom: '1.5rem' }}>
            <strong>{error.message}</strong>
            {error.description && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
                {error.description}
              </p>
            )}
          </Alert>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error.type === 'expired' && (
              <Button
                onClick={handleResendEmail}
                disabled={resendingEmail}
                fullWidth
                variant="primary"
              >
                {resendingEmail ? 'Reenviando...' : 'Reenviar Email de Confirmación'}
              </Button>
            )}
            
            <Button
              onClick={() => navigate('/auth/login')}
              variant="secondary"
              fullWidth
            >
              Ir a Iniciar Sesión
            </Button>

            <Button
              onClick={() => navigate('/auth/register')}
              variant="outline"
              fullWidth
            >
              Registrarse Nuevamente
            </Button>
          </div>
        </Card>
      </div>
    )
  }

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

