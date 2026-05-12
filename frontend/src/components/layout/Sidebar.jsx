// Componente Sidebar de navegación
import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { buildInicioNavCards, buildReferenciasHubCards } from '../../utils/inicioNavCards'
import './Sidebar.css'

const REF_PATHS = ['/inicio/referencias', '/categorias', '/marcas', '/clientes', '/proveedores', '/productos']

function SidebarMiniIcon({ iconClass, tone, sm }) {
  return (
    <span
      className={`sidebar-mini-card__icon sidebar-mini-card__icon--${tone}${sm ? ' sidebar-mini-card__icon--sm' : ''}`}
      aria-hidden
    >
      <i className={`bi ${iconClass}`} />
    </span>
  )
}

function SidebarMiniCardLink({ to, title, subtitle, icon, tone, active, onNavigate }) {
  return (
    <Link
      to={to}
      className={`sidebar-mini-card${active ? ' active' : ''}`}
      onClick={onNavigate}
    >
      <SidebarMiniIcon iconClass={icon} tone={tone} />
      <span className="sidebar-mini-card__text">
        <span className="sidebar-mini-card__title">{title}</span>
        <span className="sidebar-mini-card__sub">{subtitle}</span>
      </span>
    </Link>
  )
}

function SidebarReferenciasSection({ meta, refCards, open, onToggle, isPathActive, onNavigate }) {
  const sectionActive = REF_PATHS.some((p) => isPathActive(p))

  return (
    <div className="sidebar-section sidebar-section--mini">
      <button
        type="button"
        className={`sidebar-mini-card sidebar-mini-card--toggle${sectionActive ? ' active' : ''}${open ? ' open' : ''}`}
        onClick={onToggle}
        aria-expanded={open}
      >
        <SidebarMiniIcon iconClass={meta.icon} tone={meta.tone} />
        <span className="sidebar-mini-card__text">
          <span className="sidebar-mini-card__title">{meta.title}</span>
          <span className="sidebar-mini-card__sub">{meta.subtitle}</span>
        </span>
        <span className="sidebar-mini-card__chev" aria-hidden>
          <i className="bi bi-chevron-down" />
        </span>
      </button>
      {open && (
        <div className="sidebar-submenu sidebar-submenu--mini">
          <Link
            to="/inicio/referencias"
            className={`sidebar-mini-card sidebar-mini-card--sub${isPathActive('/inicio/referencias') ? ' active' : ''}`}
            onClick={onNavigate}
          >
            <SidebarMiniIcon iconClass="bi-grid-1x2" tone={meta.tone} sm />
            <span className="sidebar-mini-card__text">
              <span className="sidebar-mini-card__title">Panel Referencias</span>
              <span className="sidebar-mini-card__sub">Vista en tarjetas</span>
            </span>
          </Link>
          {refCards.map((c) => (
            <Link
              key={c.key}
              to={c.to}
              className={`sidebar-mini-card sidebar-mini-card--sub${isPathActive(c.to) ? ' active' : ''}`}
              onClick={onNavigate}
            >
              <SidebarMiniIcon iconClass={c.icon} tone={c.tone} sm />
              <span className="sidebar-mini-card__text">
                <span className="sidebar-mini-card__title">{c.title}</span>
                <span className="sidebar-mini-card__sub">{c.subtitle}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { isAdmin, puedeModulo } = useAuthContext()
  const [referenciasOpen, setReferenciasOpen] = useState(true)

  const hubCards = useMemo(() => buildInicioNavCards(puedeModulo, isAdmin), [puedeModulo, isAdmin])
  const refCards = useMemo(() => buildReferenciasHubCards(puedeModulo), [puedeModulo])

  const isPathActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  const toggleReferencias = () => {
    setReferenciasOpen(!referenciasOpen)
  }

  useEffect(() => {
    if (window.innerWidth <= 768 && isOpen) {
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const handleNav = () => {
    if (window.innerWidth <= 768) onClose()
  }

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <nav className="sidebar-nav" aria-label="Módulos">
        <SidebarMiniCardLink
          to="/inicio"
          title="Inicio"
          subtitle="Panel de navegación"
          icon="bi-house-door"
          tone="cyan"
          active={isPathActive('/inicio')}
          onNavigate={handleNav}
        />

        {hubCards.map((card) =>
          card.key === 'referencias' && refCards.length > 0 ? (
            <SidebarReferenciasSection
              key="referencias"
              meta={card}
              refCards={refCards}
              open={referenciasOpen}
              onToggle={toggleReferencias}
              isPathActive={isPathActive}
              onNavigate={handleNav}
            />
          ) : card.key === 'referencias' ? null : (
            <SidebarMiniCardLink
              key={card.key}
              to={card.to}
              title={card.title}
              subtitle={card.subtitle}
              icon={card.icon}
              tone={card.tone}
              active={isPathActive(card.to)}
              onNavigate={handleNav}
            />
          ),
        )}
      </nav>
    </aside>
  )
}

export default Sidebar
