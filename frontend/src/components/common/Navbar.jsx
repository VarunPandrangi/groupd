import { Link, useNavigate } from 'react-router-dom';
import { SignOut, List, X } from '@phosphor-icons/react';
import { useAuthStore } from '../../stores/authStore';

export default function Navbar({ onToggleSidebar, sidebarOpen }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        {/* Left: logo + optional hamburger */}
        <div className="navbar__left">
          {onToggleSidebar && (
            <button
              className="navbar__hamburger"
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={20} /> : <List size={20} />}
            </button>
          )}
          <Link to="/" className="navbar__logo">
            Join<span className="navbar__logo-accent">E</span>azy
          </Link>
        </div>

        {/* Right */}
        <div className="navbar__right">
          {isAuthenticated && user ? (
            <>
              <span className="navbar__username">{user.full_name}</span>
              <span
                className={`navbar__role-badge ${
                  user.role === 'admin'
                    ? 'navbar__role-badge--admin'
                    : 'navbar__role-badge--student'
                }`}
              >
                {user.role === 'admin' ? 'Admin' : 'Student'}
              </span>
              <button className="navbar__logout" onClick={handleLogout}>
                <SignOut size={18} />
                <span className="navbar__logout-text">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__link">
                Login
              </Link>
              <Link to="/register" className="navbar__btn-register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
