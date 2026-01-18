// Componente Badge reutilizable
import './Badge.css'

function Badge({ 
  children, 
  variant = 'primary',
  className = '',
  ...props 
}) {
  const badgeClasses = [
    'badge',
    `badge-${variant}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <span className={badgeClasses} {...props}>
      {children}
    </span>
  )
}

export default Badge

