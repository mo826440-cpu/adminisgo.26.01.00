// Componente Alert reutilizable
import './Alert.css'

function Alert({ 
  children, 
  variant = 'info',
  dismissible = false,
  onDismiss,
  className = '',
  ...props 
}) {
  const alertClasses = [
    'alert',
    `alert-${variant}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={alertClasses} role="alert" {...props}>
      {children}
      {dismissible && (
        <button
          type="button"
          className="alert-dismiss"
          onClick={onDismiss}
          aria-label="Cerrar"
        >
          ×
        </button>
      )}
    </div>
  )
}

export default Alert

