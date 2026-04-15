import { useId, useMemo, useState } from 'react'
import { Button } from '../../components/common'
import { getDefaultSlicerArrays } from './reporteDateSlicers'
import './ReporteDateSlicerBar.css'

const MES_LABEL = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
]

function sortU(arr) {
  return [...arr].sort((a, b) => a - b)
}

/**
 * @param {{ years: number[], months: number[], days: number[], onChange: (s: { years: number[], months: number[], days: number[] }) => void }} props
 */
export default function ReporteDateSlicerBar({ years, months, days, onChange }) {
  const [panelOpen, setPanelOpen] = useState(false)
  const panelId = useId()

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear()
    const lo = y - 6
    const hi = y + 1
    const out = []
    for (let yy = lo; yy <= hi; yy++) out.push(yy)
    return out
  }, [])

  const toggleYear = (y) => {
    if (years.includes(y)) {
      if (years.length <= 1) return
      onChange({ years: years.filter((x) => x !== y), months, days })
    } else {
      onChange({ years: sortU([...years, y]), months, days })
    }
  }

  const toggleMonth = (m) => {
    if (months.length === 0) {
      onChange({ years, months: [m], days })
      return
    }
    if (months.includes(m)) {
      const next = months.filter((x) => x !== m)
      onChange({ years, months: next, days })
    } else {
      onChange({ years, months: sortU([...months, m]), days })
    }
  }

  const toggleDay = (d) => {
    if (days.length === 0) {
      onChange({ years, months, days: [d] })
      return
    }
    if (days.includes(d)) {
      const next = days.filter((x) => x !== d)
      onChange({ years, months, days: next })
    } else {
      onChange({ years, months, days: sortU([...days, d]) })
    }
  }

  const clearMonths = () => onChange({ years, months: [], days })
  const clearDays = () => onChange({ years, months, days: [] })
  const resetDefault = () => onChange(getDefaultSlicerArrays())

  const monthActive = (m) => months.length === 0 || months.includes(m)
  const dayActive = (d) => days.length === 0 || days.includes(d)

  return (
    <div className="reporte-slicer-shell">
      <div className="reporte-slicer-head">
        <button
          type="button"
          id={`${panelId}-toggle`}
          className="reporte-slicer-trigger"
          aria-expanded={panelOpen}
          aria-controls={panelId}
          onClick={() => setPanelOpen((v) => !v)}
        >
          <span className="reporte-slicer-trigger-icon" aria-hidden="true">
            <i className="bi bi-funnel-fill" />
          </span>
          <span className="reporte-slicer-trigger-text">Filtros por fecha</span>
          <i
            className={`bi reporte-slicer-trigger-chevron ${panelOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <div
        id={panelId}
        className="reporte-slicer"
        role="region"
        aria-label="Filtro de fechas por segmentos"
        hidden={!panelOpen}
      >
      <div className="reporte-slicer-toolbar">
        <p className="reporte-slicer-hint text-secondary">
          Cruzá año, mes y día. Mes o día vacío = incluye todos los valores de esa dimensión.
        </p>
        <Button type="button" variant="outline" size="sm" className="reporte-slicer-reset" onClick={resetDefault}>
          Últimos 3 meses
        </Button>
      </div>

      <div className="reporte-slicer-group" role="group" aria-label="Año">
        <div className="reporte-slicer-group-head">
          <span className="reporte-slicer-dimension">Año</span>
        </div>
        <div className="reporte-slicer-track">
          {yearOptions.map((y) => (
            <button
              key={y}
              type="button"
              className={`reporte-slicer-chip ${years.includes(y) ? 'reporte-slicer-chip--active' : ''}`}
              aria-pressed={years.includes(y)}
              onClick={() => toggleYear(y)}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="reporte-slicer-group" role="group" aria-label="Mes">
        <div className="reporte-slicer-group-head">
          <span className="reporte-slicer-dimension">Mes</span>
          <button type="button" className="reporte-slicer-link" onClick={clearMonths}>
            Todos los meses
          </button>
        </div>
        <div className="reporte-slicer-track reporte-slicer-track--months">
          {MES_LABEL.map((label, i) => {
            const m = i + 1
            const active = monthActive(m)
            return (
              <button
                key={m}
                type="button"
                className={`reporte-slicer-chip ${active ? 'reporte-slicer-chip--active' : ''}`}
                aria-pressed={active}
                onClick={() => toggleMonth(m)}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="reporte-slicer-group" role="group" aria-label="Día del mes">
        <div className="reporte-slicer-group-head">
          <span className="reporte-slicer-dimension">Día</span>
          <button type="button" className="reporte-slicer-link" onClick={clearDays}>
            Todos los días
          </button>
        </div>
        <div className="reporte-slicer-track reporte-slicer-track--days">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
            const active = dayActive(d)
            return (
              <button
                key={d}
                type="button"
                className={`reporte-slicer-chip reporte-slicer-chip--day ${active ? 'reporte-slicer-chip--active' : ''}`}
                aria-pressed={active}
                onClick={() => toggleDay(d)}
              >
                {d}
              </button>
            )
          })}
        </div>
      </div>
      </div>
    </div>
  )
}
