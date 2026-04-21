import { NavLink, useNavigate } from 'react-router-dom';
import { Plus, SignOut } from '@phosphor-icons/react';
import { useAuthStore } from '../../stores/authStore';
import { cx } from '../../utils/cx';

export default function AppSidebar({
  navItems = [],
  primaryAction = null,
  className = '',
}) {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const ActionIcon = primaryAction?.icon ?? Plus;

  return (
    <aside className={cx('stitch-dashboard__sidebar', className)}>
      <div className="stitch-dashboard__brand-wrap">
        <h1 className="stitch-dashboard__brand">GROUPD</h1>
        <p className="stitch-dashboard__subbrand">Academic Portal</p>
      </div>

      {primaryAction ? (
        <div className="stitch-dashboard__cta-wrap">
          <button
            type="button"
            className="stitch-dashboard__cta"
            onClick={primaryAction.onClick}
          >
            <ActionIcon size={14} weight="bold" />
            {primaryAction.label}
          </button>
        </div>
      ) : null}

      <nav className="stitch-dashboard__nav" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact ?? item.path.endsWith('/dashboard')}
              className={({ isActive }) =>
                cx('stitch-dashboard__nav-item', isActive && 'stitch-dashboard__nav-item--active')
              }
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="stitch-dashboard__footer">
        <button
          type="button"
          className="stitch-dashboard__footer-item"
          onClick={handleLogout}
        >
          <SignOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
