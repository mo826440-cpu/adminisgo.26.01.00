function safeStr(v) {
  return String(v ?? '').trim()
}

function arr(v) {
  return Array.isArray(v) ? v : []
}

export default function ClienteDeudasTicketThermal({
  comercio,
  cliente,
  ventasConDeuda,
  formatearMoneda,
  formatearFechaHoraTicket,
  pagoInfo = null,
}) {
  const comercioNombre = safeStr(comercio?.nombre || 'Comercio').toUpperCase()
  const direccion = safeStr(comercio?.direccion || '')
  const telefono = safeStr(comercio?.telefono || '')
  const cuit = safeStr(comercio?.cuit_rut || '')

  const nombreCliente = safeStr(cliente?.nombre || 'Cliente')

  const ventas = arr(ventasConDeuda)
  const totalDeuda = ventas.reduce((sum, v) => sum + (parseFloat(v.monto_deuda) || 0), 0)
  const esComprobantePago = pagoInfo && Number.isFinite(Number(pagoInfo.montoPagado))
  const montoPagado = esComprobantePago ? Number(pagoInfo.montoPagado) || 0 : 0
  const deudaRestante = esComprobantePago ? Math.max(0, Number(pagoInfo.deudaRestante) || 0) : 0

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
            <td className="tk-l tk-bold">
              {esComprobantePago ? 'Comprobante de pago' : 'Historial de deudas'}
            </td>
            <td className="tk-r">{formatearFechaHoraTicket(new Date().toISOString())}</td>
          </tr>
          <tr>
            <td className="tk-l tk-bold">Cliente</td>
            <td className="tk-r tk-bold">{nombreCliente}</td>
          </tr>
        </tbody>
      </table>

      <table className="ticket-sheet">
        <thead>
          <tr>
            <td className="tk-l" style={{ width: '34%' }}>
              Fecha
            </td>
            <td className="tk-l" style={{ width: '34%' }}>
              Ticket
            </td>
            <td className="tk-r" style={{ width: '32%' }}>
              Deuda
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={{ borderBottom: '1px dashed #000', padding: 0, height: 0 }} />
          </tr>
        </thead>
        <tbody>
          {ventas.length ? (
            ventas.map((v) => (
              <tr key={v.id}>
                <td className="tk-l">{v.fecha_hora ? formatearFechaHoraTicket(v.fecha_hora) : '—'}</td>
                <td className="tk-l">{safeStr(v.numero_ticket || `#${v.id}`)}</td>
                <td className="tk-r tk-bold">{formatearMoneda(v.monto_deuda ?? 0)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="tk-full" colSpan={3}>
                Sin deudas.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <table className="ticket-sheet ticket-sheet--footer">
        <tbody>
          <tr className="total-final-row">
            <td className="tk-l tk-bold">TOTAL DEUDA</td>
            <td className="tk-r tk-bold">{formatearMoneda(totalDeuda)}</td>
          </tr>
          {esComprobantePago ? (
            <>
              <tr className="total-final-row">
                <td className="tk-l tk-bold">Monto total pagado</td>
                <td className="tk-r tk-bold">{formatearMoneda(montoPagado)}</td>
              </tr>
              {deudaRestante <= 0.01 ? (
                <tr className="leyenda-fila">
                  <td className="tk-full tk-bold" colSpan={2}>
                    Deuda cancelada — Sin deuda
                  </td>
                </tr>
              ) : (
                <tr className="total-final-row">
                  <td className="tk-l tk-bold">Deuda restante</td>
                  <td className="tk-r tk-bold">{formatearMoneda(deudaRestante)}</td>
                </tr>
              )}
            </>
          ) : null}
        </tbody>
      </table>

      <table className="ticket-sheet ticket-sheet--footer">
        <tbody>
          <tr className="leyenda-fila">
            <td className="tk-full">¡GRACIAS!</td>
          </tr>
          <tr className="leyenda-fila">
            <td className="tk-full">Conserve este comprobante.</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

