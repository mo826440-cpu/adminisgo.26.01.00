# Instalar Dependencias de Mercado Pago

## 📦 Comandos a Ejecutar

### 1. Instalar SDK de Mercado Pago

```bash
cd frontend
npm install mercadopago
```

Esto instalará el SDK oficial de Mercado Pago para Node.js, que se usará en las API Routes de Vercel.

---

## ✅ Verificación

Después de instalar, verifica que se agregó al `package.json`:

```json
"dependencies": {
  "mercadopago": "^2.1.7",
  ...
}
```

---

## 📝 Nota

El SDK de Mercado Pago solo se usa en el **backend** (API Routes). El frontend no necesita instalar nada adicional, solo hace llamadas HTTP a las API Routes.

---

**Siguiente paso**: Configurar variables de entorno (ver `CONFIGURAR_MERCADO_PAGO.md`)
