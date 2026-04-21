import { Outlet } from 'react-router-dom';
import {
  Books,
  ClipboardText,
  FileText,
  SquaresFour,
  Users,
} from '@phosphor-icons/react';
import AppShell from './AppShell';

const adminNavItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: SquaresFour, exact: true },
  { label: 'Assignments', path: '/admin/assignments', icon: FileText },
  { label: 'Courses', path: '/admin/courses', icon: Books },
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
