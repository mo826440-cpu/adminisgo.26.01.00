import './ReporteInformePrint.css'

export function ReporteInformeExportActions({ onPdf, onPrint, disabled }) {
  return (
    <div className="reporte-export-actions">
      <button
        type="button"
        className="reporte-export-icon-btn reporte-export-icon-btn--pdf"
        title="Descargar PDF"
        aria-label="Descargar reporte en PDF"
        disabled={disabled}
        onClick={onPdf}
      >
        <i className="bi bi-file-earmark-pdf" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="reporte-export-icon-btn"
        title="Imprimir ticket"
        aria-label="Imprimir reporte en formato ticket"
        disabled={disabled}
        onClick={onPrint}
      >
        <i className="bi bi-printer" aria-hidden="true" />
      </button>
    </div>
  )
}
