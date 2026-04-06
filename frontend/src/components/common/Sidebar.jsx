import { NavLink } from 'react-router-dom';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useAuthStore } from '../../stores/authStore';
import { cx } from '../../utils/cx';
import Button from './Button';

export default function Sidebar({
  navItems = [],
  collapsed = false,
  onToggleCollapse,
}) {
  const user = useAuthStore((state) => state.user);
  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <>
      <aside
        className="sidebar"
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

      <nav className="mobile-tabbar" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact ?? item.path.endsWith('/dashboard')}
              className={({ isActive }) =>
                cx('mobile-tabbar__item', isActive && 'mobile-tabbar__item--active')
              }
            >
              <span className="mobile-tabbar__icon">
                <Icon size={20} />
              </span>
              <span className="mobile-tabbar__label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
