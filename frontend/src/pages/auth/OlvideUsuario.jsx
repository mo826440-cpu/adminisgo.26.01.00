import { Link } from 'react-router-dom'
import AccesoShell from './AccesoShell'
import './AccesoShell.css'

function OlvideUsuario() {
  return (
    <AccesoShell>
      <h2>Olvidé mi usuario</h2>
      <p className="acceso__intro">El acceso de este sistema es el correo electrónico.</p>
      <p className="acceso__nota">
        No hay un nombre de usuario aparte. Para ingresar se usa el correo con el que el
        administrador creó o invitó la cuenta, junto con la contraseña, o el botón de Google si
        esa cuenta está vinculada.
      </p>
      <p className="acceso__nota">
        Esta pantalla no busca ni muestra correos de otras personas. Si no recordás cuál es el
        tuyo, pedile al administrador que te confirme el acceso.
      </p>
      <p className="acceso__ayuda">¿Necesitás acceso? Contactá al administrador</p>
      <p className="acceso__ayuda">
        <Link className="acceso__volver" to="/">
          Volver al acceso
        </Link>
      </p>
    </AccesoShell>
  )
}

export default OlvideUsuario
