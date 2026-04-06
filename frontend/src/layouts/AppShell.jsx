import { useEffect, useState } from 'react';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import { cx } from '../utils/cx';

const STORAGE_KEY = 'sidebar-collapsed';

export default function AppShell({ navItems = [], children, shellClassName = '' }) {
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
      // no-op when storage is unavailable
    }
  }, [collapsed]);

  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <div className={cx('min-h-screen app-shell', shellClassName)}>
      <Navbar />
      <Sidebar
        navItems={navItems}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((currentValue) => !currentValue)}
      />
      <main
        className="min-h-screen w-full app-shell__content"
        style={{ '--sidebar-offset': `${sidebarWidth}px` }}
      >
        <div className="w-full max-w-4xl app-shell__frame">{children}</div>
      </main>
    </div>
  );
}
