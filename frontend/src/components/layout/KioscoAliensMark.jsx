import { useState } from 'react'

const LOGO_SRC = '/marca/kiosco-aliens-logo.svg'

/** Marca de Kiosco Aliens. Si el archivo no está, queda el espacio con un alien simple. */
function KioscoAliensMark({ className = '' }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <svg className={className} viewBox="0 0 72 86" aria-hidden>
        <path fill="#FF861C" d="M36 2.2C55.2 2.2 67.2 16.4 67.2 35.2c0 15.2-6.1 27.4-14.6 36.2C47.4 77.2 42.2 83.6 36 83.6c-6.2 0-11.4-6.4-16.6-12.2C10.9 62.6 4.8 50.4 4.8 35.2 4.8 16.4 16.8 2.2 36 2.2z" />
        <ellipse fill="#141414" cx="26.2" cy="38.5" rx="7.1" ry="10.4" transform="rotate(-27 26.2 38.5)" />
        <ellipse fill="#141414" cx="45.8" cy="38.5" rx="7.1" ry="10.4" transform="rotate(27 45.8 38.5)" />
      </svg>
    )
  }

  return (
    <img
      className={className}
      src={LOGO_SRC}
      alt=""
      width="48"
      height="48"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}

export default KioscoAliensMark
