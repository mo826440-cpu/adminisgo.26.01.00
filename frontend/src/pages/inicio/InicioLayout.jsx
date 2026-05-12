// Contenedor de rutas /inicio/* con Layout compartido
import { Outlet } from 'react-router-dom'
import { Layout } from '../../components/layout'

function InicioLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

export default InicioLayout
