// Componente para capturar firma digital
import { useRef, useState, useEffect } from 'react'
import { Button } from './index'
import './FirmaCanvas.css'

function FirmaCanvas({
  onConfirm,
  onCancel,
  width = 400,
  height = 150,
  lineWidth = 2,
  lineColor = '#000000',
  backgroundColor = '#ffffff',
  disabled = false,
  className = ''
}) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  // Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    
    // Configurar canvas
    canvas.width = width
    canvas.height = height
    
    // Configurar estilo de dibujo
    ctx.strokeStyle = lineColor
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    // Rellenar fondo
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)
  }, [width, height, lineColor, lineWidth, backgroundColor])

  // Obtener coordenadas del mouse/touch
  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if (e.touches && e.touches.length > 0) {
      // Touch event
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      }
    } else {
      // Mouse event
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      }
    }
  }

  // Iniciar dibujo
  const startDrawing = (e) => {
    if (disabled) return
    
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const coords = getCoordinates(e)
    
    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
    setIsDrawing(true)
    setHasSignature(true)
  }

  // Dibujar
  const draw = (e) => {
    if (!isDrawing || disabled) return
    
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const coords = getCoordinates(e)
    
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
  }

  // Detener dibujo
  const stopDrawing = (e) => {
    if (!isDrawing) return
    
    e.preventDefault()
    setIsDrawing(false)
  }

  // Limpiar canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || disabled) return

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  // Exportar firma como imagen (Data URL)
  const exportSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return null

    return canvas.toDataURL('image/png')
  }

  // Confirmar firma
  const handleConfirm = async () => {
    if (!hasSignature) {
      alert('Por favor, dibuja tu firma antes de confirmar')
      return
    }

    setIsConfirming(true)
    try {
      const signatureDataUrl = exportSignature()
      if (onConfirm) {
        await onConfirm(signatureDataUrl)
      }
    } catch (error) {
      console.error('Error al confirmar firma:', error)
      alert('Error al procesar la firma. Por favor, intenta nuevamente.')
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className={`firma-canvas-container ${className}`}>
      <div className="firma-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="firma-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            cursor: disabled ? 'not-allowed' : 'crosshair',
            touchAction: 'none'
          }}
        />
        {!hasSignature && (
          <div className="firma-canvas-placeholder">
            <p>Dibuja tu firma aquí</p>
          </div>
        )}
      </div>
      
      <div className="firma-canvas-actions">
        <Button
          variant="outline"
          onClick={clearCanvas}
          disabled={disabled || !hasSignature || isConfirming}
        >
          Limpiar
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={disabled || !hasSignature || isConfirming}
          loading={isConfirming}
        >
          {isConfirming ? 'Confirmando...' : 'Confirmar Firma'}
        </Button>
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={disabled || isConfirming}
          >
            Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}

export default FirmaCanvas

