// Componente Button reutilizable
import './Button.css'

function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  className = '',
  ...props 
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size !== 'md' && `btn-${size}`,
    fullWidth && 'btn-block',
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      <span 
        className="spinner spinner-sm" 
        style={{ 
          marginRight: loading ? '0.5rem' : '0',
          display: loading ? 'inline-block' : 'none'
        }} 
      />
      {children}
    </button>
  )
}

export default Button

