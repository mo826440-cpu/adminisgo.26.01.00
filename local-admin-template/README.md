# Módulo de seguimiento local (Adminis Go)

Sirve para ver un **resumen** (comercios, usuarios Auth, tablas en `public`, tamaño de la BD en disco), un **desglose por tabla** (registros aproximados y espacio en disco) y **detalle operativo** (filas en tablas públicas, planes, listado de comercios) usando la **service role** de Supabase, **solo en tu PC**.

### Migraciones SQL (métricas de BD)

- **Resumen** (conteo de tablas + tamaño total de la BD): RPC `local_admin_db_overview` → `database/migrations/033_local_admin_db_overview_rpc.sql`
- **Desglose por tabla** (lista, filas estimadas, tamaño en disco por relación): RPC `local_admin_table_breakdown` → `database/migrations/034_local_admin_table_breakdown_rpc.sql`

Aplicá ambas en Supabase (SQL Editor o tu flujo de migraciones). Sin la 033, faltan indicadores del resumen; sin la 034, no se llena la tabla de desglose (y verás el error en pantalla).

## Instalación (una vez)

Desde la **raíz del repo**:

### Windows (PowerShell)

```powershell
Copy-Item -Recurse -Force local-admin-template local-admin
cd local-admin
Copy-Item .env.example .env
notepad .env
```

Completá en `.env`:

- `SUPABASE_URL` — igual que en tu frontend (`VITE_SUPABASE_URL`).
- `SUPABASE_SERVICE_ROLE_KEY` — la encontrás en Supabase → **Project Settings → API → service_role** (¡secreta!).

```powershell
npm install
npm start
```

Abrí **http://127.0.0.1:3847**

### Linux / macOS

```bash
cp -r local-admin-template local-admin
cd local-admin
cp .env.example .env
# editar .env
npm install
npm start
```

## Seguridad

- No commitees `local-admin/` (está en `.gitignore`).
- No expongas el puerto `3847` al WiFi/router.
- La **service role** ignora RLS: es solo para administración local.

## Qué no hace este panel

- No muestra automáticamente el plan **Gratis/Pro de Supabase** (eso está en el dashboard de facturación; hay enlaces en la página).
- No calcula “MB por comercio” (haría falta SQL/medición ad hoc).

La carpeta **`local-admin-template/`** sí puede estar en GitHub (plantilla sin secretos). Tu instancia con `.env` vive en **`local-admin/`** y no se sube.
