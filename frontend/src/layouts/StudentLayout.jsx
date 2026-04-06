import { Outlet } from 'react-router-dom';
import { ChartBar, FileText, SquaresFour, Users } from '@phosphor-icons/react';
import AppShell from './AppShell';

const studentNavItems = [
  { label: 'Dashboard', path: '/student/dashboard', icon: SquaresFour, exact: true },
  { label: 'Assignments', path: '/student/assignments', icon: FileText },
  { label: 'My Group', path: '/student/group', icon: Users },
  { label: 'Progress', path: '/student/progress', icon: ChartBar },
];

export default function StudentLayout() {
  return (
    <AppShell navItems={studentNavItems} shellClassName="w-full">
      <div className="w-full">
        <Outlet />
      </div>
    </AppShell>
  );
}
