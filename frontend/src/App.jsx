import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useAuthStore } from './stores/authStore';

import PublicLayout from './layouts/PublicLayout';
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import EmptyState from './components/common/EmptyState';

import LandingPage from './pages/auth/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import StudentDashboard from './pages/student/StudentDashboard';
import AssignmentList from './pages/student/AssignmentList';
import AssignmentDetail from './pages/student/AssignmentDetail';
import GroupManagement from './pages/student/GroupManagement';
import CreateGroup from './pages/student/CreateGroup';
import GroupProgress from './pages/student/GroupProgress';

import AdminDashboard from './pages/admin/AdminDashboard';
import AssignmentManager from './pages/admin/AssignmentManager';
import CreateAssignment from './pages/admin/CreateAssignment';
import EditAssignment from './pages/admin/EditAssignment';
import GroupViewer from './pages/admin/GroupViewer';
import GroupDetail from './pages/admin/GroupDetail';
import SubmissionTracker from './pages/admin/SubmissionTracker';

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center not-found">
      <EmptyState
        icon={MagnifyingGlass}
        title="Page not found"
        message="The page you were looking for may have moved or no longer exists."
      />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    useAuthStore.getState().checkAuth();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="assignments" element={<AssignmentList />} />
          <Route path="assignments/:id" element={<AssignmentDetail />} />
          <Route path="group" element={<GroupManagement />} />
          <Route path="group/create" element={<CreateGroup />} />
          <Route path="progress" element={<GroupProgress />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="assignments" element={<AssignmentManager />} />
          <Route path="assignments/new" element={<CreateAssignment />} />
          <Route path="assignments/:id" element={<EditAssignment />} />
          <Route path="groups" element={<GroupViewer />} />
          <Route path="groups/:id" element={<GroupDetail />} />
          <Route path="submissions" element={<SubmissionTracker />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
