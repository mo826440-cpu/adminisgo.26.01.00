// Componente para mostrar y aceptar términos y condiciones
import { useState, useEffect } from 'react'
import { Modal, Button, FirmaCanvas } from './index'
import { obtenerTerminosActuales } from '../../services/terminos'
import { subirFirmaAStorage, guardarConsentimiento } from '../../services/consentimientos'
import { useAuthContext } from '../../context/AuthContext'
import './TerminosYCondiciones.css'

function TerminosYCondiciones({
  isOpen,
  onClose,
  onAccept,
  required = true,
  showVersion = true
}) {
  const { user } = useAuthContext()
  const [terminos, setTerminos] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [aceptado, setAceptado] = useState(false)
  const [firmaDataUrl, setFirmaDataUrl] = useState(null)
  const [firmaUrl, setFirmaUrl] = useState(null)
  const [subiendoFirma, setSubiendoFirma] = useState(false)
  const [scrollReachedBottom, setScrollReachedBottom] = useState(false)

  // Cargar términos al abrir el modal
  useEffect(() => {
    if (isOpen && !terminos) {
      cargarTerminos()
    }
  }, [isOpen])

  // Resetear estado al cerrar
  useEffect(() => {
    if (!isOpen) {
      setAceptado(false)
      setFirmaDataUrl(null)
      setFirmaUrl(null)
      setScrollReachedBottom(false)
      setError(null)
    }
  }, [isOpen])

  const cargarTerminos = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: errorTerminos } = await obtenerTerminosActuales()
      if (errorTerminos) throw errorTerminos
      setTerminos(data)
    } catch (err) {
      console.error('Error al cargar términos:', err)
      setError('Error al cargar los términos y condiciones. Por favor, intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
    setScrollReachedBottom(isAtBottom)
  }

  const handleFirmaConfirm = async (dataUrl) => {
    setSubiendoFirma(true)
    setError(null)
    try {
      // Subir firma a Storage
      const { data: uploadData, error: uploadError } = await subirFirmaAStorage(
        dataUrl,
        'terminos',
        user?.id
      )

      if (uploadError) throw uploadError

      setFirmaUrl(uploadData.url)
      setFirmaDataUrl(dataUrl)
    } catch (err) {
      console.error('Error al subir firma:', err)
      setError('Error al procesar la firma. Por favor, intenta nuevamente.')
      setSubiendoFirma(false)
    } finally {
      setSubiendoFirma(false)
    }
  }

  const handleAccept = async () => {
    if (!aceptado) {
      setError('Debes aceptar los términos y condiciones')
      return
    }

    if (!firmaUrl) {
      setError('Debes firmar los términos y condiciones')
      return
    }

    if (!scrollReachedBottom && required) {
      setError('Por favor, lee completamente los términos y condiciones antes de aceptar')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Obtener IP y User Agent
      const ipAddress = await obtenerIP()
      const userAgent = navigator.userAgent

      // Guardar consentimiento
      const { data: consentimiento, error: errorConsentimiento } = await guardarConsentimiento({
        tipo: 'terminos_condiciones',
        versionTerminos: terminos?.version,
        firmaImagenUrl: firmaUrl,
        ipAddress,
        userAgent
      })

      if (errorConsentimiento) throw errorConsentimiento

      // Llamar callback de aceptación
      if (onAccept) {
        await onAccept({
          consentimiento,
          version: terminos?.version
        })
      }
    } catch (err) {
      console.error('Error al guardar consentimiento:', err)
      setError('Error al guardar el consentimiento. Por favor, intenta nuevamente.')
      setLoading(false)
    }
  }

  const obtenerIP = async () => {
    try {
      // Usar servicio externo para obtener IP (opcional)
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  const canAccept = aceptado && firmaUrl && (scrollReachedBottom || !required)

  return (
    <Modal
      isOpen={isOpen}
      onClose={required ? undefined : onClose}
      title="Términos y Condiciones"
      variant="default"
      showCloseButton={!required}
      closeOnOverlayClick={!required}
    >
      <div className="terminos-container">
        {loading && !terminos && (
          <div className="terminos-loading">
            <p>Cargando términos y condiciones...</p>
          </div>
        )}

        {error && (
          <div className="terminos-error">
            <p>{error}</p>
          </div>
        )}

        {terminos && (
          <>
            {showVersion && (
              <div className="terminos-version">
                <p><strong>Versión:</strong> {terminos.version}</p>
                <p><strong>Fecha de publicación:</strong> {new Date(terminos.fecha_publicacion).toLocaleDateString('es-AR')}</p>
              </div>
            )}

            <div
              className="terminos-content"
              onScroll={handleScroll}
            >
              <div className="terminos-text">
                <h2>{terminos.titulo}</h2>
                <div dangerouslySetInnerHTML={{ __html: terminos.contenido }} />
              </div>
            </div>

            {!scrollReachedBottom && required && (
              <div className="terminos-scroll-warning">
                <p>⚠️ Por favor, lee completamente los términos antes de continuar</p>
              </div>
            )}

            <div className="terminos-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={aceptado}
                  onChange={(e) => setAceptado(e.target.checked)}
                  disabled={loading || subiendoFirma}
                />
                <span>He leído y acepto los términos y condiciones</span>
              </label>
            </div>

            <div className="terminos-firma">
              <h3>Firma Digital</h3>
              <p className="terminos-firma-descripcion">
                Por favor, dibuja tu firma para confirmar que aceptas los términos y condiciones
              </p>
              <FirmaCanvas
                onConfirm={handleFirmaConfirm}
                onCancel={() => {
                  setFirmaDataUrl(null)
                  setFirmaUrl(null)
                }}
                width={400}
                height={150}
                disabled={loading || subiendoFirma || !aceptado}
              />
              {subiendoFirma && (
                <p className="terminos-firma-uploading">Subiendo firma...</p>
              )}
              {firmaUrl && (
                <p className="terminos-firma-success">✅ Firma capturada correctamente</p>
              )}
            </div>

            <div className="terminos-actions">
              <Button
                variant="primary"
                onClick={handleAccept}
                disabled={!canAccept || loading || subiendoFirma}
                loading={loading}
                fullWidth
              >
                {loading ? 'Procesando...' : 'Aceptar Términos y Condiciones'}
              </Button>
              {!required && (
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={loading || subiendoFirma}
                  fullWidth
                  style={{ marginTop: '0.5rem' }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default TerminosYCondiciones
