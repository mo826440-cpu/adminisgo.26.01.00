import { useMemo, useState } from 'react'
import { Card, Button, Alert } from '../../components/common'
import { useTicketPrintConfig } from '../../context/TicketPrintContext'
import {
  TICKET_ANCHO_OPTS,
  TICKET_FUENTE_OPTS,
  TICKET_PESO_OPTS,
} from '../../constants/ticketPrintConfig'
import { buildTicketConfigPreviewText } from '../../utils/ticketPrintPreviewSample'
import { thermalPlainTextToHtml } from '../../utils/thermalPlainReceipt'
import { getTicketBoldLinePrefixes } from '../../constants/ticketPrintConfig'
import './ConfigImpresorasSection.css'

function ToggleRow({ id, label, hint, checked, onChange }) {
  return (
    <label className="config-impresoras-toggle" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="config-impresoras-toggle__text">
        <span className="config-impresoras-toggle__label">{label}</span>
        {hint ? <span className="config-impresoras-toggle__hint">{hint}</span> : null}
      </span>
    </label>
  )
}

export default function ConfigImpresorasSection() {
  const { config, updateConfig, persistConfig } = useTicketPrintConfig()
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const cfg = draft ?? config

  const previewPlain = useMemo(() => buildTicketConfigPreviewText(cfg), [cfg])
  const previewHtml = useMemo(() => {
    if (cfg.pesoFuente !== 'bold') {
      return previewPlain
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    }
    return thermalPlainTextToHtml(previewPlain, {
      boldLinePrefixes: getTicketBoldLinePrefixes(),
      boldFirstNonEmptyLine: true,
    })
  }, [previewPlain, cfg.pesoFuente])

  const patch = (partial) => {
    setDraft((prev) => ({ ...(prev ?? config), ...partial }))
    setSuccess(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    const toSave = draft ?? config
    const { error: err } = await persistConfig(toSave)
    setSaving(false)
    if (err) {
      setError(err.message || 'No se pudo guardar la configuración de impresoras')
      return
    }
    setDraft(null)
    setSuccess('Configuración de impresoras guardada correctamente')
  }

  const anchoMm = cfg.ancho === 'pos58' ? 58 : 80
  const cols = cfg.ancho === 'pos58' ? 32 : 42

  return (
    <Card title="Configuración de Impresoras" className="config-section config-impresoras-section">
      <p className="text-secondary config-impresoras-intro">
        Definí el ancho del rollo térmico, qué secciones imprimir y el estilo del ticket. Los cambios se aplican a
        ventas, ventas rápidas, compras, caja y deudas de clientes.
      </p>

      {error ? (
        <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      ) : null}

      <div className="config-impresoras-grid">
        <div className="config-impresoras-form">
          <div className="form-row">
            <div className="form-col">
              <label className="form-label" htmlFor="cfg-imp-ancho">
                Ancho de impresora
                <select
                  id="cfg-imp-ancho"
                  className="form-control"
                  value={cfg.ancho}
                  onChange={(e) => patch({ ancho: e.target.value })}
                >
                  {TICKET_ANCHO_OPTS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-col">
              <label className="form-label" htmlFor="cfg-imp-fuente">
                Tipo de letra
                <select
                  id="cfg-imp-fuente"
                  className="form-control"
                  value={cfg.tipoFuente}
                  onChange={(e) => patch({ tipoFuente: e.target.value })}
                >
                  {TICKET_FUENTE_OPTS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-col">
              <label className="form-label" htmlFor="cfg-imp-peso">
                Peso de fuente
                <select
                  id="cfg-imp-peso"
                  className="form-control"
                  value={cfg.pesoFuente}
                  onChange={(e) => patch({ pesoFuente: e.target.value })}
                >
                  {TICKET_PESO_OPTS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <fieldset className="config-impresoras-fieldset">
            <legend>Secciones del ticket</legend>
            <ToggleRow
              id="cfg-imp-comercio"
              label="Datos del comercio"
              hint="Nombre, dirección, teléfono y CUIT"
              checked={cfg.mostrarDatosComercio}
              onChange={(v) => patch({ mostrarDatosComercio: v })}
            />
            <ToggleRow
              id="cfg-imp-cliente"
              label="Datos del cliente"
              hint="Nombre y documento (DNI)"
              checked={cfg.mostrarDatosCliente}
              onChange={(v) => patch({ mostrarDatosCliente: v })}
            />
            <ToggleRow
              id="cfg-imp-pagos"
              label="Formas de pago, pagado y adeudado"
              checked={cfg.mostrarFormasPago}
              onChange={(v) => patch({ mostrarFormasPago: v })}
            />
            <ToggleRow
              id="cfg-imp-firmas"
              label="Firmas (cliente y vendedor)"
              checked={cfg.mostrarFirmas}
              onChange={(v) => patch({ mostrarFirmas: v })}
            />
          </fieldset>

          <div className="form-actions">
            <Button type="button" variant="primary" loading={saving} disabled={saving} onClick={handleSave}>
              Guardar configuración
            </Button>
            {draft ? (
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setDraft(null)
                  updateConfig(config)
                }}
              >
                Descartar cambios
              </Button>
            ) : null}
          </div>
        </div>

        <div className="config-impresoras-preview-wrap">
          <p className="config-impresoras-preview-title">Vista previa en tiempo real</p>
          <p className="config-impresoras-preview-meta text-secondary">
            {anchoMm} mm · {cols} columnas · monospace
          </p>
          <div
            className="config-impresoras-preview-roll"
            data-ticket-ancho={cfg.ancho}
            data-ticket-fuente={cfg.tipoFuente}
            data-ticket-peso={cfg.pesoFuente}
            style={{ maxWidth: `${anchoMm}mm` }}
          >
            <pre
              className="config-impresoras-preview-pre"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
