// Página pública de Términos y Condiciones (landing y footer)
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { obtenerTerminosActuales } from '../../services/terminos'
import { Spinner } from '../../components/common'
import './LegalPublic.css'

function TerminosPublic() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      const { data: terminos, error: err } = await obtenerTerminosActuales()
      if (err) setError(err.message)
      else setData(terminos)
      setLoading(false)
    }
    cargar()
  }, [])

  if (loading) {
    return (
      <div className="legal-public">
        <div className="legal-public-container">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="legal-public">
        <div className="legal-public-container">
          <p className="legal-public-error">
            No se pudo cargar el contenido. Por favor, intentá más tarde.
          </p>
          <Link to="/" className="btn btn-primary">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="legal-public">
      <div className="legal-public-container">
        <Link to="/" className="legal-public-back">
          ← Volver al inicio
        </Link>
        <h1 className="legal-public-title">{data.titulo || 'Términos y Condiciones'}</h1>
        {data.version && (
          <p className="legal-public-version">Versión {data.version}</p>
        )}
        <div
          className="legal-public-content"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {data.contenido}
        </div>
        <Link to="/" className="btn btn-outline" style={{ marginTop: '2rem' }}>
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

export default TerminosPublic
