import { Outlet, useNavigate } from 'react-router-dom';
import { ChartBar, FileText, Plus, SquaresFour, UsersThree, Books } from '@phosphor-icons/react';
import AppShell from './AppShell';
import { useAuthStore } from '../stores/authStore';
import { useGroupStore } from '../stores/groupStore';

const studentNavItems = [
  { label: 'Dashboard', path: '/student/dashboard', icon: SquaresFour, exact: true },
  { label: 'Assignments', path: '/student/assignments', icon: FileText },
  { label: 'Courses', path: '/student/courses', icon: Books },
  { label: 'My Group', path: '/student/group', icon: UsersThree },
  { label: 'Progress', path: '/student/progress', icon: ChartBar },
];

export default function StudentLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const groupId = useGroupStore((state) => state.group?.id);
  const hasGroup = Boolean(user?.group_id || groupId);

  return (
    <AppShell
      navItems={studentNavItems}
      shellClassName="w-full"
      sidebarAction={
        hasGroup
          ? null
          : {
              label: 'Create Group',
              icon: Plus,
              onClick: () => navigate('/student/group/create'),
            }
      }
    >
      <div className="w-full">
        <Outlet />
      </div>
    </AppShell>
  );
}
