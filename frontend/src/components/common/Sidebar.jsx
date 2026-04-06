import { NavLink } from 'react-router-dom';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useAuthStore } from '../../stores/authStore';
import { cx } from '../../utils/cx';
import Button from './Button';

export default function Sidebar({
  navItems = [],
  collapsed = false,
  mobileOpen = false,
  onClose,
  onToggleCollapse,
}) {
  const user = useAuthStore((state) => state.user);
  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cx('sidebar', mobileOpen && 'sidebar--mobile-open')}
        style={{ '--sidebar-width': `${sidebarWidth}px` }}
      >
        <nav className="sidebar__nav">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact ?? item.path.endsWith('/dashboard')}
                onClick={onClose}
                className={({ isActive }) =>
                  cx('sidebar__item', isActive && 'sidebar__item--active')
                }
              >
                <span className="sidebar__icon">
                  <Icon size={20} />
                </span>
                {!collapsed ? <span className="sidebar__label">{item.label}</span> : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          {!collapsed && user ? (
            <div className="sidebar__user">
              <span className="sidebar__user-name">{user.full_name}</span>
              <span className="sidebar__user-role">
                {user.role === 'admin' ? 'Admin' : 'Student'}
              </span>
            </div>
          ) : null}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <CaretRight size={16} /> : <CaretLeft size={16} />}
            {!collapsed ? 'Collapse' : null}
          </Button>
        </div>
      </aside>
    </>
  );
}
