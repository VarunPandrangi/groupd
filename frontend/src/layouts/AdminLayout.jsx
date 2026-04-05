import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SquaresFour, FileText, Users, ClipboardText } from '@phosphor-icons/react';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';

const STORAGE_KEY = 'sidebar-collapsed';

const adminNavItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: SquaresFour },
  { label: 'Assignments', path: '/admin/assignments', icon: FileText },
  { label: 'Groups', path: '/admin/groups', icon: Users },
  { label: 'Submissions', path: '/admin/submissions', icon: ClipboardText },
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onStorage = () => {
      try {
        setCollapsed(localStorage.getItem(STORAGE_KEY) === 'true');
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', onStorage);

    const interval = setInterval(() => {
      try {
        const val = localStorage.getItem(STORAGE_KEY) === 'true';
        setCollapsed((prev) => (prev !== val ? val : prev));
      } catch {
        // ignore
      }
    }, 300);

    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, []);

  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <div className="layout-app">
      <Navbar
        onToggleSidebar={() => setMobileOpen((v) => !v)}
        sidebarOpen={mobileOpen}
      />
      <Sidebar
        navItems={adminNavItems}
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <main
        className="layout-app__content"
        style={{ marginLeft: sidebarWidth }}
      >
        <Outlet />
      </main>
    </div>
  );
}
