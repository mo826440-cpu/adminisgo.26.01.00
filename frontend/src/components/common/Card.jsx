// Componente Card reutilizable
import './Card.css'

function Card({ 
  children, 
  title,
  header,
  footer,
  className = '',
  hoverable = false,
  ...props 
}) {
  const cardClasses = [
    'card',
    hoverable && 'card-hoverable',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={cardClasses} {...props}>
      {(title || header) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {header}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  )
}

export default Card

