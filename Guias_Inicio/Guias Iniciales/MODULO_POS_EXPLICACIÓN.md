¿Qué es el módulo POS?

POS significa "Point of Sale" (Punto de Venta). Es la interfaz que usan los empleados para procesar ventas.
Funcionalidad principal
Es como una caja registradora digital. Permite:
Seleccionar productos: buscar y agregar productos al carrito.
Modificar el carrito: cambiar cantidades, eliminar items.
Seleccionar cliente: opcional; puede ser "Cliente Genérico" o un cliente registrado.
Calcular totales: subtotal, descuentos (si aplica), impuestos (si aplica), total final.
Procesar pago: método de pago (efectivo, tarjeta, etc.). En el MVP empezamos con efectivo.
Confirmar venta: al confirmar, se guarda:
La venta en la tabla ventas (fecha, cliente, total, método de pago, etc.)
Los detalles de la venta en detalle_ventas (productos, cantidades, precios)
Se actualiza el stock de cada producto (reduce el stock disponible)
Mostrar ticket: resumen de la venta para imprimir o mostrar en pantalla.
Ejemplo de flujo
El cliente quiere comprar: 2 Coca-Cola + 1 Snickers
En el POS: buscas "Coca-Cola", agregas 2 unidades, buscas "Snickers", agregas 1
El sistema calcula: $500 + $200 = $700
Seleccionas el cliente (o "Cliente Genérico")
El cliente paga $1000 en efectivo
Confirmas la venta
El sistema: guarda la venta, reduce el stock (Coca-Cola: -2, Snickers: -1), muestra el ticket
Interfaz típica
┌─────────────────────────────────────────┐
│  POS - Punto de Venta                   │
├─────────────────────────────────────────┤
│  [Buscar producto...]                   │
│                                         │
│  LISTA DE PRODUCTOS                     │
│  ┌─────────────────────────────────┐    │
│  │ Producto 1    $100  [+ Agregar] │    │
│  │ Producto 2    $200  [+ Agregar] │    │
│  └─────────────────────────────────┘    │
│                                         │
│  CARRITO                                │
│  ┌─────────────────────────────────┐    │
│  │ 2x Coca-Cola    $500            │    │
│  │ 1x Snickers     $200            │    │
│  ├─────────────────────────────────┤    │
│  │ Subtotal:       $700            │    │
│  │ Total:          $700            │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Cliente: [Cliente Genérico ▼]          │
│  Método:  [Efectivo ▼]                  │
│                                         │
│  [Cancelar]  [Confirmar Venta]          │
└─────────────────────────────────────────┘
En resumen: es la parte del sistema donde se registran las ventas y se actualiza el inventario.