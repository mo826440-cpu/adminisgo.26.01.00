// Componente de prueba para servicios
import { useState } from 'react'
import { esAdminGlobal, obtenerNotificacionesAdmin, contarNotificacionesNoLeidas } from '../../services/admin'
import { obtenerTerminosActuales } from '../../services/terminos'
import { obtenerPoliticaPrivacidadActual } from '../../services/politicaPrivacidad'
import { verificarConsentimientoActual, obtenerConsentimientosUsuario } from '../../services/consentimientos'
import { obtenerUsuariosAdicionales } from '../../services/usuariosAdicionales'
import { obtenerPlanPersonalizado } from '../../services/planesPersonalizados'
import { Spinner } from '../../components/common'
import './TestServicios.css'

function TestServicios() {
  const [loading, setLoading] = useState(false)
  const [resultados, setResultados] = useState({})

  const probarServicio = async (nombre, funcion) => {
    setLoading(true)
    try {
      const resultado = await funcion()
      // Si hay error en el resultado, manejarlo
      if (resultado.error) {
        setResultados(prev => ({
          ...prev,
          [nombre]: {
            error: typeof resultado.error === 'object' 
              ? resultado.error.message || JSON.stringify(resultado.error)
              : resultado.error,
            errorObject: resultado.error
          }
        }))
        console.error(`❌ ${nombre}:`, resultado.error)
      } else {
        setResultados(prev => ({
          ...prev,
          [nombre]: resultado
        }))
        console.log(`✅ ${nombre}:`, resultado)
      }
    } catch (error) {
      setResultados(prev => ({
        ...prev,
        [nombre]: { 
          error: error.message || String(error),
          errorObject: error
        }
      }))
      console.error(`❌ ${nombre}:`, error)
    } finally {
      setLoading(false)
    }
  }

  const probarTodos = async () => {
    setLoading(true)
    setResultados({})
    
    // Probar todos los servicios
    await probarServicio('esAdminGlobal', esAdminGlobal)
    await probarServicio('obtenerTerminosActuales', obtenerTerminosActuales)
    await probarServicio('obtenerPoliticaPrivacidadActual', obtenerPoliticaPrivacidadActual)
    await probarServicio('verificarConsentimientoActual', verificarConsentimientoActual)
    await probarServicio('obtenerConsentimientosUsuario', obtenerConsentimientosUsuario)
    await probarServicio('obtenerUsuariosAdicionales', obtenerUsuariosAdicionales)
    await probarServicio('obtenerPlanPersonalizado', obtenerPlanPersonalizado)
    await probarServicio('obtenerNotificacionesAdmin', obtenerNotificacionesAdmin)
    await probarServicio('contarNotificacionesNoLeidas', contarNotificacionesNoLeidas)
    
    setLoading(false)
  }

  return (
    <div className="test-servicios">
      <div className="test-header">
        <h1>🧪 Prueba de Servicios</h1>
        <p>Prueba todos los servicios creados para el sistema de planes y consentimientos</p>
      </div>

      <div className="test-actions">
        <button 
          className="btn btn-primary" 
          onClick={probarTodos}
          disabled={loading}
        >
          {loading ? <Spinner size="sm" /> : 'Probar Todos los Servicios'}
        </button>
      </div>

      <div className="test-servicios-grid">
        {/* Admin */}
        <div className="test-card">
          <h3>Admin</h3>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => probarServicio('esAdminGlobal', esAdminGlobal)}
            disabled={loading}
          >
            Es Admin Global
          </button>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => probarServicio('obtenerNotificacionesAdmin', obtenerNotificacionesAdmin)}
            disabled={loading}
          >
            Notificaciones
          </button>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => probarServicio('contarNotificacionesNoLeidas', contarNotificacionesNoLeidas)}
            disabled={loading}
          >
            Contar No Leídas
          </button>
        </div>

        {/* Términos */}
        <div className="test-card">
          <h3>Términos y Condiciones</h3>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => probarServicio('obtenerTerminosActuales', obtenerTerminosActuales)}
            disabled={loading}
          >
            Obtener Actuales
          </button>
        </div>

        {/* Política de Privacidad */}
        <div className="test-card">
          <h3>Política de Privacidad</h3>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => probarServicio('obtenerPoliticaPrivacidadActual', obtenerPoliticaPrivacidadActual)}
            disabled={loading}
          >
            Obtener Actual
          </button>
        </div>

        {/* Consentimientos */}
        <div className="test-card">
          <h3>Consentimientos</h3>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => probarServicio('verificarConsentimientoActual', verificarConsentimientoActual)}
            disabled={loading}
          >
            Verificar Actual
          </button>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => probarServicio('obtenerConsentimientosUsuario', obtenerConsentimientosUsuario)}
            disabled={loading}
          >
            Obtener Todos
          </button>
        </div>

        {/* Usuarios Adicionales */}
        <div className="test-card">
          <h3>Usuarios Adicionales</h3>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => probarServicio('obtenerUsuariosAdicionales', obtenerUsuariosAdicionales)}
            disabled={loading}
          >
            Obtener Usuarios
          </button>
        </div>

        {/* Planes Personalizados */}
        <div className="test-card">
          <h3>Planes Personalizados</h3>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => probarServicio('obtenerPlanPersonalizado', obtenerPlanPersonalizado)}
            disabled={loading}
          >
            Obtener Plan
          </button>
        </div>
      </div>

      {/* Resultados */}
      <div className="test-resultados">
        <h2>Resultados</h2>
        {Object.keys(resultados).length === 0 ? (
          <p className="text-muted">Haz clic en un botón para probar un servicio</p>
        ) : (
          <div className="resultados-list">
            {Object.entries(resultados).map(([nombre, resultado]) => (
              <div key={nombre} className="resultado-item">
                <h4>{nombre}</h4>
                {resultado.error ? (
                  <div className="error">
                    <strong>❌ Error:</strong> {typeof resultado.error === 'string' 
                      ? resultado.error 
                      : resultado.error.message || JSON.stringify(resultado.error, null, 2)}
                    {resultado.errorObject && typeof resultado.errorObject === 'object' && (
                      <details style={{ marginTop: '0.5rem' }}>
                        <summary style={{ cursor: 'pointer', fontSize: '0.85rem' }}>Detalles del error</summary>
                        <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', background: 'rgba(0,0,0,0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                          {JSON.stringify(resultado.errorObject, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ) : (
                  <pre>{JSON.stringify(resultado.data, null, 2)}</pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TestServicios

