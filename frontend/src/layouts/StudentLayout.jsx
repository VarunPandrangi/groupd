import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SquaresFour, FileText, Users, ChartBar } from '@phosphor-icons/react';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';

const STORAGE_KEY = 'sidebar-collapsed';

const studentNavItems = [
  { label: 'Dashboard', path: '/student/dashboard', icon: SquaresFour },
  { label: 'Assignments', path: '/student/assignments', icon: FileText },
  { label: 'My Group', path: '/student/group', icon: Users },
  { label: 'Progress', path: '/student/progress', icon: ChartBar },
];

export default function StudentLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Listen for sidebar collapse changes from localStorage
  useEffect(() => {
    const onStorage = () => {
      try {
        setCollapsed(localStorage.getItem(STORAGE_KEY) === 'true');
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', onStorage);

    // Also poll on an interval since same-tab storage events don't fire
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
        navItems={studentNavItems}
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
