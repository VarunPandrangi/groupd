import { Link, useNavigate } from 'react-router-dom';
import {
  MoonStars,
  SignOut,
  SunDim,
} from '@phosphor-icons/react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import Button from './Button';
import { buttonClassName } from './buttonClassName';

export default function Navbar() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const navigate = useNavigate();

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  return (
    <nav className="topbar">
      <div className="topbar__inner">
        <div className="topbar__left">
          <Link to="/" className="brand">
            Join<span className="brand__accent">E</span>azy
          </Link>
        </div>

        <div className="topbar__right">
          {isAuthenticated && user ? (
            <>
              <div className="topbar__meta">
                <span className="topbar__name">{user.full_name}</span>
                <span
                  className={`role-badge ${
                    user.role === 'admin'
                      ? 'role-badge--admin'
                      : 'role-badge--student'
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <Button
                type="button"
                variant="icon"
                iconOnly
                aria-label={`Switch to ${
                  theme === 'light' ? 'dark' : 'light'
                } mode`}
                onClick={toggleTheme}
              >
                {theme === 'light' ? <MoonStars size={18} /> : <SunDim size={18} />}
              </Button>
              <Button
                type="button"
                variant="icon"
                iconOnly
                aria-label="Log out"
                onClick={handleLogout}
              >
                <SignOut size={18} />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className={buttonClassName({ variant: 'ghost' })}>
                Login
              </Link>
              <Link
                to="/register"
                className={buttonClassName({ variant: 'primary' })}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
