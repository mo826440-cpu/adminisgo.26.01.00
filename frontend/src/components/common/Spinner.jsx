// Componente Spinner/Loading
import './Spinner.css'

function Spinner({ 
  size = 'md',
  className = '',
  ...props 
}) {
  const spinnerClasses = [
    'spinner',
    size !== 'md' && `spinner-${size}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={spinnerClasses} {...props} aria-label="Cargando">
      <span className="sr-only">Cargando...</span>
    </div>
  )
}

export default Spinner

