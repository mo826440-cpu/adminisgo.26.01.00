# Adminis Go - Sistema de Gestión de Comercios (POS + ERP + CRM)

Sistema completo de gestión para comercios con funcionalidades POS, ERP y CRM, disponible como Progressive Web App (PWA).

## 📋 Descripción

Adminis Go es una aplicación web progresiva (PWA) que permite a los comercios gestionar sus operaciones diarias:
- **POS** (Point of Sale): Punto de venta para procesar ventas
- **ERP** (Enterprise Resource Planning): Gestión de inventario, productos, compras
- **CRM** (Customer Relationship Management): Gestión de clientes y relaciones

## 🚀 Tecnologías

- **Frontend**: React 18 + Vite
- **UI Framework**: Bootstrap 5
- **Estado**: Zustand
- **Routing**: React Router
- **Backend**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Storage**: Supabase Storage
- **Hosting**: Vercel

## 📁 Estructura del Proyecto

```
adminisgo/
├── frontend/          # Aplicación React
├── database/          # Scripts SQL y migraciones
├── Guias_Inicio/      # Documentación del proyecto
└── Ejemplos/          # Ejemplos y pruebas
```

## 🛠️ Instalación

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Git
- Cuenta en Supabase
- Cuenta en Vercel (para deployment)

### Setup

1. Clonar el repositorio (o ya estás en el proyecto)
2. Navegar a la carpeta frontend:
   ```bash
   cd frontend
   ```
3. Instalar dependencias:
   ```bash
   npm install
   ```
4. Configurar variables de entorno:
   - Crear archivo `.env` en `frontend/`
   - Agregar:
     ```
     VITE_SUPABASE_URL=tu-url-de-supabase
     VITE_SUPABASE_ANON_KEY=tu-anon-key
     ```
5. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 📚 Documentación

La documentación completa del proyecto se encuentra en la carpeta `Guias_Inicio/`:

- `DESCRIPCION_PROYECTO.md`: Descripción completa del proyecto
- `GUIA_ESTILOS_APP_GESTION.md`: Guía de estilos y diseño
- `GUIA_DE_FUNCIONES.md`: Funcionalidades detalladas
- `GUIA_DE_BASE_DE_DATOS.md`: Esquema de base de datos
- `ESTRUCTURA_LENGUAJES_Y_HERRAMIENTAS.md`: Estructura y herramientas
- `CHECKLIST_PROYECTO.md`: Checklist de seguimiento del proyecto

## 🎯 Estado del Proyecto

🟢 **Estado**: En desarrollo inicial (Fase 0: Preparación y Setup)

## 📝 Licencia

[Agregar licencia según corresponda]

## 👥 Contribuidores

[Agregar información de contribuidores si aplica]

---

**Versión**: 0.1.0  
**Última actualización**: Enero 2026

