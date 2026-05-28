import { useMemo } from 'react'

function safeStr(v) {
  return String(v ?? '').trim()
}

function chunks(arr) {
  return Array.isArray(arr) ? arr : []
}

export default function VentaRapidaTicketThermal({
  ventaRapida,
  comercio,
  formatearMoneda,
  formatearFechaHoraTicket,
}) {
  const items = chunks(ventaRapida?.items)
  const pagos = chunks(ventaRapida?.pagos)

  const numeroTicket = ventaRapida?.numero_ticket ?? ventaRapida?.ventas?.numero_ticket ?? '-'
  const clienteNombre = ventaRapida?.clientes?.nombre ? safeStr(ventaRapida.clientes.nombre) : 'Cliente genérico'
  const fechaTxt = ventaRapida?.fecha_hora ? formatearFechaHoraTicket(ventaRapida.fecha_hora) : '-'

  const total = Number(ventaRapida?.total ?? 0)
  const pagado = Number(ventaRapida?.monto_pagado ?? 0)
  const deuda =
    ventaRapida?.monto_deuda ??
    ventaRapida?.ventas?.monto_deuda ??
    Math.max(0, Number.isFinite(total) ? total : 0 - (Number.isFinite(pagado) ? pagado : 0))

  const comercioNombre = useMemo(() => {
    const n = safeStr(comercio?.nombre || 'Comercio')
    return n.toUpperCase()
  }, [comercio])

  const direccion = safeStr(comercio?.direccion || '')
  const telefono = safeStr(comercio?.telefono || '')
  const cuit = safeStr(comercio?.cuit_rut || '')

  return (
    <div className="ticket-print" translate="no">
      <table className="ticket-sheet ticket-sheet--nombre">
        <tbody>
          <tr>
            <td className="tk-full">
              <div className="nombre-comercio tk-bold">{comercioNombre}</div>
              <div className="datos-comercio">
                {direccion ? <div>{direccion}</div> : null}
                {telefono ? <div>Tel: {telefono}</div> : null}
                {cuit ? <div>CUIT: {cuit}</div> : null}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table className="ticket-sheet ticket-sheet--header">
        <tbody>
          <tr>
            <td className="col-label tk-l" style={{ fontSize: '8px' }}>
              Boleto N°
            </td>
            <td className="col-value tk-r" style={{ fontSize: '8px' }}>
              {numeroTicket}
            </td>
          </tr>
          <tr>
            <td className="col-label tk-l">Fecha</td>
            <td className="col-value tk-r">{fechaTxt}</td>
          </tr>
          <tr>
            <td className="col-label tk-l tk-bold">Cliente</td>
            <td className="col-value tk-r tk-bold">{clienteNombre}</td>
          </tr>
        </tbody>
      </table>

      <table className="ticket-sheet ticket-sheet--no-divider-after">
        <tbody>
          <tr className="section-title">
            <td className="tk-full">DETALLE</td>
          </tr>
        </tbody>
      </table>

      {/* Reemplaza la línea punteada por un salto de línea */}
      <table className="ticket-sheet ticket-sheet--no-divider-after">
        <tbody>
          <tr>
            <td className="tk-full">&nbsp;</td>
          </tr>
        </tbody>
      </table>

      <table className="ticket-sheet">
        <thead>
          <tr>
            <td className="tk-l" style={{ width: '60%' }}>
              PROD.
            </td>
            <td className="tk-r" style={{ width: '10%' }}>
              UN.
            </td>
            <td className="tk-r" style={{ width: '30%' }}>
              $TOT.
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={{ borderBottom: '1px dashed #000', padding: 0, height: 0 }} />
          </tr>
        </thead>
        <tbody>
          {items.length ? (
            items.map((it) => (
              <tr key={it.id ?? `${it.producto_id ?? ''}-${it.subtotal ?? ''}`}>
                <td className="tk-l">{safeStr(it.productos?.nombre || 'Producto')}</td>
                <td className="tk-r">{Number(it.cantidad ?? 1)}</td>
                <td className="tk-r">{formatearMoneda(it.subtotal ?? it.precio_unitario ?? 0)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="tk-l">Sin ítems</td>
              <td className="tk-r">-</td>
              <td className="tk-r">-</td>
            </tr>
          )}
        </tbody>
      </table>

      <table className="ticket-sheet ticket-sheet--no-divider-after">
        <tbody>
          <tr className="total-final-row">
            <td className="tk-l tk-bold">TOTAL VENTA</td>
            <td className="tk-r tk-bold">{formatearMoneda(total)}</td>
          </tr>
        </tbody>
      </table>

      {/* Reemplaza la línea punteada por un salto de línea */}
      <table className="ticket-sheet ticket-sheet--no-divider-after">
        <tbody>
          <tr>
            <td className="tk-full">&nbsp;</td>
          </tr>
        </tbody>
      </table>

      {pagos.length ? (
        <table className="ticket-sheet">
          <tbody>
            <tr className="pagosh-titulo">
              <td className="tk-l tk-bold">FORMA PAGO</td>
              <td className="tk-r" />
            </tr>
            {pagos.map((p) => (
              <tr key={p.id ?? `${p.metodo_pago ?? ''}-${p.monto_pagado ?? ''}`} className="pagosh-fila">
                <td className="tk-l">{safeStr(p.metodo_pago || '')}</td>
                <td className="tk-r">{formatearMoneda(p.monto_pagado ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <table className="ticket-sheet ticket-sheet--footer">
        <tbody>
          <tr>
            <td className="tk-l tk-bold">TOTAL PAGADO</td>
            <td className="tk-r tk-bold">{formatearMoneda(pagado)}</td>
          </tr>
          <tr>
            <td className="tk-l tk-bold">TOTAL DEUDA</td>
            <td className="tk-r tk-bold">{formatearMoneda(deuda)}</td>
          </tr>
          {Array.from({ length: 3 }).map((_, i) => (
            <tr key={`sp-tot-${i}`}>
              <td colSpan={2}>&nbsp;</td>
            </tr>
          ))}
          <tr className="leyenda-fila">
            <td className="tk-full" colSpan={2}>
              ¡GRACIAS POR SU COMPRA!
            </td>
          </tr>
          <tr className="leyenda-fila">
            <td className="tk-full" colSpan={2}>
              Este ticket no es una factura, ni tiene validez fiscal.
            </td>
          </tr>
          <tr className="leyenda-fila">
            <td className="tk-full" colSpan={2}>
              Solo es un comprobante de venta.
            </td>
          </tr>
          <tr className="leyenda-fila">
            <td className="tk-full" colSpan={2}>
              Conserve este ticket.
            </td>
          </tr>

          {/* Firmas (5 saltos, línea+título, 5 saltos, línea+título, 5 saltos) */}
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={`sp1-${i}`}>
              <td colSpan={2}>&nbsp;</td>
            </tr>
          ))}
          <tr>
            <td className="tk-full" colSpan={2}>
              ______________________________
            </td>
          </tr>
          <tr>
            <td className="tk-full" colSpan={2}>
              Firma Cliente
            </td>
          </tr>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={`sp2-${i}`}>
              <td colSpan={2}>&nbsp;</td>
            </tr>
          ))}
          <tr>
            <td className="tk-full" colSpan={2}>
              ______________________________
            </td>
          </tr>
          <tr>
            <td className="tk-full" colSpan={2}>
              Firma Representante
            </td>
          </tr>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={`sp3-${i}`}>
              <td colSpan={2}>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

