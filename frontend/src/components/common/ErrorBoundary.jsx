import React from 'react'
import { Alert, Button } from './index'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Actualizar el estado para que la próxima renderización muestre la UI de fallback
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Registrar el error en la consola
    console.error('Error capturado por ErrorBoundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    // Opcional: redirigir a la página de inicio o recargar
    window.location.href = '/productos'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          maxWidth: '800px', 
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <Alert variant="danger">
            <h2 style={{ marginTop: 0 }}>⚠️ Algo salió mal</h2>
            <p>Ha ocurrido un error inesperado. Por favor, intenta nuevamente.</p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: '1rem', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                  Detalles del error (solo en desarrollo)
                </summary>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '1rem', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '0.875rem'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      {'\n\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
          </Alert>
          <div style={{ marginTop: '1.5rem' }}>
            <Button 
              variant="primary" 
              onClick={this.handleReset}
            >
              Volver a Productos
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

