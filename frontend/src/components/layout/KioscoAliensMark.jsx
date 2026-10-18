import { useState } from 'react'

const MARKS = {
  logo: '/marca/alien-cabeza.png',
  header: '/marca/alien-brillo.png',
}

/** Cabeza de Kiosco Aliens. `logo` en el menú; `header` en la barra del panel. */
function KioscoAliensMark({ className = '', variant = 'logo' }) {
  const [failed, setFailed] = useState(false)
  const src = MARKS[variant] || MARKS.logo

  if (failed) {
    return (
      <svg className={className} viewBox="0 0 200 214" aria-hidden>
        <path fill="#FF861C" d="M100 6C152.2 6 194 46.2 194 102c0 52.4-35.2 96.2-94 106C41.2 198.2 6 154.4 6 102 6 46.2 47.8 6 100 6z" />
        <ellipse fill="#101010" cx="73" cy="108" rx="21" ry="32" transform="rotate(-26 73 108)" />
        <ellipse fill="#101010" cx="127" cy="108" rx="21" ry="32" transform="rotate(26 127 108)" />
      </svg>
    )
  }

  return (
    <img
      className={className}
      src={src}
      alt=""
      width="160"
      height="160"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}

export default KioscoAliensMark
