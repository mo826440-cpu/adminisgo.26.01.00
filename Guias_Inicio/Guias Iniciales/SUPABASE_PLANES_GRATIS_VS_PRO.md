# Supabase: planes Gratis vs Pro (y cuándo subir)

Resumen en criollo según la comparación típica de facturación de Supabase, pensado para un **kiosco** con volumen aproximado de **2.000–2.500 ventas** y **150–300 compras por mes**.

**Contexto:** el sistema **ya no es solo de prueba**: lo usa **un kiosco todos los días** en un negocio real. Eso cambia el peso de backups, pausas del proyecto y límites de disco.

---

## Esquema: ¿cuándo me conviene pasar al plan Pro (y por qué)?

### Tabla decisoria (orientativa)

| Situación | ¿Tiene sentido el **Pro** (~USD 25/mes)? | Por qué (según lo que suele mostrar el plan público Gratis vs Pro) |
|-----------|------------------------------------------|----------------------------------------------------------------------|
| Negocio **abierto casi todos los días** y la app **pega a la API** seguido | **Recomendable** | El **Gratis** puede **pausarse** tras ~**1 semana sin actividad**; un cierre largo (vacaciones, feriados encadenados) puede dejarte el proyecto dormido hasta que lo reactivás manualmente. El **Pro** va orientado a **producción** sin esa lógica de “proyecto de prueba”. |
| Datos de **ventas / compras** que no podés perder | **Recomendable** | El **Pro** incluye **backups diarios** (en la captura: **7 días** de retención). En **Gratis** no está ese respaldo automático del mismo modo: el riesgo operativo es tuyo si algo se borra o corrompe. |
| La base se acerca a **~500 MB** (tope típico del Gratis) | **Sí, o limpiar datos** | **Gratis:** ~**500 MB** de base. **Pro:** **8 GB** de disco por proyecto incluidos (y después se paga extra por GB). Muchas filas + años de historial + adjuntos pueden comer disco. |
| Mucho **tráfico de salida** (egress), muchas descargas o app muy “habladora” | **Valorar Pro** | **Gratis:** pocos GB/mes de egress (en la captura: **5 GB**). **Pro:** mucho más incluido (**250 GB** en la captura). Un solo kiosco suele ir bien en Gratis; si crece el uso o hay reportes masivos, mirá el medidor en Supabase. |
| Solo **probás** o el riesgo de perder datos es bajo | **No urgente** | El **Gratis** alcanza para MVP; igual conviene tener **algún** plan de copia (export manual, etc.). |
| Necesitás **SOC2 / HIPAA / SSO** o soporte con **SLA** | **No es el Pro “solo”** | Eso entra en **Equipo** o **Empresa**; para un kiosco normal no aplica. |

### Comparativo rápido Gratis vs Pro (según captura de precios)

| Tema | **Gratis** | **Pro** (resumen) |
|------|------------|---------------------|
| Precio | **USD 0** / mes | Desde **~USD 25** / mes |
| Disco base de datos | **~500 MB** | **8 GB** incl. por proyecto (+ extra pago si pasás) |
| Pausa del proyecto | Sí: **~1 semana sin actividad** (revisá el texto exacto en tu panel) | Pensado para **producción** (sin esa pausa de “proyecto gratis”) |
| Backups automáticos | No destacados como en Pro | **Diarios**, **7 días** de retención (según tabla pública) |
| Egreso (egress) | **5 GB** (típico en tabla) | **250 GB** incl. (típico en tabla) |
| Storage de archivos | **1 GB** | **100 GB** incl. (típico en tabla) |
| Soporte | Comunidad | **Email** |
| Uso típico | Personal / pruebas / algo muy chico | **Aplicaciones en producción** con margen para crecer |

**Nota aparte (código / API):** el límite de **~1000 filas por respuesta** de PostgREST **no se “arregla” cambiando de plan**: se resuelve **paginando** en la app (como ya está hecho en `ventas.js`). El plan importa más por **disco, backups, pausa, egress**, etc.

