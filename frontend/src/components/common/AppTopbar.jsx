import { Bell, SignOut } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { cx } from '../../utils/cx';

export default function AppTopbar({ className = '' }) {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className={cx('stitch-dashboard__topbar', className)}>
      <div className="stitch-dashboard__top-actions">
        <button type="button" className="stitch-dashboard__icon-btn" aria-label="Notifications">
          <Bell size={14} />
        </button>
        <button
          type="button"
          className="stitch-dashboard__icon-btn"
          aria-label="Sign out"
          onClick={handleLogout}
        >
          <SignOut size={14} />
        </button>
      </div>
    </header>
  );
}
