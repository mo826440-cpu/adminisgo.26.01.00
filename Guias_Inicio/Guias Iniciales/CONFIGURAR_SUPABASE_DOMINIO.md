# Configurar Dominio en Supabase

## 📋 Pasos para Agregar adminisgo.com en Supabase

1. **Andá a tu proyecto en Supabase:**
   - https://supabase.com/dashboard
   - Seleccioná tu proyecto (el que tiene la URL `luaxxiedrxexrpeludyo.supabase.co`)

2. **Andá a Settings → API:**
   - En el menú izquierdo, clickeá en **"Settings"** (Configuración)
   - Luego clickeá en **"API"**

3. **Agregar dominios permitidos:**
   - Buscá la sección **"Site URL"** o **"URL Configuration"**
   - En **"Site URL"**, cambiá o agregá: `https://www.adminisgo.com`
   - En **"Additional Redirect URLs"** o **"Allowed URLs"**, agregá:
     - `https://www.adminisgo.com`
     - `https://adminisgo.com`
     - (Opcional: también podés agregar el dominio de Vercel: `https://adminisgo-26-01-00.vercel.app`)

4. **Guardar cambios:**
   - Click en **"Save"** o **"Guardar"**

---

## ✅ Después de esto

Tu aplicación debería funcionar completamente en:
- `https://www.adminisgo.com`
- `https://adminisgo.com` (redirige a www)

---

## 🧪 Probar la App

1. Abrí: `https://www.adminisgo.com`
2. Probá:
   - ✅ Login/Registro
   - ✅ Navegación
   - ✅ Crear/editar productos
   - ✅ PWA (instalar desde el dominio)

---

## ⚠️ Si algo no funciona

- Revisá la consola del navegador (F12) por errores
- Verificá que las variables de entorno estén configuradas en Vercel
- Verificá que el dominio esté en Supabase

