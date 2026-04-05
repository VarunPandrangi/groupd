import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

import PublicLayout from './layouts/PublicLayout';
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-display)',
        gap: '12px',
      }}
    >
      <span style={{ fontSize: '4rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
        404
      </span>
      <span style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
        Page Not Found
      </span>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    useAuthStore.getState().checkAuth();
  }, []);

  return (
    <Routes>
      {/* Landing — uses its own built-in header */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth pages — global Navbar */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Student routes — protected */}
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

      {/* Admin routes — protected */}
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

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
