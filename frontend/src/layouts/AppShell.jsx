import { useEffect, useState } from 'react';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';

const STORAGE_KEY = 'sidebar-collapsed';

export default function AppShell({ navItems = [], children }) {
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
    <div className="app-shell">
      <Navbar />
      <Sidebar
        navItems={navItems}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((currentValue) => !currentValue)}
      />
      <main
        className="app-shell__content"
        style={{ '--sidebar-offset': `${sidebarWidth}px` }}
      >
        <div className="app-shell__frame">{children}</div>
      </main>
    </div>
  );
}
