Quiero que diseñes la interfaz y la lógica para el sector de "Configuración de Impresoras" dentro de nuestro módulo de Configuración, adaptándote de forma estricta a la arquitectura técnica actual de este proyecto.

Antes de generar el código, lee nuestros archivos abiertos e indexados para identificar y respetar:
1. El lenguaje de programación, framework de frontend y el sistema de componentes/estilos que venimos usando en el sistema.
2. La estructura de base de datos existente (revisá cómo guardamos las configuraciones generales del sistema o las tablas de comercio para almacenar este nuevo estado).

REQUERIMIENTOS DEL MÓDULO:

1. SELECTOR DE IMPRESORA/ANCHO:
   - Opción POS 58mm (fuente de ancho fijo a 32 columnas de texto).
   - Opción POS 80mm (fuente de ancho fijo a 42 columnas de texto).

2. PANEL DE CAMPOS ACTIVABLES/DESACTIVABLES (Checkboxes o Switches de UI):
   Permitir al usuario elegir mediante toggles si se visualizan u ocultan en el ticket final:
   - Datos del Comercio (Nombre, Dirección)
   - Datos del Cliente (Nombre, DNI)
   - Sector de Múltiples Formas de Pago, Pagado y Adeudado
   - Sector de Firmas (Cliente y Vendedor)

3. ESTILOS DE FUENTE:
   - Tipo de letra (Permitir seleccionar entre Font A, Font B, Courier).
   - Peso de la fuente (Común / Negrita) para aplicar a títulos y totales.

4. COMPONENTE DE VISTA PREVIA EN TIEMPO REAL (Live Preview):
   - Debe simular visualmente un rollo de papel térmico (fondo claro, sombra sutil, bordes definidos).
   - DEBE usar obligatoriamente una tipografía monoespaciada (monospace) en CSS/UI para que el alineado de los precios a la derecha no se rompa en la pantalla.
   - Al cambiar el ancho (58mm o 80mm), el contenedor de la vista previa debe ajustar su ancho físico en pixeles y limitar el texto estrictamente a 32 o 42 caracteres por línea respectivamente.
   - Cualquier cambio en los switches (ocultar firmas, activar datos de cliente, cambiar a negrita) debe actualizar el texto de la vista previa en tiempo real de forma dinámica.

Utilizá las siguientes plantillas base con datos de prueba para renderizar la vista previa inicial (con todas las opciones activadas). Tu código debe ocultar o mostrar dinámicamente las secciones según los componentes activados:

--- PLANTILLA BASE 58mm (32 columnas de ancho fijo) ---
================================
         KIOSCO "EL SOL"        
    Av. Corrientes 1234, CABA   
================================
        TICKET DE VENTA         
  NO VALIDO COMO FACTURA FISCAL 
================================
Fecha: 11/06/2026    Hora: 19:19
Ticket Nro: 0001-00023456
--------------------------------
DATOS DEL CLIENTE:
Nom: Juan Carlos Perez
DNI: 22.345.678
--------------------------------
Cant Descripcion         Importe
--------------------------------
1    Alfajor Jorgito     $900,00
2    Chicle Beldent      $800,00
1    Coca-Cola 500ml   $1.800,00
--------------------------------
TOTAL COMPRA:          $3.500,00
--------------------------------
DETALLE DE PAGO:
> Efectivo:            $1.000,00
> Mercado Pago:        $1.000,00
--------------------------------
TOTAL PAGADO:          $2.000,00
MONTO ADEUDADO:        $1.500,00
================================

FIRMA CLIENTE: _________________


FIRMA VENDEDOR: ________________



================================
     ¡Gracias por su compra!    
================================




--- PLANTILLA BASE 80mm (42 columnas de ancho fijo) ---
==========================================
              KIOSCO "EL SOL"             
         Av. Corrientes 1234, CABA        
==========================================
             TICKET DE VENTA              
      NO VALIDO COMO FACTURA FISCAL       
==========================================
Fecha: 11/06/2026              Hora: 19:19
Ticket Nro: 0001-00023456
Atendido por: Carlos
------------------------------------------
DATOS DEL CLIENTE:
Nombre y Apellido: Juan Carlos Perez
DNI/CUIL: 22.345.678
------------------------------------------
Cant. Descripción                  Importe
------------------------------------------
1     Alfajor Jorgito Negro       $ 900,00
2     Chicle Beldent Menta        $ 800,00
1     Gaseosa Coca-Cola 500ml   $1.800,00
------------------------------------------
TOTAL COMPRA:                    $3.500,00
------------------------------------------
FORMA DE PAGO DETALLADA:
- Efectivo:                      $1.000,00
- Mercado Pago:                  $1.000,00
------------------------------------------
TOTAL COMPRA:                    $3.500,00
TOTAL PAGADO:                    $2.000,00
MONTO ADEUDADO:                  $1.500,00
==========================================

FIRMA CLIENTE:  __________________________


FIRMA VENDEDOR: __________________________



==========================================
         ¡Gracias por su compra!          
==========================================



ENTREGABLES REQUERIDOS:
1. Código de la interfaz (frontend) con el formulario de configuración y la vista previa reactiva.
2. Controlador/Endpoint (backend) que reciba la petición para guardar los cambios.
3. Script de base de datos o migración correspondiente para almacenar este objeto JSON de configuración en nuestra estructura de persistencia actual.
