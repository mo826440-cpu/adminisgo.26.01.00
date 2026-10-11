export const CLAVE_ACCESO_MSG = 'aliens_acceso_msg'
export const CLAVE_RECUPERAR = 'aliens_recuperar_clave'

export function guardarAvisoAcceso(mensaje) {
  try {
    sessionStorage.setItem(CLAVE_ACCESO_MSG, mensaje)
  } catch {
    /* sesión no disponible */
  }
}

export function consumirAvisoAcceso() {
  try {
    const mensaje = sessionStorage.getItem(CLAVE_ACCESO_MSG)
    if (mensaje) sessionStorage.removeItem(CLAVE_ACCESO_MSG)
    return mensaje
  } catch {
    return null
  }
}

export function marcarRecuperacionClave() {
  try {
    sessionStorage.setItem(CLAVE_RECUPERAR, '1')
  } catch {
    /* ignore */
  }
}

export function hayRecuperacionClave() {
  try {
    return sessionStorage.getItem(CLAVE_RECUPERAR) === '1'
  } catch {
    return false
  }
}

export function limpiarRecuperacionClave() {
  try {
    sessionStorage.removeItem(CLAVE_RECUPERAR)
  } catch {
    /* ignore */
  }
}
