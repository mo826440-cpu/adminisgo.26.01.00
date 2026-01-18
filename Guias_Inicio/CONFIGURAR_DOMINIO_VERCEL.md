# Configurar Dominio Personalizado en Vercel - adminisgo.com

## 📋 Paso 1: Agregar Dominio en Vercel

1. **Andá a tu proyecto en Vercel:**
   - https://vercel.com/mo826440-8437s-projects/adminisgo-26-01-00
   - O desde el dashboard, clickeá en tu proyecto

2. **Andá a la sección "Domains" (Dominios):**
   - Click en la pestaña **"Ajustes"** (Settings) en la parte superior
   - En el menú izquierdo, clickeá en **"Dominios"** (Domains)
   - O directamente: https://vercel.com/mo826440-8437s-projects/adminisgo-26-01-00/settings/domains

3. **Agregar el dominio:**
   - En el campo de texto, escribí: `adminisgo.com`
   - Click en **"Agregar"** o **"Add"**
   - Vercel te mostrará las instrucciones de DNS que necesitás configurar

---

## 📋 Paso 2: Ver Instrucciones de DNS en Vercel

Después de agregar el dominio, Vercel te mostrará algo como:

**Para `adminisgo.com`:**
- **Tipo:** CNAME o A Record
- **Nombre:** `@` o `adminisgo.com`
- **Valor:** Una URL tipo `cname.vercel-dns.com` o una IP

**Para `www.adminisgo.com`:**
- **Tipo:** CNAME
- **Nombre:** `www`
- **Valor:** `cname.vercel-dns.com` (o similar)

⚠️ **IMPORTANTE:** Anotá exactamente qué valores te da Vercel, porque los necesitás para configurar en DonWeb.

---

## 📋 Paso 3: Configurar DNS en DonWeb

1. **En la página de Zona DNS que ya tenés abierta:**
   - https://micuenta.donweb.com/es-ar/servicios/dominios/5562430/configurar/dns-zone

2. **Eliminar registros antiguos (si es necesario):**
   - Si tenés registros A que apuntan a GitHub (como los que veo: 185.199.108.153, etc.), podés eliminarlos
   - Click en el icono de "Eliminar" (basura) al lado de cada registro A antiguo
   - ⚠️ **NO elimines** los registros NS (ns1.donweb.com, ns2.donweb.com)

3. **Agregar registros según Vercel:**
   
   **Opción A: Si Vercel te da un CNAME:**
   - Click en **"Agregar registro"** (botón verde)
   - **Tipo:** Seleccioná "CNAME"
   - **Nombre:** `@` (para adminisgo.com) o `adminisgo.com`
   - **Contenido:** El valor que te dio Vercel (ej: `cname.vercel-dns.com`)
   - **TTL:** 14400 (o el que Vercel recomiende)
   - Click en **"Guardar"** o **"Agregar"**

   **Opción B: Si Vercel te da registros A (IPs):**
   - Click en **"Agregar registro"**
   - **Tipo:** Seleccioná "A"
   - **Nombre:** `@` o `adminisgo.com`
   - **Contenido:** La IP que te dio Vercel
   - **TTL:** 14400
   - Click en **"Guardar"**
   - (Si Vercel da múltiples IPs, agregá un registro A por cada una)

4. **Agregar registro para www:**
   - Si ya tenés `www.adminisgo.com` como CNAME, editálo
   - Si no, agregá un nuevo registro CNAME:
     - **Tipo:** CNAME
     - **Nombre:** `www`
     - **Contenido:** El valor de CNAME que te dio Vercel (debería ser el mismo que para el dominio principal)
     - **TTL:** 14400
     - Click en **"Guardar"**

---

## 📋 Paso 4: Esperar Propagación DNS

- La propagación DNS puede tardar desde **5 minutos hasta 24 horas**
- Generalmente tarda **15-30 minutos**
- Podés verificar el estado en Vercel (te mostrará si está activo o pendiente)

---

## 📋 Paso 5: Configurar Dominio en Supabase

Una vez que Vercel confirme que el dominio está activo:

1. **Andá a Supabase:**
   - https://supabase.com/dashboard
   - Seleccioná tu proyecto

2. **Settings → API:**
   - En el menú izquierdo: **Settings** → **API**

3. **Agregar dominio permitido:**
   - Buscá la sección **"Site URL"** o **"Allowed URLs"**
   - Agregá: `https://adminisgo.com`
   - También agregá: `https://www.adminisgo.com`
   - Guardá los cambios

---

## 📋 Paso 6: Verificar

1. **Verificar en Vercel:**
   - Debería mostrar estado "Activo" o "Ready"
   - Si muestra "Pending" o error, esperá un poco más

2. **Probar en el navegador:**
   - Abrí: `https://adminisgo.com`
   - Debería cargar tu aplicación
   - También probá: `https://www.adminisgo.com`

3. **Probar funcionalidades:**
   - Login/Registro
   - Navegación
   - PWA (instalar desde adminisgo.com)

---

## ⚠️ Notas Importantes

- **NO elimines** los registros NS (name servers) - son necesarios
- **Sí podés eliminar** los registros A antiguos de GitHub si ya no los usás
- El CNAME de `www` puede apuntar al mismo valor que el dominio principal
- HTTPS es automático en Vercel (no necesitás certificado SSL)
- Si algo no funciona, revisá los logs en Vercel

---

## 🆘 Si hay problemas

1. **Dominio no se activa en Vercel:**
   - Verificá que los registros DNS estén correctos
   - Esperá más tiempo (hasta 24 horas)
   - Verificá que no haya errores de escritura

2. **La app carga pero login no funciona:**
   - Verificá que agregaste el dominio en Supabase
   - Revisá la consola del navegador (F12) por errores

3. **Error de certificado SSL:**
   - Vercel lo maneja automáticamente
   - Si hay error, esperá unos minutos más

---

¿Necesitás ayuda con algún paso específico?

