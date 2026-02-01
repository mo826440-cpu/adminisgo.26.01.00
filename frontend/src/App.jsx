import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DateTimeProvider } from './context/DateTimeContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import { AdminRoute } from './components/common'
import ErrorBoundary from './components/common/ErrorBoundary'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import CompleteRegistration from './pages/auth/CompleteRegistration'
import SelectPlan from './pages/auth/SelectPlan'
import AuthCallback from './pages/auth/AuthCallback'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import LandingPage from './pages/LandingPage'
import TerminosPublic from './pages/legal/TerminosPublic'
import PrivacidadPublic from './pages/legal/PrivacidadPublic'
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
import VentasRapidas from './pages/ventas/VentasRapidas'
import HistorialCajas from './pages/ventas/HistorialCajas'
import VentaRapidaDetalle from './pages/ventas/VentaRapidaDetalle'
import Configuracion from './pages/configuracion/Configuracion'
import CambiarPlan from './pages/configuracion/CambiarPlan'
import EnDesarrollo from './pages/EnDesarrollo'
import UsuariosList from './pages/usuarios/UsuariosList'
import UsuarioForm from './pages/usuarios/UsuarioForm'
import ComprasList from './pages/compras/ComprasList'
import CompraForm from './pages/compras/CompraForm'
import CompraDetalle from './pages/compras/CompraDetalle'
import ServiciosTest from './pages/test/ServiciosTest'
import TestServicios from './pages/test/TestServicios'
import TestFirmaCanvas from './pages/test/TestFirmaCanvas'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DateTimeProvider>
          <Router>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route 
              path="/auth/callback" 
              element={
                <ProtectedRoute>
                  <AuthCallback />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/auth/select-plan" 
              element={
                <ProtectedRoute>
                  <SelectPlan />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/auth/complete-registration" 
              element={
                <ProtectedRoute>
                  <CompleteRegistration />
                </ProtectedRoute>
              } 
            />
            
            {/* Ruta de prueba de servicios (solo desarrollo) */}
          <Route 
            path="/test/servicios" 
            element={
              <ProtectedRoute>
                  <ServiciosTest />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/test/servicios-nuevos" 
            element={
              <ProtectedRoute>
                  <TestServicios />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/test/firma-canvas" 
            element={
              <ProtectedRoute>
                  <TestFirmaCanvas />
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
            path="/ventas-rapidas" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <VentasRapidas />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ventas-rapidas/historial" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <HistorialCajas />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ventas-rapidas/:id" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <VentaRapidaDetalle />
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
          <Route 
            path="/configuracion/cambiar-plan" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <CambiarPlan />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          
          {/* Módulo Usuarios (solo admin/dueño) */}
          <Route 
            path="/usuarios" 
            element={
              <AdminRoute>
                <ErrorBoundary>
                  <UsuariosList />
                </ErrorBoundary>
              </AdminRoute>
            } 
          />
          <Route 
            path="/usuarios/nuevo" 
            element={
              <AdminRoute>
                <UsuarioForm />
              </AdminRoute>
            } 
          />
          <Route 
            path="/compras" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <ComprasList />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/compras/nueva" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <CompraForm />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/compras/:id" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <CompraDetalle />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/compras/:id/editar" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <CompraForm />
                </ErrorBoundary>
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
          
          {/* Páginas legales públicas (sin login) */}
          <Route path="/terminos" element={<TerminosPublic />} />
          <Route path="/privacidad" element={<PrivacidadPublic />} />

          {/* Ruta raíz: Landing Page */}
          <Route path="/" element={<LandingPage />} />
          </Routes>
        </Router>
        </DateTimeProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
