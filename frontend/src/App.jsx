import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import ErrorBoundary from './components/common/ErrorBoundary'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import CompleteRegistration from './pages/auth/CompleteRegistration'
import Dashboard from './pages/dashboard/Dashboard'
import ProductosList from './pages/productos/ProductosList'
import ProductoForm from './pages/productos/ProductoForm'
import ClientesList from './pages/clientes/ClientesList'
import ClienteForm from './pages/clientes/ClienteForm'
import CategoriasList from './pages/categorias/CategoriasList'
import CategoriaForm from './pages/categorias/CategoriaForm'
import MarcasList from './pages/marcas/MarcasList'
import MarcaForm from './pages/marcas/MarcaForm'
import ProveedoresList from './pages/proveedores/ProveedoresList'
import ProveedorForm from './pages/proveedores/ProveedorForm'
import VentasList from './pages/ventas/VentasList'
import POS from './pages/ventas/POS'
import VentaDetalle from './pages/ventas/VentaDetalle'
import Configuracion from './pages/configuracion/Configuracion'
import EnDesarrollo from './pages/EnDesarrollo'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route 
              path="/auth/complete-registration" 
              element={
                <ProtectedRoute>
                  <CompleteRegistration />
                </ProtectedRoute>
              } 
            />
            
            {/* Rutas protegidas */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/productos" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <ProductosList />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/productos/nuevo" 
              element={
                <ProtectedRoute>
                  <ProductoForm />
                </ProtectedRoute>
              } 
            />
          <Route 
            path="/productos/:id" 
            element={
              <ProtectedRoute>
                <ProductoForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/clientes" 
            element={
              <ProtectedRoute>
                <ClientesList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/clientes/nuevo" 
            element={
              <ProtectedRoute>
                <ClienteForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/clientes/:id" 
            element={
              <ProtectedRoute>
                <ClienteForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/categorias" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <CategoriasList />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/categorias/nuevo" 
            element={
              <ProtectedRoute>
                <CategoriaForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/categorias/:id" 
            element={
              <ProtectedRoute>
                <CategoriaForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/marcas" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <MarcasList />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/marcas/nuevo" 
            element={
              <ProtectedRoute>
                <MarcaForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/marcas/:id" 
            element={
              <ProtectedRoute>
                <MarcaForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/proveedores" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <ProveedoresList />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/proveedores/nuevo" 
            element={
              <ProtectedRoute>
                <ProveedorForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/proveedores/:id" 
            element={
              <ProtectedRoute>
                <ProveedorForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ventas" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <VentasList />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ventas/nueva" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <POS />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ventas/:id" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <VentaDetalle />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ventas/:id/editar" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <POS />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/configuraciones" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Configuracion />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          
          {/* Rutas en desarrollo */}
          <Route 
            path="/usuarios" 
            element={
              <ProtectedRoute>
                <EnDesarrollo modulo="Módulo de Usuarios" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/compras" 
            element={
              <ProtectedRoute>
                <EnDesarrollo modulo="Módulo de Compras" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/inventario" 
            element={
              <ProtectedRoute>
                <EnDesarrollo modulo="Módulo de Inventario" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reportes" 
            element={
              <ProtectedRoute>
                <EnDesarrollo modulo="Módulo de Reportes" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mantenimiento" 
            element={
              <ProtectedRoute>
                <EnDesarrollo modulo="Módulo de Mantenimiento" />
              </ProtectedRoute>
            } 
          />
          
          {/* Ruta raíz: redirigir a dashboard si autenticado, sino a login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
