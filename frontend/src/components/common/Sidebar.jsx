import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

const STORAGE_KEY = 'sidebar-collapsed';

export default function Sidebar({ navItems = [], isOpen = false, onClose }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // localStorage unavailable
    }
  }, [collapsed]);

  const toggleCollapse = () => setCollapsed((prev) => !prev);

  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="sidebar__overlay" onClick={onClose} />
      )}

      <aside
        className={`sidebar ${isOpen ? 'sidebar--mobile-open' : ''}`}
        style={{ width: sidebarWidth }}
      >
        <nav className="sidebar__nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path.endsWith('dashboard')}
                className={({ isActive }) =>
                  `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
                }
                onClick={onClose}
              >
                <span className="sidebar__icon">
                  <Icon size={20} />
                </span>
                {!collapsed && (
                  <span className="sidebar__label">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle — hidden on mobile */}
        <button
          className="sidebar__toggle"
          onClick={toggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <CaretRight size={18} /> : <CaretLeft size={18} />}
        </button>
      </aside>
    </>
  );
}
