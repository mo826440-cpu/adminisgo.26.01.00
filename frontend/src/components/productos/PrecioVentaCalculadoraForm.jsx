import { useEffect, useState } from 'react'
import { formatMoneyAR } from '../../pages/reportes/reporteVentasUtils'
import {
  calcularPrecioVentaDesdeMargen,
  inferirPorcentajeMargen,
  parsePorcentajeInput,
  parsePrecioPlainInput,
  precioCompraToInput,
} from '../../utils/precioVentaCalculo'
import './PrecioVentaCalculadora.css'

/**
 * Formulario: precio compra + % suma → precio venta calculado.
 *
 * @param {object} props
 * @param {number|string|null} [props.precioCompraInitial]
 * @param {number|string|null} [props.precioVentaInitial]
 * @param {string} [props.porcentajeInitial]
 * @param {string} [props.idPrefix]
 * @param {string} [props.intro]
 * @param {(payload: { precioCompra: string, porcentajeSuma: string, precioVenta: number, valid: boolean }) => void} [props.onChange]
 */
function PrecioVentaCalculadoraForm({
  precioCompraInitial = '',
  precioVentaInitial = '',
  porcentajeInitial,
  idPrefix = 'precio-calc',
  intro,
  onChange,
}) {
  const [precioCompra, setPrecioCompra] = useState(() => precioCompraToInput(precioCompraInitial))
  const [porcentajeSuma, setPorcentajeSuma] = useState(() => {
    if (porcentajeInitial != null && porcentajeInitial !== '') return String(porcentajeInitial)
    return inferirPorcentajeMargen(precioCompraInitial, precioVentaInitial)
  })

  useEffect(() => {
    setPrecioCompra(precioCompraToInput(precioCompraInitial))
    setPorcentajeSuma(() => {
      if (porcentajeInitial != null && porcentajeInitial !== '') return String(porcentajeInitial)
      return inferirPorcentajeMargen(precioCompraInitial, precioVentaInitial)
    })
  }, [precioCompraInitial, precioVentaInitial, porcentajeInitial])

  const compraNum = parsePrecioPlainInput(precioCompra)
  const pctNum = parsePorcentajeInput(porcentajeSuma)
  const precioVenta = calcularPrecioVentaDesdeMargen(compraNum, pctNum)
  const valid = Number.isFinite(precioVenta) && precioVenta >= 0

  useEffect(() => {
    onChange?.({ precioCompra, porcentajeSuma, precioVenta, valid })
  }, [precioCompra, porcentajeSuma, precioVenta, valid, onChange])

  return (
    <div className="precio-calc-form">
      {intro ? <p className="precio-calc-form__intro">{intro}</p> : null}
      <div className="precio-calc-form__grid">
        <div className="precio-calc-form__field">
          <label htmlFor={`${idPrefix}-compra`}>Precio compra</label>
          <div className="precio-calc-form__input-wrap">
            <span className="precio-calc-form__prefix" aria-hidden>
              $
            </span>
            <input
              id={`${idPrefix}-compra`}
              type="text"
              inputMode="decimal"
              className="form-control"
              value={precioCompra}
              onChange={(e) => setPrecioCompra(e.target.value)}
              placeholder="Ej: 1000 o 1000,50"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="precio-calc-form__field">
          <label htmlFor={`${idPrefix}-porcentaje`}>% Suma</label>
          <div className="precio-calc-form__input-wrap">
            <input
              id={`${idPrefix}-porcentaje`}
              type="text"
              inputMode="decimal"
              className="form-control"
              value={porcentajeSuma}
              onChange={(e) => setPorcentajeSuma(e.target.value)}
              placeholder="Ej: 10"
              autoComplete="off"
            />
            <span className="precio-calc-form__suffix" aria-hidden>
              %
            </span>
          </div>
        </div>
        <div className="precio-calc-form__resultado" aria-live="polite">
          <span className="precio-calc-form__resultado-label">Precio venta</span>
          <span
            className={`precio-calc-form__resultado-valor ${valid ? '' : 'precio-calc-form__resultado-valor--invalido'}`}
          >
            {valid ? formatMoneyAR(precioVenta) : 'Completá precio compra y % suma'}
          </span>
          <p className="precio-calc-form__formula">Precio venta = Precio compra + % Suma</p>
        </div>
      </div>
    </div>
  )
}

export default PrecioVentaCalculadoraForm
