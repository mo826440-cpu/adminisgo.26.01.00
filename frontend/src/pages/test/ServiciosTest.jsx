// Componente de prueba para servicios
// Este componente es solo para desarrollo - eliminar en producción
import { useState, useEffect } from 'react'
import { 
  esAdminGlobal, 
  obtenerNotificacionesAdmin,
  contarNotificacionesNoLeidas 
} from '../../services/admin'
import { obtenerTerminosActuales } from '../../services/terminos'
import { obtenerPoliticaPrivacidadActual } from '../../services/politicaPrivacidad'
import { verificarConsentimientoActual } from '../../services/consentimientos'
import { obtenerUsuariosAdicionales } from '../../services/usuariosAdicionales'
import { obtenerPlanPersonalizado } from '../../services/planesPersonalizados'

function ServiciosTest() {
  const [resultados, setResultados] = useState({})
  const [cargando, setCargando] = useState(false)

  const ejecutarPruebas = async () => {
    setCargando(true)
    const resultadosPruebas = {}

    try {
      // 1. Probar esAdminGlobal
      console.log('🔍 Probando esAdminGlobal...')
      const { data: esAdmin, error: errorAdmin } = await esAdminGlobal()
      resultadosPruebas.esAdminGlobal = {
        resultado: esAdmin,
        error: errorAdmin?.message || null
      }
      console.log('✅ esAdminGlobal:', esAdmin, errorAdmin)

      // 2. Probar obtenerTerminosActuales
      console.log('🔍 Probando obtenerTerminosActuales...')
      const { data: terminos, error: errorTerminos } = await obtenerTerminosActuales()
      resultadosPruebas.obtenerTerminosActuales = {
        resultado: terminos ? `Versión ${terminos.version}: ${terminos.titulo}` : 'No hay términos',
        error: errorTerminos?.message || null
      }
      console.log('✅ Términos:', terminos, errorTerminos)

      // 3. Probar obtenerPoliticaPrivacidadActual
      console.log('🔍 Probando obtenerPoliticaPrivacidadActual...')
      const { data: politica, error: errorPolitica } = await obtenerPoliticaPrivacidadActual()
      resultadosPruebas.obtenerPoliticaPrivacidadActual = {
        resultado: politica ? `Versión ${politica.version}: ${politica.titulo}` : 'No hay política',
        error: errorPolitica?.message || null
      }
      console.log('✅ Política:', politica, errorPolitica)

      // 4. Probar verificarConsentimientoActual
      console.log('🔍 Probando verificarConsentimientoActual...')
      const { data: tieneConsentimiento, error: errorConsentimiento } = await verificarConsentimientoActual()
      resultadosPruebas.verificarConsentimientoActual = {
        resultado: tieneConsentimiento ? 'Tiene consentimiento actual' : 'NO tiene consentimiento actual',
        error: errorConsentimiento?.message || null
      }
      console.log('✅ Consentimiento:', tieneConsentimiento, errorConsentimiento)

      // 5. Probar obtenerUsuariosAdicionales (solo si es admin o tiene comercio)
      console.log('🔍 Probando obtenerUsuariosAdicionales...')
      const { data: usuariosAdicionales, error: errorUsuarios } = await obtenerUsuariosAdicionales()
      resultadosPruebas.obtenerUsuariosAdicionales = {
        resultado: usuariosAdicionales ? `${usuariosAdicionales.length} usuarios adicionales` : '0 usuarios',
        error: errorUsuarios?.message || null
      }
      console.log('✅ Usuarios adicionales:', usuariosAdicionales, errorUsuarios)

      // 6. Probar obtenerPlanPersonalizado
      console.log('🔍 Probando obtenerPlanPersonalizado...')
      const { data: planPersonalizado, error: errorPlan } = await obtenerPlanPersonalizado()
      resultadosPruebas.obtenerPlanPersonalizado = {
        resultado: planPersonalizado ? `Plan: ${planPersonalizado.nombre_plan}` : 'No tiene plan personalizado',
        error: errorPlan?.message || null
      }
      console.log('✅ Plan personalizado:', planPersonalizado, errorPlan)

      // 7. Si es admin, probar notificaciones
      if (esAdmin) {
        console.log('🔍 Probando obtenerNotificacionesAdmin...')
        const { data: notificaciones, error: errorNotif } = await obtenerNotificacionesAdmin()
        resultadosPruebas.obtenerNotificacionesAdmin = {
          resultado: notificaciones ? `${notificaciones.length} notificaciones` : '0 notificaciones',
          error: errorNotif?.message || null
        }
        console.log('✅ Notificaciones:', notificaciones, errorNotif)

        console.log('🔍 Probando contarNotificacionesNoLeidas...')
        const { data: noLeidas, error: errorNoLeidas } = await contarNotificacionesNoLeidas()
        resultadosPruebas.contarNotificacionesNoLeidas = {
          resultado: `${noLeidas} notificaciones no leídas`,
          error: errorNoLeidas?.message || null
        }
        console.log('✅ No leídas:', noLeidas, errorNoLeidas)
      }

    } catch (error) {
      console.error('❌ Error general en pruebas:', error)
      resultadosPruebas.error = error.message
    } finally {
      setCargando(false)
      setResultados(resultadosPruebas)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Prueba de Servicios</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Este componente prueba todos los servicios creados. Revisa la consola del navegador para ver los logs detallados.
      </p>

      <button 
        onClick={ejecutarPruebas}
        disabled={cargando}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: cargando ? 'not-allowed' : 'pointer',
          marginBottom: '2rem'
        }}
      >
        {cargando ? '⏳ Ejecutando pruebas...' : '▶️ Ejecutar Pruebas'}
      </button>

      {Object.keys(resultados).length > 0 && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '1.5rem', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h2 style={{ marginTop: 0 }}>📊 Resultados:</h2>
          {Object.entries(resultados).map(([servicio, resultado]) => (
            <div 
              key={servicio}
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                backgroundColor: 'white',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#495057' }}>
                {servicio}
              </h3>
              <p style={{ margin: '0.25rem 0', color: resultado.error ? '#dc3545' : '#28a745' }}>
                <strong>Resultado:</strong> {resultado.resultado || 'N/A'}
              </p>
              {resultado.error && (
                <p style={{ margin: '0.25rem 0', color: '#dc3545', fontSize: '0.9rem' }}>
                  <strong>Error:</strong> {resultado.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
        <strong>⚠️ Nota:</strong> Este componente es solo para desarrollo. 
        Elimínalo o desactívalo antes de producción.
      </div>
    </div>
  )
}

export default ServiciosTest

