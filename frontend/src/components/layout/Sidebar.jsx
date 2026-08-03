// Componente Sidebar de navegación
import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { buildInicioNavCards, buildReferenciasHubCards } from '../../utils/inicioNavCards'
import { signOut } from '../../services/auth'
import './Sidebar.css'

const REF_PATHS = ['/inicio/referencias', '/categorias', '/marcas', '/clientes', '/proveedores', '/productos']

/** Orden visual del menú (no altera permisos ni rutas). */
const MENU_ORDER = [
  'dashboard',
  'usuarios',
  'referencias',
  'compras',
  'ventas',
  'ventas_prueba',
  'ventas_rapidas',
  'reportes',
  'otros_costos',
  'configuraciones',
  'mantenimiento',
]

function initialsFromName(name, email) {
  const source = (name || email || '?').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

function SidebarNavIcon({ iconClass }) {
  return (
    <span className="sidebar-item__icon" aria-hidden>
      <i className={`bi ${iconClass}`} />
    </span>
  )
}

function SidebarNavLink({ to, title, icon, active, compact, onNavigate }) {
  return (
    <Link
      to={to}
      className={`sidebar-item${active ? ' is-active' : ''}`}
      onClick={onNavigate}
      title={compact ? title : undefined}
      aria-label={compact ? title : undefined}
    >
      <SidebarNavIcon iconClass={icon} />
      <span className="sidebar-item__label">{title}</span>
    </Link>
  )
}

function SidebarReferenciasSection({
  meta,
  refCards,
  open,
  onToggle,
  isPathActive,
  onNavigate,
  compact,
}) {
  const sectionActive = REF_PATHS.some((p) => isPathActive(p))

  return (
    <div className={`sidebar-section${open ? ' is-open' : ''}${sectionActive ? ' is-active' : ''}`}>
      <button
        type="button"
        className={`sidebar-item sidebar-item--toggle${sectionActive ? ' is-active' : ''}${open ? ' is-open' : ''}`}
        onClick={onToggle}
        aria-expanded={open}
        title={compact ? meta.title : undefined}
        aria-label={meta.title}
      >
        <SidebarNavIcon iconClass={meta.icon} />
        <span className="sidebar-item__label">{meta.title}</span>
        <span className="sidebar-item__chev" aria-hidden>
          <i className="bi bi-chevron-down" />
        </span>
      </button>

      <div className={`sidebar-submenu${open ? ' is-open' : ''}`} role="region" aria-label="Referencias">
        <div className="sidebar-submenu__inner">
          <div className="sidebar-submenu__panel">
            {compact ? (
              <p className="sidebar-submenu__flyout-title">{meta.title}</p>
            ) : null}
            <Link
              to="/inicio/referencias"
              className={`sidebar-subitem${isPathActive('/inicio/referencias') ? ' is-active' : ''}`}
              onClick={onNavigate}
              title={compact ? 'Panel Referencias' : undefined}
            >
              <span className="sidebar-subitem__dot" aria-hidden />
              <span className="sidebar-subitem__label">Panel Referencias</span>
            </Link>
            {refCards.map((c) => (
              <Link
                key={c.key}
                to={c.to}
                className={`sidebar-subitem${isPathActive(c.to) ? ' is-active' : ''}`}
                onClick={onNavigate}
                title={compact ? c.title : undefined}
              >
                <span className="sidebar-subitem__dot" aria-hidden />
                <span className="sidebar-subitem__label">{c.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SidebarUserCard({ compact }) {
  const { user, usuario } = useAuthContext()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapRef = useRef(null)

  const displayName = usuario?.nombre || user?.email?.split('@')[0] || 'Usuario'
  const roleLabel = usuario?.rol_nombre || 'Usuario'
  const initials = initialsFromName(usuario?.nombre, user?.email)

  useEffect(() => {
    if (!menuOpen) return undefined
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    setMenuOpen(false)
    try {
      await signOut()
    } catch {
      /* redirect anyway */
    }
    navigate('/', { replace: true })
  }

  return (
    <div className={`sidebar-user${menuOpen ? ' is-open' : ''}`} ref={wrapRef}>
      <button
        type="button"
        className="sidebar-user__trigger"
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        title={compact ? `${displayName} · ${roleLabel}` : undefined}
      >
        <span className="sidebar-user__avatar" aria-hidden>
          {initials}
        </span>
        <span className="sidebar-user__meta">
          <span className="sidebar-user__name">{displayName}</span>
          <span className="sidebar-user__role">{roleLabel}</span>
        </span>
        <span className="sidebar-user__chev" aria-hidden>
          <i className="bi bi-chevron-down" />
        </span>
      </button>
      {menuOpen ? (
        <div className="sidebar-user__menu" role="menu">
          <div className="sidebar-user__menu-email" title={user?.email || ''}>
            {user?.email || '—'}
          </div>
          <button
            type="button"
            className="sidebar-user__menu-item"
            role="menuitem"
            onClick={() => void handleLogout()}
          >
            <i className="bi bi-box-arrow-right" aria-hidden />
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  )
}

function Sidebar({ isOpen, onClose, isCompact = false, onToggleCompact }) {
  const location = useLocation()
  const { isAdmin, puedeModulo } = useAuthContext()
  const [referenciasOpen, setReferenciasOpen] = useState(false)

  const hubCards = useMemo(() => buildInicioNavCards(puedeModulo, isAdmin), [puedeModulo, isAdmin])
  const refCards = useMemo(() => buildReferenciasHubCards(puedeModulo), [puedeModulo])

  const orderedCards = useMemo(() => {
    const byKey = new Map(hubCards.map((c) => [c.key, c]))
    const ordered = []
    for (const key of MENU_ORDER) {
      const card = byKey.get(key)
      if (card) ordered.push(card)
    }
    for (const card of hubCards) {
      if (!MENU_ORDER.includes(card.key)) ordered.push(card)
    }
    return ordered
  }, [hubCards])

  const isPathActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  const isInicioActive = location.pathname === '/inicio'

  const toggleReferencias = () => {
    setReferenciasOpen(!referenciasOpen)
  }

  // Mantener Referencias abierto si la ruta actual pertenece al grupo
  useEffect(() => {
    const inRefs = REF_PATHS.some(
      (p) => location.pathname === p || location.pathname.startsWith(`${p}/`),
    )
    if (inRefs) setReferenciasOpen(true)
  }, [location.pathname])

  useEffect(() => {
    if (window.innerWidth <= 768 && isOpen) {
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const handleNav = () => {
    if (window.innerWidth <= 768) onClose()
  }

  const asideClass = [
    'sidebar',
    isOpen ? 'open' : '',
    isCompact ? 'sidebar--compact' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <aside className={asideClass}>
      <div className="sidebar-shell">
        <div className="sidebar-brand">
          <div className="sidebar-brand__mark" aria-hidden>
            <img src="/favicon.svg" alt="" width="36" height="36" decoding="async" />
          </div>
          <span className="sidebar-brand__name">AdminisGo</span>
          {typeof onToggleCompact === 'function' ? (
            <button
              type="button"
              className="sidebar-brand__compact"
              onClick={onToggleCompact}
              aria-pressed={isCompact}
              aria-label={isCompact ? 'Ensanchar menú lateral' : 'Contraer menú a iconos'}
              title={isCompact ? 'Ensanchar menú' : 'Contraer a iconos'}
            >
              <i className={`bi ${isCompact ? 'bi-chevron-right' : 'bi-chevron-left'}`} aria-hidden />
            </button>
          ) : null}
        </div>

        <nav className="sidebar-nav" aria-label="Módulos">
          <SidebarNavLink
            to="/inicio"
            title="Inicio"
            icon="bi-house-door"
            active={isInicioActive}
            compact={isCompact}
            onNavigate={handleNav}
          />

          {orderedCards.map((card) =>
            card.key === 'referencias' && refCards.length > 0 ? (
              <SidebarReferenciasSection
                key="referencias"
                meta={card}
                refCards={refCards}
                open={referenciasOpen}
                onToggle={toggleReferencias}
                isPathActive={isPathActive}
                onNavigate={handleNav}
                compact={isCompact}
              />
            ) : card.key === 'referencias' ? null : (
              <SidebarNavLink
                key={card.key}
                to={card.to}
                title={card.title}
                icon={card.icon}
                active={isPathActive(card.to)}
                compact={isCompact}
                onNavigate={handleNav}
              />
            ),
          )}
        </nav>

        <div className="sidebar-footer">
          <SidebarUserCard compact={isCompact} />
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