---

## Plan Gratis ($0)

**Qué es:** Para arrancar o probar. Base chica (por ejemplo ~500 MB), poca RAM compartida, pocos GB de salida de datos (egress), poco almacenamiento de archivos, soporte solo por comunidad.

**Ojo:** Los proyectos gratuitos **pueden pausarse** si el proyecto queda **inactivo** un tiempo (según las reglas actuales de Supabase; revisá siempre el texto en tu panel). Si el kiosco **usa el sistema casi todos los días**, en la práctica el proyecto suele seguir activo; si hay **varios días seguidos sin ningún uso** de la API, conviene verificar si eso te afecta.

**En general no incluye** backups diarios como el plan Pro (eso importa para datos de negocio).

---

## Plan Pro (~USD 25 / mes) — el “del medio”

**Qué es:** El plan típico de **producción chica o mediana**: más disco incluido, más salida de datos y de archivos, **backups diarios** (retención de varios días, según lo que indique tu panel), retención de logs, soporte por correo.

**Para un kiosco:** Con **miles de movimientos por mes**, el **tamaño de la base** suele **no** ser todavía el motivo principal para subir; lo que más pesa a favor del Pro suele ser: **backups automáticos**, menos drama con **límites**, y **no depender del modo gratuito** si el negocio ya es real.

*(Los montos y límites exactos cambian: mirá siempre [supabase.com/pricing](https://supabase.com/pricing) y tu sección de Facturación.)*

---

## Plan Equipo (~USD 599 / mes)

**Qué es:** Para empresas que necesitan **compliance** (SOC2, HIPAA opcional), **SSO** en el dashboard de Supabase, soporte prioritario con **SLA**, backups con retención más larga.

**Para un solo kiosco** no suele tener sentido salvo que sea una **empresa grande** con requisitos legales o de seguridad muy específicos.

---

## Plan Empresa (precio a medida)

**Qué es:** Grandes cuentas, soporte dedicado, requisitos especiales (por ejemplo “traé tu propia nube”). **No aplica** al escenario típico de un kiosco hoy.

---

## ¿Conviene pasarse a Pro **ahora**?

### Tu volumen no “obliga” el Pro por capacidad pura

~2.500 ventas + ~300 compras al mes, en filas de base de datos, **no agotan por sí solos** un plan gratuito razonable durante bastante tiempo (siempre que no guardes archivos enormes ni crezca muchísimo el histórico sin control).

### Sí tiene sentido el Pro ya si…

- el kiosco es **negocio en marcha** y no querés el riesgo/estrés de **proyecto pausado** o de quedarte **sin backup automático** del proveedor;
- querés **respaldo diario** por si se rompe algo o un error borra datos;
- preferís **pagar poco** y tener más **tranquilidad operativa**.

### Podés quedarte en Gratis un tiempo más si…

- todavía estás **probando** o el riesgo es bajo *(si **ya** es negocio diario, seguir en Gratis es posible, pero asumís más riesgo: pausa por inactividad y sin backups tipo Pro)*;
- el proyecto **se usa casi todos los días** (menos chance de caer en inactividad);
- aceptás **no tener** los backups del Pro y tenés **otra** estrategia de respaldo (aunque sea manual o export periódico).

---

## Conclusión en una línea

Por **cantidad de ventas/compras**, **no es obligatorio** el Pro; por **negocio real + backups + tranquilidad**, el **Pro suele ser una buena decisión** para un kiosco que ya trabaja todos los días.

**Tip:** En el dashboard de Supabase revisá **uso de base de datos** y **egress** durante un mes; si vas holgado, el Gratis puede alcanzar; si te acercás a límites o te importa el backup, conviene subir.

---

*Nota: Los límites exactos (MB, GB, precios) los define Supabase y pueden cambiar; esta guía es orientativa.*
