/**
 * Texto de vista previa para Configuración de Impresoras (plantillas 58/80 mm del spec).
 */
import {
  thermalCenterLine,
  thermalDash,
  thermalDetailLine,
  thermalCellRpad,
  thermalCellLpad,
} from './thermalPlainReceipt'
import { getTicketColsFromConfig } from '../constants/ticketPrintConfig'

function eqLine(cols) {
  return '='.repeat(cols)
}

function itemRow(cols, qty, name, price) {
  if (cols >= 42) {
    const wQ = 5
    const wT = 13
    const wP = cols - wQ - wT
    return (
      thermalCellRpad(String(qty), wQ) +
      thermalCellRpad(name, wP) +
      thermalCellLpad(price, wT)
    )
  }
  const wQ = 4
  const wT = 10
  const wP = cols - wQ - wT
  return (
    thermalCellRpad(String(qty), wQ) +
    thermalCellRpad(name, wP) +
    thermalCellLpad(price, wT)
  )
}

function headerItems(cols) {
  if (cols >= 42) {
    return thermalCellRpad('Cant.', 5) + thermalCellRpad('Descripción', 24) + thermalCellLpad('Importe', 13)
  }
  return thermalCellRpad('Cant', 4) + thermalCellRpad('Descripcion', 18) + thermalCellLpad('Importe', 10)
}

export function buildTicketConfigPreviewText(config) {
  const cfg = config || {}
  const cols = getTicketColsFromConfig(cfg)
  const lines = []

  lines.push(eqLine(cols))
  if (cfg.mostrarDatosComercio !== false) {
    lines.push(thermalCenterLine('KIOSCO "EL SOL"', cols))
    lines.push(thermalCenterLine('Av. Corrientes 1234, CABA', cols))
    lines.push(eqLine(cols))
  }

  lines.push(thermalCenterLine('TICKET DE VENTA', cols))
  lines.push(thermalCenterLine('NO VALIDO COMO FACTURA FISCAL', cols))
  lines.push(eqLine(cols))

  if (cols >= 42) {
    lines.push('Fecha: 11/06/2026              Hora: 19:19'.slice(0, cols))
  } else {
    lines.push('Fecha: 11/06/2026    Hora: 19:19'.slice(0, cols))
  }
  lines.push('Ticket Nro: 0001-00023456'.slice(0, cols))
  if (cols >= 42) lines.push('Atendido por: Carlos'.slice(0, cols))
  lines.push(thermalDash(cols))

  if (cfg.mostrarDatosCliente !== false) {
    lines.push('DATOS DEL CLIENTE:'.slice(0, cols))
    if (cols >= 42) {
      lines.push('Nombre y Apellido: Juan Carlos Perez'.slice(0, cols))
      lines.push('DNI/CUIL: 22.345.678'.slice(0, cols))
    } else {
      lines.push('Nom: Juan Carlos Perez'.slice(0, cols))
      lines.push('DNI: 22.345.678'.slice(0, cols))
    }
    lines.push(thermalDash(cols))
  }

  lines.push(headerItems(cols).slice(0, cols))
  lines.push(thermalDash(cols))
  lines.push(itemRow(cols, 1, cols >= 42 ? 'Alfajor Jorgito Negro' : 'Alfajor Jorgito', cols >= 42 ? '$ 900,00' : '$900,00'))
  lines.push(itemRow(cols, 2, cols >= 42 ? 'Chicle Beldent Menta' : 'Chicle Beldent', '$800,00'))
  lines.push(
    itemRow(
      cols,
      1,
      cols >= 42 ? 'Gaseosa Coca-Cola 500ml' : 'Coca-Cola 500ml',
      cols >= 42 ? '$1.800,00' : '$1.800,00'
    )
  )
  lines.push(thermalDash(cols))
  lines.push(thermalDetailLine('TOTAL COMPRA:', cols >= 42 ? '$3.500,00' : '$3.500,00', cols))
  lines.push(thermalDash(cols))

  if (cfg.mostrarFormasPago !== false) {
    if (cols >= 42) {
      lines.push('FORMA DE PAGO DETALLADA:'.slice(0, cols))
      lines.push(thermalDetailLine('- Efectivo:', '$1.000,00', cols))
      lines.push(thermalDetailLine('- Mercado Pago:', '$1.000,00', cols))
    } else {
      lines.push('DETALLE DE PAGO:'.slice(0, cols))
      lines.push(thermalDetailLine('> Efectivo:', '$1.000,00', cols))
      lines.push(thermalDetailLine('> Mercado Pago:', '$1.000,00', cols))
    }
    lines.push(thermalDash(cols))
    lines.push(thermalDetailLine('TOTAL PAGADO:', '$2.000,00', cols))
    lines.push(thermalDetailLine(cols >= 42 ? 'MONTO ADEUDADO:' : 'MONTO ADEUDADO:', '$1.500,00', cols))
    lines.push(eqLine(cols))
  }

  if (cfg.mostrarFirmas !== false) {
    lines.push('')
    lines.push(
      cols >= 42 ? 'FIRMA CLIENTE:  __________________________' : 'FIRMA CLIENTE: _________________'
    )
    lines.push('')
    lines.push('')
    lines.push(
      cols >= 42 ? 'FIRMA VENDEDOR: __________________________' : 'FIRMA VENDEDOR: ________________'
    )
    lines.push('')
    lines.push('')
    lines.push(eqLine(cols))
  }

  lines.push(thermalCenterLine('¡Gracias por su compra!', cols))
  lines.push(eqLine(cols))

  return lines.join('\n')
}
