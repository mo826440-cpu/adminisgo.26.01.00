// Página de "En Desarrollo"
import { Layout } from '../components/layout'
import { Card } from '../components/common'
import './EnDesarrollo.css'

function EnDesarrollo({ modulo = 'Este módulo' }) {
  return (
    <Layout>
      <div className="container en-desarrollo-container">
        <Card className="en-desarrollo-card">
          <div className="en-desarrollo-content">
            <div className="en-desarrollo-icon">🚧</div>
            <h1 className="en-desarrollo-title">{modulo}</h1>
            <p className="en-desarrollo-message">
              Este módulo se encuentra en desarrollo y estará disponible próximamente.
            </p>
            <p className="en-desarrollo-subtitle">
              Estamos trabajando para brindarte la mejor experiencia.
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  )
}

export default EnDesarrollo

