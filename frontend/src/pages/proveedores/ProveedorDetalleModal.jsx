import { Modal, Button } from '../../components/common'
import { formatMoneyAR } from '../reportes/reporteVentasUtils'

function valor(texto) {
  const limpio = texto != null ? String(texto).trim() : ''
  return limpio || 'Sin cargar'
}

function ProveedorDetalleModal({ proveedor, saldo, onClose, onCuenta, onEditar }) {
  const pendiente = Number(saldo) > 0.009
  return (
    <Modal
      isOpen={Boolean(proveedor)}
      onClose={onClose}
      title={proveedor?.nombre_razon_social || 'Proveedor'}
      className="prov-modal-ancho"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button variant="outline" onClick={onCuenta}>Ver cuenta corriente</Button>
          <Button variant="primary" onClick={onEditar}>Editar proveedor</Button>
        </>
      }
    >
      {proveedor ? (
        <div className="prov-detalle">
          <section>
            <h3>Datos de contacto</h3>
            <dl>
              <div><dt>Contacto</dt><dd>{valor(proveedor.contacto_principal)}</dd></div>
              <div><dt>Teléfono</dt><dd>{valor(proveedor.telefono)}</dd></div>
              <div><dt>Email</dt><dd>{valor(proveedor.email)}</dd></div>
              <div><dt>CUIT</dt><dd>{valor(proveedor.cuit_rut)}</dd></div>
              <div><dt>Dirección</dt><dd>{valor(proveedor.direccion)}</dd></div>
            </dl>
          </section>
          <section>
            <h3>Información comercial</h3>
            <dl>
              <div>
                <dt>Saldo</dt>
                <dd className={pendiente ? 'prov-money--deuda' : ''}>{formatMoneyAR(saldo || 0)}</dd>
              </div>
              <div><dt>Condición de pago</dt><dd>{valor(proveedor.condiciones_pago)}</dd></div>
              <div>
                <dt>Plazo de entrega</dt>
                <dd>{proveedor.plazo_entrega != null && proveedor.plazo_entrega !== '' ? `${proveedor.plazo_entrega} días` : 'Sin cargar'}</dd>
              </div>
              <div><dt>Notas</dt><dd>{valor(proveedor.notas)}</dd></div>
              <div>
                <dt>Estado</dt>
                <dd>{proveedor.activo === false ? 'Inactivo' : 'Activo'}</dd>
              </div>
            </dl>
          </section>
        </div>
      ) : null}
    </Modal>
  )
}

export default ProveedorDetalleModal
