Manejo de errores y validaciones del sistema

Este documento tiene como objetivo definir los requisitos de validación y manejo de errores que deben aplicarse en distintas partes del proyecto.

- Formulario: Carga de Clientes

Validación de datos duplicados
Si el campo Número de documento coincide con el de un cliente previamente registrado, al presionar el botón Crear:

No se deberán guardar los datos ingresados.

Se deberá mostrar un mensaje de error indicando que el cliente ya existe.

Coincidencia de nombre de cliente
Si al cargar un nuevo cliente el Nombre del cliente coincide con el de un cliente ya registrado, al presionar Crear:

Se deberá mostrar un mensaje de advertencia.

El mensaje deberá incluir un botón de aceptación para confirmar y continuar con la carga.

Campos obligatorios
Los siguientes campos no pueden quedar vacíos al momento del registro:

Nombre del cliente

Número de documento

Confirmación antes de guardar
Al presionar el botón Finalizar carga:

Se deberá mostrar un mensaje de confirmación con botón de aceptación antes de guardar los datos.

En caso de faltar información obligatoria o existir datos incorrectos, se deberá mostrar un mensaje de error correspondiente.

 - Formulario: Carga de Productos

Validación de datos duplicados
Si alguno de los siguientes campos coincide con un producto previamente registrado, al presionar el botón Crear:

No se deberán guardar los datos ingresados.

Se deberá mostrar un mensaje de error indicando el conflicto.

Campos a validar:

Nombre del producto

Código de barras

Código interno

Campos obligatorios
Los siguientes campos no pueden quedar vacíos al momento del registro:

Nombre del producto

Código de barras

Código interno

Stock mínimo

Confirmación antes de guardar
Al presionar el botón Finalizar carga:

Se deberá mostrar un mensaje de confirmación con botón de aceptación antes de guardar los datos.

En caso de faltar información obligatoria o existir datos incorrectos, se deberá mostrar un mensaje de error.

Categorías y Marcas:

Tanto el formulario para cargar categorias, como el de marcas, no debe permitir cargar registros que contengan nombre repedido de registro anterior. Debe dar aviso si el campo nombre está vacío. Debe dar aviso de aceptación antes de guardar los registros. Debe dar mensaje de éxito si los registros se cargan correctamente. 

Proveedores:

En el formulario de registro de proveedores, tener las siguientes consideraciones:

- Los campos que no pueden estar vacíos son Nombre / Razón Social.
- Antes de registrar los datos debe preguntar si acepto.