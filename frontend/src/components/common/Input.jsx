// Componente Input reutilizable
import { forwardRef } from 'react'
import './Input.css'

const Input = forwardRef(function Input({
  label,
  error,
  helperText,
  required = false,
  fullWidth = true,
  className = '',
  ...props
}, ref) {
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div className={`form-group ${fullWidth ? 'form-group-full' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`form-control ${error ? 'form-control-error' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {error && (
        <div id={`${inputId}-error`} className="form-error" role="alert">
          {error}
        </div>
      )}
      {helperText && !error && (
        <div id={`${inputId}-helper`} className="form-helper">
          {helperText}
        </div>
      )}
    </div>
  )
})

export default Input

