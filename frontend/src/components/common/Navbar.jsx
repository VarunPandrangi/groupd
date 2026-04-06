import { Link, useNavigate } from 'react-router-dom';
import {
  MoonStars,
  SignOut,
  SunDim,
} from '@phosphor-icons/react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { cx } from '../../utils/cx';
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
    <nav className="w-full topbar">
      <div className="flex items-center justify-between gap-4 topbar__inner">
        <div className="flex items-center gap-3 topbar__left">
          <Link to="/" className="font-bold tracking-tight brand">
            Group<span className="font-bold brand__accent">d</span>
          </Link>
        </div>

        <div className="flex items-center gap-3 topbar__right">
          {isAuthenticated && user ? (
            <>
              <div className="inline-flex items-center gap-2 topbar__meta">
                <span className="text-sm font-medium topbar__name">{user.full_name}</span>
                <span
                  className={cx(
                    'inline-flex items-center justify-center rounded-full text-xs font-semibold role-badge',
                    user.role === 'admin' ? 'role-badge--admin' : 'role-badge--student'
                  )}
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
