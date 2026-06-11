# Estructura, Lenguajes y Herramientas - Proyecto Adminis Go

## 📋 Índice
1. [Estructura del Proyecto](#1-estructura-del-proyecto)
2. [Lenguajes y Tecnologías](#2-lenguajes-y-tecnologías)
3. [Herramientas Necesarias](#3-herramientas-necesarias)
4. [Recomendaciones de Servicios](#4-recomendaciones-de-servicios)
5. [Despliegue y Distribución](#5-despliegue-y-distribución)
6. [Comandos de Verificación e Instalación](#6-comandos-de-verificación-e-instalación)

---

## 1. Estructura del Proyecto

### 1.1 Estructura Recomendada (Monorepo o Separado)

#### Opción A: Monorepo (Recomendado para este proyecto)
```
adminisgo/
│
├── frontend/                    # Aplicación frontend
│   ├── public/                  # Archivos públicos
│   │   ├── index.html
│   │   ├── manifest.json        # PWA manifest
│   │   ├── sw.js                # Service Worker
│   │   └── icons/               # Iconos PWA
│   │
│   ├── src/
│   │   ├── assets/              # Imágenes, fuentes, etc.
│   │   │   ├── images/
│   │   │   ├── fonts/
│   │   │   └── icons/
│   │   │
│   │   ├── components/          # Componentes reutilizables
│   │   │   ├── common/          # Botones, inputs, cards, etc.
│   │   │   ├── layout/          # Navbar, Sidebar, Footer
│   │   │   ├── forms/           # Formularios
│   │   │   └── tables/          # Tablas
│   │   │
│   │   ├── pages/               # Páginas/vistas
│   │   │   ├── auth/            # Login, registro
│   │   │   ├── dashboard/       # Dashboard principal
│   │   │   ├── ventas/          # Módulo POS
│   │   │   ├── productos/       # Gestión de productos
│   │   │   ├── clientes/        # CRM
│   │   │   ├── compras/         # Módulo de compras
│   │   │   ├── inventario/      # Control de stock
│   │   │   ├── reportes/        # Reportes
│   │   │   ├── usuarios/        # Gestión de usuarios
│   │   │   ├── configuracion/   # Configuración
│   │   │   └── landing/         # Landing page
│   │   │
│   │   ├── services/            # Servicios/API calls
│   │   │   ├── api.js           # Cliente API base
│   │   │   ├── auth.js          # Autenticación
│   │   │   ├── productos.js     # API productos
│   │   │   ├── ventas.js        # API ventas
│   │   │   └── ...
│   │   │
│   │   ├── store/               # Estado global (Redux/Zustand)
│   │   │   ├── slices/          # Redux slices
│   │   │   └── store.js
│   │   │
│   │   ├── hooks/               # Custom hooks
│   │   ├── utils/               # Utilidades
│   │   │   ├── formatters.js    # Formateo de datos
│   │   │   ├── validators.js    # Validaciones
│   │   │   └── constants.js     # Constantes
│   │   │
│   │   ├── styles/              # Estilos CSS
│   │   │   ├── variables.css    # Variables CSS
│   │   │   ├── typography.css   # Tipografía
│   │   │   ├── components.css   # Componentes
│   │   │   ├── layout.css       # Layout
│   │   │   └── responsive.css   # Media queries
│   │   │
│   │   ├── App.js               # Componente principal
│   │   ├── routes.js            # Configuración de rutas
│   │   └── index.js             # Entry point
│   │
│   ├── package.json
│   ├── vite.config.js           # o webpack.config.js
│   └── .env                     # Variables de entorno
│
├── backend/                     # API Backend (opcional si usas Supabase)
│   ├── src/
│   │   ├── routes/              # Rutas API
│   │   ├── controllers/         # Lógica de negocio
│   │   ├── models/              # Modelos de datos
│   │   ├── middleware/          # Middlewares
│   │   ├── utils/               # Utilidades
│   │   └── server.js            # Servidor principal
│   │
│   ├── package.json
│   └── .env
│
├── database/                    # Scripts de base de datos
│   ├── migrations/              # Migraciones SQL
│   ├── seeds/                   # Datos de ejemplo
│   └── schema.sql               # Esquema completo
│
├── docs/                        # Documentación
│   ├── GUIA_ESTILOS_APP_GESTION.md
│   ├── GUIA_DE_FUNCIONES.md
│   ├── GUIA_DE_BASE_DE_DATOS.md
│   └── DESCRIPCION_PROYECTO.md
│
├── .gitignore
├── README.md
└── package.json                 # Root package.json (workspaces)
```

#### Opción B: Repositorios Separados
- `adminisgo-frontend/`: Repositorio del frontend
- `adminisgo-backend/`: Repositorio del backend (si no usas Supabase)
- `adminisgo-docs/`: Repositorio de documentación (opcional)

**Recomendación**: Opción A (Monorepo) para facilitar el desarrollo y deployment.

---

## 2. Lenguajes y Tecnologías

### 2.1 Frontend

#### Stack Recomendado

**Opción 1: React + Vite (RECOMENDADO)**
- **Lenguaje**: JavaScript (ES6+) o TypeScript
- **Framework**: React 18+
- **Build Tool**: Vite (rápido y moderno)
- **Routing**: React Router v6
- **Estado Global**: Zustand o Redux Toolkit
- **Estilos**: CSS Modules o Styled Components
- **UI Framework**: Bootstrap 5 o Tailwind CSS
- **Formularios**: React Hook Form + Yup
- **HTTP Client**: Axios o Fetch API
- **PWA**: Workbox o manual Service Worker

**Opción 2: Vue 3 + Vite**
- **Lenguaje**: JavaScript o TypeScript
- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Routing**: Vue Router
- **Estado**: Pinia
- **UI Framework**: Vuetify o Quasar
- **Formularios**: VeeValidate

**Opción 3: SvelteKit**
- **Lenguaje**: JavaScript o TypeScript
- **Framework**: SvelteKit
- **UI**: Svelte Material UI o Svelte Bootstrap

**Recomendación**: **React + Vite** por:
- Gran ecosistema y comunidad
- Muchos recursos y tutoriales
- Fácil integración con Supabase
- Buen soporte PWA
- TypeScript opcional pero recomendado

### 2.2 Backend

#### Opción A: Supabase (RECOMENDADO - Ya lo tienes)
- **Backend as a Service**: Supabase
- **Base de datos**: PostgreSQL (incluido)
- **Autenticación**: Supabase Auth (incluido)
- **Storage**: Supabase Storage (para imágenes)
- **Real-time**: Supabase Realtime (incluido)
- **Edge Functions**: Supabase Edge Functions (opcional)

**Ventajas de Supabase**:
- ✅ Ya lo tienes configurado
- ✅ PostgreSQL robusto
- ✅ Autenticación lista
- ✅ Storage para imágenes
- ✅ Real-time gratis
- ✅ Dashboard visual
- ✅ Row Level Security (RLS) para multi-tenant

#### Opción B: Backend Propio
- **Lenguaje**: Node.js (JavaScript/TypeScript)
- **Framework**: Express.js o Fastify
- **Base de datos**: PostgreSQL o MySQL
- **ORM**: Prisma, Sequelize, o TypeORM
- **Autenticación**: JWT con Passport.js
- **Validación**: Joi o Zod

**Recomendación**: **Mantener Supabase** porque:
- Ya está configurado
- Ahorra tiempo de desarrollo
- Escalable
- Incluye muchas funcionalidades listas

### 2.3 Base de Datos

- **Sistema**: PostgreSQL (si usas Supabase)
- **Alternativa**: MySQL/MariaDB (si backend propio)
- **ORM/Query Builder**: 
  - Supabase Client (si Supabase)
  - Prisma (si backend propio)
  - Sequelize (si backend propio)

### 2.4 PWA (Progressive Web App)

- **Manifest**: `manifest.json`
- **Service Worker**: `sw.js` (para offline)
- **Storage**: IndexedDB (para datos offline)
- **Librerías**: Workbox (Google) o manual

### 2.5 Herramientas de Desarrollo

- **Control de Versiones**: Git
- **Package Manager**: npm o yarn
- **Linter**: ESLint
- **Formatter**: Prettier
- **Type Checker**: TypeScript (opcional pero recomendado)

---

## 3. Herramientas Necesarias

### 3.1 Herramientas Esenciales

#### Node.js y npm
- **Qué es**: Runtime de JavaScript y gestor de paquetes
- **Necesario**: Sí (esencial)
- **Versión mínima**: Node.js 18+ LTS
- **Dónde descargar**: https://nodejs.org/
- **Comando verificación**: `node --version` y `npm --version`

#### Git
- **Qué es**: Control de versiones
- **Necesario**: Sí (esencial)
- **Dónde descargar**: https://git-scm.com/
- **Comando verificación**: `git --version`

#### Editor de Código
- **Recomendado**: Visual Studio Code
- **Dónde descargar**: https://code.visualstudio.com/
- **Extensiones recomendadas**:
  - ESLint
  - Prettier
  - GitLens
  - JavaScript/TypeScript
  - CSS Peek

### 3.2 Herramientas Opcionales pero Recomendadas

#### GitHub Desktop (GUI para Git)
- **Qué es**: Interfaz gráfica para Git
- **Necesario**: No (puedes usar Git desde terminal)
- **Dónde descargar**: https://desktop.github.com/

#### Postman o Insomnia
- **Qué es**: Cliente API para probar endpoints
- **Necesario**: Útil para desarrollo
- **Dónde descargar**: 
  - Postman: https://www.postman.com/downloads/
  - Insomnia: https://insomnia.rest/download

#### Docker (Opcional)
- **Qué es**: Contenedores para desarrollo
- **Necesario**: Solo si usas backend propio
- **Dónde descargar**: https://www.docker.com/products/docker-desktop

---

## 4. Recomendaciones de Servicios

### 4.1 GitHub - ¿Seguir con GitHub o migrar?

#### ✅ **RECOMENDACIÓN: MANTENER GITHUB**

**Razones para mantener GitHub**:
- ✅ Ya lo tienes configurado
- ✅ Integración fácil con tu dominio (adminisgo.com)
- ✅ GitHub Pages para landing (gratis)
- ✅ GitHub Actions para CI/CD (gratis)
- ✅ Excelente para desarrollo colaborativo
- ✅ Comunidad grande y recursos
- ✅ Integración con Vercel/Netlify (deployment)

**Alternativas** (solo si realmente necesitas):
- **GitLab**: Similar a GitHub, con CI/CD integrado
- **Bitbucket**: Opción empresarial
- **Azure DevOps**: Si usas Microsoft

**Conclusión**: **Mantener GitHub** - Es la mejor opción para este proyecto.

### 4.2 Supabase - ¿Seguir con Supabase o migrar?

#### ✅ **RECOMENDACIÓN: MANTENER SUPABASE**

**Razones para mantener Supabase**:
- ✅ Ya lo tienes configurado
- ✅ PostgreSQL robusto (mejor que Firebase)
- ✅ Autenticación incluida
- ✅ Storage para imágenes
- ✅ Real-time incluido
- ✅ Row Level Security (perfecto para multi-tenant)
- ✅ Dashboard visual
- ✅ Plan gratuito generoso
- ✅ Muy bueno para este tipo de app

**Alternativas** (comparación):

**Firebase (Google)**:
- ❌ NoSQL (Firestore) - menos flexible para ERP
- ✅ Buena para apps simples
- ❌ Más difícil para queries complejas de gestión
- **Veredicto**: No recomendado para este proyecto

**Backend propio (Node.js + PostgreSQL)**:
- ✅ Control total
- ❌ Más tiempo de desarrollo
- ❌ Más mantenimiento
- ❌ Necesitas servidor
- **Veredicto**: Solo si necesitas control total

**AWS Amplify / AWS AppSync**:
- ✅ Escalable
- ❌ Más complejo
- ❌ Más caro
- **Veredicto**: Overkill para este proyecto

**Conclusión**: **MANTENER SUPABASE** - Es perfecto para este proyecto.

### 4.3 Hosting/Deployment

#### Opción 1: Vercel (RECOMENDADO para Frontend)
- **Qué es**: Hosting para aplicaciones frontend
- **Ventajas**:
  - ✅ Integración perfecta con GitHub
  - ✅ Deploy automático al hacer push
  - ✅ HTTPS incluido
  - ✅ CDN global
  - ✅ Plan gratuito generoso
  - ✅ Fácil configuración de dominio (adminisgo.com)
- **Dónde**: https://vercel.com/
- **Recomendación**: ✅ Usar Vercel

#### Opción 2: Netlify
- **Qué es**: Similar a Vercel
- **Ventajas**: Similar a Vercel
- **Dónde**: https://www.netlify.com/
- **Recomendación**: Alternativa a Vercel

#### Opción 3: GitHub Pages
- **Ventajas**: Gratis, integrado con GitHub
- **Desventajas**: Solo para sitios estáticos (no ideal para PWA compleja)
- **Recomendación**: Solo para landing page estática

**Recomendación**: **Vercel** para frontend + **Supabase** para backend = Combinación perfecta

### 4.4 Configuración del Dominio (adminisgo.com)

#### Con Vercel + GitHub:
1. Conectar repositorio de GitHub a Vercel
2. Configurar dominio personalizado en Vercel
3. Configurar DNS en tu proveedor de dominio:
   - Agregar registro CNAME: `www` → `cname.vercel-dns.com`
   - Agregar registro A: `@` → IP de Vercel (te la da Vercel)
4. Vercel maneja SSL automáticamente

#### Con GitHub Pages:
1. Configurar GitHub Pages en el repositorio
2. Configurar dominio en GitHub Pages
3. Configurar DNS:
   - CNAME: `www` → `tu-usuario.github.io`
   - A records: Según lo que indique GitHub

---

## 5. Despliegue y Distribución

### 5.1 Distribución Web (PC y Navegadores)

#### Cómo Funciona
- **Acceso**: Los usuarios ingresan desde `adminisgo.com` en cualquier navegador
- **PWA**: La app puede instalarse desde el navegador (funciona como app nativa)
- **Plataformas**: Windows, macOS, Linux (cualquier OS con navegador moderno)

#### Pasos para Deployment Web
1. **Desarrollo**: Desarrollo local con `npm run dev`
2. **Build**: Compilar para producción (`npm run build`)
3. **Deploy a Vercel**:
   - Conectar repositorio GitHub a Vercel
   - Vercel detecta automáticamente el proyecto
   - Deploy automático al hacer push a main
4. **Configurar dominio**: Agregar adminisgo.com en Vercel
5. **Listo**: App disponible en adminisgo.com

#### PWA en PC/Navegador
- **Instalación**: Botón "Instalar" en el navegador (Chrome, Edge, etc.)
- **Funciona como app**: Se abre en ventana propia, sin barra del navegador
- **Offline**: Funciona offline (con Service Worker)
- **Notificaciones**: Puede enviar notificaciones
- **Actualizaciones**: Se actualiza automáticamente

### 5.2 Distribución en Play Store (Android)

#### ¿Cómo Funciona?
**IMPORTANTE**: PWA no se puede publicar directamente en Play Store como APK tradicional.

#### Opciones:

**Opción 1: TWA (Trusted Web Activity) - RECOMENDADO**
- **Qué es**: Wrapper de PWA que permite publicar en Play Store
- **Cómo funciona**:
  1. Creas un wrapper Android mínimo (Android Studio)
  2. El wrapper carga tu PWA (adminisgo.com)
  3. Se publica en Play Store como app nativa
  4. Los usuarios la descargan desde Play Store
  5. La app carga tu PWA desde internet
- **Ventajas**:
  - ✅ Disponible en Play Store
  - ✅ Usuarios la encuentran fácilmente
  - ✅ Puedes actualizar sin re-publicar (la app es tu web)
  - ✅ Mantienes un solo código (web)
- **Herramientas**:
  - Bubblewrap (CLI de Google) - RECOMENDADO
  - Android Studio (más complejo)

**Opción 2: PWA Builder + PWABuilder**
- **Qué es**: Herramienta de Microsoft para empaquetar PWA
- **Ventajas**: Fácil de usar
- **Dónde**: https://www.pwabuilder.com/

**Opción 3: Capacitor (Ionic)**
- **Qué es**: Framework que convierte web app en nativa
- **Ventajas**: También funciona para iOS
- **Desventajas**: Más complejo

**Recomendación**: **TWA con Bubblewrap** (más simple y oficial de Google)

#### Proceso Detallado para Play Store:

**Paso 1: Preparar PWA**
- ✅ Tener manifest.json completo
- ✅ Service Worker funcionando
- ✅ HTTPS habilitado (obligatorio)
- ✅ App funcionando bien en móvil

**Paso 2: Crear TWA con Bubblewrap**
```bash
# Instalar Bubblewrap (ver comandos más abajo)
npm install -g @bubblewrap/cli

# Inicializar TWA
bubblewrap init --manifest https://adminisgo.com/manifest.json

# Build APK/AAB
bubblewrap build
```

**Paso 3: Crear Cuenta en Google Play Console**
- **Dónde**: https://play.google.com/console/
- **Costo**: $25 USD una vez (pago único)
- **Proceso**: Registro de cuenta de desarrollador

**Paso 4: Publicar en Play Store**
1. Crear nueva app en Play Console
2. Completar información (nombre, descripción, screenshots)
3. Subir APK/AAB generado
4. Configurar precios (gratis o de pago)
5. Revisar y publicar

**Paso 5: Mantenimiento**
- Actualizas tu web (adminisgo.com)
- La app en Play Store se actualiza automáticamente (es tu web)
- Solo necesitas re-publicar si cambias el TWA wrapper

### 5.3 Distribución en App Store (iOS)

#### ¿Cómo Funciona?
**PWA no se puede publicar directamente en App Store**.

#### Opción Recomendada: Capacitor
- **Qué es**: Framework que convierte web app en app nativa iOS
- **Proceso**:
  1. Instalar Capacitor
  2. Agregar plataforma iOS
  3. Build para iOS
  4. Publicar en App Store
- **Requisitos**:
  - Mac con Xcode (obligatorio)
  - Cuenta de desarrollador Apple ($99 USD/año)
  - Proceso más complejo que Android

#### Alternativa: PWA pura (sin App Store)
- Los usuarios iOS pueden instalar PWA desde Safari
- No aparece en App Store
- Funciona pero con menos visibilidad

**Recomendación**: 
- **Android**: Publicar en Play Store (TWA)
- **iOS**: Empezar con PWA instalable desde Safari, luego considerar Capacitor si hay demanda

### 5.4 Resumen de Distribución

| Plataforma | Método | Costo | Complejidad |
|------------|--------|-------|-------------|
| **Web (PC/Navegador)** | Vercel + Dominio | Gratis/Dominio | Fácil |
| **Android (Play Store)** | TWA (Bubblewrap) | $25 USD (una vez) | Media |
| **iOS (App Store)** | Capacitor | $99 USD/año | Alta |
| **iOS (PWA)** | Instalación desde Safari | Gratis | Fácil |

**Recomendación de Prioridad**:
1. ✅ **Web (PC/Navegador)**: Primero - Funciona en todos lados
2. ✅ **Android Play Store**: Segundo - Buena experiencia
3. ⚠️ **iOS**: Tercero - PWA primero, App Store después si hay demanda

---

## 6. Comandos de Verificación e Instalación

### 6.1 Verificar Herramientas Instaladas (PowerShell)

Abre PowerShell y ejecuta estos comandos:

#### Node.js y npm
```powershell
# Verificar Node.js
node --version
# Si muestra versión (ej: v18.17.0) = ✅ Instalado
# Si muestra error = ❌ No instalado

# Verificar npm
npm --version
# Si muestra versión (ej: 9.6.7) = ✅ Instalado
```

#### Git
```powershell
# Verificar Git
git --version
# Si muestra versión (ej: git version 2.41.0) = ✅ Instalado
```

#### Verificar VS Code (opcional)
```powershell
# Verificar VS Code
code --version
# Si muestra versión = ✅ Instalado
# Si muestra error = Abrir desde menú inicio en su lugar
```

### 6.2 Instalar Herramientas (PowerShell como Administrador)

#### Instalar Node.js (si no está instalado)

**Opción 1: Descarga Manual (RECOMENDADO)**
1. Ir a: https://nodejs.org/
2. Descargar LTS (Long Term Support) - versión recomendada
3. Ejecutar instalador
4. Seguir wizard (Next, Next, Install)
5. Reiniciar PowerShell
6. Verificar: `node --version`

**Opción 2: Con Chocolatey (si lo tienes)**
```powershell
# Instalar Node.js con Chocolatey
choco install nodejs-lts
```

#### Instalar Git (si no está instalado)

**Opción 1: Descarga Manual (RECOMENDADO)**
1. Ir a: https://git-scm.com/download/win
2. Descargar instalador
3. Ejecutar instalador
4. Configuración recomendada: "Git from the command line and also from 3rd-party software"
5. Reiniciar PowerShell
6. Verificar: `git --version`

**Opción 2: Con Chocolatey**
```powershell
choco install git
```

#### Instalar VS Code (si no está instalado)

**Opción 1: Descarga Manual**
1. Ir a: https://code.visualstudio.com/
2. Descargar instalador Windows
3. Ejecutar instalador
4. Durante instalación, marcar "Add to PATH" (agregar a PATH)

**Opción 2: Con Chocolatey**
```powershell
choco install vscode
```

### 6.3 Instalar Herramientas de Desarrollo

#### Verificar npm (debe estar con Node.js)
```powershell
npm --version
```

#### Instalar herramientas globales (opcional pero útiles)

**Bubblewrap (para TWA/Play Store)**
```powershell
npm install -g @bubblewrap/cli
```

**Verificar instalación**:
```powershell
bubblewrap --version
```

**Vercel CLI (opcional - para deploy desde terminal)**
```powershell
npm install -g vercel
```

**Verificar instalación**:
```powershell
vercel --version
```

**Create React App (para crear proyecto React)**
```powershell
# No es necesario instalarlo globalmente
# Se usa con: npx create-react-app
# o mejor: npx create-vite
```

### 6.4 Configurar Git (Primera vez)

```powershell
# Configurar nombre de usuario
git config --global user.name "Tu Nombre"

# Configurar email
git config --global user.email "tu@email.com"

# Verificar configuración
git config --list
```

### 6.5 Clonar/Inicializar Proyecto

#### Si ya tienes repositorio en GitHub:
```powershell
# Clonar repositorio
git clone https://github.com/tu-usuario/adminisgo.git
cd adminisgo
```

#### Si quieres crear nuevo proyecto:
```powershell
# Crear carpeta del proyecto
mkdir adminisgo
cd adminisgo

# Inicializar Git
git init

# Conectar con GitHub (después de crear repo en GitHub)
git remote add origin https://github.com/tu-usuario/adminisgo.git
```

---

## 7. Setup Inicial del Proyecto

### 7.1 Crear Proyecto Frontend (React + Vite)

```powershell
# Crear proyecto React con Vite
npm create vite@latest frontend -- --template react
# o con TypeScript:
npm create vite@latest frontend -- --template react-ts

cd frontend

# Instalar dependencias
npm install

# Instalar dependencias adicionales recomendadas
npm install react-router-dom
npm install zustand  # o npm install @reduxjs/toolkit react-redux
npm install axios
npm install react-hook-form yup
npm install @supabase/supabase-js
npm install bootstrap bootstrap-icons

# Iniciar servidor de desarrollo
npm run dev
```

### 7.2 Configurar Supabase

1. **Ir a**: https://supabase.com/
2. **Login** con tu cuenta (o crear cuenta)
3. **Crear nuevo proyecto** (o usar existente)
4. **Configurar variables de entorno**:
   - Crear archivo `.env` en `frontend/`:
   ```
   VITE_SUPABASE_URL=tu-url-de-supabase
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```
5. **Configurar base de datos**: Ejecutar scripts SQL desde `GUIA_DE_BASE_DE_DATOS.md`

### 7.3 Configurar Vercel (Deployment)

1. **Ir a**: https://vercel.com/
2. **Sign up** con GitHub
3. **Import Project**:
   - Seleccionar repositorio de GitHub
   - Vercel detecta automáticamente (React/Vite)
   - Configurar variables de entorno (SUPABASE_URL, etc.)
   - Deploy
4. **Configurar dominio**:
   - En proyecto de Vercel: Settings > Domains
   - Agregar: adminisgo.com
   - Configurar DNS según instrucciones

---

## 8. Checklist de Setup

### ✅ Antes de Empezar

- [ ] Node.js instalado (`node --version`)
- [ ] npm instalado (`npm --version`)
- [ ] Git instalado (`git --version`)
- [ ] VS Code instalado (opcional pero recomendado)
- [ ] Cuenta en GitHub creada
- [ ] Cuenta en Supabase creada
- [ ] Cuenta en Vercel creada (para deployment)
- [ ] Git configurado (nombre y email)
- [ ] Proyecto creado o clonado
- [ ] Variables de entorno configuradas

### ✅ Para Publicar en Play Store

- [ ] PWA funcionando en producción
- [ ] HTTPS habilitado
- [ ] Manifest.json completo
- [ ] Service Worker funcionando
- [ ] Bubblewrap instalado (`npm install -g @bubblewrap/cli`)
- [ ] Cuenta en Google Play Console ($25 USD)
- [ ] TWA generado (`bubblewrap build`)
- [ ] APK/AAB subido a Play Store

---

## 9. Servicios Online (Ingresar desde Navegador)

### 9.1 Servicios Necesarios

#### GitHub
- **URL**: https://github.com/
- **Qué hacer**: 
  - Login/Registrarse
  - Crear nuevo repositorio (o usar existente)
  - Configurar acceso desde terminal
- **Gratis**: Sí (planes gratuitos disponibles)

#### Supabase
- **URL**: https://supabase.com/
- **Qué hacer**:
  - Login/Registrarse
  - Crear nuevo proyecto (o usar existente)
  - Obtener URL y API keys
  - Configurar base de datos
- **Gratis**: Sí (plan gratuito generoso)

#### Vercel
- **URL**: https://vercel.com/
- **Qué hacer**:
  - Sign up con GitHub
  - Conectar repositorio
  - Configurar dominio
  - Configurar variables de entorno
- **Gratis**: Sí (plan gratuito generoso)

#### Google Play Console
- **URL**: https://play.google.com/console/
- **Qué hacer**:
  - Crear cuenta de desarrollador
  - Pagar tarifa única ($25 USD)
  - Crear nueva aplicación
  - Subir APK/AAB
- **Costo**: $25 USD (pago único)

#### Apple Developer (solo si publicas en iOS)
- **URL**: https://developer.apple.com/
- **Qué hacer**:
  - Crear cuenta de desarrollador
  - Pagar membresía anual
  - Configurar certificados
- **Costo**: $99 USD/año

---

## 10. Resumen de Recomendaciones

### ✅ Stack Recomendado (Final)

**Frontend**:
- React 18 + Vite
- TypeScript (opcional pero recomendado)
- React Router
- Zustand (estado)
- Bootstrap 5 o Tailwind CSS
- Supabase Client

**Backend**:
- **MANTENER SUPABASE** ✅
- PostgreSQL (incluido en Supabase)
- Supabase Auth
- Supabase Storage

**Hosting**:
- **Vercel** para frontend ✅
- **Supabase** para backend ✅

**Control de Versiones**:
- **MANTENER GITHUB** ✅

**Distribución**:
- **Web**: Vercel + adminisgo.com ✅
- **Android**: TWA (Bubblewrap) + Play Store ✅
- **iOS**: PWA desde Safari (inicio), luego Capacitor si necesario

**Conclusión**: **Mantener GitHub y Supabase** - Son las mejores opciones para este proyecto. Solo agregar Vercel para hosting del frontend.

---

## 📝 Notas Finales

### Flujo de Trabajo Recomendado

1. **Desarrollo Local**:
   - Trabajar en `frontend/`
   - Usar `npm run dev` para desarrollo
   - Conectar con Supabase localmente

2. **Versionado**:
   - Commits a Git
   - Push a GitHub

3. **Deployment**:
   - Vercel detecta push a main
   - Deploy automático
   - App disponible en adminisgo.com

4. **Play Store**:
   - Actualizar PWA en producción
   - Generar nuevo TWA con Bubblewrap
   - Publicar actualización en Play Store

### Próximos Pasos Inmediatos

1. ✅ Verificar herramientas instaladas (comandos arriba)
2. ✅ Instalar herramientas faltantes
3. ✅ Crear/Configurar repositorio en GitHub
4. ✅ Configurar proyecto en Supabase
5. ✅ Crear proyecto inicial con Vite
6. ✅ Configurar Vercel
7. ✅ Empezar desarrollo

---

**Última actualización**: Enero 2026  
**Versión del documento**: 1.0

