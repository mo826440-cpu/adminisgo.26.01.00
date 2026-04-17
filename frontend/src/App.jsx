import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DateTimeProvider } from './context/DateTimeContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import { AdminRoute, PermissionRoute } from './components/common'
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
import ReportesPage from './pages/reportes/ReportesPage'
import OtrosCostosPage from './pages/otrosCostos/OtrosCostosPage'
import UsuariosList from './pages/usuarios/UsuariosList'
import UsuarioForm from './pages/usuarios/UsuarioForm'
import RolesPermisosPage from './pages/usuarios/RolesPermisosPage'
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
                <PermissionRoute modulo="dashboard">
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
                </PermissionRoute>
              } 
            />
            <Route 
              path="/productos" 
              element={
                <PermissionRoute modulo="productos">
                  <ErrorBoundary>
                    <ProductosList />
                  </ErrorBoundary>
                </PermissionRoute>
              } 
            />
            <Route 
              path="/productos/nuevo" 
              element={
                <PermissionRoute modulo="productos">
                  <ProductoForm />
                </PermissionRoute>
              } 
            />
          <Route 
            path="/productos/:id" 
            element={
              <PermissionRoute modulo="productos">
                <ProductoForm />
              </PermissionRoute>
            } 
          />
          <Route 
            path="/clientes" 
            element={
              <PermissionRoute modulo="clientes">
                <ClientesList />
              </PermissionRoute>
            } 
          />
          <Route 
            path="/clientes/nuevo" 
            element={
              <PermissionRoute modulo="clientes">
                <ClienteForm />
              </PermissionRoute>
            } 
          />
          <Route 
            path="/clientes/:id" 
            element={
              <PermissionRoute modulo="clientes">
                <ClienteForm />
              </PermissionRoute>
            } 
          />
          <Route 
            path="/categorias" 
            element={
              <PermissionRoute modulo="categorias">
                <ErrorBoundary>
                  <CategoriasList />
                </ErrorBoundary>
              </PermissionRoute>
            } 
          />
          <Route 
            path="/categorias/nuevo" 
            element={
              <PermissionRoute modulo="categorias">
                <CategoriaForm />
              </PermissionRoute>
            } 
          />
          <Route 
            path="/categorias/:id" 
            element={
              <PermissionRoute modulo="categorias">
                <CategoriaForm />
              </PermissionRoute>
            } 
          />
          <Route 
            path="/marcas" 
            element={
              <PermissionRoute modulo="marcas">
                <ErrorBoundary>
                  <MarcasList />
                </ErrorBoundary>
              </PermissionRoute>
            } 
          />
          <Route 
            path="/marcas/nuevo" 
            element={
              <PermissionRoute modulo="marcas">
                <MarcaForm />
              </PermissionRoute>
            } 
          />
          <Route 
            path="/marcas/:id" 
            element={
              <PermissionRoute modulo="marcas">
                <MarcaForm />
              </PermissionRoute>
            } 
          />
          <Route 
            path="/proveedores" 
            element={
              <PermissionRoute modulo="proveedores">
                <ErrorBoundary>
                  <ProveedoresList />
                </ErrorBoundary>
              </PermissionRoute>
            } 
          />
          <Route 
            path="/proveedores/nuevo" 
            element={
              <PermissionRoute modulo="proveedores">
                <ProveedorForm />
              </PermissionRoute>
            } 
          />
          <Route 
            path="/proveedores/:id" 
            element={
              <PermissionRoute modulo="proveedores">
                <ProveedorForm />
              </PermissionRoute>
            } 
          />
          <Route 
            path="/ventas" 
            element={
              <PermissionRoute modulo="ventas">
                <ErrorBoundary>
                  <VentasList />
                </ErrorBoundary>
              </PermissionRoute>
            } 
          />
          <Route 
            path="/ventas/nueva" 
            element={
              <PermissionRoute modulo="ventas">
                <ErrorBoundary>
                  <POS />
                </ErrorBoundary>
              </PermissionRoute>
            } 
          />
          <Route 
            path="/ventas/:id" 
            element={
              <PermissionRoute modulo="ventas">
                <ErrorBoundary>
                  <VentaDetalle />
                </ErrorBoundary>
              </PermissionRoute>
            } 
          />
          <Route 
            path="/ventas/:id/editar" 
            element={
              <PermissionRoute modulo="ventas">
                <ErrorBoundary>
                  <POS />
                </ErrorBoundary>
              </PermissionRoute>
            } 
          />
          <Route 
            path="/ventas-rapidas" 
            element={
              <PermissionRoute modulo="ventas_rapidas">
                <ErrorBoundary>
                  <VentasRapidas />
                </ErrorBoundary>
              </PermissionRoute>
            } 
          />
          <Route 
            path="/ventas-rapidas/historial" 
            element={
              <PermissionRoute modulo="ventas_rapidas">
                <ErrorBoundary>
                  <HistorialCajas />
                </ErrorBoundary>
              </PermissionRoute>
            } 
          />
          <Route 
            path="/ventas-rapidas/:id" 
            element={
              <PermissionRoute modulo="ventas_rapidas">
                <ErrorBoundary>
                  <VentaRapidaDetalle />
                </ErrorBoundary>
              </PermissionRoute>
            } 
          />
          {/* Configuraciones (solo admin/dueño) */}
          <Route 
            path="/configuraciones" 
            element={
              <AdminRoute>
                <ErrorBoundary>
                  <Configuracion />
                </ErrorBoundary>
              </AdminRoute>
            } 
          />
          <Route 
            path="/configuracion/cambiar-plan" 
            element={
              <AdminRoute>
                <ErrorBoundary>
                  <CambiarPlan />
                </ErrorBoundary>
              </AdminRoute>
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
            path="/usuarios/permisos"
            element={
              <AdminRoute>
                <ErrorBoundary>
                  <RolesPermisosPage />
                </ErrorBoundary>
              </AdminRoute>
            }
          />
          <Route 
            path="/compras" 
            element={
              <PermissionRoute modulo="compras">
                <ErrorBoundary>
                  <ComprasList />
                </ErrorBoundary>
              </PermissionRoute>
            } 
          />
          <Route 
            path="/compras/nueva" 
            element={
              <PermissionRoute modulo="compras">
                <ErrorBoundary>
                  <CompraForm />
                </ErrorBoundary>
              </PermissionRoute>
            } 
          />
          <Route 
            path="/compras/:id" 
            element={
              <PermissionRoute modulo="compras">
                <ErrorBoundary>
                  <CompraDetalle />
                </ErrorBoundary>
              </PermissionRoute>
            } 
          />
          <Route 
            path="/compras/:id/editar" 
            element={
              <PermissionRoute modulo="compras">
                <ErrorBoundary>
                  <CompraForm />
                </ErrorBoundary>
              </PermissionRoute>
            } 
          />
          <Route 
            path="/inventario" 
            element={
              <PermissionRoute modulo="inventario">
                <EnDesarrollo modulo="Módulo de Inventario" />
              </PermissionRoute>
            } 
          />
          <Route 
            path="/reportes" 
            element={
              <PermissionRoute modulo="reportes">
                <ReportesPage />
              </PermissionRoute>
            } 
          />
          <Route
            path="/otros-costos"
            element={
              <AdminRoute>
                <ErrorBoundary>
                  <OtrosCostosPage />
                </ErrorBoundary>
              </AdminRoute>
            }
          />
          <Route 
            path="/mantenimiento" 
            element={
              <PermissionRoute modulo="mantenimiento">
                <EnDesarrollo modulo="Módulo de Mantenimiento" />
              </PermissionRoute>
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
