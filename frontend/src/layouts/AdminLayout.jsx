import { Outlet } from 'react-router-dom';
import {
  ClipboardText,
  FileText,
  SquaresFour,
  Users,
} from '@phosphor-icons/react';
import AppShell from './AppShell';

const adminNavItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: SquaresFour, exact: true },
  { label: 'Assignments', path: '/admin/assignments', icon: FileText },
  { label: 'Groups', path: '/admin/groups', icon: Users },
  { label: 'Submissions', path: '/admin/submissions', icon: ClipboardText },
];

export default function AdminLayout() {
  return (
    <AppShell navItems={adminNavItems} shellClassName="w-full">
      <div className="w-full">
        <Outlet />
      </div>
    </AppShell>
  );
}
