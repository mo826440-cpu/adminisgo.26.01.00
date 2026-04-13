# Módulo de seguimiento solo en tu PC (sin GitHub)

## ¿Se puede?

**Sí.** Git solo sube lo que está **trackeado**. Si el código vive en una carpeta **ignorada** (`.gitignore`), **nunca** entra al commit ni al push: solo existe en tu disco.

En este repo quedó configurado:

```gitignore
local-admin/
```

**Todo lo que pongas dentro de `local-admin/`** (páginas React, scripts, notas, `.env` propios) **no se sube** a GitHub, salvo que saques esa carpeta del `.gitignore` (no recomendado).

### Ojo con estos casos

| Situación | Riesgo |
|-----------|--------|
| Copiás archivos **fuera** de `local-admin/` | Eso **sí** se puede commitear sin querer. |
| Pegás **keys** en código que **sí** está en el repo | Quedan en el historial de Git aunque después las borres. Las claves van en `.env.local` (ya ignorado) o en archivos dentro de `local-admin/`. |
| Otro PC o compañero clona el repo | **No tendrá** tu módulo: tendrías que copiar la carpeta a mano o aceptar que es solo en esta máquina. |

---

## Plantilla lista en el repo (sí sube a GitHub)

En la raíz del proyecto está **`local-admin-template/`**: servidor Node mínimo + HTML que muestra conteos y enlaces al dashboard de Supabase.

- **Esa plantilla sí se commitea** (no incluye secretos).
- Tu copia de trabajo con `.env` va en **`local-admin/`**, que **no** se sube.

### Pasos rápidos

**PowerShell (desde la raíz del repo):**

```powershell
Copy-Item -Recurse -Force local-admin-template local-admin
cd local-admin
Copy-Item .env.example .env
# Editá .env: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (Project Settings → API)
npm install
npm start
```

Abrí **http://127.0.0.1:3847**

Para métricas de base de datos en el panel, ejecutá en Supabase **`database/migrations/033_local_admin_db_overview_rpc.sql`** (resumen) y **`database/migrations/034_local_admin_table_breakdown_rpc.sql`** (desglose por tabla). Ambas RPC quedan restringidas a `service_role`.

Instrucciones detalladas: **`local-admin-template/README.md`**.

---

## Qué datos pedís y cómo conseguirlos (realista)

| Dato | Dificultad | Comentario |
|------|------------|--------------|
| **Plan actual de Supabase** (Gratis / Pro, límites) | **No sale del cliente `anon`** a la app | Lo habitual es mirarlo en **Dashboard → Billing** o usar la **Supabase Management API** con un **token personal** (secreto, solo servidor o script local, **nunca** en el frontend público). |
| **Cantidad de comercios** | Fácil si tenés tabla `comercios` (o similar) | Consulta con el cliente Supabase **desde tu script local** con usuario que tenga permiso de lectura (o service role **solo en local** y nunca en repo). |
| **Uso de “memoria” / disco por comercio al mes** | **No es trivial** | Postgres no guarda “MB por comercio” por defecto: habría que **diseñar** métricas (tamaño de tablas por `comercio_id`, jobs, etc.) o usar **reportes del dashboard** de Supabase a nivel **proyecto** (disco total del proyecto). |
| **Cuánto te queda libre según plan** | Depende del plan | Comparás **uso actual del proyecto** (dashboard) con el **límite del plan** (500 MB Gratis, 8 GB Pro, etc.). Automatizar = Management API + métricas. |

Conclusión: un panel lindo **100 % automático** con todo lo que listás suele ser **herramienta local + APIs/tokens + quizá SQL de mantenimiento**, no solo “otra pantalla en el mismo frontend” sin tocar secretos.

---

## Recomendación breve

- **Secretos:** solo en `local-admin/.env` (carpeta ignorada). La **service_role** no va en el `frontend` público.
- **Actualizar la plantilla** en el repo: editá archivos dentro de `local-admin-template/`; para probar, volvé a copiar a `local-admin` o trabajá directo en `local-admin` sabiendo que esos cambios no van al push.

---
