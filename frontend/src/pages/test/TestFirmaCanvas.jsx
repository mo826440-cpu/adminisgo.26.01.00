// Página de prueba para FirmaCanvas
import { useState } from 'react'
import { FirmaCanvas } from '../../components/common'
import { subirFirmaAStorage } from '../../services/consentimientos'
import './TestFirmaCanvas.css'

function TestFirmaCanvas() {
  const [firmaDataUrl, setFirmaDataUrl] = useState(null)
  const [firmaUrl, setFirmaUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleConfirm = async (dataUrl) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    setFirmaDataUrl(dataUrl)

    try {
      // Simular subida a Storage (necesitas estar autenticado)
      // Por ahora solo mostramos el data URL
      console.log('Firma capturada:', dataUrl.substring(0, 50) + '...')
      
      // Si quieres probar la subida real, descomenta esto:
      /*
      const { data, error: uploadError } = await subirFirmaAStorage(
        dataUrl,
        'terminos',
        'test-user-id'
      )
      
      if (uploadError) {
        throw uploadError
      }
      
      setFirmaUrl(data.url)
      */
      
      setSuccess(true)
    } catch (err) {
      console.error('Error al procesar firma:', err)
      setError(err.message || 'Error al procesar la firma')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFirmaDataUrl(null)
    setFirmaUrl(null)
    setError(null)
    setSuccess(false)
  }

  return (
    <div className="test-firma-canvas">
      <div className="test-header">
        <h1>🧪 Prueba de FirmaCanvas</h1>
        <p>Componente para capturar firmas digitales</p>
      </div>

      <div className="test-content">
        <div className="test-section">
          <h2>Canvas de Firma</h2>
          <FirmaCanvas
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            width={400}
            height={150}
          />
        </div>

        {loading && (
          <div className="test-status loading">
            <p>⏳ Procesando firma...</p>
          </div>
        )}

        {error && (
          <div className="test-status error">
            <p><strong>❌ Error:</strong> {error}</p>
          </div>
        )}

        {success && (
          <div className="test-status success">
            <p><strong>✅ Firma capturada exitosamente!</strong></p>
          </div>
        )}

        {firmaDataUrl && (
          <div className="test-section">
            <h2>Vista Previa de la Firma</h2>
            <div className="firma-preview">
              <img 
                src={firmaDataUrl} 
                alt="Firma capturada" 
                className="firma-preview-image"
              />
            </div>
            <div className="firma-info">
              <p><strong>Data URL (primeros 100 caracteres):</strong></p>
              <code>{firmaDataUrl.substring(0, 100)}...</code>
              <p><strong>Tamaño:</strong> ~{Math.round(firmaDataUrl.length * 0.75 / 1024)} KB</p>
            </div>
          </div>
        )}

        {firmaUrl && (
          <div className="test-section">
            <h2>URL de la Firma en Storage</h2>
            <div className="firma-url">
              <p><strong>URL:</strong></p>
              <code>{firmaUrl}</code>
            </div>
          </div>
        )}

        <div className="test-section">
          <h2>Instrucciones</h2>
          <ol>
            <li>Dibuja tu firma en el canvas usando el mouse o el dedo (en móvil)</li>
            <li>Haz clic en "Limpiar" si quieres borrar y empezar de nuevo</li>
            <li>Haz clic en "Confirmar Firma" cuando estés satisfecho</li>
            <li>La firma se convertirá en una imagen PNG que puedes guardar o subir a Storage</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default TestFirmaCanvas

